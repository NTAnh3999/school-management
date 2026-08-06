import { useMemo, useState } from "react";
import { Card, Space, Select, Table, Progress, Empty, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { useListCoursesQuery } from "@/store/api/coursesApi";
import { useGetCourseProgressQuery } from "@/store/api/progressApi";
import type { TeacherCourseProgressRow } from "@/types";

// ADM-30 — Progress Dashboard. The backend only exposes progress aggregated per course
// (GET /progress/course/:id), not tenant-wide, so admins pick a course to review; learners
// with low completion are surfaced first as an approximation of "behind pacing / at risk".
export function ProgressDashboard() {
  const navigate = useNavigate();
  const { data: courses } = useListCoursesQuery({ status: "active", page_size: 100 });
  const [courseId, setCourseId] = useState<number | undefined>();
  const { data: rows, isLoading } = useGetCourseProgressQuery(courseId!, { skip: !courseId });

  const atRisk = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => (r.progress?.completion_percentage ?? 0) < 30 && r.progress?.status !== "not_started")
        .slice(0, 20),
    [rows],
  );

  const columns: ColumnsType<TeacherCourseProgressRow> = [
    {
      title: "Learner",
      key: "student",
      render: (_, r) => r.student?.full_name ?? `Enrollment #${r.enrollment_id}`,
    },
    {
      title: "Status",
      key: "status",
      render: (_, r) => (r.progress ? <Tag>{r.progress.status.replace(/_/g, " ")}</Tag> : "—"),
    },
    {
      title: "Completion",
      key: "completion",
      render: (_, r) => (
        <Progress percent={Math.round(r.progress?.completion_percentage ?? 0)} size="small" />
      ),
    },
    {
      title: "Time spent",
      key: "time",
      render: (_, r) =>
        r.progress?.total_time_spent_minutes != null ? `${r.progress.total_time_spent_minutes} min` : "—",
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, r) => (
        <a onClick={() => navigate(`/progress/${r.enrollment_id}`)}>View</a>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader title="Progress" description="Learner completion and pacing by course." />

      <Select
        placeholder="Select a course"
        showSearch
        optionFilterProp="label"
        value={courseId}
        onChange={setCourseId}
        style={{ width: 420 }}
        options={courses?.courses.map((c) => ({ label: `${c.course_code} — ${c.course_name}`, value: c.id }))}
      />

      {!courseId ? (
        <Empty description="Select a course to review learner progress." />
      ) : (
        <>
          {atRisk.length > 0 && (
            <Card title="Learners behind pacing" size="small">
              <Table<TeacherCourseProgressRow>
                dataSource={atRisk}
                columns={columns}
                rowKey="enrollment_id"
                size="small"
                pagination={false}
              />
            </Card>
          )}

          <Card title="All learners">
            <Table<TeacherCourseProgressRow>
              dataSource={rows}
              columns={columns}
              rowKey="enrollment_id"
              loading={isLoading}
              size="small"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: "No enrollments in this course yet." }}
            />
          </Card>
        </>
      )}
    </Space>
  );
}
