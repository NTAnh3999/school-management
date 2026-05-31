import {
  addCourseReview,
  listCourseReviews,
  patchCourseReview,
  removeCourseReview,
} from "@/app/(app)/courses/_feature/mock-data";

export async function getCourseReviews(courseId: number) {
  return listCourseReviews(courseId);
}

export async function createReview(
  courseId: number,
  data: {
    rating: number;
    review_text?: string;
  },
) {
  return addCourseReview(courseId, data);
}

export async function updateReview(
  id: number,
  data: {
    rating: number;
    review_text?: string;
  },
) {
  return patchCourseReview(id, data);
}

export async function deleteReview(id: number) {
  return removeCourseReview(id);
}
