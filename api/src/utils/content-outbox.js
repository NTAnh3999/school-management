"use strict";
const nodeCrypto = require("crypto");
const { ContentVersionEventOutbox } = require("../models");

/**
 * Writes a row to content_version_event_outbox. Matches enrollment.service.js's outbox-write
 * convention: best-effort, never rolls back the caller's already-committed state on failure.
 * No consumer/worker exists for this table (same scope as EnrollmentEventOutbox today).
 */
const emitContentEvent = async ({
  eventType,
  tenantId = null,
  contentVersionId = null,
  contentAssetId = null,
  courseId = null,
  previousStatus = null,
  currentStatus,
  payload = null,
}) => {
  try {
    await ContentVersionEventOutbox.create({
      event_id: nodeCrypto.randomUUID(),
      event_type: eventType,
      tenant_id: tenantId,
      content_version_id: contentVersionId,
      content_asset_id: contentAssetId,
      course_id: courseId,
      previous_status: previousStatus,
      current_status: currentStatus,
      occurred_at: new Date(),
      payload,
    });
  } catch {
    // Outbox failures must not roll back already-committed content state.
  }
};

module.exports = { emitContentEvent };
