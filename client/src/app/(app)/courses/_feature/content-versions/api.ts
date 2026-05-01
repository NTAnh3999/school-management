import { httpClient } from "@/lib/http-client";
import { API_ROUTES } from "@/config/api";

export async function getContentVersions(courseId: number) {
  const response = await httpClient.get(
    API_ROUTES.contentVersions.list(courseId),
  );
  return response.data;
}

export async function getContentVersion(id: number) {
  const response = await httpClient.get(API_ROUTES.contentVersions.detail(id));
  return response.data;
}

export async function createContentVersion(
  courseId: number,
  data: { versionLabel: string; changelog?: string },
) {
  const response = await httpClient.post(
    API_ROUTES.contentVersions.create(courseId),
    data,
  );
  return response.data;
}

export async function publishContentVersion(id: number) {
  const response = await httpClient.post(
    API_ROUTES.contentVersions.publish(id),
  );
  return response.data;
}

export async function archiveContentVersion(id: number) {
  const response = await httpClient.patch(
    API_ROUTES.contentVersions.archive(id),
  );
  return response.data;
}

export async function getPublishedContentStructure(courseId: number) {
  const response = await httpClient.get(
    API_ROUTES.contentVersions.publishedStructure(courseId),
  );
  return response.data;
}

export async function previewDraftContent(courseId: number) {
  const response = await httpClient.get(
    API_ROUTES.contentVersions.previewDraft(courseId),
  );
  return response.data;
}
