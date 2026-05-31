import type {
  ContentAsset,
  ContentVersion,
  Course,
  CourseLevel,
  CourseReview,
  CourseSection,
  Enrollment,
  EnrollmentStatus,
  LearningItem,
  Lesson,
  LessonProgress,
  LessonProgressStatus,
  PublishedContentStructure,
  StudentCourseProgress,
  User,
} from "@/types/models";

const nowIso = () => new Date().toISOString();

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const studentUser: User = {
  id: 1001,
  fullName: "Alex Morgan",
  email: "alex.morgan@schoolhub.dev",
  role: "student",
  createdAt: nowIso(),
  updatedAt: nowIso(),
};

const instructors: User[] = [
  {
    id: 201,
    fullName: "Dr. Julian Aris",
    email: "julian.aris@schoolhub.dev",
    role: "parent",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 202,
    fullName: "Elena Rodriguez",
    email: "elena.rodriguez@schoolhub.dev",
    role: "parent",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 203,
    fullName: "Marcus Vale",
    email: "marcus.vale@schoolhub.dev",
    role: "parent",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let courses: Course[] = [
  {
    id: 1,
    title: "Applied Neuroscience for Learning",
    description:
      "Build practical study systems from brain-based learning principles and improve retention with clear, repeatable habits.",
    level: "intermediate",
    price: 49,
    status: "published",
    instructor_id: 201,
    instructor: instructors[0],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 2,
    title: "Focus Architecture: Deep Work Foundations",
    description:
      "Design a distraction-resistant study workflow with calmer planning, better attention cycles, and stronger execution.",
    level: "beginner",
    price: 39,
    status: "published",
    instructor_id: 202,
    instructor: instructors[1],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 3,
    title: "Advanced Knowledge Mapping",
    description:
      "Turn dense material into memorable concept maps, layered summaries, and fast retrieval prompts.",
    level: "advanced",
    price: 79,
    status: "published",
    instructor_id: 203,
    instructor: instructors[2],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let sections: CourseSection[] = [
  {
    id: 11,
    course_id: 1,
    title: "Neural foundations",
    description: "How memory and attention cooperate while learning.",
    order_index: 1,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 12,
    course_id: 1,
    title: "Practice loops",
    description: "Build spacing and retrieval into a weekly cadence.",
    order_index: 2,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 21,
    course_id: 2,
    title: "Environment setup",
    description: "Make your workspace frictionless and intentional.",
    order_index: 1,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 31,
    course_id: 3,
    title: "Map structure",
    description: "From broad topics to compressed mental models.",
    order_index: 1,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let lessons: Lesson[] = [
  {
    id: 101,
    section_id: 11,
    title: "Attention and encoding",
    lesson_type: "video",
    duration_minutes: 14,
    order_index: 1,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 102,
    section_id: 11,
    title: "Working memory limits",
    lesson_type: "text",
    duration_minutes: 10,
    order_index: 2,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 103,
    section_id: 12,
    title: "Spaced repetition cadence",
    lesson_type: "video",
    duration_minutes: 17,
    order_index: 1,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 201,
    section_id: 21,
    title: "Attention-friendly desk setup",
    lesson_type: "text",
    duration_minutes: 12,
    order_index: 1,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let learningItems: LearningItem[] = [
  {
    id: 5001,
    lesson_id: 101,
    item_type: "VIDEO",
    title: "Lecture: Attention and Encoding",
    display_order: 1,
    estimated_duration: 14,
    is_required: true,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 5002,
    lesson_id: 101,
    item_type: "TEXT",
    title: "Summary Notes",
    content_payload: { blocks: 5 },
    display_order: 2,
    estimated_duration: 6,
    is_required: true,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let reviews: CourseReview[] = [
  {
    id: 9001,
    course_id: 1,
    student_id: 1001,
    rating: 5,
    review_text: "Very practical and easy to apply in daily study sessions.",
    student: studentUser,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 9002,
    course_id: 2,
    student_id: 1001,
    rating: 4,
    review_text: "Clear pacing and useful structure templates.",
    student: studentUser,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let enrollments: Enrollment[] = [
  {
    id: 7001,
    student_id: 1001,
    course_id: 1,
    status: "active",
    enrolled_at: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 7002,
    student_id: 1001,
    course_id: 2,
    status: "completed",
    enrolled_at: nowIso(),
    completed_at: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let lessonProgress: LessonProgress[] = [
  {
    id: 8101,
    enrollment_id: 7001,
    lesson_id: 101,
    status: "completed",
    completion_date: nowIso(),
    time_spent_minutes: 18,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 8102,
    enrollment_id: 7001,
    lesson_id: 102,
    status: "in_progress",
    time_spent_minutes: 9,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 8201,
    enrollment_id: 7002,
    lesson_id: 201,
    status: "completed",
    completion_date: nowIso(),
    time_spent_minutes: 20,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let courseProgress: StudentCourseProgress[] = [
  {
    id: 8501,
    enrollment_id: 7001,
    completion_percentage: 42,
    total_time_spent_minutes: 84,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 8502,
    enrollment_id: 7002,
    completion_percentage: 100,
    total_time_spent_minutes: 196,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let contentVersions: ContentVersion[] = [
  {
    id: 3001,
    course_id: 1,
    version_label: "v1.0",
    version_no: 1,
    status: "PUBLISHED",
    changelog: "Initial published curriculum.",
    published_at: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 3002,
    course_id: 1,
    version_label: "v1.1",
    version_no: 2,
    status: "DRAFT",
    changelog: "Added reflection practice sequence.",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let contentAssets: ContentAsset[] = [
  {
    id: 4001,
    filename: "attention-encoding.mp4",
    media_type: "video",
    mime_type: "video/mp4",
    size_bytes: 18233122,
    storage_key: "mock/content/attention-encoding.mp4",
    uploaded_by: 201,
    uploaded_at: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let idSeed = 10000;
const nextId = () => {
  idSeed += 1;
  return idSeed;
};

const withCourseRelations = (course: Course): Course => {
  const sectionList = sections
    .filter((section) => section.course_id === course.id)
    .sort((a, b) => a.order_index - b.order_index)
    .map((section) => ({
      ...section,
      lessons: lessons
        .filter((lesson) => lesson.section_id === section.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map((lesson) => ({
          ...lesson,
          learning_items: learningItems
            .filter(
              (item) =>
                item.lesson_id === lesson.id && item.status !== "archived",
            )
            .sort((a, b) => a.display_order - b.display_order),
        })),
    }));

  const reviewList = reviews.filter((review) => review.course_id === course.id);
  const enrollmentList = getEnrollmentsByCourse(course.id);

  return {
    ...course,
    sections: sectionList,
    reviews: reviewList,
    enrollments: enrollmentList,
  };
};

const getEnrollmentsByCourse = (courseId: number): Enrollment[] => {
  return enrollments
    .filter((enrollment) => enrollment.course_id === courseId)
    .map((enrollment) => {
      const progress = courseProgress.find(
        (entry) => entry.enrollment_id === enrollment.id,
      );
      const relatedLessonProgress = lessonProgress
        .filter((entry) => entry.enrollment_id === enrollment.id)
        .map((entry) => ({
          ...entry,
          lesson: lessons.find((lesson) => lesson.id === entry.lesson_id),
        }));

      return {
        ...enrollment,
        student: studentUser,
        progress,
        lesson_progress: relatedLessonProgress,
      };
    });
};

export function listCourses(params?: {
  level?: string;
  status?: string;
  instructorId?: number;
}) {
  let filtered = [...courses];

  if (params?.level) {
    filtered = filtered.filter((course) => course.level === params.level);
  }

  if (params?.status) {
    filtered = filtered.filter((course) => course.status === params.status);
  }

  if (params?.instructorId) {
    filtered = filtered.filter(
      (course) => course.instructor_id === params.instructorId,
    );
  }

  return deepClone(filtered.map(withCourseRelations));
}

export function getCourseById(id: number) {
  const course = courses.find((entry) => entry.id === id);
  if (!course) {
    throw new Error("Course not found");
  }

  return deepClone(withCourseRelations(course));
}

export function addCourse(data: {
  title: string;
  description: string;
  level: string;
  price: number;
}) {
  const created: Course = {
    id: nextId(),
    title: data.title,
    description: data.description,
    level: (data.level as CourseLevel) || "beginner",
    price: data.price,
    status: "draft",
    instructor_id: instructors[0].id,
    instructor: instructors[0],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  courses = [created, ...courses];
  return deepClone(created);
}

export function patchCourse(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    level: string;
    price: number;
    status: string;
  }>,
) {
  let updated: Course | undefined;

  courses = courses.map((course) => {
    if (course.id !== id) return course;
    updated = {
      ...course,
      ...data,
      level: (data.level as CourseLevel) ?? course.level,
      status: (data.status as Course["status"]) ?? course.status,
      updatedAt: nowIso(),
    };
    return updated;
  });

  if (!updated) {
    throw new Error("Course not found");
  }

  return deepClone(withCourseRelations(updated));
}

export function removeCourse(id: number) {
  courses = courses.filter((course) => course.id !== id);
  sections = sections.filter((section) => section.course_id !== id);
  const removedSectionIds = new Set(
    sections
      .filter((section) => section.course_id === id)
      .map((section) => section.id),
  );
  lessons = lessons.filter(
    (lesson) => !removedSectionIds.has(lesson.section_id),
  );
  reviews = reviews.filter((review) => review.course_id !== id);
  enrollments = enrollments.filter((enrollment) => enrollment.course_id !== id);
  return { success: true };
}

export function enrollInCourse(courseId: number) {
  const existing = enrollments.find((entry) => entry.course_id === courseId);
  if (existing) {
    return deepClone(existing);
  }

  const enrollment: Enrollment = {
    id: nextId(),
    student_id: studentUser.id,
    course_id: courseId,
    status: "active",
    enrolled_at: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  const progress: StudentCourseProgress = {
    id: nextId(),
    enrollment_id: enrollment.id,
    completion_percentage: 0,
    total_time_spent_minutes: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  enrollments = [enrollment, ...enrollments];
  courseProgress = [progress, ...courseProgress];

  return deepClone(enrollment);
}

export function listMyEnrollments() {
  return deepClone(
    enrollments.map((enrollment) => {
      const course = courses.find((entry) => entry.id === enrollment.course_id);
      const progress = courseProgress.find(
        (entry) => entry.enrollment_id === enrollment.id,
      );
      const progressRows = lessonProgress
        .filter((entry) => entry.enrollment_id === enrollment.id)
        .map((entry) => ({
          ...entry,
          lesson: lessons.find((lesson) => lesson.id === entry.lesson_id),
        }));

      return {
        ...enrollment,
        student: studentUser,
        course,
        progress,
        lesson_progress: progressRows,
      };
    }),
  );
}

export function listSections(courseId: number) {
  return deepClone(
    sections
      .filter((section) => section.course_id === courseId)
      .sort((a, b) => a.order_index - b.order_index)
      .map((section) => ({
        ...section,
        lessons: lessons
          .filter((lesson) => lesson.section_id === section.id)
          .sort((a, b) => a.order_index - b.order_index),
      })),
  );
}

export function getSectionById(id: number) {
  const section = sections.find((entry) => entry.id === id);
  if (!section) {
    throw new Error("Section not found");
  }
  return deepClone({
    ...section,
    lessons: lessons
      .filter((lesson) => lesson.section_id === section.id)
      .sort((a, b) => a.order_index - b.order_index),
  });
}

export function addSection(
  courseId: number,
  data: { title: string; description?: string; order_index: number },
) {
  const created: CourseSection = {
    id: nextId(),
    course_id: courseId,
    title: data.title,
    description: data.description,
    order_index: data.order_index,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  sections = [...sections, created];
  return deepClone(created);
}

export function patchSection(
  id: number,
  data: Partial<{ title: string; description: string; order_index: number }>,
) {
  let updated: CourseSection | undefined;

  sections = sections.map((section) => {
    if (section.id !== id) return section;
    updated = {
      ...section,
      ...data,
      updatedAt: nowIso(),
    };
    return updated;
  });

  if (!updated) {
    throw new Error("Section not found");
  }

  return deepClone(updated);
}

export function removeSection(id: number) {
  sections = sections.filter((section) => section.id !== id);
  lessons = lessons.filter((lesson) => lesson.section_id !== id);
  return { success: true };
}

export function listLessons(sectionId: number) {
  return deepClone(
    lessons
      .filter((lesson) => lesson.section_id === sectionId)
      .sort((a, b) => a.order_index - b.order_index)
      .map((lesson) => ({
        ...lesson,
        learning_items: learningItems
          .filter(
            (item) =>
              item.lesson_id === lesson.id && item.status !== "archived",
          )
          .sort((a, b) => a.display_order - b.display_order),
      })),
  );
}

export function getLessonById(id: number) {
  const lesson = lessons.find((entry) => entry.id === id);
  if (!lesson) {
    throw new Error("Lesson not found");
  }
  return deepClone({
    ...lesson,
    learning_items: learningItems
      .filter(
        (item) => item.lesson_id === lesson.id && item.status !== "archived",
      )
      .sort((a, b) => a.display_order - b.display_order),
  });
}

export function addLesson(
  sectionId: number,
  data: {
    title: string;
    content?: string;
    lesson_type: string;
    video_url?: string;
    duration_minutes: number;
    order_index: number;
  },
) {
  const created: Lesson = {
    id: nextId(),
    section_id: sectionId,
    title: data.title,
    content: data.content,
    lesson_type: data.lesson_type as Lesson["lesson_type"],
    video_url: data.video_url,
    duration_minutes: data.duration_minutes,
    order_index: data.order_index,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  lessons = [...lessons, created];
  return deepClone(created);
}

export function patchLesson(
  id: number,
  data: Partial<{
    title: string;
    content: string;
    lesson_type: string;
    video_url: string;
    duration_minutes: number;
    order_index: number;
  }>,
) {
  let updated: Lesson | undefined;

  lessons = lessons.map((lesson) => {
    if (lesson.id !== id) return lesson;
    updated = {
      ...lesson,
      ...data,
      lesson_type:
        (data.lesson_type as Lesson["lesson_type"]) ?? lesson.lesson_type,
      updatedAt: nowIso(),
    };
    return updated;
  });

  if (!updated) {
    throw new Error("Lesson not found");
  }

  return deepClone(updated);
}

export function removeLesson(id: number) {
  lessons = lessons.filter((lesson) => lesson.id !== id);
  learningItems = learningItems.filter((item) => item.lesson_id !== id);
  return { success: true };
}

export function listLearningItems(lessonId: number) {
  return deepClone(
    learningItems
      .filter(
        (item) => item.lesson_id === lessonId && item.status !== "archived",
      )
      .sort((a, b) => a.display_order - b.display_order),
  );
}

export function getLearningItemById(id: number) {
  const item = learningItems.find((entry) => entry.id === id);
  if (!item) {
    throw new Error("Learning item not found");
  }
  return deepClone(item);
}

export function addLearningItem(
  lessonId: number,
  data: {
    itemType: string;
    title: string;
    contentPayload?: Record<string, unknown>;
    assetId?: number;
    displayOrder?: number;
    estimatedDuration?: number;
    isRequired?: boolean;
  },
) {
  const created: LearningItem = {
    id: nextId(),
    lesson_id: lessonId,
    item_type: (data.itemType as LearningItem["item_type"]) || "TEXT",
    title: data.title,
    content_payload: data.contentPayload,
    asset_id: data.assetId,
    display_order: data.displayOrder ?? learningItems.length + 1,
    estimated_duration: data.estimatedDuration,
    is_required: data.isRequired ?? true,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  learningItems = [...learningItems, created];
  return deepClone(created);
}

export function patchLearningItem(
  id: number,
  data: Partial<{
    title: string;
    contentPayload: Record<string, unknown>;
    assetId: number;
    displayOrder: number;
    estimatedDuration: number;
    isRequired: boolean;
  }>,
) {
  let updated: LearningItem | undefined;

  learningItems = learningItems.map((item) => {
    if (item.id !== id) return item;
    updated = {
      ...item,
      title: data.title ?? item.title,
      content_payload: data.contentPayload ?? item.content_payload,
      asset_id: data.assetId ?? item.asset_id,
      display_order: data.displayOrder ?? item.display_order,
      estimated_duration: data.estimatedDuration ?? item.estimated_duration,
      is_required: data.isRequired ?? item.is_required,
      updatedAt: nowIso(),
    };
    return updated;
  });

  if (!updated) {
    throw new Error("Learning item not found");
  }

  return deepClone(updated);
}

export function archiveLearningItemById(id: number) {
  learningItems = learningItems.map((item) =>
    item.id === id
      ? { ...item, status: "archived", updatedAt: nowIso() }
      : item,
  );
  return { success: true };
}

export function reorderLearningItemsByLesson(
  lessonId: number,
  orderedIds: number[],
) {
  const orderMap = new Map<number, number>();
  orderedIds.forEach((itemId, index) => {
    orderMap.set(itemId, index + 1);
  });

  learningItems = learningItems.map((item) => {
    if (item.lesson_id !== lessonId) return item;
    if (!orderMap.has(item.id)) return item;

    return {
      ...item,
      display_order: orderMap.get(item.id) ?? item.display_order,
      updatedAt: nowIso(),
    };
  });

  return listLearningItems(lessonId);
}

export function listCourseReviews(courseId: number) {
  return deepClone(reviews.filter((review) => review.course_id === courseId));
}

export function addCourseReview(
  courseId: number,
  data: { rating: number; review_text?: string },
) {
  const created: CourseReview = {
    id: nextId(),
    course_id: courseId,
    student_id: studentUser.id,
    rating: data.rating,
    review_text: data.review_text,
    student: studentUser,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  reviews = [created, ...reviews];
  return deepClone(created);
}

export function patchCourseReview(
  id: number,
  data: { rating: number; review_text?: string },
) {
  let updated: CourseReview | undefined;

  reviews = reviews.map((review) => {
    if (review.id !== id) return review;
    updated = {
      ...review,
      rating: data.rating,
      review_text: data.review_text,
      updatedAt: nowIso(),
    };
    return updated;
  });

  if (!updated) {
    throw new Error("Review not found");
  }

  return deepClone(updated);
}

export function removeCourseReview(id: number) {
  reviews = reviews.filter((review) => review.id !== id);
  return { success: true };
}

export function saveLessonProgress(data: {
  enrollment_id: number;
  lesson_id: number;
  status: string;
  time_spent_minutes?: number;
}) {
  const status = data.status as LessonProgressStatus;
  const existing = lessonProgress.find(
    (entry) =>
      entry.enrollment_id === data.enrollment_id &&
      entry.lesson_id === data.lesson_id,
  );

  if (existing) {
    existing.status = status;
    existing.time_spent_minutes =
      data.time_spent_minutes ?? existing.time_spent_minutes;
    existing.completion_date = status === "completed" ? nowIso() : undefined;
    existing.updatedAt = nowIso();
  } else {
    lessonProgress = [
      ...lessonProgress,
      {
        id: nextId(),
        enrollment_id: data.enrollment_id,
        lesson_id: data.lesson_id,
        status,
        completion_date: status === "completed" ? nowIso() : undefined,
        time_spent_minutes: data.time_spent_minutes ?? 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ];
  }

  const progressRows = lessonProgress.filter(
    (entry) => entry.enrollment_id === data.enrollment_id,
  );
  const completed = progressRows.filter(
    (entry) => entry.status === "completed",
  ).length;
  const total = progressRows.length || 1;
  const totalMinutes = progressRows.reduce(
    (sum, entry) => sum + entry.time_spent_minutes,
    0,
  );

  const existingProgress = courseProgress.find(
    (entry) => entry.enrollment_id === data.enrollment_id,
  );

  if (existingProgress) {
    existingProgress.completion_percentage = Math.round(
      (completed / total) * 100,
    );
    existingProgress.total_time_spent_minutes = totalMinutes;
    existingProgress.updatedAt = nowIso();
  } else {
    courseProgress = [
      ...courseProgress,
      {
        id: nextId(),
        enrollment_id: data.enrollment_id,
        completion_percentage: Math.round((completed / total) * 100),
        total_time_spent_minutes: totalMinutes,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ];
  }

  return { success: true };
}

export function getProgressByEnrollment(enrollmentId: number) {
  const row = courseProgress.find(
    (entry) => entry.enrollment_id === enrollmentId,
  );
  return deepClone(row ?? null);
}

export function getProgressByCourse(courseId: number) {
  const enrollmentIds = enrollments
    .filter((enrollment) => enrollment.course_id === courseId)
    .map((enrollment) => enrollment.id);

  return deepClone(
    courseProgress.filter((entry) =>
      enrollmentIds.includes(entry.enrollment_id),
    ),
  );
}

export function listContentVersions(courseId: number) {
  return deepClone(
    contentVersions
      .filter((version) => version.course_id === courseId)
      .sort((a, b) => b.version_no - a.version_no),
  );
}

export function getContentVersionById(id: number) {
  const row = contentVersions.find((entry) => entry.id === id);
  if (!row) {
    throw new Error("Content version not found");
  }
  return deepClone(row);
}

export function addContentVersion(
  courseId: number,
  data: { versionLabel: string; changelog?: string },
) {
  const nextVersionNo =
    Math.max(
      0,
      ...contentVersions
        .filter((entry) => entry.course_id === courseId)
        .map((entry) => entry.version_no),
    ) + 1;

  const created: ContentVersion = {
    id: nextId(),
    course_id: courseId,
    version_label: data.versionLabel,
    version_no: nextVersionNo,
    status: "DRAFT",
    changelog: data.changelog,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  contentVersions = [created, ...contentVersions];
  return deepClone(created);
}

export function publishContentVersionById(id: number) {
  const version = contentVersions.find((entry) => entry.id === id);
  if (!version) {
    throw new Error("Content version not found");
  }

  contentVersions = contentVersions.map((entry) => {
    if (entry.course_id !== version.course_id) return entry;
    if (entry.id === id) {
      return {
        ...entry,
        status: "PUBLISHED",
        published_at: nowIso(),
        updatedAt: nowIso(),
      };
    }

    if (entry.status === "PUBLISHED") {
      return {
        ...entry,
        status: "ARCHIVED",
        updatedAt: nowIso(),
      };
    }

    return entry;
  });

  return deepClone(contentVersions.find((entry) => entry.id === id));
}

export function archiveContentVersionById(id: number) {
  contentVersions = contentVersions.map((entry) =>
    entry.id === id
      ? {
          ...entry,
          status: "ARCHIVED",
          updatedAt: nowIso(),
        }
      : entry,
  );

  return { success: true };
}

export function getPublishedStructure(
  courseId: number,
): PublishedContentStructure {
  const publishedVersion = contentVersions.find(
    (entry) => entry.course_id === courseId && entry.status === "PUBLISHED",
  );
  const version = publishedVersion ?? listContentVersions(courseId)[0];

  return deepClone({
    course_id: courseId,
    version_id: version?.id ?? 0,
    version_label: version?.version_label ?? "v0.0",
    version_no: version?.version_no ?? 0,
    published_at: version?.published_at ?? nowIso(),
    structure: listSections(courseId),
  });
}

export function getDraftPreview(courseId: number): PublishedContentStructure {
  const latestVersion = listContentVersions(courseId)[0];

  return deepClone({
    course_id: courseId,
    version_id: latestVersion?.id ?? 0,
    version_label: latestVersion?.version_label ?? "draft",
    version_no: latestVersion?.version_no ?? 0,
    published_at: nowIso(),
    structure: listSections(courseId),
  });
}

export function listAssets(params?: {
  mediaType?: string;
  uploadedBy?: number;
}) {
  let filtered = [...contentAssets];

  if (params?.mediaType) {
    filtered = filtered.filter(
      (asset) => asset.media_type === params.mediaType,
    );
  }

  if (params?.uploadedBy) {
    filtered = filtered.filter(
      (asset) => asset.uploaded_by === params.uploadedBy,
    );
  }

  return deepClone(filtered);
}

export function getAssetById(id: number) {
  const asset = contentAssets.find((entry) => entry.id === id);
  if (!asset) {
    throw new Error("Asset not found");
  }
  return deepClone(asset);
}

export function addAsset(data: {
  filename: string;
  mediaType: string;
  mimeType: string;
  storageKey: string;
  sizeBytes?: number;
  durationSeconds?: number;
  thumbnailUrl?: string;
}) {
  const created: ContentAsset = {
    id: nextId(),
    filename: data.filename,
    media_type: data.mediaType as ContentAsset["media_type"],
    mime_type: data.mimeType,
    storage_key: data.storageKey,
    size_bytes: data.sizeBytes,
    duration_seconds: data.durationSeconds,
    thumbnail_url: data.thumbnailUrl,
    uploaded_by: instructors[0].id,
    uploaded_at: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  contentAssets = [created, ...contentAssets];
  return deepClone(created);
}

export function patchAsset(
  id: number,
  data: Partial<{ filename: string; thumbnailUrl: string }>,
) {
  let updated: ContentAsset | undefined;

  contentAssets = contentAssets.map((asset) => {
    if (asset.id !== id) return asset;

    updated = {
      ...asset,
      filename: data.filename ?? asset.filename,
      thumbnail_url: data.thumbnailUrl ?? asset.thumbnail_url,
      updatedAt: nowIso(),
    };
    return updated;
  });

  if (!updated) {
    throw new Error("Asset not found");
  }

  return deepClone(updated);
}
