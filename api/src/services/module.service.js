const { BadRequestError, NotFoundError, ConflictError } = require("../utils/error-responses");
const { sequelize, CourseModule, Course, Lesson, ContentVersion, AuditLog } = require("../models");
const { CONTENT_VERSION_EDITABLE_STATUSES, CONTENT_ERROR_CODES } = require("../constants/content");

const _assertVersionEditable = async (contentVersionId, transaction) => {
  const version = await ContentVersion.findByPk(contentVersionId, { transaction });
  if (!version)
    throw new NotFoundError("Content version not found", {
      errorCode: CONTENT_ERROR_CODES.VERSION_NOT_FOUND,
    });
  if (!CONTENT_VERSION_EDITABLE_STATUSES.includes(version.status)) {
    throw new ConflictError("This content version is no longer editable", {
      errorCode: CONTENT_ERROR_CODES.PUBLISHED_IMMUTABLE,
    });
  }
  return version;
};

const create = async (contentVersionId, { title, description, displayOrder }, userId) => {
  if (!title) throw new BadRequestError("Missing title");

  const version = await _assertVersionEditable(contentVersionId);

  const courseModule = await CourseModule.create({
    course_id: version.course_id,
    content_version_id: contentVersionId,
    title,
    description,
    display_order: displayOrder || 0,
    status: "draft",
    revision: 1,
    created_by: userId,
    updated_by: userId,
  });

  await AuditLog.create({
    entity_name: "CourseModule",
    entity_id: courseModule.id,
    course_id: version.course_id,
    action: "CREATE",
    new_values: { title },
    changed_by: userId,
    source: "api",
    version_ref: contentVersionId,
  });

  return courseModule;
};

const listByVersion = async (contentVersionId) => {
  return CourseModule.findAll({
    where: { content_version_id: contentVersionId },
    include: [{ model: Lesson, as: "lessons" }],
    order: [
      ["display_order", "ASC"],
      [{ model: Lesson, as: "lessons" }, "display_order", "ASC"],
    ],
  });
};

/**
 * Course-global list, kept for backward compat: resolves to the course's current open Draft
 * (or, if none, the Published version) rather than a specific content_version_id.
 */
const list = async (courseId) => {
  const openDraft = await ContentVersion.findOne({
    where: {
      course_id: courseId,
      status: ["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "APPROVED"],
    },
    order: [["created_at", "DESC"]],
  });
  const version =
    openDraft ||
    (await ContentVersion.findOne({
      where: { course_id: courseId, status: "PUBLISHED" },
      order: [["published_at", "DESC"]],
    }));
  if (!version) return [];
  return listByVersion(version.id);
};

const detail = async (id) => {
  const courseModule = await CourseModule.findByPk(id, {
    include: [
      { model: Course, as: "course" },
      { model: Lesson, as: "lessons" },
    ],
  });
  if (!courseModule) throw new NotFoundError("Module not found");
  return courseModule;
};

const update = async (id, payload, userId) => {
  const courseModule = await CourseModule.findByPk(id);
  if (!courseModule) throw new NotFoundError("Module not found");

  await _assertVersionEditable(courseModule.content_version_id);

  const { title, description, displayOrder, revision } = payload;
  if (revision === undefined) {
    throw new BadRequestError("revision is required for optimistic locking");
  }

  const [affected] = await CourseModule.update(
    {
      title: title ?? courseModule.title,
      description: description ?? courseModule.description,
      display_order: displayOrder ?? courseModule.display_order,
      updated_by: userId,
      revision: courseModule.revision + 1,
    },
    { where: { id, revision } }
  );
  if (affected === 0) {
    throw new ConflictError("Module was updated by someone else, please reload", {
      errorCode: CONTENT_ERROR_CODES.CONCURRENT_UPDATE,
    });
  }

  return CourseModule.findByPk(id);
};

const remove = async (id) => {
  const courseModule = await CourseModule.findByPk(id);
  if (!courseModule) throw new NotFoundError("Module not found");

  // Structurally safe hard-delete: this can only ever run against a still-editable version's
  // rows, since Published/Archived versions' modules live under a content_version_id this
  // check rejects.
  await _assertVersionEditable(courseModule.content_version_id);

  await courseModule.destroy();
  return true;
};

const archive = async (id, userId) => {
  const courseModule = await CourseModule.findByPk(id);
  if (!courseModule) throw new NotFoundError("Module not found");
  if (courseModule.status === "archived") throw new BadRequestError("Module is already archived");

  const version = await _assertVersionEditable(courseModule.content_version_id);

  courseModule.status = "archived";
  courseModule.updated_by = userId;
  courseModule.revision += 1;
  await courseModule.save();

  await AuditLog.create({
    entity_name: "CourseModule",
    entity_id: courseModule.id,
    course_id: version.course_id,
    action: "CHANGE_STATUS",
    new_values: { status: "archived" },
    changed_by: userId,
    source: "api",
    version_ref: version.id,
  });

  return courseModule;
};

const reorder = async (contentVersionId, orderedIds, userId) => {
  await _assertVersionEditable(contentVersionId);

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new BadRequestError("orderedIds must be a non-empty array");
  }

  await sequelize.transaction(async (transaction) => {
    const modules = await CourseModule.findAll({
      where: { content_version_id: contentVersionId },
      transaction,
    });
    const moduleIds = new Set(modules.map((m) => m.id));

    await Promise.all(
      orderedIds.map((moduleId, index) => {
        if (!moduleIds.has(moduleId)) {
          throw new BadRequestError(`Module ${moduleId} not found in this content version`);
        }
        return CourseModule.update(
          { display_order: index, updated_by: userId, revision: sequelize.literal("revision + 1") },
          { where: { id: moduleId, content_version_id: contentVersionId }, transaction }
        );
      })
    );
  });

  return listByVersion(contentVersionId);
};

module.exports = { create, list, listByVersion, detail, update, remove, archive, reorder };
