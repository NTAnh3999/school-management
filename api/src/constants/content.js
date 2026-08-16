const CONTENT_VERSION_STATUSES = Object.freeze({
  DRAFT: "DRAFT",
  IN_REVIEW: "IN_REVIEW",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
});

// Adjacency map encoding FSD 6.2's transition matrix. Keys are the current status; values are the
// set of statuses that status may move to. "Draft -> Published" is only legal when the course's
// approval policy is disabled (checked separately by the service, not by this map).
const CONTENT_VERSION_TRANSITIONS = Object.freeze({
  [CONTENT_VERSION_STATUSES.DRAFT]: Object.freeze([
    CONTENT_VERSION_STATUSES.IN_REVIEW,
    CONTENT_VERSION_STATUSES.PUBLISHED,
  ]),
  [CONTENT_VERSION_STATUSES.IN_REVIEW]: Object.freeze([
    CONTENT_VERSION_STATUSES.CHANGES_REQUESTED,
    CONTENT_VERSION_STATUSES.APPROVED,
  ]),
  [CONTENT_VERSION_STATUSES.CHANGES_REQUESTED]: Object.freeze([
    CONTENT_VERSION_STATUSES.IN_REVIEW,
  ]),
  [CONTENT_VERSION_STATUSES.APPROVED]: Object.freeze([CONTENT_VERSION_STATUSES.PUBLISHED]),
  [CONTENT_VERSION_STATUSES.PUBLISHED]: Object.freeze([CONTENT_VERSION_STATUSES.ARCHIVED]),
  [CONTENT_VERSION_STATUSES.ARCHIVED]: Object.freeze([]),
});

// Statuses in which a version's Module/Lesson/LearningItem rows may still be edited.
const CONTENT_VERSION_EDITABLE_STATUSES = Object.freeze([
  CONTENT_VERSION_STATUSES.DRAFT,
  CONTENT_VERSION_STATUSES.IN_REVIEW,
  CONTENT_VERSION_STATUSES.CHANGES_REQUESTED,
]);

// FSD 5.3 CCA-05 / 5.4: Text, Video, Document, Infographic, ExternalLink, KnowledgeCheck,
// AssessmentReference, Model3D, InteractivePackage.
const LEARNING_ITEM_TYPES = Object.freeze([
  "Text",
  "Video",
  "Document",
  "Infographic",
  "ExternalLink",
  "KnowledgeCheck",
  "AssessmentReference",
  "Model3D",
  "InteractivePackage",
]);

const COMPLETION_RULES = Object.freeze({
  DWELL_TIME: "dwell_time",
  WATCH_PERCENTAGE: "watch_percentage",
  OPENED: "opened",
  CLICKED: "clicked",
  SUBMITTED: "submitted",
  DELEGATED: "delegated",
  INTERACTED: "interacted",
  XAPI_STATEMENT: "xapi_statement",
});

// FSD 5.4's table: the one completion_rule each item_type is allowed to use. Enforced at the
// service layer on create/update so a Text item can't be saved with e.g. watch_percentage.
const COMPLETION_RULE_BY_ITEM_TYPE = Object.freeze({
  Text: COMPLETION_RULES.DWELL_TIME,
  Video: COMPLETION_RULES.WATCH_PERCENTAGE,
  Document: COMPLETION_RULES.OPENED,
  Infographic: COMPLETION_RULES.OPENED,
  ExternalLink: COMPLETION_RULES.CLICKED,
  KnowledgeCheck: COMPLETION_RULES.SUBMITTED,
  AssessmentReference: COMPLETION_RULES.DELEGATED,
  Model3D: COMPLETION_RULES.INTERACTED,
  InteractivePackage: COMPLETION_RULES.XAPI_STATEMENT,
});

// FSD 7.2: `source` only applies to item_type = Video (uploaded -> ContentAsset reference_id;
// external -> content_payload.url/provider). Null for every other item_type.
const LEARNING_ITEM_VIDEO_SOURCES = Object.freeze({
  UPLOADED: "uploaded",
  EXTERNAL: "external",
});

// Item types whose reference_id must point at a ContentAsset (subject to processing_status
// readiness gating, FSD 8.4) vs. types that are self-contained in content_payload.
const ASSET_REFERENCED_ITEM_TYPES = Object.freeze([
  "Document",
  "Infographic",
  "Model3D",
  "InteractivePackage",
]);

const CONTENT_REVIEW_DECISIONS = Object.freeze({
  APPROVED: "APPROVED",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
});

const CONTENT_ASSET_PROCESSING_STATUSES = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
});

// FSD section 11 - stable, machine-readable error codes surfaced via ErrorResponse's `details.errorCode`.
const CONTENT_ERROR_CODES = Object.freeze({
  COURSE_NOT_FOUND: "CONTENT_COURSE_NOT_FOUND",
  VERSION_NOT_FOUND: "CONTENT_VERSION_NOT_FOUND",
  ACCESS_DENIED: "CONTENT_ACCESS_DENIED",
  TENANT_SCOPE_VIOLATION: "CONTENT_TENANT_SCOPE_VIOLATION",
  VERSION_NOT_EDITABLE: "CONTENT_VERSION_NOT_EDITABLE",
  INVALID_STATUS_TRANSITION: "CONTENT_INVALID_STATUS_TRANSITION",
  INVALID_HIERARCHY: "CONTENT_INVALID_HIERARCHY",
  INVALID_ITEM_TYPE: "CONTENT_INVALID_ITEM_TYPE",
  ASSET_NOT_READY: "CONTENT_ASSET_NOT_READY",
  PUBLISH_VALIDATION_FAILED: "CONTENT_PUBLISH_VALIDATION_FAILED",
  REVIEW_REQUIRED: "CONTENT_REVIEW_REQUIRED",
  REVIEW_COMMENT_REQUIRED: "CONTENT_REVIEW_COMMENT_REQUIRED",
  CONCURRENT_UPDATE: "CONTENT_CONCURRENT_UPDATE",
  DUPLICATE_ORDER: "CONTENT_DUPLICATE_ORDER",
  ALREADY_PUBLISHED: "CONTENT_ALREADY_PUBLISHED",
  DRAFT_ALREADY_EXISTS: "CONTENT_DRAFT_ALREADY_EXISTS",
  NOT_AUTHOR: "CONTENT_NOT_AUTHOR",
  PUBLISHED_IMMUTABLE: "CONTENT_PUBLISHED_IMMUTABLE",
});

const canTransition = (currentStatus, targetStatus) =>
  Boolean(CONTENT_VERSION_TRANSITIONS[currentStatus]?.includes(targetStatus));

module.exports = {
  CONTENT_VERSION_STATUSES,
  CONTENT_VERSION_TRANSITIONS,
  CONTENT_VERSION_EDITABLE_STATUSES,
  LEARNING_ITEM_TYPES,
  COMPLETION_RULES,
  COMPLETION_RULE_BY_ITEM_TYPE,
  LEARNING_ITEM_VIDEO_SOURCES,
  ASSET_REFERENCED_ITEM_TYPES,
  CONTENT_REVIEW_DECISIONS,
  CONTENT_ASSET_PROCESSING_STATUSES,
  CONTENT_ERROR_CODES,
  canTransition,
};
