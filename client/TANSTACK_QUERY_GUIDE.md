# TanStack Query Implementation Guide

## Overview

TanStack Query (React Query) has been fully implemented across all API calls in the application. This replaces direct HTTP client calls with declarative data-fetching hooks that provide automatic caching, background refetching, and optimistic updates.

## Benefits

- **Automatic Caching**: Data is cached and reused across components
- **Background Refetching**: Stale data is automatically refreshed
- **Loading & Error States**: Built-in state management for async operations
- **Optimistic Updates**: UI updates before server confirmation
- **DevTools**: Integrated React Query DevTools for debugging

## Configuration

The QueryClient is configured in [lib/react-query.ts](lib/react-query.ts):

```typescript
{
  queries: {
    refetchOnWindowFocus: false,  // Don't refetch on window focus
    retry: 1,                      // Retry failed requests once
    staleTime: 1000 * 30,         // Data is fresh for 30 seconds
  },
  mutations: {
    retry: 1,                      // Retry failed mutations once
  }
}
```

## Available Hooks

### Courses

**Location**: `app/(app)/courses/_feature/hooks.ts`

```typescript
// Queries
useCourses(params?: { level?: string; status?: string; instructorId?: number })
useCourse(id: number)
useMyEnrollments()

// Mutations
useCreateCourse()
useUpdateCourse()
useDeleteCourse()
useEnrollCourse()
```

**Example Usage**:

```typescript
// Fetching courses
const { data: courses, isLoading, error } = useCourses({ level: "beginner" });

// Creating a course
const createMutation = useCreateCourse();
createMutation.mutate({
  title: "New Course",
  description: "Course description",
  level: "intermediate",
  price: 99.99,
});
```

### Sections

**Location**: `app/(app)/courses/_feature/sections/hooks.ts`

```typescript
// Queries
useSections(courseId: number)
useSection(id: number)

// Mutations
useCreateSection()
useUpdateSection()
useDeleteSection()
```

**Example Usage**:

```typescript
// Fetching sections for a course
const { data: sections } = useSections(courseId);

// Creating a section
const createMutation = useCreateSection();
createMutation.mutate({
  courseId: 1,
  data: {
    title: "Introduction",
    description: "Course introduction",
    order_index: 1,
  },
});
```

### Lessons

**Location**: `app/(app)/courses/_feature/lessons/hooks.ts`

```typescript
// Queries
useLessons(sectionId: number)
useLesson(id: number)

// Mutations
useCreateLesson()
useUpdateLesson()
useDeleteLesson()
```

**Example Usage**:

```typescript
// Fetching lessons for a section
const { data: lessons } = useLessons(sectionId);

// Updating a lesson
const updateMutation = useUpdateLesson();
updateMutation.mutate({
  id: lessonId,
  data: { title: "Updated Title" },
});
```

### Quizzes

**Location**: `app/(app)/assessments/_feature/quizzes/hooks.ts`

```typescript
// Queries
useQuiz(id: number)
useQuizAttempts(quizId: number)

// Mutations
useCreateQuiz()
useAddQuizQuestion()
useStartQuizAttempt()
useSubmitQuizAttempt()
```

**Example Usage**:

```typescript
// Starting a quiz attempt
const startAttempt = useStartQuizAttempt();
startAttempt.mutate(quizId, {
  onSuccess: (attempt) => {
    console.log("Attempt started:", attempt);
  },
});

// Submitting quiz answers
const submitAttempt = useSubmitQuizAttempt();
submitAttempt.mutate({
  attemptId: 123,
  answers: [
    { question_id: 1, selected_option_id: 1 },
    { question_id: 2, text_answer: "My answer" },
  ],
});
```

### Progress

**Location**: `_shared/progress/hooks.ts`

```typescript
// Queries
useEnrollmentProgress(enrollmentId: number)
useCourseProgress(courseId: number)

// Mutations
useUpdateProgress()
```

**Example Usage**:

```typescript
// Tracking lesson progress
const updateProgress = useUpdateProgress();
updateProgress.mutate({
  enrollment_id: 1,
  lesson_id: 5,
  status: "completed",
  time_spent_minutes: 30,
});
```

### Reviews

**Location**: `_shared/reviews/hooks.ts`

```typescript
// Queries
useCourseReviews(courseId: number)

// Mutations
useCreateReview()
useUpdateReview()
useDeleteReview()
```

**Example Usage**:

```typescript
// Creating a review
const createReview = useCreateReview();
createReview.mutate({
  courseId: 1,
  data: {
    rating: 5,
    review_text: "Excellent course!",
  },
});
```

### Rewards

**Location**: `app/(app)/rewards/_feature/hooks.ts`

```typescript
// Queries
useRewards()
useMyRewards()
useStudentRewards(studentId: number)

// Mutations
useCreateReward()
useAwardReward()
```

**Example Usage**:

```typescript
// Fetching user's rewards
const { data: myRewards } = useMyRewards();

// Awarding a reward
const awardReward = useAwardReward();
awardReward.mutate({
  student_id: 123,
  reward_id: 456,
  enrollment_id: 789,
});
```

### Notifications

**Location**: `_shared/notifications/hooks.ts`

```typescript
// Queries
useNotifications();

// Mutations
useMarkNotificationRead();
useMarkAllNotificationsRead();
useDeleteNotification();
```

### Authentication

**Location**: `app/(auth)/_feature/hooks.ts`

```typescript
// Queries
useProfile();

// Mutations
useLogin();
useRegister();
useLogout();
```

## Common Patterns

### Loading States

```typescript
const { data, isLoading, isError, error } = useCourses();

if (isLoading) return <Spinner />;
if (isError) return <Error message={error.message} />;

return <CourseList courses={data} />;
```

### Mutation with Callbacks

```typescript
const mutation = useCreateCourse();

const handleSubmit = (formData) => {
  mutation.mutate(formData, {
    onSuccess: () => {
      toast.success("Course created successfully!");
      router.push("/courses");
    },
    onError: (error) => {
      toast.error(`Failed to create course: ${error.message}`);
    },
  });
};
```

### Conditional Fetching

```typescript
// Only fetch if courseId is available
const { data: course } = useCourse(courseId, {
  enabled: !!courseId,
});
```

### Manual Refetching

```typescript
const { data, refetch } = useCourses();

<Button onClick={() => refetch()}>Refresh</Button>
```

### Accessing Mutation State

```typescript
const mutation = useCreateCourse();

<Button
  onClick={() => mutation.mutate(data)}
  disabled={mutation.isPending}
>
  {mutation.isPending ? 'Creating...' : 'Create Course'}
</Button>
```

## Query Keys Structure

Query keys are organized hierarchically for efficient cache invalidation:

```typescript
["courses"][("courses", { level: "beginner" })][("courses", 123)][ // All courses // Filtered courses // Single course
  ("sections", "course", 123)
][("sections", 456)][("lessons", "section", 123)][("lessons", 456)][ // Sections for course 123 // Single section // Lessons for section 123 // Single lesson
  ("quizzes", 123)
][("quiz-attempts", 123)][("progress", "enrollment", 123)][ // Single quiz // Attempts for quiz 123 // Progress for enrollment
  ("progress", "course", 456)
][("reviews", "course", 123)]["rewards"][("rewards", "my")][ // Progress for course // Reviews for course 123 // All rewards // Current user's rewards
  ("rewards", "student", 123)
]["notifications"]["profile"]; // Rewards for student 123 // User notifications // Current user profile
```

## DevTools

React Query DevTools are enabled in development mode. Access them via the floating icon in the bottom-right corner of your browser.

Features:

- View all queries and their states
- Inspect query data
- Manually trigger refetches
- View query timeline
- Debug cache behavior

## Best Practices

1. **Use the hooks directly in components** - Don't wrap them in custom logic unless necessary
2. **Leverage automatic refetching** - The library handles stale data automatically
3. **Use optimistic updates** - Update UI before server confirms for better UX
4. **Keep query keys consistent** - Follow the established patterns
5. **Handle error states** - Always provide user feedback for errors
6. **Use `enabled` option** - Prevent unnecessary requests with conditional fetching
7. **Invalidate related queries** - Mutations already invalidate related queries automatically

## Migration from Direct API Calls

### Before (Pure HTTP Client)

```typescript
import { getCourses } from "./api";

const [courses, setCourses] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  getCourses()
    .then((data) => setCourses(data))
    .catch((err) => setError(err))
    .finally(() => setLoading(false));
}, []);
```

### After (TanStack Query)

```typescript
import { useCourses } from "./hooks";

const { data: courses, isLoading, error } = useCourses();
// That's it! Caching, refetching, and error handling are automatic
```

## Additional Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/react/guides/query-keys)
