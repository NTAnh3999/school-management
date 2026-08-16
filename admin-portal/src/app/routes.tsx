import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";
import { Spin } from "antd";
import { RootLayout } from "./layouts/RootLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { ProtectedRoute, GuestRoute, RequireAuth } from "./components/ProtectedRoute";

// Lazy-load each page for code splitting (bundle-dynamic-imports)
const Login = lazy(() => import("./pages/auth/Login").then((m) => ({ default: m.Login })));
const SelectTenant = lazy(() =>
  import("./pages/auth/SelectTenant").then((m) => ({ default: m.SelectTenant })),
);

const Dashboard = lazy(() =>
  import("./pages/dashboard/Dashboard").then((m) => ({ default: m.Dashboard })),
);

const UserList = lazy(() => import("./pages/users/UserList").then((m) => ({ default: m.UserList })));
const UserDetail = lazy(() =>
  import("./pages/users/UserDetail").then((m) => ({ default: m.UserDetail })),
);
const InviteUser = lazy(() =>
  import("./pages/users/InviteUser").then((m) => ({ default: m.InviteUser })),
);

const ProfileList = lazy(() =>
  import("./pages/profiles/ProfileList").then((m) => ({ default: m.ProfileList })),
);
const ProfileDetail = lazy(() =>
  import("./pages/profiles/ProfileDetail").then((m) => ({ default: m.ProfileDetail })),
);
const RelationshipsHome = lazy(() =>
  import("./pages/profiles/RelationshipsHome").then((m) => ({ default: m.RelationshipsHome })),
);

const CourseList = lazy(() =>
  import("./pages/courses/CourseList").then((m) => ({ default: m.CourseList })),
);
const CourseDetail = lazy(() =>
  import("./pages/courses/CourseDetail").then((m) => ({ default: m.CourseDetail })),
);
const CourseForm = lazy(() =>
  import("./pages/courses/CourseForm").then((m) => ({ default: m.CourseForm })),
);
const ContentApprovalQueue = lazy(() =>
  import("./pages/courses/ContentApprovalQueue").then((m) => ({ default: m.ContentApprovalQueue })),
);

const DepartmentList = lazy(() =>
  import("./pages/academic/DepartmentList").then((m) => ({ default: m.DepartmentList })),
);
const DepartmentForm = lazy(() =>
  import("./pages/academic/DepartmentForm").then((m) => ({ default: m.DepartmentForm })),
);
const ContentAssets = lazy(() =>
  import("./pages/academic/ContentAssets").then((m) => ({ default: m.ContentAssets })),
);

const ClassroomList = lazy(() =>
  import("./pages/classrooms/ClassroomList").then((m) => ({ default: m.ClassroomList })),
);
const ClassroomDetail = lazy(() =>
  import("./pages/classrooms/ClassroomDetail").then((m) => ({ default: m.ClassroomDetail })),
);
const ClassroomForm = lazy(() =>
  import("./pages/classrooms/ClassroomForm").then((m) => ({ default: m.ClassroomForm })),
);

const EnrollmentList = lazy(() =>
  import("./pages/enrollments/EnrollmentList").then((m) => ({ default: m.EnrollmentList })),
);
const EnrollmentDetail = lazy(() =>
  import("./pages/enrollments/EnrollmentDetail").then((m) => ({ default: m.EnrollmentDetail })),
);
const CreateEnrollment = lazy(() =>
  import("./pages/enrollments/CreateEnrollment").then((m) => ({ default: m.CreateEnrollment })),
);

const AssessmentOverview = lazy(() =>
  import("./pages/assessments/AssessmentOverview").then((m) => ({ default: m.AssessmentOverview })),
);
const AssessmentDetail = lazy(() =>
  import("./pages/assessments/AssessmentDetail").then((m) => ({ default: m.AssessmentDetail })),
);
const Gradebook = lazy(() =>
  import("./pages/assessments/Gradebook").then((m) => ({ default: m.Gradebook })),
);

const ProgressDashboard = lazy(() =>
  import("./pages/progress/ProgressDashboard").then((m) => ({ default: m.ProgressDashboard })),
);
const LearnerProgressDetail = lazy(() =>
  import("./pages/progress/LearnerProgressDetail").then((m) => ({ default: m.LearnerProgressDetail })),
);

const ReportingDashboard = lazy(() =>
  import("./pages/reporting/ReportingDashboard").then((m) => ({ default: m.ReportingDashboard })),
);

const NotificationList = lazy(() =>
  import("./pages/notifications/NotificationList").then((m) => ({ default: m.NotificationList })),
);

const AuditLog = lazy(() =>
  import("./pages/administration/AuditLog").then((m) => ({ default: m.AuditLog })),
);
const TenantSettings = lazy(() =>
  import("./pages/administration/TenantSettings").then((m) => ({ default: m.TenantSettings })),
);

const MyProfile = lazy(() =>
  import("./pages/account/MyProfile").then((m) => ({ default: m.MyProfile })),
);

const ComingSoon = lazy(() => import("./pages/ComingSoon").then((m) => ({ default: m.ComingSoon })));

const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));

const PageSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    }
  >
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    Component: GuestRoute,
    children: [
      {
        Component: AuthLayout,
        children: [
          { path: "login", element: <PageSuspense><Login /></PageSuspense> },
        ],
      },
    ],
  },
  {
    path: "select-tenant",
    Component: RequireAuth,
    children: [
      {
        Component: AuthLayout,
        children: [{ index: true, element: <PageSuspense><SelectTenant /></PageSuspense> }],
      },
    ],
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        Component: RootLayout,
        children: [
          { index: true, element: <PageSuspense><Dashboard /></PageSuspense> },

          { path: "users", element: <PageSuspense><UserList /></PageSuspense> },
          { path: "users/invite", element: <PageSuspense><InviteUser /></PageSuspense> },
          { path: "users/:id", element: <PageSuspense><UserDetail /></PageSuspense> },

          { path: "profiles", element: <PageSuspense><ProfileList /></PageSuspense> },
          { path: "profiles/:id", element: <PageSuspense><ProfileDetail /></PageSuspense> },
          { path: "relationships", element: <PageSuspense><RelationshipsHome /></PageSuspense> },

          { path: "departments", element: <PageSuspense><DepartmentList /></PageSuspense> },
          { path: "departments/new", element: <PageSuspense><DepartmentForm /></PageSuspense> },
          { path: "departments/:id/edit", element: <PageSuspense><DepartmentForm /></PageSuspense> },
          { path: "content-assets", element: <PageSuspense><ContentAssets /></PageSuspense> },

          { path: "courses", element: <PageSuspense><CourseList /></PageSuspense> },
          { path: "courses/new", element: <PageSuspense><CourseForm /></PageSuspense> },
          { path: "courses/:id", element: <PageSuspense><CourseDetail /></PageSuspense> },
          { path: "courses/:id/edit", element: <PageSuspense><CourseForm /></PageSuspense> },
          {
            path: "courses/content-approval",
            element: <PageSuspense><ContentApprovalQueue /></PageSuspense>,
          },

          { path: "classrooms", element: <PageSuspense><ClassroomList /></PageSuspense> },
          { path: "classrooms/new", element: <PageSuspense><ClassroomForm /></PageSuspense> },
          { path: "classrooms/:id", element: <PageSuspense><ClassroomDetail /></PageSuspense> },
          { path: "classrooms/:id/edit", element: <PageSuspense><ClassroomForm /></PageSuspense> },

          { path: "enrollments", element: <PageSuspense><EnrollmentList /></PageSuspense> },
          { path: "enrollments/new", element: <PageSuspense><CreateEnrollment /></PageSuspense> },
          { path: "enrollments/:id", element: <PageSuspense><EnrollmentDetail /></PageSuspense> },

          { path: "assessments", element: <PageSuspense><AssessmentOverview /></PageSuspense> },
          { path: "assessments/:id", element: <PageSuspense><AssessmentDetail /></PageSuspense> },
          { path: "gradebook", element: <PageSuspense><Gradebook /></PageSuspense> },

          { path: "progress", element: <PageSuspense><ProgressDashboard /></PageSuspense> },
          {
            path: "progress/:enrollmentId",
            element: <PageSuspense><LearnerProgressDetail /></PageSuspense>,
          },

          { path: "reporting", element: <PageSuspense><ReportingDashboard /></PageSuspense> },
          { path: "notifications", element: <PageSuspense><NotificationList /></PageSuspense> },

          { path: "administration/audit-log", element: <PageSuspense><AuditLog /></PageSuspense> },
          { path: "administration/settings", element: <PageSuspense><TenantSettings /></PageSuspense> },

          {
            path: "billing",
            element: (
              <PageSuspense>
                <ComingSoon
                  title="Billing"
                  description="Invoices and payments within your tenant."
                  note="Billing is an optional module (Could-priority) and is not enabled for this tenant yet."
                />
              </PageSuspense>
            ),
          },

          { path: "account/profile", element: <PageSuspense><MyProfile /></PageSuspense> },
          {
            path: "account/security",
            element: (
              <PageSuspense>
                <ComingSoon
                  title="Change Password / Security"
                  description="Manage your password and security settings."
                  note="Self-service password change is planned for a later release."
                />
              </PageSuspense>
            ),
          },

          { path: "*", element: <PageSuspense><NotFound /></PageSuspense> },
        ],
      },
    ],
  },
]);
