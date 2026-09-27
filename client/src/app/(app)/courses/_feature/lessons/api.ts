import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";
import type { Lesson } from "@/types/models";

// GET /lessons/module/:moduleId — includes `quiz` but NOT `learning_items`.
export async function getLessons(moduleId: number) {
  const response = await httpClient.get<{ lessons: Lesson[] }>(
    API_ROUTES.lessons.list(moduleId),
  );
  return response.data.lessons;
}

// GET /lessons/:id — includes module (-> course), quiz, feedback. Still no
// learning_items; fetch those separately via getLearningItems(lessonId).
export async function getLesson(id: number) {
  const response = await httpClient.get<{ lesson: Lesson }>(
    API_ROUTES.lessons.detail(id),
  );
  return response.data.lesson;
}
