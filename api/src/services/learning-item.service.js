const { BadRequestError, NotFoundError, ConflictError } = require("../utils/error-responses");
const {
  sequelize,
  LearningItem,
  Lesson,
  CourseModule,
  Course,
  ContentAsset,
  ContentVersion,
  AuditLog,
} = require("../models");
const {
  LEARNING_ITEM_TYPES,
  COMPLETION_RULE_BY_ITEM_TYPE,
  LEARNING_ITEM_VIDEO_SOURCES,
  ASSET_REFERENCED_ITEM_TYPES,
  CONTENT_VERSION_EDITABLE_STATUSES,
  CONTENT_ERROR_CODES,
} = require("../constants/content");

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

/**
 * Validates and resolves itemType/source/contentPayload/assetId against FSD 5.4's per-type
 * table, and returns the fixed completion_rule for that type. Only checks fields the caller
 * actually supplied (fields left `undefined` on update are validated as unchanged elsewhere).
 */
const _resolveItemTypeFields = (itemType, { source, contentPayload, assetId }) => {
  const completionRule = COMPLETION_RULE_BY_ITEM_TYPE[itemType];

  if (itemType === "Video") {
    if (source !== undefined && !Object.values(LEARNING_ITEM_VIDEO_SOURCES).includes(source)) {
      throw new BadRequestError(
        `source must be one of: ${Object.values(LEARNING_ITEM_VIDEO_SOURCES).join(", ")} for Video items`,
        { errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE }
      );
    }
    if (source === LEARNING_ITEM_VIDEO_SOURCES.UPLOADED && assetId === undefined && contentPayload === undefined) {
      // Nothing to validate yet on a partial update -- full requiredness is checked at create time only.
    } else if (source === LEARNING_ITEM_VIDEO_SOURCES.EXTERNAL) {
      const url = contentPayload && contentPayload.url;
      if (contentPayload !== undefined && typeof url !== "string") {
        throw new BadRequestError("content_payload.url (string) is required for external Video items", {
          errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE,
        });
      }
    }
  } else if (source !== undefined && source !== null) {
    throw new BadRequestError("source only applies to Video items", {
      errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE,
    });
  }

  if (itemType === "ExternalLink" && contentPayload !== undefined) {
    const url = contentPayload && contentPayload.url;
    if (typeof url !== "string") {
      throw new BadRequestError("content_payload.url (string) is required for ExternalLink items", {
        errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE,
      });
    }
  }

  if (itemType === "AssessmentReference") {
    // FSD boundary rule: only ever store assessment_id, no join/validation against Assessment.
    const assessmentId = contentPayload && contentPayload.assessment_id;
    if (contentPayload !== undefined && !Number.isInteger(assessmentId)) {
      throw new BadRequestError(
        "content_payload.assessment_id (integer) is required for AssessmentReference items",
        { errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE }
      );
    }
  }

  if (itemType === "Text" && contentPayload !== undefined) {
    const body = contentPayload && contentPayload.body;
    if (typeof body !== "string") {
      throw new BadRequestError("content_payload.body (string) is required for Text items", {
        errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE,
      });
    }
  }

  // Document/Infographic/Model3D/InteractivePackage: reference_id -> asset_id, gated on
  // processing_status readiness at publish time (FSD 8.4), not at create/update time.
  if (
    ASSET_REFERENCED_ITEM_TYPES.includes(itemType) &&
    assetId === undefined &&
    contentPayload === undefined &&
    source === undefined
  ) {
    // Partial update touching neither field -- nothing to validate.
  }

  return completionRule;
};

const _loadLessonWithCourse = async (lessonId) => {
  const lesson = await Lesson.findByPk(lessonId, {
    include: [{ model: CourseModule, as: "module", include: [{ model: Course, as: "course" }] }],
  });
  if (!lesson) throw new NotFoundError("Lesson not found");
  return lesson;
};

const create = async (lessonId, payload, userId) => {
  const {
    itemType,
    title,
    contentPayload,
    assetId,
    source,
    displayOrder,
    estimatedDuration,
    isRequired,
  } = payload;

  if (!title) throw new BadRequestError("Learning item title is required");
  if (!itemType || !LEARNING_ITEM_TYPES.includes(itemType)) {
    throw new BadRequestError(
      `Invalid content item type. Must be one of: ${LEARNING_ITEM_TYPES.join(", ")}`,
      { errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE }
    );
  }

  // _resolveItemTypeFields only *shape*-validates whatever was actually supplied (its checks are
  // skip-if-undefined, which is correct for update()'s partial-payload case); create() layers
  // explicit requiredness checks below since every applicable field IS mandatory at create time.
  const completionRule = _resolveItemTypeFields(itemType, { source, contentPayload, assetId });

  if (ASSET_REFERENCED_ITEM_TYPES.includes(itemType) && !assetId) {
    throw new BadRequestError(`asset_id (reference_id) is required for ${itemType} items`, {
      errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE,
    });
  }
  if (itemType === "Video" && !source) {
    throw new BadRequestError("source (uploaded|external) is required for Video items", {
      errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE,
    });
  }
  if (itemType === "Video" && source === LEARNING_ITEM_VIDEO_SOURCES.UPLOADED && !assetId) {
    throw new BadRequestError("asset_id is required for uploaded-source Video items", {
      errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE,
    });
  }
  if (itemType === "Video" && source === LEARNING_ITEM_VIDEO_SOURCES.EXTERNAL && !(contentPayload && contentPayload.url)) {
    throw new BadRequestError("content_payload.url is required for external-source Video items", {
      errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE,
    });
  }
  if (itemType === "Text" && !(contentPayload && typeof contentPayload.body === "string")) {
    throw new BadRequestError("content_payload.body (string) is required for Text items", {
      errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE,
    });
  }
  if (itemType === "ExternalLink" && !(contentPayload && typeof contentPayload.url === "string")) {
    throw new BadRequestError("content_payload.url (string) is required for ExternalLink items", {
      errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE,
    });
  }
  if (itemType === "AssessmentReference" && !Number.isInteger(contentPayload && contentPayload.assessment_id)) {
    throw new BadRequestError(
      "content_payload.assessment_id (integer) is required for AssessmentReference items",
      { errorCode: CONTENT_ERROR_CODES.INVALID_ITEM_TYPE }
    );
  }

  const lesson = await _loadLessonWithCourse(lessonId);
  const version = await _assertVersionEditable(lesson.content_version_id);

  if (assetId) {
    const asset = await ContentAsset.findByPk(assetId);
    if (!asset) throw new BadRequestError("Asset not found");
  }

  const item = await LearningItem.create({
    lesson_id: lessonId,
    content_version_id: lesson.content_version_id,
    item_type: itemType,
    title,
    content_payload: contentPayload || null,
    asset_id: assetId || null,
    source: itemType === "Video" ? source : null,
    completion_rule: completionRule,
    display_order: displayOrder ?? 0,
    estimated_duration: estimatedDuration || null,
    is_required: isRequired || false,
    status: "draft",
    revision: 1,
    created_by: userId,
    updated_by: userId,
  });

  await AuditLog.create({
    entity_name: "LearningItem",
    entity_id: item.id,
    course_id: lesson.module.course_id,
    action: "CREATE",
    new_values: { title, itemType, displayOrder },
    changed_by: userId,
    source: "api",
    version_ref: version.id,
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

const update = async (id, payload, userId) => {
  const item = await LearningItem.findByPk(id, {
    include: [
      {
        model: Lesson,
        as: "lesson",
        include: [
          { model: CourseModule, as: "module", include: [{ model: Course, as: "course" }] },
        ],
      },
    ],
  });
  if (!item) throw new NotFoundError("Learning item not found");
  if (item.status === "archived")
    throw new BadRequestError("Cannot edit an archived learning item");

  await _assertVersionEditable(item.content_version_id);

  if (payload.revision === undefined) {
    throw new BadRequestError("revision is required for optimistic locking");
  }

  if (payload.assetId) {
    const asset = await ContentAsset.findByPk(payload.assetId);
    if (!asset) throw new BadRequestError("Asset not found");
  }

  // item_type itself is immutable after creation (frontend enforces this too, see
  // LearningItemEditor); re-validate whatever subset of type-specific fields this update
  // touches against the item's existing item_type.
  _resolveItemTypeFields(item.item_type, {
    source: payload.source,
    contentPayload: payload.contentPayload,
    assetId: payload.assetId,
  });

  const oldValues = { title: item.title, itemType: item.item_type };

  const [affected] = await LearningItem.update(
    {
      title: payload.title ?? item.title,
      content_payload: payload.contentPayload ?? item.content_payload,
      asset_id: payload.assetId ?? item.asset_id,
      source: item.item_type === "Video" ? (payload.source ?? item.source) : item.source,
      display_order: payload.displayOrder ?? item.display_order,
      estimated_duration: payload.estimatedDuration ?? item.estimated_duration,
      is_required: payload.isRequired ?? item.is_required,
      updated_by: userId,
      revision: item.revision + 1,
    },
    { where: { id, revision: payload.revision } }
  );
  if (affected === 0) {
    throw new ConflictError("Learning item was updated by someone else, please reload", {
      errorCode: CONTENT_ERROR_CODES.CONCURRENT_UPDATE,
    });
  }

  const updated = await LearningItem.findByPk(id);

  await AuditLog.create({
    entity_name: "LearningItem",
    entity_id: item.id,
    course_id: item.lesson.module.course_id,
    action: "UPDATE",
    old_values: oldValues,
    new_values: { title: updated.title },
    changed_by: userId,
    source: "api",
  });

  return updated;
};

const archive = async (id, userId) => {
  const item = await LearningItem.findByPk(id, {
    include: [
      {
        model: Lesson,
        as: "lesson",
        include: [
          { model: CourseModule, as: "module", include: [{ model: Course, as: "course" }] },
        ],
      },
    ],
  });
  if (!item) throw new NotFoundError("Learning item not found");

  await _assertVersionEditable(item.content_version_id);

  item.status = "archived";
  item.updated_by = userId;
  item.revision += 1;
  await item.save();

  await AuditLog.create({
    entity_name: "LearningItem",
    entity_id: item.id,
    course_id: item.lesson.module.course_id,
    action: "CHANGE_STATUS",
    new_values: { status: "archived" },
    changed_by: userId,
    source: "api",
  });

  return item;
};

const reorder = async (lessonId, orderedIds, userId) => {
  const lesson = await Lesson.findByPk(lessonId);
  if (!lesson) throw new NotFoundError("Lesson not found");
  await _assertVersionEditable(lesson.content_version_id);

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new BadRequestError("orderedIds must be a non-empty array");
  }

  await sequelize.transaction(async (transaction) => {
    const items = await LearningItem.findAll({ where: { lesson_id: lessonId }, transaction });
    const itemIds = new Set(items.map((i) => i.id));

    await Promise.all(
      orderedIds.map((itemId, index) => {
        if (!itemIds.has(itemId)) {
          throw new BadRequestError(`Learning item ${itemId} not found in this lesson`);
        }
        return LearningItem.update(
          { display_order: index, updated_by: userId, revision: sequelize.literal("revision + 1") },
          { where: { id: itemId, lesson_id: lessonId }, transaction }
        );
      })
    );
  });

  return LearningItem.findAll({ where: { lesson_id: lessonId }, order: [["display_order", "ASC"]] });
};

module.exports = { create, list, detail, update, archive, reorder };
