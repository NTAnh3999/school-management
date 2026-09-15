export type MockQuestionType = "single_choice" | "multiple_choice" | "short_answer" | "essay";

export type MockAssessmentOption = {
  id: string;
  text: string;
};

export type MockAssessmentQuestion = {
  id: string;
  type: MockQuestionType;
  prompt: string;
  points: number;
  options?: MockAssessmentOption[];
  correctOptionIds?: string[];
  sampleAnswer?: string;
};

export type MockAssessment = {
  id: string;
  title: string;
  courseTitle: string;
  lessonTitle: string;
  status: "open" | "scheduled" | "submitted" | "released";
  gradingMethod: "auto" | "manual" | "hybrid";
  durationMinutes: number;
  attemptLimit: number;
  attemptNumber: number;
  dueAt: string;
  releasePolicy: "manual" | "auto_after_graded" | "scheduled";
  maxScore: number;
  questions: MockAssessmentQuestion[];
};

export const mockAssessments: MockAssessment[] = [
  {
    id: "module-1-checkpoint",
    title: "Module 1 Checkpoint",
    courseTitle: "Foundations of Academic Writing",
    lessonTitle: "Claim, evidence, and reasoning",
    status: "open",
    gradingMethod: "hybrid",
    durationMinutes: 18,
    attemptLimit: 2,
    attemptNumber: 1,
    dueAt: "2026-09-03T10:00:00+07:00",
    releasePolicy: "manual",
    maxScore: 20,
    questions: [
      {
        id: "q1",
        type: "single_choice",
        prompt: "Which sentence states the clearest academic claim?",
        points: 4,
        options: [
          { id: "a", text: "Many students use notes." },
          {
            id: "b",
            text: "Structured note-taking improves recall because it forces learners to organize evidence.",
          },
          { id: "c", text: "This topic is interesting and useful." },
          { id: "d", text: "People have different learning habits." },
        ],
        correctOptionIds: ["b"],
      },
      {
        id: "q2",
        type: "multiple_choice",
        prompt: "Select the items that count as evidence in an academic paragraph.",
        points: 5,
        options: [
          { id: "a", text: "A measured result from a study" },
          { id: "b", text: "A relevant quotation from a primary text" },
          { id: "c", text: "A personal preference without support" },
          { id: "d", text: "A comparison using verified course data" },
        ],
        correctOptionIds: ["a", "b", "d"],
      },
      {
        id: "q3",
        type: "short_answer",
        prompt: "In one or two sentences, explain why reasoning should follow evidence.",
        points: 5,
        sampleAnswer:
          "Reasoning explains how the evidence supports the claim, so the reader can follow the argument.",
      },
      {
        id: "q4",
        type: "essay",
        prompt:
          "Write a short paragraph that makes a claim about study routines and supports it with one piece of evidence.",
        points: 6,
      },
    ],
  },
  {
    id: "retrieval-practice-pulse",
    title: "Retrieval Practice Pulse",
    courseTitle: "Learning Strategy Lab",
    lessonTitle: "Spaced recall and reflection",
    status: "released",
    gradingMethod: "auto",
    durationMinutes: 10,
    attemptLimit: 3,
    attemptNumber: 2,
    dueAt: "2026-09-01T18:00:00+07:00",
    releasePolicy: "auto_after_graded",
    maxScore: 12,
    questions: [
      {
        id: "q1",
        type: "single_choice",
        prompt: "What is the main goal of retrieval practice?",
        points: 4,
        options: [
          { id: "a", text: "To reread notes for a longer period" },
          { id: "b", text: "To recall information without looking first" },
          { id: "c", text: "To highlight every unfamiliar term" },
        ],
        correctOptionIds: ["b"],
      },
      {
        id: "q2",
        type: "multiple_choice",
        prompt: "Which actions support spaced review?",
        points: 8,
        options: [
          { id: "a", text: "Reviewing once immediately before the exam" },
          { id: "b", text: "Returning to material after increasing intervals" },
          { id: "c", text: "Mixing older concepts into new practice" },
          { id: "d", text: "Checking recall before opening notes" },
        ],
        correctOptionIds: ["b", "c", "d"],
      },
    ],
  },
  {
    id: "final-reflection-draft",
    title: "Final Reflection Draft",
    courseTitle: "Foundations of Academic Writing",
    lessonTitle: "Reflection and revision",
    status: "scheduled",
    gradingMethod: "manual",
    durationMinutes: 25,
    attemptLimit: 1,
    attemptNumber: 0,
    dueAt: "2026-09-08T17:00:00+07:00",
    releasePolicy: "manual",
    maxScore: 15,
    questions: [
      {
        id: "q1",
        type: "essay",
        prompt:
          "Reflect on one writing habit you changed during this module and describe what evidence helped you decide.",
        points: 15,
      },
    ],
  },
];

export function getMockAssessment(id: string) {
  return mockAssessments.find((assessment) => assessment.id === id);
}
