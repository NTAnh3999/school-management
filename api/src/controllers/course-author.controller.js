const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const CourseAuthorService = require("../services/course-author.service");
const asyncHandler = require("../utils/async-handler");

const list = asyncHandler(async (req, res) => {
  const authors = await CourseAuthorService.listForCourse(req.params.courseId);
  return new OKResponse({ metadata: { authors } }).send(res);
});

const assign = asyncHandler(async (req, res) => {
  const assignment = await CourseAuthorService.assign(
    req.params.courseId,
    req.body.userId,
    req.body.roleInCourse,
    req.user.id
  );
  return new CreatedResponse({ message: "Author assigned", metadata: { assignment } }).send(res);
});

const revoke = asyncHandler(async (req, res) => {
  await CourseAuthorService.revoke(req.params.courseId, req.params.userId);
  return new OKResponse({ message: "Author assignment revoked" }).send(res);
});

module.exports = { list, assign, revoke };
