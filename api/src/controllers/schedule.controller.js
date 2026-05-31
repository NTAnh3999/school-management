"use strict";
const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const ScheduleService = require("../services/schedule.service");
const asyncHandler = require("../utils/async-handler");

// SCHED-00: View Schedule
const viewSchedule = asyncHandler(async (req, res) => {
  const { classroomId, teacherId, studentId, fromDate, toDate, status, deliveryMode, campusId } =
    req.query;
  const sessions = await ScheduleService.viewSchedule(
    { classroomId, teacherId, studentId, fromDate, toDate, status, deliveryMode, campusId },
    req.user.id,
    req.user.role
  );
  return new OKResponse({ metadata: { sessions } }).send(res);
});

// SCHED-01: Create Session
const createSession = asyncHandler(async (req, res) => {
  const session = await ScheduleService.createSession(req.body, req.user.id, req.user.role);
  return new CreatedResponse({ message: "Session created", metadata: { session } }).send(res);
});

// SCHED-02: Update Session
const updateSession = asyncHandler(async (req, res) => {
  const session = await ScheduleService.updateSession(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Session updated", metadata: { session } }).send(res);
});

// SCHED-03: Cancel Session
const cancelSession = asyncHandler(async (req, res) => {
  const session = await ScheduleService.cancelSession(
    req.params.id,
    req.body.cancel_reason,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Session cancelled", metadata: { session } }).send(res);
});

// SCHED-04: Create Recurring Series
const createSeries = asyncHandler(async (req, res) => {
  const result = await ScheduleService.createSeries(req.body, req.user.id, req.user.role);
  return new CreatedResponse({
    message: `Series created with ${result.sessions.length} sessions`,
    metadata: result,
  }).send(res);
});

// SCHED-05: Reschedule Session
const rescheduleSession = asyncHandler(async (req, res) => {
  const result = await ScheduleService.rescheduleSession(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Session(s) rescheduled", metadata: result }).send(res);
});

// SCHED-06: Check Conflict
const checkConflict = asyncHandler(async (req, res) => {
  const result = await ScheduleService.checkConflict(req.query);
  return new OKResponse({ metadata: result }).send(res);
});

// SCHED-07: Attach Live Session Metadata
const attachLiveMetadata = asyncHandler(async (req, res) => {
  const metadata = await ScheduleService.attachLiveMetadata(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );
  return new OKResponse({
    message: "Live metadata attached",
    metadata: { live_metadata: metadata },
  }).send(res);
});

// SCHED-08: Import Schedule
const importSchedule = asyncHandler(async (req, res) => {
  if (!req.file) throw new Error("No file uploaded");
  const result = await ScheduleService.importSchedule(req.file.buffer, req.user.id, req.user.role);
  return new OKResponse({ message: "Import complete", metadata: result }).send(res);
});

// SCHED-09: Export Schedule
const exportSchedule = asyncHandler(async (req, res) => {
  const { fromDate, toDate, classroomId, teacherId, studentId, status, deliveryMode, campusId } =
    req.query;
  const buffer = await ScheduleService.exportSchedule(
    { fromDate, toDate, classroomId, teacherId, studentId, status, deliveryMode, campusId },
    req.user.id,
    req.user.role
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="schedule_export.xlsx"`);
  res.send(buffer);
});

// SCHED-10: Complete Session
const completeSession = asyncHandler(async (req, res) => {
  const session = await ScheduleService.completeSession(req.params.id, req.user.id, req.user.role);
  return new OKResponse({ message: "Session marked as completed", metadata: { session } }).send(
    res
  );
});

// SCHED-11: Archive Session
const archiveSession = asyncHandler(async (req, res) => {
  const session = await ScheduleService.archiveSession(req.params.id, req.user.id, req.user.role);
  return new OKResponse({ message: "Session archived", metadata: { session } }).send(res);
});

// Change history
const getChangeHistory = asyncHandler(async (req, res) => {
  const history = await ScheduleService.getChangeHistory(req.params.id);
  return new OKResponse({ metadata: { history } }).send(res);
});

module.exports = {
  viewSchedule,
  createSession,
  updateSession,
  cancelSession,
  createSeries,
  rescheduleSession,
  checkConflict,
  attachLiveMetadata,
  importSchedule,
  exportSchedule,
  completeSession,
  archiveSession,
  getChangeHistory,
};
