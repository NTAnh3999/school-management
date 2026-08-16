const { ForbiddenError } = require("../utils/error-responses");
const CourseAuthorService = require("../services/course-author.service");
const { CONTENT_ERROR_CODES } = require("../constants/content");

/**
 * Composes with requirePermission("content.version.manage", ...): proves the actor's role has
 * the in-tenant capability, while this middleware proves the actor is the FSD's "Content Author"
 * on THIS specific course -- unless they hold content.version.manage.any (Admin/Academic-Admin
 * policy bypass), in which case the per-course assignment check is skipped entirely.
 *
 * @param {(req: import('express').Request) => (Promise<number>|number)} resolveCourseId
 */
const requireCourseAuthor = (resolveCourseId) => (req, res, next) => {
  void res;
  const hasBypass = Boolean(
    req.user?.permissions?.some((permission) => permission.code === "content.version.manage.any")
  );
  if (hasBypass) return next();

  Promise.resolve(resolveCourseId(req))
    .then(async (courseId) => {
      if (!courseId) {
        return next(new ForbiddenError("Course context is required", { errorCode: CONTENT_ERROR_CODES.NOT_AUTHOR }));
      }

      const isAuthor = await CourseAuthorService.isAssignedAuthor(courseId, req.user.id);
      if (!isAuthor) {
        return next(
          new ForbiddenError("You are not an assigned author on this course", {
            errorCode: CONTENT_ERROR_CODES.NOT_AUTHOR,
          })
        );
      }

      return next();
    })
    .catch(next);
};

module.exports = { requireCourseAuthor };
