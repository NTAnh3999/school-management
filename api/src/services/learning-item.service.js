const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const {
  LearningItem,
  Lesson,
  CourseSection,
  Course,
  ContentAsset,
  AuditLog,
} = require("../models");
const { ROLES, isRole } = require("../constants/roles");

const VALID_ITEM_TYPES = ["VIDEO", "QUIZ", "INFOGRAPHIC", "DOCUMENT", "TEXT"];

const _authorizeViaCourse = async (lessonId, userId, userRole) => {
  const lesson = await Lesson.findByPk(lessonId, {
    include: [{ model: CourseSection, as: "section", include: [{ model: Course, as: "course" }] }],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");
  if (!isRole(userRole, ROLES.ADMIN) && lesson.section.course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to manage learning items in this lesson");
  }
  return lesson;
};

const create = async (lessonId, payload, userId, userRole) => {
  const { itemType, title, contentPayload, assetId, displayOrder, estimatedDuration, isRequired } =
    payload;

  if (!title) throw new BadRequestError("Learning item title is required");
  if (!itemType || !VALID_ITEM_TYPES.includes(itemType)) {
    throw new BadRequestError(
      `Invalid content item type. Must be one of: ${VALID_ITEM_TYPES.join(", ")}`
    );
  }

  const lesson = await _authorizeViaCourse(lessonId, userId, userRole);

  if (assetId) {
    const asset = await ContentAsset.findByPk(assetId);
    if (!asset) throw new BadRequestError("Asset not found");
  }

  const item = await LearningItem.create({
    lesson_id: lessonId,
    item_type: itemType,
    title,
    content_payload: contentPayload || null,
    asset_id: assetId || null,
    display_order: displayOrder ?? 0,
    estimated_duration: estimatedDuration || null,
    is_required: isRequired || false,
    status: "draft",
    created_by: userId,
    updated_by: userId,
  });

  await AuditLog.create({
    entity_name: "LearningItem",
    entity_id: item.id,
    course_id: lesson.section.course_id,
    action: "CREATE",
    new_values: { title, itemType, displayOrder },
    changed_by: userId,
    source: "api",
  });

  return item;
};

const list = async (lessonId) => {
  const lesson = await Lesson.findByPk(lessonId);
  if (!lesson) throw new NotFoundError("Lesson not found");

  return LearningItem.findAll({
    where: { lesson_id: lessonId },
    include: [{ model: ContentAsset, as: "asset" }],
    order: [["display_order", "ASC"]],
  });
};

const detail = async (id) => {
  const item = await LearningItem.findByPk(id, {
    include: [{ model: ContentAsset, as: "asset" }],
  });
  if (!item) throw new NotFoundError("Learning item not found");
  return item;
};

const update = async (id, payload, userId, userRole) => {
  const item = await LearningItem.findByPk(id, {
    include: [
      {
        model: Lesson,
        as: "lesson",
        include: [
          { model: CourseSection, as: "section", include: [{ model: Course, as: "course" }] },
        ],
      },
    ],
  });
  if (!item) throw new NotFoundError("Learning item not found");
  if (item.status === "archived")
    throw new BadRequestError("Cannot edit an archived learning item");

  if (!isRole(userRole, ROLES.ADMIN) && item.lesson.section.course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to update this learning item");
  }

  if (payload.assetId) {
    const asset = await ContentAsset.findByPk(payload.assetId);
    if (!asset) throw new BadRequestError("Asset not found");
  }

  const oldValues = { title: item.title, itemType: item.item_type };
  item.title = payload.title ?? item.title;
  item.content_payload = payload.contentPayload ?? item.content_payload;
  item.asset_id = payload.assetId ?? item.asset_id;
  item.display_order = payload.displayOrder ?? item.display_order;
  item.estimated_duration = payload.estimatedDuration ?? item.estimated_duration;
  item.is_required = payload.isRequired ?? item.is_required;
  item.updated_by = userId;

  await item.save();

  await AuditLog.create({
    entity_name: "LearningItem",
    entity_id: item.id,
    course_id: item.lesson.section.course_id,
    action: "UPDATE",
    old_values: oldValues,
    new_values: { title: item.title },
    changed_by: userId,
    source: "api",
  });

  return item;
};

const archive = async (id, userId, userRole) => {
  const item = await LearningItem.findByPk(id, {
    include: [
      {
        model: Lesson,
        as: "lesson",
        include: [
          { model: CourseSection, as: "section", include: [{ model: Course, as: "course" }] },
        ],
      },
    ],
  });
  if (!item) throw new NotFoundError("Learning item not found");

  if (!isRole(userRole, ROLES.ADMIN) && item.lesson.section.course.teacher_id !== userId) {
    throw new ForbiddenError("Not authorized to archive this learning item");
  }

  item.status = "archived";
  item.updated_by = userId;
  await item.save();

  await AuditLog.create({
    entity_name: "LearningItem",
    entity_id: item.id,
    course_id: item.lesson.section.course_id,
    action: "CHANGE_STATUS",
    new_values: { status: "archived" },
    changed_by: userId,
    source: "api",
  });

  return item;
};

const reorder = async (lessonId, orderedIds, userId, userRole) => {
  const lesson = await _authorizeViaCourse(lessonId, userId, userRole);

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new BadRequestError("orderedIds must be a non-empty array");
  }

  const items = await LearningItem.findAll({ where: { lesson_id: lessonId } });
  const itemMap = new Map(items.map((i) => [i.id, i]));

  for (let i = 0; i < orderedIds.length; i++) {
    const item = itemMap.get(orderedIds[i]);
    if (!item) throw new BadRequestError(`Learning item ${orderedIds[i]} not found in this lesson`);
    item.display_order = i;
    item.updated_by = userId;
    await item.save();
  }

  return LearningItem.findAll({
    where: { lesson_id: lessonId },
    order: [["display_order", "ASC"]],
  });
};

module.exports = { create, list, detail, update, archive, reorder };
