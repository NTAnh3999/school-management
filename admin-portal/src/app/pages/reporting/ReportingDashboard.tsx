import { useMemo } from "react";
import { Row, Col, Card, Space, Skeleton, Typography } from "antd";
import { PageHeader } from "../../components/PageHeader";
import { KpiCard } from "../../components/KpiCard";
import { StatusBreakdown } from "../../components/StatusBreakdown";
import { useListCoursesQuery } from "@/store/api/coursesApi";
import { useListClassroomsQuery } from "@/store/api/classroomsApi";
import { useListEnrollmentsQuery } from "@/store/api/enrollmentsApi";
import { useListProfilesQuery } from "@/store/api/profilesApi";

const countBy = <T,>(items: T[] | undefined, key: (item: T) => string) => {
  const counts = new Map<string, number>();
  items?.forEach((item) => {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  });
  return Array.from(counts, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

// ADM-34 — Reporting Dashboard. The backend has no dedicated reporting/analytics module, so
// this aggregates course, classroom, and enrollment data client-side (capped at 200 records per
// entity — accurate for typical tenant sizes, approximate for very large ones. A real reporting
// endpoint would be needed to scale this precisely).
export function ReportingDashboard() {
  const { data: courses, isLoading: coursesLoading } = useListCoursesQuery({ page_size: 200 });
  const { data: classrooms, isLoading: classroomsLoading } = useListClassroomsQuery({ page_size: 200 });
  const { data: enrollments, isLoading: enrollmentsLoading } = useListEnrollmentsQuery({ page_size: 200 });
  const { data: profiles, isLoading: profilesLoading } = useListProfilesQuery({ limit: 200 });

  const courseStatusBreakdown = useMemo(() => countBy(courses?.courses, (c) => c.status), [courses]);
  const classroomStatusBreakdown = useMemo(
    () => countBy(classrooms?.items, (c) => c.status),
    [classrooms],
  );
  const enrollmentStatusBreakdown = useMemo(
    () => countBy(enrollments?.enrollments, (e) => e.status),
    [enrollments],
  );
  const profileTypeBreakdown = useMemo(
    () => countBy(profiles?.profiles, (p) => p.profile_type),
    [profiles],
  );

  const loading = coursesLoading || classroomsLoading || enrollmentsLoading || profilesLoading;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Reporting"
        description="Tenant-wide overview across users, courses, classrooms, and enrollments."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KpiCard label="Profiles" value={profiles?.total ?? 0} loading={profilesLoading} />
        <KpiCard label="Courses" value={courses?.total ?? 0} loading={coursesLoading} />
        <KpiCard label="Classrooms" value={classrooms?.total ?? 0} loading={classroomsLoading} />
        <KpiCard label="Enrollments" value={enrollments?.total ?? 0} loading={enrollmentsLoading} />
      </div>

      {loading ? (
        <Skeleton active />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Profiles by type">
              {profileTypeBreakdown.length ? (
                <StatusBreakdown data={profileTypeBreakdown} />
              ) : (
                <Typography.Text type="secondary">No profiles yet.</Typography.Text>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Courses by status">
              {courseStatusBreakdown.length ? (
                <StatusBreakdown data={courseStatusBreakdown} />
              ) : (
                <Typography.Text type="secondary">No courses yet.</Typography.Text>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Classrooms by status">
              {classroomStatusBreakdown.length ? (
                <StatusBreakdown data={classroomStatusBreakdown} />
              ) : (
                <Typography.Text type="secondary">No classrooms yet.</Typography.Text>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Enrollments by status">
              {enrollmentStatusBreakdown.length ? (
                <StatusBreakdown data={enrollmentStatusBreakdown} />
              ) : (
                <Typography.Text type="secondary">No enrollments yet.</Typography.Text>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </Space>
  );
}
