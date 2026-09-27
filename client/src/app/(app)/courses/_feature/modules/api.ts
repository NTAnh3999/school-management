import { API_ROUTES } from "@/config/api";
import { httpClient } from "@/lib/http-client";
import type { CourseModule } from "@/types/models";

// GET /modules/course/:courseId — resolves to the open Draft version, or the
// latest Published version if there is no Draft. Each module includes
// `lessons` but NOT `learning_items`.
export async function getModules(courseId: number) {
  const response = await httpClient.get<{ modules: CourseModule[] }>(
    API_ROUTES.modules.listByCourse(courseId),
  );
  return response.data.modules;
}

export async function getModule(id: number) {
  const response = await httpClient.get<{ module: CourseModule }>(
    API_ROUTES.modules.detail(id),
  );
  return response.data.module;
}
