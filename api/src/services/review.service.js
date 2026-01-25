const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const { CourseReview, Course, User, Enrollment } = require("../models");

const createReview = async (courseId, studentId, { rating, reviewText }) => {
  if (!rating || rating < 1 || rating > 5) {
    throw new BadRequestError("Rating must be between 1 and 5");
  }

  const course = await Course.findByPk(courseId);
  if (!course) throw new NotFoundError("Course not found");

  // Check if student is enrolled
  const enrollment = await Enrollment.findOne({
    where: { course_id: courseId, student_id: studentId },
  });
  if (!enrollment) throw new BadRequestError("Must be enrolled to review course");

  // Check if already reviewed
  const existing = await CourseReview.findOne({
    where: { course_id: courseId, student_id: studentId },
  });
  if (existing) throw new BadRequestError("Already reviewed this course");

  const review = await CourseReview.create({
    course_id: courseId,
    student_id: studentId,
    rating,
    review_text: reviewText,
  });

  return review;
};

const updateReview = async (reviewId, studentId, { rating, reviewText }) => {
  const review = await CourseReview.findByPk(reviewId);
  if (!review) throw new NotFoundError("Review not found");

  if (review.student_id !== studentId) {
    throw new ForbiddenError("Not authorized to update this review");
  }

  if (rating) {
    if (rating < 1 || rating > 5) throw new BadRequestError("Rating must be between 1 and 5");
    review.rating = rating;
  }
  if (reviewText !== undefined) review.review_text = reviewText;

  await review.save();
  return review;
};

const getCourseReviews = async (courseId) => {
  return CourseReview.findAll({
    where: { course_id: courseId },
    include: [{ model: User, as: "student", attributes: ["id", "full_name"] }],
    order: [["created_at", "DESC"]],
  });
};

const deleteReview = async (reviewId, studentId, userRole) => {
  const review = await CourseReview.findByPk(reviewId);
  if (!review) throw new NotFoundError("Review not found");

  if (userRole !== "admin" && review.student_id !== studentId) {
    throw new ForbiddenError("Not authorized to delete this review");
  }

  await review.destroy();
  return true;
};

module.exports = { createReview, updateReview, getCourseReviews, deleteReview };
