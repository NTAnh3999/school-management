const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const ReviewService = require("../services/review.service");
const asyncHandler = require("../utils/async-handler");

const createReview = asyncHandler(async (req, res) => {
  const review = await ReviewService.createReview(req.params.courseId, req.user.id, req.body);
  return new CreatedResponse({ message: "Review created", metadata: { review } }).send(res);
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await ReviewService.updateReview(req.params.id, req.user.id, req.body);
  return new OKResponse({ message: "Review updated", metadata: { review } }).send(res);
});

const getCourseReviews = asyncHandler(async (req, res) => {
  const reviews = await ReviewService.getCourseReviews(req.params.courseId);
  return new OKResponse({ metadata: { reviews } }).send(res);
});

const deleteReview = asyncHandler(async (req, res) => {
  await ReviewService.deleteReview(req.params.id, req.user.id, req.user.role);
  return new OKResponse({ message: "Review deleted" }).send(res);
});

module.exports = { createReview, updateReview, getCourseReviews, deleteReview };
