const {
  BadRequestError,
  NotFoundError,
  ConflictError,
} = require("../utils/error-responses");
const {
  sequelize,
  ContentVersion,
  Course,
  Department,
  CourseModule,
  Lesson,
  LearningItem,
  ContentAsset,
  ContentReview,
  CourseContentRoot,
  AuditLog,
} = require("../models");
const {
  CONTENT_VERSION_STATUSES,
  CONTENT_VERSION_EDITABLE_STATUSES,
  CONTENT_REVIEW_DECISIONS,
  CONTENT_ASSET_PROCESSING_STATUSES,
  CONTENT_ERROR_CODES,
  canTransition,
} = require("../constants/content");
const { emitContentEvent } = require("../utils/content-outbox");

const OPEN_DRAFT_STATUSES = [
  CONTENT_VERSION_STATUSES.DRAFT,
  CONTENT_VERSION_STATUSES.IN_REVIEW,
  CONTENT_VERSION_STATUSES.CHANGES_REQUESTED,
  CONTENT_VERSION_STATUSES.APPROVED,
];

const _assertTransition = (currentStatus, targetStatus) => {
  if (!canTransition(currentStatus, targetStatus)) {
    throw new BadRequestError(
      `Cannot move content version from ${currentStatus} to ${targetStatus}`,
      { errorCode: CONTENT_ERROR_CODES.INVALID_STATUS_TRANSITION }
    );
  }
};

const _resolveContentRoot = async (course, transaction) => {
  let root = await CourseContentRoot.findOne({ where: { course_id: course.id }, transaction });
  if (root) return root;

  const department = course.department || (await Department.findByPk(course.department_id));
  root = await CourseContentRoot.create(
    {
      tenant_id: department ? department.tenant_id : null,
      course_id: course.id,
      current_published_version_id: null,
    },
    { transaction }
  );
  return root;
};

/**
 * Build a snapshot of a specific version's structure (now version-scoped, not course-global).
 */
const _buildSnapshot = async (versionId, transaction) => {
  const modules = await CourseModule.findAll({
    where: { content_version_id: versionId },
    include: [
      {
        model: Lesson,
        as: "lessons",
        where: { content_version_id: versionId },
        required: false,
        include: [
          {
            model: LearningItem,
            as: "learning_items",
            where: { content_version_id: versionId },
            required: false,
          },
        ],
      },
    ],
    order: [
      ["display_order", "ASC"],
      [{ model: Lesson, as: "lessons" }, "display_order", "ASC"],
      [
        { model: Lesson, as: "lessons" },
        { model: LearningItem, as: "learning_items" },
        "display_order",
        "ASC",
      ],
    ],
    transaction,
  });
  return JSON.parse(JSON.stringify(modules));
};

/**
 * Clone the full Module/Lesson/LearningItem tree of `sourceVersionId` into `targetVersionId`.
 * New rows, new ids -- editing the target never touches the source's rows.
 */
const _cloneTree = async (sourceVersionId, targetVersionId, userId, transaction) => {
  const modules = await CourseModule.findAll({
    where: { content_version_id: sourceVersionId },
    include: [{ model: Lesson, as: "lessons", include: [{ model: LearningItem, as: "learning_items" }] }],
    transaction,
  });

  for (const sourceModule of modules) {
    const clonedModule = await CourseModule.create(
      {
        course_id: sourceModule.course_id,
        content_version_id: targetVersionId,
        title: sourceModule.title,
        description: sourceModule.description,
        display_order: sourceModule.display_order,
        status: sourceModule.status,
        revision: 1,
        created_by: userId,
        updated_by: userId,
      },
      { transaction }
    );

    for (const sourceLesson of sourceModule.lessons || []) {
      const clonedLesson = await Lesson.create(
        {
          module_id: clonedModule.id,
          content_version_id: targetVersionId,
          title: sourceLesson.title,
          objective: sourceLesson.objective,
          lesson_summary: sourceLesson.lesson_summary,
          duration_minutes: sourceLesson.duration_minutes,
          display_order: sourceLesson.display_order,
          status: sourceLesson.status,
          estimated_duration: sourceLesson.estimated_duration,
          revision: 1,
          created_by: userId,
          updated_by: userId,
        },
        { transaction }
      );

      for (const sourceItem of sourceLesson.learning_items || []) {
        await LearningItem.create(
          {
            lesson_id: clonedLesson.id,
            content_version_id: targetVersionId,
            item_type: sourceItem.item_type,
            title: sourceItem.title,
            content_payload: sourceItem.content_payload,
            asset_id: sourceItem.asset_id,
            display_order: sourceItem.display_order,
            estimated_duration: sourceItem.estimated_duration,
            is_required: sourceItem.is_required,
            status: sourceItem.status,
            revision: 1,
            created_by: userId,
            updated_by: userId,
          },
          { transaction }
        );
      }
    }
  }
};

/**
 * Validate publish readiness. Returns { ready, issues } instead of throwing, so it can back
 * both the read-only /validate endpoint and publish()'s own pre-flight check.
 */
const _checkPublishReadiness = async (versionId, transaction) => {
  const issues = [];

  const modules = await CourseModule.findAll({
    where: { content_version_id: versionId },
    include: [
      {
        model: Lesson,
        as: "lessons",
        where: { content_version_id: versionId },
        required: false,
        include: [
          {
            model: LearningItem,
            as: "learning_items",
            where: { content_version_id: versionId },
            required: false,
            include: [{ model: ContentAsset, as: "asset" }],
          },
        ],
      },
    ],
    transaction,
  });

  if (!modules || modules.length === 0) {
    issues.push("No modules found");
  }

  for (const courseModule of modules) {
    if (!courseModule.lessons || courseModule.lessons.length === 0) {
      issues.push(`Module "${courseModule.title}" has no lessons`);
      continue;
    }
    for (const lesson of courseModule.lessons) {
      for (const item of lesson.learning_items || []) {
        if (item.asset_id && item.asset && item.asset.processing_status !== CONTENT_ASSET_PROCESSING_STATUSES.READY) {
          issues.push(
            `Learning item "${item.title}" references an asset that is not ready (status: ${item.asset.processing_status})`
          );
        }
      }
    }
  }

  return { ready: issues.length === 0, issues };
};

const _assertPublishReady = async (versionId, transaction) => {
  const { ready, issues } = await _checkPublishReadiness(versionId, transaction);
  if (!ready) {
    throw new BadRequestError(`Content version is not ready to publish: ${issues.join("; ")}`, {
      errorCode: CONTENT_ERROR_CODES.PUBLISH_VALIDATION_FAILED,
      issues,
    });
  }
};

const create = async (courseId, payload, userId) => {
  const { versionLabel, changelog } = payload;

  if (!versionLabel) throw new BadRequestError("version_label is required");

  const course = await Course.findByPk(courseId, { include: [{ model: Department, as: "department" }] });
  if (!course) throw new NotFoundError("Course not found", { errorCode: CONTENT_ERROR_CODES.COURSE_NOT_FOUND });
  if (course.status === "archived") {
    throw new BadRequestError("Cannot create a content version for an archived course");
  }

  return sequelize.transaction(async (transaction) => {
    const root = await _resolveContentRoot(course, transaction);

    const existingOpenDraft = await ContentVersion.findOne({
      where: { content_root_id: root.id, status: OPEN_DRAFT_STATUSES },
      transaction,
    });
    if (existingOpenDraft) {
      throw new ConflictError("This course already has an open draft content version", {
        errorCode: CONTENT_ERROR_CODES.DRAFT_ALREADY_EXISTS,
        versionId: existingOpenDraft.id,
      });
    }

    const lastVersion = await ContentVersion.findOne({
      where: { course_id: courseId },
      order: [["version_no", "DESC"]],
      transaction,
    });
    const versionNo = lastVersion ? lastVersion.version_no + 1 : 1;

    const sourceVersionId = root.current_published_version_id;

    const version = await ContentVersion.create(
      {
        course_id: courseId,
        content_root_id: root.id,
        based_on_version_id: sourceVersionId || null,
        version_label: versionLabel,
        version_no: versionNo,
        status: CONTENT_VERSION_STATUSES.DRAFT,
        revision: 1,
        changelog: changelog || null,
        created_by: userId,
      },
      { transaction }
    );

    if (sourceVersionId) {
      await _cloneTree(sourceVersionId, version.id, userId, transaction);
    }

    version.snapshot_ref = await _buildSnapshot(version.id, transaction);
    await version.save({ transaction });

    await AuditLog.create(
      {
        entity_name: "ContentVersion",
        entity_id: version.id,
        course_id: courseId,
        action: "CREATE",
        new_values: { versionLabel, versionNo, status: version.status },
        changed_by: userId,
        source: "api",
        version_ref: version.id,
      },
      { transaction }
    );

    await emitContentEvent({
      eventType: "ContentVersionCreated",
      tenantId: root.tenant_id,
      contentVersionId: version.id,
      courseId,
      currentStatus: version.status,
      payload: { versionNo, clonedFrom: sourceVersionId || null },
    });

    return version;
  });
};

const list = async (courseId) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found", { errorCode: CONTENT_ERROR_CODES.COURSE_NOT_FOUND });

  return ContentVersion.findAll({
    where: { course_id: courseId },
    order: [["version_no", "DESC"]],
  });
};

const detail = async (id) => {
  const version = await ContentVersion.findByPk(id, {
    include: [{ model: Course, as: "course" }],
  });
  if (!version)
    throw new NotFoundError("Content version not found", {
      errorCode: CONTENT_ERROR_CODES.VERSION_NOT_FOUND,
    });
  return version;
};

const submitForReview = async (id, userId) => {
  return sequelize.transaction(async (transaction) => {
    const version = await ContentVersion.findByPk(id, { transaction });
    if (!version)
      throw new NotFoundError("Content version not found", {
        errorCode: CONTENT_ERROR_CODES.VERSION_NOT_FOUND,
      });

    _assertTransition(version.status, CONTENT_VERSION_STATUSES.IN_REVIEW);
    await _assertPublishReady(version.id, transaction);

    const previousStatus = version.status;
    const updated = await ContentVersion.update(
      {
        status: CONTENT_VERSION_STATUSES.IN_REVIEW,
        submitted_for_review_by: userId,
        submitted_for_review_at: new Date(),
        revision: version.revision + 1,
      },
      { where: { id: version.id, revision: version.revision }, transaction }
    );
    if (updated[0] === 0) {
      throw new ConflictError("Content version was updated by someone else, please reload", {
        errorCode: CONTENT_ERROR_CODES.CONCURRENT_UPDATE,
      });
    }

    await AuditLog.create(
      {
        entity_name: "ContentVersion",
        entity_id: version.id,
        course_id: version.course_id,
        action: "CHANGE_STATUS",
        old_values: { status: previousStatus },
        new_values: { status: CONTENT_VERSION_STATUSES.IN_REVIEW },
        changed_by: userId,
        source: "api",
        version_ref: version.id,
      },
      { transaction }
    );

    await emitContentEvent({
      eventType: "ContentVersionSubmittedForReview",
      contentVersionId: version.id,
      courseId: version.course_id,
      previousStatus,
      currentStatus: CONTENT_VERSION_STATUSES.IN_REVIEW,
    });

    return ContentVersion.findByPk(version.id, { transaction });
  });
};

const reviewDecision = async (id, { decision, comment }, userId) => {
  if (!Object.values(CONTENT_REVIEW_DECISIONS).includes(decision)) {
    throw new BadRequestError("decision must be APPROVED or CHANGES_REQUESTED");
  }
  if (decision === CONTENT_REVIEW_DECISIONS.CHANGES_REQUESTED && !comment) {
    throw new BadRequestError("comment is required when requesting changes", {
      errorCode: CONTENT_ERROR_CODES.REVIEW_COMMENT_REQUIRED,
    });
  }

  return sequelize.transaction(async (transaction) => {
    const version = await ContentVersion.findByPk(id, { transaction });
    if (!version)
      throw new NotFoundError("Content version not found", {
        errorCode: CONTENT_ERROR_CODES.VERSION_NOT_FOUND,
      });

    const targetStatus =
      decision === CONTENT_REVIEW_DECISIONS.APPROVED
        ? CONTENT_VERSION_STATUSES.APPROVED
        : CONTENT_VERSION_STATUSES.CHANGES_REQUESTED;
    _assertTransition(version.status, targetStatus);

    const previousStatus = version.status;
    const updatePayload = {
      status: targetStatus,
      revision: version.revision + 1,
    };
    if (targetStatus === CONTENT_VERSION_STATUSES.APPROVED) {
      updatePayload.approved_by = userId;
      updatePayload.approved_at = new Date();
    }

    const updated = await ContentVersion.update(updatePayload, {
      where: { id: version.id, revision: version.revision },
      transaction,
    });
    if (updated[0] === 0) {
      throw new ConflictError("Content version was updated by someone else, please reload", {
        errorCode: CONTENT_ERROR_CODES.CONCURRENT_UPDATE,
      });
    }

    await ContentReview.create(
      {
        content_version_id: version.id,
        decided_by: userId,
        decision,
        comment: comment || null,
        decided_at: new Date(),
      },
      { transaction }
    );

    await AuditLog.create(
      {
        entity_name: "ContentVersion",
        entity_id: version.id,
        course_id: version.course_id,
        action: "CHANGE_STATUS",
        old_values: { status: previousStatus },
        new_values: { status: targetStatus, comment: comment || null },
        changed_by: userId,
        source: "api",
        version_ref: version.id,
      },
      { transaction }
    );

    await emitContentEvent({
      eventType:
        targetStatus === CONTENT_VERSION_STATUSES.APPROVED
          ? "ContentVersionApproved"
          : "ContentVersionChangesRequested",
      contentVersionId: version.id,
      courseId: version.course_id,
      previousStatus,
      currentStatus: targetStatus,
      payload: { comment: comment || null },
    });

    return ContentVersion.findByPk(version.id, { transaction });
  });
};

const validate = async (id) => {
  const version = await ContentVersion.findByPk(id);
  if (!version)
    throw new NotFoundError("Content version not found", {
      errorCode: CONTENT_ERROR_CODES.VERSION_NOT_FOUND,
    });
  return _checkPublishReadiness(version.id);
};

const listReviews = async (id) => {
  const version = await ContentVersion.findByPk(id);
  if (!version)
    throw new NotFoundError("Content version not found", {
      errorCode: CONTENT_ERROR_CODES.VERSION_NOT_FOUND,
    });
  return ContentReview.findAll({
    where: { content_version_id: id },
    order: [["decided_at", "DESC"]],
  });
};

const publish = async (id, userId, { approvalRequired = false } = {}) => {
  return sequelize.transaction(async (transaction) => {
    const version = await ContentVersion.findByPk(id, {
      include: [{ model: Course, as: "course" }],
      transaction,
    });
    if (!version)
      throw new NotFoundError("Content version not found", {
        errorCode: CONTENT_ERROR_CODES.VERSION_NOT_FOUND,
      });
    if (version.status === CONTENT_VERSION_STATUSES.PUBLISHED)
      throw new BadRequestError("Content version is already published", {
        errorCode: CONTENT_ERROR_CODES.ALREADY_PUBLISHED,
      });

    // Draft -> Published is only legal when the course's approval policy is disabled;
    // Approved -> Published is always legal.
    if (version.status === CONTENT_VERSION_STATUSES.DRAFT && approvalRequired) {
      throw new BadRequestError("This content version must be approved before it can be published", {
        errorCode: CONTENT_ERROR_CODES.REVIEW_REQUIRED,
      });
    }
    _assertTransition(version.status, CONTENT_VERSION_STATUSES.PUBLISHED);

    await _assertPublishReady(version.id, transaction);

    const snapshot = await _buildSnapshot(version.id, transaction);

    const root = await _resolveContentRoot(version.course, transaction);

    // Archive whatever was previously published for this course.
    if (root && root.current_published_version_id) {
      await ContentVersion.update(
        { status: CONTENT_VERSION_STATUSES.ARCHIVED },
        {
          where: { id: root.current_published_version_id, status: CONTENT_VERSION_STATUSES.PUBLISHED },
          transaction,
        }
      );
    }

    const updated = await ContentVersion.update(
      {
        status: CONTENT_VERSION_STATUSES.PUBLISHED,
        published_at: new Date(),
        published_by: userId,
        snapshot_ref: snapshot,
        revision: version.revision + 1,
      },
      { where: { id: version.id, revision: version.revision }, transaction }
    );
    if (updated[0] === 0) {
      throw new ConflictError("Content version was updated by someone else, please reload", {
        errorCode: CONTENT_ERROR_CODES.CONCURRENT_UPDATE,
      });
    }

    if (root) {
      root.current_published_version_id = version.id;
      await root.save({ transaction });
    }

    await AuditLog.create(
      {
        entity_name: "ContentVersion",
        entity_id: version.id,
        course_id: version.course_id,
        action: "CHANGE_STATUS",
        old_values: { status: version.status },
        new_values: { status: CONTENT_VERSION_STATUSES.PUBLISHED },
        changed_by: userId,
        source: "api",
        version_ref: version.id,
      },
      { transaction }
    );

    await emitContentEvent({
      eventType: "ContentVersionPublished",
      tenantId: root ? root.tenant_id : null,
      contentVersionId: version.id,
      courseId: version.course_id,
      previousStatus: version.status,
      currentStatus: CONTENT_VERSION_STATUSES.PUBLISHED,
    });

    return ContentVersion.findByPk(version.id, { transaction });
  });
};

const archive = async (id, userId) => {
  return sequelize.transaction(async (transaction) => {
    const version = await ContentVersion.findByPk(id, { transaction });
    if (!version)
      throw new NotFoundError("Content version not found", {
        errorCode: CONTENT_ERROR_CODES.VERSION_NOT_FOUND,
      });

    _assertTransition(version.status, CONTENT_VERSION_STATUSES.ARCHIVED);

    const previousStatus = version.status;
    const updated = await ContentVersion.update(
      { status: CONTENT_VERSION_STATUSES.ARCHIVED, revision: version.revision + 1 },
      { where: { id: version.id, revision: version.revision }, transaction }
    );
    if (updated[0] === 0) {
      throw new ConflictError("Content version was updated by someone else, please reload", {
        errorCode: CONTENT_ERROR_CODES.CONCURRENT_UPDATE,
      });
    }

    // Archiving the currently-published version leaves the root pointing at a stale (now
    // archived) version_id unless cleared here.
    await CourseContentRoot.update(
      { current_published_version_id: null },
      { where: { course_id: version.course_id, current_published_version_id: version.id }, transaction }
    );

    await AuditLog.create(
      {
        entity_name: "ContentVersion",
        entity_id: version.id,
        course_id: version.course_id,
        action: "CHANGE_STATUS",
        old_values: { status: previousStatus },
        new_values: { status: CONTENT_VERSION_STATUSES.ARCHIVED },
        changed_by: userId,
        source: "api",
        version_ref: version.id,
      },
      { transaction }
    );

    await emitContentEvent({
      eventType: "ContentVersionArchived",
      contentVersionId: version.id,
      courseId: version.course_id,
      previousStatus,
      currentStatus: CONTENT_VERSION_STATUSES.ARCHIVED,
    });

    return ContentVersion.findByPk(version.id, { transaction });
  });
};

/**
 * CCA-API-17: Get published content structure for downstream consumption (Assessment, Progress, Portal).
 * Contract kept stable -- Classroom/Assessment/Progress already consume this shape.
 */
const getPublishedStructure = async (courseId) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found", { errorCode: CONTENT_ERROR_CODES.COURSE_NOT_FOUND });

  const publishedVersion = await ContentVersion.findOne({
    where: { course_id: courseId, status: CONTENT_VERSION_STATUSES.PUBLISHED },
    order: [["published_at", "DESC"]],
  });

  if (!publishedVersion)
    throw new NotFoundError("No published content version found for this course", {
      errorCode: CONTENT_ERROR_CODES.VERSION_NOT_FOUND,
    });

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
 * CCA-11: Preview draft structure (no progress generated, no data mutation).
 */
const previewDraft = async (courseId) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found", { errorCode: CONTENT_ERROR_CODES.COURSE_NOT_FOUND });

  const draftVersion = await ContentVersion.findOne({
    where: { course_id: courseId, status: OPEN_DRAFT_STATUSES },
    order: [["created_at", "DESC"]],
  });
  if (!draftVersion) {
    return { course_id: courseId, preview: true, structure: [] };
  }

  const snapshot = await _buildSnapshot(draftVersion.id);
  return { course_id: courseId, preview: true, version_id: draftVersion.id, structure: snapshot };
};

module.exports = {
  create,
  list,
  detail,
  submitForReview,
  reviewDecision,
  validate,
  listReviews,
  publish,
  archive,
  getPublishedStructure,
  previewDraft,
  CONTENT_VERSION_EDITABLE_STATUSES,
};
