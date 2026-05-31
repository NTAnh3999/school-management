import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";
import { Spin } from "antd";
import { RootLayout } from "./layouts/RootLayout";

// Lazy-load each page for code splitting (bundle-dynamic-imports)
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Users = lazy(() =>
  import("./pages/Users").then((m) => ({ default: m.Users })),
);
const Courses = lazy(() =>
  import("./pages/Courses").then((m) => ({ default: m.Courses })),
);
const Classrooms = lazy(() =>
  import("./pages/Classrooms").then((m) => ({ default: m.Classrooms })),
);
const Enrollments = lazy(() =>
  import("./pages/Enrollments").then((m) => ({ default: m.Enrollments })),
);
const Schedule = lazy(() =>
  import("./pages/Schedule").then((m) => ({ default: m.Schedule })),
);
const Reports = lazy(() =>
  import("./pages/Reports").then((m) => ({ default: m.Reports })),
);
const Permissions = lazy(() =>
  import("./pages/Permissions").then((m) => ({ default: m.Permissions })),
);
const Settings = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.Settings })),
);
const NotFound = lazy(() =>
  import("./pages/NotFound").then((m) => ({ default: m.NotFound })),
);

const PageSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div
        style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}
      >
        <Spin size="large" />
      </div>
    }
  >
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        element: (
          <PageSuspense>
            <Dashboard />
          </PageSuspense>
        ),
      },
      {
        path: "users",
        element: (
          <PageSuspense>
            <Users />
          </PageSuspense>
        ),
      },
      {
        path: "courses",
        element: (
          <PageSuspense>
            <Courses />
          </PageSuspense>
        ),
      },
      {
        path: "classrooms",
        element: (
          <PageSuspense>
            <Classrooms />
          </PageSuspense>
        ),
      },
      {
        path: "enrollments",
        element: (
          <PageSuspense>
            <Enrollments />
          </PageSuspense>
        ),
      },
      {
        path: "schedule",
        element: (
          <PageSuspense>
            <Schedule />
          </PageSuspense>
        ),
      },
      {
        path: "reports",
        element: (
          <PageSuspense>
            <Reports />
          </PageSuspense>
        ),
      },
      {
        path: "permissions",
        element: (
          <PageSuspense>
            <Permissions />
          </PageSuspense>
        ),
      },
      {
        path: "settings",
        element: (
          <PageSuspense>
            <Settings />
          </PageSuspense>
        ),
      },
      {
        path: "*",
        element: (
          <PageSuspense>
            <NotFound />
          </PageSuspense>
        ),
      },
    ],
  },
]);
