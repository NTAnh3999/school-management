import { httpClient } from "@/lib/http-client";
import { API_ROUTES } from "@/config/api";

export async function getCourseReviews(courseId: number) {
  const response = await httpClient.get(API_ROUTES.reviews.course(courseId));
  return response.data;
}

export async function createReview(
  courseId: number,
  data: {
    rating: number;
    review_text?: string;
  },
) {
  const response = await httpClient.post(
    API_ROUTES.reviews.create(courseId),
    data,
  );
  return response.data;
}

export async function updateReview(
  id: number,
  data: {
    rating: number;
    review_text?: string;
  },
) {
  const response = await httpClient.put(API_ROUTES.reviews.update(id), data);
  return response.data;
}

export async function deleteReview(id: number) {
  const response = await httpClient.delete(API_ROUTES.reviews.delete(id));
  return response.data;
}
