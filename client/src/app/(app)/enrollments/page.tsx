import { redirect } from "next/navigation";

// Enrollments are shown in "Khoá học của tôi" (STU-02) since the redesign;
// keep the old URL working for bookmarks and notifications.
export default function EnrollmentsPage() {
  redirect("/courses");
}
