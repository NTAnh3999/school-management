import {
  addSection,
  getSectionById,
  listSections,
  patchSection,
  removeSection,
} from "../mock-data";

export async function getSections(courseId: number) {
  return listSections(courseId);
}

export async function getSection(id: number) {
  return getSectionById(id);
}

export async function createSection(
  courseId: number,
  data: {
    title: string;
    description?: string;
    order_index: number;
  },
) {
  return addSection(courseId, data);
}

export async function updateSection(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    order_index: number;
  }>,
) {
  return patchSection(id, data);
}

export async function deleteSection(id: number) {
  return removeSection(id);
}
