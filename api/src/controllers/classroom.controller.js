"use strict";
const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const ClassroomService = require("../services/classroom.service");
const asyncHandler = require("../utils/async-handler");

// ---------------------------------------------------------------------------
// SC-01: List Classrooms
// GET /classrooms
// ---------------------------------------------------------------------------
const list = asyncHandler(async (req, res) => {
  const filters = {
    keyword: req.query.keyword,
    status: req.query.status,
    course_id: req.query.course_id,
    teacher_id: req.query.teacher_id,
    delivery_method: req.query.delivery_method,
    date_from: req.query.date_from,
    date_to: req.query.date_to,
    enrollment_availability: req.query.enrollment_availability,
    page: req.query.page,
    page_size: req.query.page_size,
  };
  const result = await ClassroomService.list(filters, req.user.id, req.user.role);
  return new OKResponse({ metadata: result }).send(res);
});

// ---------------------------------------------------------------------------
// SC-04: Get Classroom Detail
// GET /classrooms/:id
// ---------------------------------------------------------------------------
const detail = asyncHandler(async (req, res) => {
  const classroom = await ClassroomService.detail(
    parseInt(req.params.id),
    req.user.id,
    req.user.role
  );
  return new OKResponse({ metadata: { classroom } }).send(res);
});

// ---------------------------------------------------------------------------
// SC-02: Create Classroom
// POST /classrooms
// ---------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  const classroom = await ClassroomService.create(req.body, req.user.id);
  return new CreatedResponse({
    message: "Classroom created successfully",
    metadata: { classroom },
  }).send(res);
});

// ---------------------------------------------------------------------------
// SC-03: Update Classroom
// PUT /classrooms/:id
// ---------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const classroom = await ClassroomService.update(
    parseInt(req.params.id),
    req.body,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Classroom updated", metadata: { classroom } }).send(res);
});

// ---------------------------------------------------------------------------
// SC-10: Publish Classroom
// POST /classrooms/:id/publish
// ---------------------------------------------------------------------------
const publish = asyncHandler(async (req, res) => {
  const classroom = await ClassroomService.publish(parseInt(req.params.id), req.user.id);
  return new OKResponse({ message: "Classroom published", metadata: { classroom } }).send(res);
});

// ---------------------------------------------------------------------------
// Start Classroom (Open/Full -> In Progress)
// POST /classrooms/:id/start
// ---------------------------------------------------------------------------
const start = asyncHandler(async (req, res) => {
  const classroom = await ClassroomService.start(parseInt(req.params.id), req.user.id);
  return new OKResponse({ message: "Classroom started", metadata: { classroom } }).send(res);
});

// ---------------------------------------------------------------------------
// SC-11: Cancel Classroom
// POST /classrooms/:id/cancel
// ---------------------------------------------------------------------------
const cancel = asyncHandler(async (req, res) => {
  const classroom = await ClassroomService.cancel(
    parseInt(req.params.id),
    { reason: req.body.reason },
    req.user.id
  );
  return new OKResponse({ message: "Classroom cancelled", metadata: { classroom } }).send(res);
});

// ---------------------------------------------------------------------------
// SC-12: Complete Classroom
// POST /classrooms/:id/complete
// ---------------------------------------------------------------------------
const complete = asyncHandler(async (req, res) => {
  const classroom = await ClassroomService.complete(parseInt(req.params.id), req.user.id);
  return new OKResponse({ message: "Classroom completed", metadata: { classroom } }).send(res);
});

// ---------------------------------------------------------------------------
// Archive Classroom
// POST /classrooms/:id/archive
// ---------------------------------------------------------------------------
const archive = asyncHandler(async (req, res) => {
  const classroom = await ClassroomService.archive(parseInt(req.params.id), req.user.id);
  return new OKResponse({ message: "Classroom archived", metadata: { classroom } }).send(res);
});

// ---------------------------------------------------------------------------
// Duplicate Classroom
// POST /classrooms/:id/duplicate
// ---------------------------------------------------------------------------
const duplicate = asyncHandler(async (req, res) => {
  const classroom = await ClassroomService.duplicate(parseInt(req.params.id), req.user.id);
  return new CreatedResponse({
    message: "Classroom duplicated",
    metadata: { classroom },
  }).send(res);
});

// ---------------------------------------------------------------------------
// SC-05: Assign Teachers
// PUT /classrooms/:id/teachers
// ---------------------------------------------------------------------------
const assignTeachers = asyncHandler(async (req, res) => {
  const classroom = await ClassroomService.assignTeachers(
    parseInt(req.params.id),
    req.body,
    req.user.id
  );
  return new OKResponse({ message: "Teachers assigned", metadata: { classroom } }).send(res);
});

// ---------------------------------------------------------------------------
// SC-08: List Students
// GET /classrooms/:id/students
// ---------------------------------------------------------------------------
const listStudents = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    page: req.query.page,
    page_size: req.query.page_size,
  };
  const result = await ClassroomService.listStudents(
    parseInt(req.params.id),
    filters,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ metadata: result }).send(res);
});

// ---------------------------------------------------------------------------
// SC-08: Add Student
// POST /classrooms/:id/students
// ---------------------------------------------------------------------------
const addStudent = asyncHandler(async (req, res) => {
  const result = await ClassroomService.addStudent(
    parseInt(req.params.id),
    {
      student_id: req.body.student_id,
      source: req.body.source,
      notes: req.body.notes,
    },
    req.user.id
  );
  return new CreatedResponse({
    message: result.waitlisted ? "Student added to waitlist" : "Student enrolled in classroom",
    metadata: result,
  }).send(res);
});

// ---------------------------------------------------------------------------
// SC-08: Remove Student
// DELETE /classrooms/:id/students/:studentId
// ---------------------------------------------------------------------------
const removeStudent = asyncHandler(async (req, res) => {
  const enrollment = await ClassroomService.removeStudent(
    parseInt(req.params.id),
    parseInt(req.params.studentId),
    { reason: req.body.reason },
    req.user.id
  );
  return new OKResponse({
    message: "Student removed from classroom",
    metadata: { enrollment },
  }).send(res);
});

// ---------------------------------------------------------------------------
// Transfer Student
// POST /classrooms/:id/students/:studentId/transfer
// ---------------------------------------------------------------------------
const transferStudent = asyncHandler(async (req, res) => {
  const result = await ClassroomService.transferStudent(
    parseInt(req.params.id),
    parseInt(req.params.studentId),
    {
      target_classroom_id: req.body.target_classroom_id,
      notes: req.body.notes,
    },
    req.user.id
  );
  return new OKResponse({ message: "Student transferred successfully", metadata: result }).send(
    res
  );
});

// ---------------------------------------------------------------------------
// Update Student Enrollment Status
// PUT /classrooms/:id/students/:studentId/status
// ---------------------------------------------------------------------------
const updateStudentStatus = asyncHandler(async (req, res) => {
  const enrollment = await ClassroomService.updateStudentStatus(
    parseInt(req.params.id),
    parseInt(req.params.studentId),
    { status: req.body.status, notes: req.body.notes },
    req.user.id
  );
  return new OKResponse({ message: "Enrollment status updated", metadata: { enrollment } }).send(
    res
  );
});

// ---------------------------------------------------------------------------
// SC-06: List Sessions
// GET /classrooms/:id/sessions
// ---------------------------------------------------------------------------
const listSessions = asyncHandler(async (req, res) => {
  const sessions = await ClassroomService.listSessions(parseInt(req.params.id));
  return new OKResponse({ metadata: { sessions } }).send(res);
});

// ---------------------------------------------------------------------------
// SC-06: Create Session
// POST /classrooms/:id/sessions
// ---------------------------------------------------------------------------
const createSession = asyncHandler(async (req, res) => {
  const session = await ClassroomService.createSession(
    parseInt(req.params.id),
    req.body,
    req.user.id
  );
  return new CreatedResponse({ message: "Session created", metadata: { session } }).send(res);
});

// ---------------------------------------------------------------------------
// Generate Sessions from Recurrence
// POST /classrooms/:id/sessions/generate
// ---------------------------------------------------------------------------
const generateSessions = asyncHandler(async (req, res) => {
  const sessions = await ClassroomService.generateSessions(
    parseInt(req.params.id),
    req.body,
    req.user.id
  );
  return new CreatedResponse({
    message: `${sessions.length} sessions generated`,
    metadata: { sessions },
  }).send(res);
});

// ---------------------------------------------------------------------------
// Update Session
// PUT /classrooms/:id/sessions/:sessionId
// ---------------------------------------------------------------------------
const updateSession = asyncHandler(async (req, res) => {
  const session = await ClassroomService.updateSession(
    parseInt(req.params.id),
    parseInt(req.params.sessionId),
    req.body,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Session updated", metadata: { session } }).send(res);
});

// ---------------------------------------------------------------------------
// Delete Session
// DELETE /classrooms/:id/sessions/:sessionId
// ---------------------------------------------------------------------------
const deleteSession = asyncHandler(async (req, res) => {
  const result = await ClassroomService.deleteSession(
    parseInt(req.params.id),
    parseInt(req.params.sessionId),
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Session removed", metadata: result }).send(res);
});

// ---------------------------------------------------------------------------
// SC-13: Activity Log
// GET /classrooms/:id/activity-log
// ---------------------------------------------------------------------------
const getActivityLog = asyncHandler(async (req, res) => {
  const logs = await ClassroomService.getActivityLog(parseInt(req.params.id));
  return new OKResponse({ metadata: { logs } }).send(res);
});

module.exports = {
  list,
  detail,
  create,
  update,
  publish,
  start,
  cancel,
  complete,
  archive,
  duplicate,
  assignTeachers,
  listStudents,
  addStudent,
  removeStudent,
  transferStudent,
  updateStudentStatus,
  listSessions,
  createSession,
  generateSessions,
  updateSession,
  deleteSession,
  getActivityLog,
};
