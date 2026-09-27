import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";
import type { CourseReview } from "@/types/models";

export async function getCourseReviews(courseId: number) {
  const response = await httpClient.get<{ reviews: CourseReview[] }>(
    API_ROUTES.reviews.course(courseId),
  );
  return response.data.reviews;
}

export async function createReview(
  courseId: number,
  data: { rating: number; review_text?: string },
) {
  const response = await httpClient.post<{ review: CourseReview }>(
    API_ROUTES.reviews.create(courseId),
    data,
  );
  return response.data.review;
}

export async function updateReview(
  id: number,
  data: { rating: number; review_text?: string },
) {
  const response = await httpClient.put<{ review: CourseReview }>(
    API_ROUTES.reviews.update(id),
    data,
  );
  return response.data.review;
}

export async function deleteReview(id: number) {
  await httpClient.delete(API_ROUTES.reviews.delete(id));
}
