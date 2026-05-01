const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const {
  ContentVersion,
  Course,
  CourseSection,
  Lesson,
  LearningItem,
  AuditLog,
} = require("../models");
const { ROLES, isRole } = require("../constants/roles");

/**
 * Build a snapshot of the current draft structure for a course.
 */
const _buildSnapshot = async (courseId) => {
  const sections = await CourseSection.findAll({
    where: { course_id: courseId, status: "draft" },
    include: [
      {
        model: Lesson,
        as: "lessons",
        where: { status: "draft" },
        required: false,
        include: [
          {
            model: LearningItem,
            as: "learning_items",
            where: { status: "draft" },
            required: false,
          },
        ],
      },
    ],
    order: [
      ["order_index", "ASC"],
      [{ model: Lesson, as: "lessons" }, "order_index", "ASC"],
      [
        { model: Lesson, as: "lessons" },
        { model: LearningItem, as: "learning_items" },
        "display_order",
        "ASC",
      ],
    ],
  });
  return JSON.parse(JSON.stringify(sections));
};

/**
 * Validate publish readiness according to business rules.
 */
const _validatePublishReadiness = (snapshot) => {
  if (!snapshot || snapshot.length === 0) {
    throw new BadRequestError("Content version is not ready to publish: no modules found");
  }
  for (const section of snapshot) {
    if (!section.lessons || section.lessons.length === 0) {
      throw new BadRequestError(
        `Content version is not ready to publish: module "${section.title}" has no lessons`
      );
    }
  }
};

const create = async (courseId, payload, userId, userRole) => {
  const { versionLabel, changelog } = payload;

  if (!versionLabel) throw new BadRequestError("version_label is required");

  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");
  if (course.status === "archived") {
    throw new BadRequestError("Cannot create a content version for an archived course");
  }

  if (!isRole(userRole, ROLES.ADMIN) && course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to create content versions for this course");
  }

  // Auto-increment version_no
  const lastVersion = await ContentVersion.findOne({
    where: { course_id: courseId },
    order: [["version_no", "DESC"]],
  });
  const versionNo = lastVersion ? lastVersion.version_no + 1 : 1;

  const snapshot = await _buildSnapshot(courseId);

  const version = await ContentVersion.create({
    course_id: courseId,
    version_label: versionLabel,
    version_no: versionNo,
    status: "DRAFT",
    changelog: changelog || null,
    snapshot_ref: snapshot,
    created_by: userId,
  });

  await AuditLog.create({
    entity_name: "ContentVersion",
    entity_id: version.id,
    course_id: courseId,
    action: "CREATE",
    new_values: { versionLabel, versionNo, status: "DRAFT" },
    changed_by: userId,
    source: "api",
    version_ref: version.id,
  });

  return version;
};

const list = async (courseId) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");

  return ContentVersion.findAll({
    where: { course_id: courseId },
    order: [["version_no", "DESC"]],
  });
};

const detail = async (id) => {
  const version = await ContentVersion.findByPk(id, {
    include: [{ model: Course, as: "course" }],
  });
  if (!version) throw new NotFoundError("Content version not found");
  return version;
};

const publish = async (id, userId, userRole) => {
  const version = await ContentVersion.findByPk(id, {
    include: [{ model: Course, as: "course" }],
  });
  if (!version) throw new NotFoundError("Content version not found");
  if (version.status === "PUBLISHED")
    throw new BadRequestError("Content version is already published");
  if (version.status === "ARCHIVED")
    throw new BadRequestError("Cannot publish an archived content version");

  if (!isRole(userRole, ROLES.ADMIN) && version.course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to publish this content version");
  }

  // Rebuild snapshot and validate publish readiness
  const snapshot = await _buildSnapshot(version.course_id);
  _validatePublishReadiness(snapshot);

  // Archive currently published version (only one published at a time)
  await ContentVersion.update(
    { status: "ARCHIVED" },
    { where: { course_id: version.course_id, status: "PUBLISHED" } }
  );

  version.status = "PUBLISHED";
  version.published_at = new Date();
  version.published_by = userId;
  version.snapshot_ref = snapshot;
  await version.save();

  await AuditLog.create({
    entity_name: "ContentVersion",
    entity_id: version.id,
    course_id: version.course_id,
    action: "CHANGE_STATUS",
    new_values: { status: "PUBLISHED", publishedAt: version.published_at },
    changed_by: userId,
    source: "api",
    version_ref: version.id,
  });

  return version;
};

const archive = async (id, userId, userRole) => {
  const version = await ContentVersion.findByPk(id, {
    include: [{ model: Course, as: "course" }],
  });
  if (!version) throw new NotFoundError("Content version not found");
  if (version.status === "ARCHIVED")
    throw new BadRequestError("Content version is already archived");

  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Only admin can archive content versions");
  }

  version.status = "ARCHIVED";
  await version.save();

  await AuditLog.create({
    entity_name: "ContentVersion",
    entity_id: version.id,
    course_id: version.course_id,
    action: "CHANGE_STATUS",
    new_values: { status: "ARCHIVED" },
    changed_by: userId,
    source: "api",
    version_ref: version.id,
  });

  return version;
};

/**
 * CCA-API-13: Get published content structure for downstream consumption (Assessment, Progress, Portal).
 */
const getPublishedStructure = async (courseId) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");

  const publishedVersion = await ContentVersion.findOne({
    where: { course_id: courseId, status: "PUBLISHED" },
    order: [["published_at", "DESC"]],
  });

  if (!publishedVersion)
    throw new NotFoundError("No published content version found for this course");

  return {
    course_id: courseId,
    version_id: publishedVersion.id,
    version_label: publishedVersion.version_label,
    version_no: publishedVersion.version_no,
    published_at: publishedVersion.published_at,
    structure: publishedVersion.snapshot_ref,
  };
};

/**
 * CCA-11: Preview draft structure (no progress generated).
 */
const previewDraft = async (courseId, userId, userRole) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");

  if (!isRole(userRole, ROLES.ADMIN) && course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to preview content for this course");
  }

  const snapshot = await _buildSnapshot(courseId);
  return { course_id: courseId, preview: true, structure: snapshot };
};

module.exports = { create, list, detail, publish, archive, getPublishedStructure, previewDraft };
