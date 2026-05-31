"use strict";

const ASSESSMENT_TYPES = Object.freeze({
  QUIZ: "quiz",
  ASSIGNMENT: "assignment",
  EXAM: "exam",
  SURVEY: "survey",
  OTHER: "other",
});

const ASSESSMENT_STATUSES = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  CLOSED: "closed",
  ARCHIVED: "archived",
});

const ATTEMPT_STATUSES = Object.freeze({
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  GRADED: "graded",
  PUBLISHED: "published",
  EXPIRED: "expired",
});

const GRADING_METHODS = Object.freeze({
  AUTO: "auto",
  MANUAL: "manual",
  HYBRID: "hybrid",
});

const PUBLISH_POLICIES = Object.freeze({
  MANUAL: "manual",
  AUTO_AFTER_GRADED: "auto_after_graded",
  SCHEDULED: "scheduled",
});

const PUBLICATION_STATUSES = Object.freeze({
  NOT_PUBLISHED: "not_published",
  PUBLISHED: "published",
  UNPUBLISHED: "unpublished",
});

const ASSESSMENT_ERROR_CODES = Object.freeze({
  REQUIRED_FIELD: "ASM_ERR_REQUIRED_FIELD",
  INVALID_SCOPE: "ASM_ERR_INVALID_SCOPE",
  INVALID_STATUS: "ASM_ERR_INVALID_STATUS",
  UNAUTHORIZED: "ASM_ERR_UNAUTHORIZED",
  NOT_PUBLISHED: "ASM_ERR_NOT_PUBLISHED",
  NOT_OPEN: "ASM_ERR_NOT_OPEN",
  CLOSED: "ASM_ERR_CLOSED",
  MAX_ATTEMPT: "ASM_ERR_MAX_ATTEMPT",
  ATTEMPT_NOT_FOUND: "ASM_ERR_ATTEMPT_NOT_FOUND",
  ATTEMPT_EXPIRED: "ASM_ERR_ATTEMPT_EXPIRED",
  DUPLICATE_SUBMISSION: "ASM_ERR_DUPLICATE_SUBMISSION",
  INVALID_SUBMISSION: "ASM_ERR_INVALID_SUBMISSION",
  INVALID_SCORE: "ASM_ERR_INVALID_SCORE",
  GRADE_LOCKED: "ASM_ERR_GRADE_LOCKED",
  RESULT_NOT_PUBLISHED: "ASM_ERR_RESULT_NOT_PUBLISHED",
  EXPORT_LIMIT: "ASM_ERR_EXPORT_LIMIT",
  SYSTEM: "ASM_ERR_SYSTEM",
});

const ASSESSMENT_EVENTS = Object.freeze({
  CREATED: "AssessmentCreated",
  UPDATED: "AssessmentUpdated",
  PUBLISHED: "AssessmentPublished",
  CLOSED: "AssessmentClosed",
  ATTEMPT_STARTED: "AttemptStarted",
  SUBMISSION_SUBMITTED: "SubmissionSubmitted",
  GRADE_ASSIGNED: "GradeAssigned",
  GRADE_PUBLISHED: "GradePublished",
  RESULT_UPDATED: "AssessmentResultUpdated",
});

module.exports = {
  ASSESSMENT_ERROR_CODES,
  ASSESSMENT_EVENTS,
  ASSESSMENT_STATUSES,
  ASSESSMENT_TYPES,
  ATTEMPT_STATUSES,
  GRADING_METHODS,
  PUBLICATION_STATUSES,
  PUBLISH_POLICIES,
};
