"use strict";
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require("../utils/error-responses");
const {
  ClassroomSession,
  ScheduleSeries,
  ScheduleChangeRecord,
  LiveSessionMetadata,
  Classroom,
  User,
  ClassroomEnrollment,
  AuditLog,
} = require("../models");
const { ROLES, isRole } = require("../constants/roles");
const sequelize = require("../database/init.mysql.js");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VALID_STATUSES = ["scheduled", "rescheduled", "cancelled", "completed", "archived"];
const DELIVERY_MODES = ["Offline", "Online", "Hybrid"];
const RESCHEDULE_SCOPES = ["this_session", "this_and_following", "entire_series"];
const DAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const writeAuditLog = async ({ sessionId, action, oldValues, newValues, actorId }) => {
  await AuditLog.create({
    entity_name: "ScheduleSession",
    entity_id: sessionId,
    action,
    old_values: oldValues || null,
    new_values: newValues || null,
    changed_by: actorId || null,
    source: "api",
  });
};

const writeChangeRecord = async ({
  sessionId,
  seriesId,
  changeType,
  oldValues,
  newValues,
  reason,
  batchId,
  actorId,
}) => {
  await ScheduleChangeRecord.create({
    session_id: sessionId,
    series_id: seriesId || null,
    change_type: changeType,
    old_values: oldValues || null,
    new_values: newValues || null,
    reason: reason || null,
    batch_id: batchId || null,
    changed_by: actorId || null,
  });
};

const assertAdmin = (userRole) => {
  if (!isRole(userRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Only admins can perform this action");
  }
};

const assertAdminOrTeacher = (userRole) => {
  if (!isRole(userRole, ROLES.ADMIN) && !isRole(userRole, ROLES.TEACHER)) {
    throw new ForbiddenError("Not authorized");
  }
};

// ---------------------------------------------------------------------------
// SCHED-06: Conflict Check (internal helper + public)
// ---------------------------------------------------------------------------
const _checkConflicts = async ({
  startDatetime,
  endDatetime,
  teacherId,
  classroomId,
  location,
  excludeSessionId,
}) => {
  const conflicts = [];
  const overlapWhere = {
    status: { [Op.notIn]: ["cancelled", "archived"] },
    session_date: {
      [Op.between]: [
        startDatetime.toISOString().slice(0, 10),
        endDatetime.toISOString().slice(0, 10),
      ],
    },
  };
  if (excludeSessionId) overlapWhere.id = { [Op.ne]: excludeSessionId };

  // Fetch candidate sessions on the same date(s)
  const candidates = await ClassroomSession.findAll({
    where: overlapWhere,
    attributes: [
      "id",
      "classroom_id",
      "teacher_id",
      "location",
      "session_date",
      "start_time",
      "end_time",
    ],
  });

  const reqStart = startDatetime.getHours() * 60 + startDatetime.getMinutes();
  const reqEnd = endDatetime.getHours() * 60 + endDatetime.getMinutes();

  const timeOverlap = (s, e) => {
    const [sh, sm] = s.split(":").map(Number);
    const [eh, em] = e.split(":").map(Number);
    const sessionStart = sh * 60 + sm;
    const sessionEnd = eh * 60 + em;
    return reqStart < sessionEnd && reqEnd > sessionStart;
  };

  for (const c of candidates) {
    if (!timeOverlap(c.start_time, c.end_time)) continue;

    if (teacherId && c.teacher_id === teacherId) {
      conflicts.push({ type: "teacher_conflict", session_id: c.id, severity: "Blocking" });
    }
    if (classroomId && c.classroom_id === classroomId) {
      conflicts.push({ type: "classroom_conflict", session_id: c.id, severity: "Blocking" });
    }
    if (location && c.location && c.location === location) {
      conflicts.push({ type: "location_conflict", session_id: c.id, severity: "Blocking" });
    }
  }

  return conflicts;
};

const checkConflict = async ({
  startDatetime,
  endDatetime,
  teacherId,
  classroomId,
  location,
  excludeSessionId,
}) => {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  if (isNaN(start) || isNaN(end)) throw new BadRequestError("Invalid datetime values");
  if (start >= end) throw new BadRequestError("start_datetime must be before end_datetime");

  const conflicts = await _checkConflicts({
    startDatetime: start,
    endDatetime: end,
    teacherId,
    classroomId,
    location,
    excludeSessionId,
  });
  return {
    conflict_found: conflicts.length > 0,
    conflicts,
    override_allowed: conflicts.every((c) => c.severity !== "Blocking"),
  };
};

// ---------------------------------------------------------------------------
// SCHED-00: View Schedule
// ---------------------------------------------------------------------------
const viewSchedule = async (filters, actorId, actorRole) => {
  const { classroomId, teacherId, studentId, fromDate, toDate, status, deliveryMode, campusId } =
    filters;

  if (!fromDate || !toDate) throw new BadRequestError("from_date and to_date are required");

  const where = {
    session_date: { [Op.between]: [fromDate, toDate] },
  };
  if (status) where.status = status;
  if (deliveryMode) where.delivery_mode = deliveryMode;
  if (campusId) where.campus_id = campusId;

  // Scope filtering
  if (isRole(actorRole, ROLES.STUDENT)) {
    // Student: only sessions for their active classroom enrollments
    const enrollments = await ClassroomEnrollment.findAll({
      where: { student_id: actorId, status: { [Op.in]: ["enrolled"] } },
      attributes: ["classroom_id"],
    });
    const enrolledClassroomIds = enrollments.map((e) => e.classroom_id);
    if (enrolledClassroomIds.length === 0) return [];
    where.classroom_id = { [Op.in]: enrolledClassroomIds };
  } else if (isRole(actorRole, ROLES.TEACHER)) {
    // Teacher: only sessions they are assigned to
    where.teacher_id = actorId;
    if (classroomId) where.classroom_id = classroomId;
  } else if (isRole(actorRole, ROLES.ADMIN)) {
    if (classroomId) where.classroom_id = classroomId;
    if (teacherId) where.teacher_id = teacherId;
    if (studentId) {
      const enrollments = await ClassroomEnrollment.findAll({
        where: { student_id: studentId, status: "enrolled" },
        attributes: ["classroom_id"],
      });
      where.classroom_id = { [Op.in]: enrollments.map((e) => e.classroom_id) };
    }
  } else {
    throw new ForbiddenError("Not authorized to view schedule");
  }

  const sessions = await ClassroomSession.findAll({
    where,
    include: [
      { model: Classroom, as: "classroom", attributes: ["id", "classroom_name", "classroom_code"] },
      { model: User, as: "teacher", attributes: ["id", "full_name", "email"] },
      { model: LiveSessionMetadata, as: "live_metadata" },
    ],
    order: [
      ["session_date", "ASC"],
      ["start_time", "ASC"],
    ],
  });

  // For students and teachers, hide host_url from live metadata
  if (isRole(actorRole, ROLES.STUDENT)) {
    sessions.forEach((s) => {
      if (s.live_metadata) s.live_metadata.host_url = undefined;
    });
  }

  return sessions;
};

// ---------------------------------------------------------------------------
// SCHED-01: Create Session
// ---------------------------------------------------------------------------
const createSession = async (data, actorId, actorRole) => {
  assertAdminOrTeacher(actorRole);

  const {
    classroomId,
    title,
    description,
    teacherId,
    sessionDate,
    startTime,
    endTime,
    deliveryMode = "Offline",
    location,
    campusId,
    notes,
    seriesId,
  } = data;

  if (!classroomId) throw new BadRequestError("classroom_id is required");
  if (!title) throw new BadRequestError("title is required");
  if (!sessionDate) throw new BadRequestError("session_date is required");
  if (!startTime || !endTime) throw new BadRequestError("start_time and end_time are required");
  if (!DELIVERY_MODES.includes(deliveryMode))
    throw new BadRequestError(`delivery_mode must be one of: ${DELIVERY_MODES.join(", ")}`);
  if (deliveryMode === "Offline" && !location)
    throw new BadRequestError("location is required for Offline sessions (BR-SCHED-011)");

  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");
  if (["closed", "archived"].includes(classroom.status))
    throw new BadRequestError(
      "Cannot schedule sessions for a closed or archived classroom (BR-SCHED-004)"
    );

  const startDt = new Date(`${sessionDate}T${startTime}`);
  const endDt = new Date(`${sessionDate}T${endTime}`);
  if (startDt >= endDt)
    throw new BadRequestError("start_time must be before end_time (BR-SCHED-005)");

  // Conflict check
  const conflicts = await _checkConflicts({
    startDatetime: startDt,
    endDatetime: endDt,
    teacherId,
    classroomId,
    location,
  });
  const blocking = conflicts.filter((c) => c.severity === "Blocking");
  if (blocking.length > 0) {
    throw new ConflictError(
      `Schedule conflict detected: ${blocking.map((c) => c.type).join(", ")}`
    );
  }

  // Auto-assign session_no
  const sessionCount = await ClassroomSession.count({ where: { classroom_id: classroomId } });

  const session = await ClassroomSession.create({
    classroom_id: classroomId,
    session_no: sessionCount + 1,
    session_title: title,
    description,
    session_date: sessionDate,
    start_time: startTime,
    end_time: endTime,
    teacher_id: teacherId || null,
    location: location || null,
    delivery_mode: deliveryMode,
    campus_id: campusId || null,
    notes,
    series_id: seriesId || null,
    status: "scheduled",
    created_by: actorId,
    updated_by: actorId,
  });

  await writeAuditLog({
    sessionId: session.id,
    action: "CREATE",
    newValues: { title, sessionDate, startTime, endTime, deliveryMode, location },
    actorId,
  });

  return session;
};

// ---------------------------------------------------------------------------
// SCHED-02: Update Session
// ---------------------------------------------------------------------------
const updateSession = async (sessionId, data, actorId, actorRole) => {
  assertAdminOrTeacher(actorRole);

  const session = await ClassroomSession.findByPk(sessionId);
  if (!session) throw new NotFoundError("Session not found");
  if (session.status === "archived")
    throw new BadRequestError("Cannot update archived session (BR-SCHED-023)");
  if (session.status === "cancelled") throw new BadRequestError("Cannot update cancelled session");
  if (session.status === "completed" && !isRole(actorRole, ROLES.ADMIN))
    throw new ForbiddenError("Only admin can update completed sessions (BR-SCHED-022)");

  const oldValues = {
    session_title: session.session_title,
    session_date: session.session_date,
    start_time: session.start_time,
    end_time: session.end_time,
    teacher_id: session.teacher_id,
    location: session.location,
    delivery_mode: session.delivery_mode,
  };

  const {
    title,
    description,
    teacherId,
    sessionDate,
    startTime,
    endTime,
    deliveryMode,
    location,
    campusId,
    notes,
  } = data;

  const newDate = sessionDate || session.session_date;
  const newStart = startTime || session.start_time;
  const newEnd = endTime || session.end_time;
  const newDelivery = deliveryMode || session.delivery_mode;
  const newLocation = location !== undefined ? location : session.location;

  if (newDelivery === "Offline" && !newLocation)
    throw new BadRequestError("location is required for Offline sessions (BR-SCHED-011)");

  const startDt = new Date(`${newDate}T${newStart}`);
  const endDt = new Date(`${newDate}T${newEnd}`);
  if (startDt >= endDt) throw new BadRequestError("start_time must be before end_time");

  // Determine change types for change records
  const timeChanged = sessionDate || startTime || endTime;
  const teacherChanged = teacherId !== undefined && teacherId !== session.teacher_id;
  const locationChanged = location !== undefined && location !== session.location;
  const deliveryChanged = deliveryMode && deliveryMode !== session.delivery_mode;

  if (timeChanged || teacherChanged || locationChanged) {
    const conflicts = await _checkConflicts({
      startDatetime: startDt,
      endDatetime: endDt,
      teacherId: teacherId || session.teacher_id,
      classroomId: session.classroom_id,
      location: newLocation,
      excludeSessionId: sessionId,
    });
    const blocking = conflicts.filter((c) => c.severity === "Blocking");
    if (blocking.length > 0) {
      throw new ConflictError(`Schedule conflict: ${blocking.map((c) => c.type).join(", ")}`);
    }
  }

  session.session_title = title ?? session.session_title;
  session.description = description ?? session.description;
  session.teacher_id = teacherId !== undefined ? teacherId : session.teacher_id;
  session.session_date = newDate;
  session.start_time = newStart;
  session.end_time = newEnd;
  session.delivery_mode = newDelivery;
  session.location = newLocation;
  session.campus_id = campusId ?? session.campus_id;
  session.notes = notes ?? session.notes;
  session.updated_by = actorId;

  if (timeChanged) session.status = "rescheduled";

  await session.save();

  // Write change records
  const changeType = timeChanged
    ? "time_change"
    : teacherChanged
      ? "teacher_change"
      : locationChanged
        ? "location_change"
        : deliveryChanged
          ? "delivery_mode_change"
          : "update";

  await writeChangeRecord({
    sessionId: session.id,
    seriesId: session.series_id,
    changeType,
    oldValues,
    newValues: {
      session_title: session.session_title,
      session_date: newDate,
      start_time: newStart,
      end_time: newEnd,
      teacher_id: session.teacher_id,
      location: newLocation,
      delivery_mode: newDelivery,
    },
    actorId,
  });

  await writeAuditLog({
    sessionId: session.id,
    action: "UPDATE",
    oldValues,
    newValues: data,
    actorId,
  });

  return session;
};

// ---------------------------------------------------------------------------
// SCHED-03: Cancel Session
// ---------------------------------------------------------------------------
const cancelSession = async (sessionId, cancelReason, actorId, actorRole) => {
  assertAdminOrTeacher(actorRole);

  if (!cancelReason) throw new BadRequestError("cancel_reason is required");

  const session = await ClassroomSession.findByPk(sessionId);
  if (!session) throw new NotFoundError("Session not found");
  if (session.status === "archived")
    throw new BadRequestError("Cannot cancel archived session (BR-SCHED-023)");
  if (session.status === "cancelled") throw new BadRequestError("Session is already cancelled");

  const oldStatus = session.status;
  session.status = "cancelled";
  session.cancel_reason = cancelReason;
  session.updated_by = actorId;
  await session.save();

  await writeChangeRecord({
    sessionId: session.id,
    seriesId: session.series_id,
    changeType: "cancel",
    oldValues: { status: oldStatus },
    newValues: { status: "cancelled", cancel_reason: cancelReason },
    reason: cancelReason,
    actorId,
  });

  await writeAuditLog({
    sessionId: session.id,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: "cancelled", cancel_reason: cancelReason },
    actorId,
  });

  return session;
};

// ---------------------------------------------------------------------------
// SCHED-04: Create Recurring Series
// ---------------------------------------------------------------------------
const createSeries = async (data, actorId, actorRole) => {
  assertAdmin(actorRole);

  const {
    classroomId,
    recurrenceRule,
    startDate,
    endDate,
    startTime,
    endTime,
    teacherId,
    location,
    deliveryMode = "Offline",
  } = data;

  if (!classroomId) throw new BadRequestError("classroom_id is required");
  if (!recurrenceRule) throw new BadRequestError("recurrence_rule is required");
  if (!startDate || !endDate) throw new BadRequestError("start_date and end_date are required");
  if (!startTime || !endTime) throw new BadRequestError("start_time and end_time are required");
  if (new Date(startDate) > new Date(endDate))
    throw new BadRequestError("start_date must be before end_date");
  if (!DELIVERY_MODES.includes(deliveryMode))
    throw new BadRequestError(`delivery_mode must be one of: ${DELIVERY_MODES.join(", ")}`);
  if (deliveryMode === "Offline" && !location)
    throw new BadRequestError("location is required for Offline sessions (BR-SCHED-011)");

  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found");

  // Generate occurrence dates from recurrence rule
  const occurrences = _generateOccurrences({ recurrenceRule, startDate, endDate });
  if (occurrences.length === 0) throw new BadRequestError("Recurrence rule produces no sessions");

  // Create series record
  const series = await ScheduleSeries.create({
    classroom_id: classroomId,
    recurrence_rule: recurrenceRule,
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    teacher_id: teacherId || null,
    location: location || null,
    delivery_mode: deliveryMode,
    created_by: actorId,
    updated_by: actorId,
  });

  // Preview conflict check (collect all conflicts but don't block if none are blocking-per-series policy)
  const allConflicts = [];
  for (const date of occurrences) {
    const startDt = new Date(`${date}T${startTime}`);
    const endDt = new Date(`${date}T${endTime}`);
    const conflicts = await _checkConflicts({
      startDatetime: startDt,
      endDatetime: endDt,
      teacherId,
      classroomId,
      location,
    });
    if (conflicts.some((c) => c.severity === "Blocking")) {
      allConflicts.push({ date, conflicts });
    }
  }

  if (allConflicts.length > 0) {
    await ScheduleSeries.destroy({ where: { id: series.id } });
    throw new ConflictError("Series has conflicting sessions", { conflicts: allConflicts });
  }

  // Create sessions
  const sessionCount = await ClassroomSession.count({ where: { classroom_id: classroomId } });
  const sessions = [];

  for (let i = 0; i < occurrences.length; i++) {
    const date = occurrences[i];
    const session = await ClassroomSession.create({
      classroom_id: classroomId,
      session_no: sessionCount + i + 1,
      session_title: `Session ${sessionCount + i + 1}`,
      session_date: date,
      start_time: startTime,
      end_time: endTime,
      teacher_id: teacherId || null,
      location: location || null,
      delivery_mode: deliveryMode,
      series_id: series.id,
      status: "scheduled",
      created_by: actorId,
      updated_by: actorId,
    });
    sessions.push(session);
  }

  await writeAuditLog({
    sessionId: sessions[0].id,
    action: "CREATE",
    newValues: { series_id: series.id, count: sessions.length, startDate, endDate, recurrenceRule },
    actorId,
  });

  return { series, sessions };
};

// Generate dates from recurrence rule
const _generateOccurrences = ({ recurrenceRule, startDate, endDate }) => {
  const { type, days } = recurrenceRule; // e.g. { type: "weekly", days: ["mon","wed","fri"] }
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  if (type === "weekly" && Array.isArray(days)) {
    const targetDays = days.map((d) => DAY_MAP[d]).filter((d) => d !== undefined);
    while (current <= end) {
      if (targetDays.includes(current.getDay())) {
        dates.push(current.toISOString().slice(0, 10));
      }
      current.setDate(current.getDate() + 1);
    }
  } else if (type === "daily") {
    while (current <= end) {
      dates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
  } else if (type === "monthly" && Array.isArray(days)) {
    // days = day-of-month numbers e.g. [1, 15]
    while (current <= end) {
      if (days.includes(current.getDate())) {
        dates.push(current.toISOString().slice(0, 10));
      }
      current.setDate(current.getDate() + 1);
    }
  }

  return dates;
};

// ---------------------------------------------------------------------------
// SCHED-05: Reschedule Session
// ---------------------------------------------------------------------------
const rescheduleSession = async (
  sessionId,
  { scope, newDate, newStartTime, newEndTime, newLocation, newTeacherId, reason },
  actorId,
  actorRole
) => {
  assertAdminOrTeacher(actorRole);

  if (!scope || !RESCHEDULE_SCOPES.includes(scope))
    throw new BadRequestError(`scope must be one of: ${RESCHEDULE_SCOPES.join(", ")}`);

  const session = await ClassroomSession.findByPk(sessionId);
  if (!session) throw new NotFoundError("Session not found");
  if (["cancelled", "archived"].includes(session.status))
    throw new BadRequestError(`Cannot reschedule a ${session.status} session`);

  const batchId = uuidv4();
  const targetDate = newDate || session.session_date;
  const targetStart = newStartTime || session.start_time;
  const targetEnd = newEndTime || session.end_time;
  const targetLocation = newLocation !== undefined ? newLocation : session.location;
  const targetTeacher = newTeacherId !== undefined ? newTeacherId : session.teacher_id;

  const startDt = new Date(`${targetDate}T${targetStart}`);
  const endDt = new Date(`${targetDate}T${targetEnd}`);
  if (startDt >= endDt) throw new BadRequestError("New start_time must be before new end_time");

  const conflicts = await _checkConflicts({
    startDatetime: startDt,
    endDatetime: endDt,
    teacherId: targetTeacher,
    classroomId: session.classroom_id,
    location: targetLocation,
    excludeSessionId: sessionId,
  });
  if (conflicts.some((c) => c.severity === "Blocking"))
    throw new ConflictError(`Reschedule conflict: ${conflicts.map((c) => c.type).join(", ")}`);

  let sessionsToUpdate = [session];

  if (scope === "this_and_following" && session.series_id) {
    sessionsToUpdate = await ClassroomSession.findAll({
      where: {
        series_id: session.series_id,
        session_date: { [Op.gte]: session.session_date },
        status: { [Op.notIn]: ["cancelled", "archived"] },
      },
    });
  } else if (scope === "entire_series" && session.series_id) {
    sessionsToUpdate = await ClassroomSession.findAll({
      where: {
        series_id: session.series_id,
        status: { [Op.notIn]: ["cancelled", "archived"] },
      },
    });
  }

  for (const s of sessionsToUpdate) {
    const oldDate = s.session_date;
    const oldStart = s.start_time;
    const oldEnd = s.end_time;

    // For series reschedules, only change time (not date) unless it's a single session
    const updatedDate = scope === "this_session" ? targetDate : s.session_date;
    const updatedStart = targetStart;
    const updatedEnd = targetEnd;

    s.original_date = s.original_date || oldDate;
    s.original_start_time = s.original_start_time || oldStart;
    s.original_end_time = s.original_end_time || oldEnd;
    s.session_date = updatedDate;
    s.start_time = updatedStart;
    s.end_time = updatedEnd;
    if (newLocation !== undefined) s.location = targetLocation;
    if (newTeacherId !== undefined) s.teacher_id = targetTeacher;
    s.status = "rescheduled";
    s.updated_by = actorId;
    await s.save();

    await writeChangeRecord({
      sessionId: s.id,
      seriesId: s.series_id,
      changeType: "reschedule",
      oldValues: { session_date: oldDate, start_time: oldStart, end_time: oldEnd },
      newValues: { session_date: updatedDate, start_time: updatedStart, end_time: updatedEnd },
      reason,
      batchId,
      actorId,
    });
  }

  await writeAuditLog({
    sessionId: session.id,
    action: "UPDATE",
    oldValues: { session_date: session.session_date, start_time: session.start_time },
    newValues: {
      scope,
      newDate: targetDate,
      newStartTime: targetStart,
      newEndTime: targetEnd,
      reason,
      batch_id: batchId,
    },
    actorId,
  });

  return { updated: sessionsToUpdate.length, batch_id: batchId };
};

// ---------------------------------------------------------------------------
// SCHED-07: Attach Live Session Metadata
// ---------------------------------------------------------------------------
const attachLiveMetadata = async (sessionId, data, actorId, actorRole) => {
  assertAdminOrTeacher(actorRole);

  const session = await ClassroomSession.findByPk(sessionId);
  if (!session) throw new NotFoundError("Session not found");
  if (session.status === "cancelled" || session.status === "archived")
    throw new BadRequestError("Cannot attach live metadata to a cancelled or archived session");

  const { provider, roomId, joinUrl, hostUrl, accessPolicy, providerStatus } = data;

  if (!provider) throw new BadRequestError("provider is required");

  const existing = await LiveSessionMetadata.findOne({ where: { session_id: sessionId } });

  let metadata;
  if (existing) {
    existing.provider = provider ?? existing.provider;
    existing.room_id = roomId ?? existing.room_id;
    existing.join_url = joinUrl ?? existing.join_url;
    existing.host_url = hostUrl ?? existing.host_url;
    existing.access_policy = accessPolicy ?? existing.access_policy;
    existing.provider_status = providerStatus ?? existing.provider_status;
    existing.updated_by = actorId;
    await existing.save();
    metadata = existing;
  } else {
    metadata = await LiveSessionMetadata.create({
      session_id: sessionId,
      provider,
      room_id: roomId || null,
      join_url: joinUrl || null,
      host_url: hostUrl || null,
      access_policy: accessPolicy || null,
      provider_status: providerStatus || "Pending",
      created_by: actorId,
      updated_by: actorId,
    });
  }

  await writeChangeRecord({
    sessionId,
    seriesId: session.series_id,
    changeType: "live_metadata",
    oldValues: existing ? { provider: existing.provider } : null,
    newValues: { provider, joinUrl },
    actorId,
  });

  await writeAuditLog({
    sessionId,
    action: existing ? "UPDATE" : "CREATE",
    newValues: { provider, join_url: joinUrl },
    actorId,
  });

  return metadata;
};

// ---------------------------------------------------------------------------
// SCHED-08: Import Schedule
// ---------------------------------------------------------------------------
const importSchedule = async (fileBuffer, actorId, actorRole) => {
  assertAdmin(actorRole);

  const xlsx = require("xlsx");
  const wb = xlsx.read(fileBuffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const results = { created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const classroomId = row["classroom_id"] ? parseInt(row["classroom_id"]) : null;
      const sessionDate = row["session_date"];
      const startTime = row["start_time"];
      const endTime = row["end_time"];
      const title = row["title"] || row["session_title"];
      const deliveryMode = row["delivery_mode"] || "Offline";
      const location = row["location"] || null;
      const teacherId = row["teacher_id"] ? parseInt(row["teacher_id"]) : null;

      if (!classroomId || !sessionDate || !startTime || !endTime)
        throw new Error(
          "Missing required fields: classroom_id, session_date, start_time, end_time"
        );
      if (!DELIVERY_MODES.includes(deliveryMode))
        throw new Error(`Invalid delivery_mode: ${deliveryMode}`);

      const classroom = await Classroom.findByPk(classroomId);
      if (!classroom) throw new Error(`Classroom ${classroomId} not found`);

      await createSession(
        {
          classroomId,
          title: title || `Imported Session`,
          teacherId,
          sessionDate,
          startTime,
          endTime,
          deliveryMode,
          location,
        },
        actorId,
        actorRole
      );
      results.created++;
    } catch (err) {
      results.errors.push({ row: i + 2, error: err.message });
      results.skipped++;
    }
  }

  await writeAuditLog({
    sessionId: 0,
    action: "IMPORT",
    newValues: { created: results.created, skipped: results.skipped },
    actorId,
  });

  return results;
};

// ---------------------------------------------------------------------------
// SCHED-09: Export Schedule
// ---------------------------------------------------------------------------
const exportSchedule = async (filters, actorId, actorRole) => {
  const sessions = await viewSchedule(filters, actorId, actorRole);

  const xlsx = require("xlsx");
  const rows = sessions.map((s) => ({
    session_id: s.id,
    classroom: s.classroom?.classroom_name || s.classroom_id,
    session_title: s.session_title,
    session_date: s.session_date,
    start_time: s.start_time,
    end_time: s.end_time,
    teacher: s.teacher?.full_name || s.teacher_id,
    delivery_mode: s.delivery_mode,
    location: s.location,
    status: s.status,
  }));

  const ws = xlsx.utils.json_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Schedule");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// ---------------------------------------------------------------------------
// SCHED-10: Complete Session
// ---------------------------------------------------------------------------
const completeSession = async (sessionId, actorId, actorRole) => {
  assertAdmin(actorRole);

  const session = await ClassroomSession.findByPk(sessionId);
  if (!session) throw new NotFoundError("Session not found");
  if (session.status === "cancelled")
    throw new BadRequestError("Cannot complete a cancelled session");
  if (session.status === "archived")
    throw new BadRequestError("Cannot complete an archived session");
  if (session.status === "completed") return session;

  const now = new Date();
  const sessionEnd = new Date(`${session.session_date}T${session.end_time}`);
  if (now < sessionEnd && !isRole(actorRole, ROLES.ADMIN))
    throw new BadRequestError("Session end time has not passed yet (BR-SCHED-010)");

  const oldStatus = session.status;
  session.status = "completed";
  session.updated_by = actorId;
  await session.save();

  await writeAuditLog({
    sessionId: session.id,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: "completed" },
    actorId,
  });

  return session;
};

// ---------------------------------------------------------------------------
// SCHED-11: Archive Session
// ---------------------------------------------------------------------------
const archiveSession = async (sessionId, actorId, actorRole) => {
  assertAdmin(actorRole);

  const session = await ClassroomSession.findByPk(sessionId);
  if (!session) throw new NotFoundError("Session not found");
  if (session.status === "archived") return session;
  if (!["completed", "cancelled"].includes(session.status))
    throw new BadRequestError("Only completed or cancelled sessions can be archived");

  const oldStatus = session.status;
  session.status = "archived";
  session.updated_by = actorId;
  await session.save();

  await writeAuditLog({
    sessionId: session.id,
    action: "CHANGE_STATUS",
    oldValues: { status: oldStatus },
    newValues: { status: "archived" },
    actorId,
  });

  return session;
};

// ---------------------------------------------------------------------------
// Get change history for a session
// ---------------------------------------------------------------------------
const getChangeHistory = async (sessionId) => {
  const session = await ClassroomSession.findByPk(sessionId);
  if (!session) throw new NotFoundError("Session not found");

  return ScheduleChangeRecord.findAll({
    where: { session_id: sessionId },
    include: [{ model: User, as: "actor", attributes: ["id", "full_name", "email"] }],
    order: [["created_at", "DESC"]],
  });
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
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
