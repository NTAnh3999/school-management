const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const CourseService = require("../services/course.service");

const create = async (req, res, next) => {
  try {
    const course = await CourseService.create({
      name: req.body?.name,
      description: req.body?.description,
      startDate: req.body?.startDate,
      endDate: req.body?.endDate,
      teacherId: req.body?.teacherId,
    });
    return new CreatedResponse({ message: "Course created", metadata: { course } }).send(res);
  } catch (err) {
    return next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const courses = await CourseService.list();
    return new OKResponse({ metadata: { courses } }).send(res);
  } catch (err) {
    return next(err);
  }
};

const detail = async (req, res, next) => {
  try {
    const course = await CourseService.detail(req.params.id);
    return new OKResponse({ metadata: { course } }).send(res);
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const course = await CourseService.update(req.params.id, {
      name: req.body?.name,
      description: req.body?.description,
      startDate: req.body?.startDate,
      endDate: req.body?.endDate,
      teacherId: req.body?.teacherId,
    });
    return new OKResponse({ message: "Course updated", metadata: { course } }).send(res);
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await CourseService.remove(req.params.id);
    return new OKResponse({ message: "Course deleted" }).send(res);
  } catch (err) {
    return next(err);
  }
};

module.exports = { create, list, detail, update, remove };
