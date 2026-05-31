import {
  addContentVersion,
  archiveContentVersionById,
  getContentVersionById,
  getDraftPreview,
  getPublishedStructure,
  listContentVersions,
  publishContentVersionById,
} from "../mock-data";

export async function getContentVersions(courseId: number) {
  return listContentVersions(courseId);
}

export async function getContentVersion(id: number) {
  return getContentVersionById(id);
}

export async function createContentVersion(
  courseId: number,
  data: { versionLabel: string; changelog?: string },
) {
  return addContentVersion(courseId, data);
}

export async function publishContentVersion(id: number) {
  return publishContentVersionById(id);
}

export async function archiveContentVersion(id: number) {
  return archiveContentVersionById(id);
}

export async function getPublishedContentStructure(courseId: number) {
  return getPublishedStructure(courseId);
}

export async function previewDraftContent(courseId: number) {
  return getDraftPreview(courseId);
}
