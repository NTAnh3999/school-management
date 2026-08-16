const { BadRequestError, NotFoundError, ConflictError } = require("../utils/error-responses");
const {
  Lesson,
  CourseModule,
  Course,
  Quiz,
  LessonFeedback,
  ContentVersion,
  AuditLog,
} = require("../models");
const { CONTENT_VERSION_EDITABLE_STATUSES, CONTENT_ERROR_CODES } = require("../constants/content");

const _assertVersionEditable = async (contentVersionId) => {
  const version = await ContentVersion.findByPk(contentVersionId);
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

const create = async (moduleId, payload, userId) => {
  const { title, objective, lessonSummary, durationMinutes, displayOrder } = payload;
  if (!title) throw new BadRequestError("Missing title");

  const courseModule = await CourseModule.findByPk(moduleId);
  if (!courseModule) throw new NotFoundError("Module not found");

  const version = await _assertVersionEditable(courseModule.content_version_id);

  const lesson = await Lesson.create({
    module_id: moduleId,
    content_version_id: courseModule.content_version_id,
    title,
    objective: objective || null,
    lesson_summary: lessonSummary,
    duration_minutes: durationMinutes || 0,
    display_order: displayOrder || 0,
    status: "draft",
    revision: 1,
    created_by: userId,
    updated_by: userId,
  });

  await AuditLog.create({
    entity_name: "Lesson",
    entity_id: lesson.id,
    course_id: version.course_id,
    action: "CREATE",
    new_values: { title },
    changed_by: userId,
    source: "api",
    version_ref: version.id,
  });

  return lesson;
};

const list = async (moduleId) => {
  return Lesson.findAll({
    where: { module_id: moduleId },
    include: [{ model: Quiz, as: "quiz" }],
    order: [["display_order", "ASC"]],
  });
};

const detail = async (id) => {
  const lesson = await Lesson.findByPk(id, {
    include: [
      { model: CourseModule, as: "module", include: [{ model: Course, as: "course" }] },
      { model: Quiz, as: "quiz" },
      { model: LessonFeedback, as: "feedback" },
    ],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");
  return lesson;
};

const update = async (id, payload, userId) => {
  const lesson = await Lesson.findByPk(id);
  if (!lesson) throw new NotFoundError("Lesson not found");

  await _assertVersionEditable(lesson.content_version_id);

  const { title, objective, lessonSummary, durationMinutes, displayOrder, revision } = payload;
  if (revision === undefined) {
    throw new BadRequestError("revision is required for optimistic locking");
  }

  const [affected] = await Lesson.update(
    {
      title: title ?? lesson.title,
      objective: objective ?? lesson.objective,
      lesson_summary: lessonSummary ?? lesson.lesson_summary,
      duration_minutes: durationMinutes ?? lesson.duration_minutes,
      display_order: displayOrder ?? lesson.display_order,
      updated_by: userId,
      revision: lesson.revision + 1,
    },
    { where: { id, revision } }
  );
  if (affected === 0) {
    throw new ConflictError("Lesson was updated by someone else, please reload", {
      errorCode: CONTENT_ERROR_CODES.CONCURRENT_UPDATE,
    });
  }

  return Lesson.findByPk(id);
};

const remove = async (id) => {
  const lesson = await Lesson.findByPk(id);
  if (!lesson) throw new NotFoundError("Lesson not found");

  await _assertVersionEditable(lesson.content_version_id);

  await lesson.destroy();
  return true;
};

const archive = async (id, userId) => {
  const lesson = await Lesson.findByPk(id);
  if (!lesson) throw new NotFoundError("Lesson not found");
  if (lesson.status === "archived") throw new BadRequestError("Lesson is already archived");

  const version = await _assertVersionEditable(lesson.content_version_id);

  lesson.status = "archived";
  lesson.updated_by = userId;
  lesson.revision += 1;
  await lesson.save();

  await AuditLog.create({
    entity_name: "Lesson",
    entity_id: lesson.id,
    course_id: version.course_id,
    action: "CHANGE_STATUS",
    new_values: { status: "archived" },
    changed_by: userId,
    source: "api",
    version_ref: version.id,
  });

  return lesson;
};

module.exports = { create, list, detail, update, remove, archive };
