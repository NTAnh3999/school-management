import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  apiSidebar: [
    "intro",
    "database-schema",
    {
      type: "category",
      label: "API Reference",
      items: [
        "api/authentication",
        "api/iam",
        "api/profiles",
        "api/courses",
        "api/enrollments",
        "api/classrooms",
        "api/modules",
        "api/lessons",
        "api/learning-items",
        "api/content-assets",
        "api/content-versions",
        "api/progress",
        "api/assessments",
        "api/quizzes",
        "api/schedules",
        "api/reviews",
        "api/notifications",
        "api/rewards",
        "api/users",
      ],
    },
  ],
};

export default sidebars;
