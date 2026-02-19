"use client";

import { EnrollmentTable } from "@/_shared/enrollments/components/enrollment-table";

export default function PeoplePage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Enrollments, permissions and RBAC assignments surface here. Plug your real
        API once the backend is ready.
      </p>
      <EnrollmentTable />
    </div>
  );
}
