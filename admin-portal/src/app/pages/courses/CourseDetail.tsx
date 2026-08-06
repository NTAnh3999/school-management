import {
  Card,
  Descriptions,
  Space,
  Tag,
  Button,
  Table,
  Tabs,
  Popconfirm,
  message,
  Skeleton,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { PermissionGate } from "../../components/PermissionGate";
import { ModuleLessonEditor } from "../../components/ModuleLessonEditor";
import { ContentVersionsPanel } from "../../components/ContentVersionsPanel";
import {
  useGetCourseByIdQuery,
  useChangeCourseStatusMutation,
  useDeleteCourseMutation,
} from "@/store/api/coursesApi";
import type { CoursePrerequisite, CourseStatus } from "@/types";
import { getErrorMessage } from "@/lib/error";

const nextStatusOptions: Record<CourseStatus, CourseStatus[]> = {
  draft: ["active", "archived"],
  active: ["inactive", "archived"],
  inactive: ["active", "archived"],
  archived: [],
};

// ADM-11 — Course Detail: metadata, lifecycle, and prerequisites.
export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: course, isLoading } = useGetCourseByIdQuery(Number(id), { skip: !id });
  const [changeStatus] = useChangeCourseStatusMutation();
  const [deleteCourse, { isLoading: deleting }] = useDeleteCourseMutation();

  const handleStatusChange = async (status: CourseStatus) => {
    if (!course) return;
    try {
      await changeStatus({ id: course.id, status }).unwrap();
      message.success(`Course marked ${status}`);
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to change course status"));
    }
  };

  const handleDelete = async () => {
    if (!course) return;
    try {
      await deleteCourse(course.id).unwrap();
      message.success("Course deleted");
      navigate("/courses");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to delete course"));
    }
  };

  const prereqColumns: ColumnsType<CoursePrerequisite> = [
    {
      title: "Prerequisite course",
      key: "course",
      render: (_, record) =>
        record.prerequisite_course
          ? `${record.prerequisite_course.course_code} — ${record.prerequisite_course.course_name}`
          : `#${record.prerequisite_course_id}`,
    },
    { title: "Rule", dataIndex: "prerequisite_type", key: "prerequisite_type", render: (v) => <Tag>{v}</Tag> },
  ];

  if (isLoading) return <Skeleton active />;
  if (!course) return <Empty description="Course not found." />;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title={course.course_name}
        description={course.course_code}
        breadcrumb={[{ label: "Courses", to: "/courses" }, { label: course.course_name }]}
        actions={
          <PermissionGate permission="iam.user.manage">
            <Space>
              {(nextStatusOptions[course.status] ?? []).map((next) => (
                <Popconfirm
                  key={next}
                  title={`Change course status to ${next}?`}
                  description={next === "archived" ? "Archived courses can no longer be assigned to new classrooms." : undefined}
                  onConfirm={() => handleStatusChange(next)}
                >
                  <Button danger={next === "archived"}>Mark {next}</Button>
                </Popconfirm>
              ))}
              <Button icon={<EditOutlined />} onClick={() => navigate(`/courses/${course.id}/edit`)}>
                Edit
              </Button>
              <Popconfirm
                title="Delete this course?"
                description="This action cannot be undone."
                onConfirm={handleDelete}
                okButtonProps={{ danger: true, loading: deleting }}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </PermissionGate>
        }
      />

      <Tabs
        items={[
          {
            key: "overview",
            label: "Overview",
            children: (
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
                <Card title="Course information">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Status">
                      <StatusTag status={course.status} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">{course.course_type}</Descriptions.Item>
                    <Descriptions.Item label="Department">
                      {course.department?.department_name ?? `#${course.department_id}`}
                    </Descriptions.Item>
                    <Descriptions.Item label="Credit">{course.credit ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Duration (hours)">
                      {course.duration_hours ?? "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Effective range">
                      {course.effective_from ?? "—"} → {course.effective_to ?? "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Description" span={2}>
                      {course.description ?? "—"}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card title="Prerequisites">
                  <Table<CoursePrerequisite>
                    dataSource={course.prerequisites}
                    columns={prereqColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    locale={{ emptyText: "No prerequisites configured." }}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
                <ModuleLessonEditor courseId={course.id} />
                <ContentVersionsPanel courseId={course.id} />
              </Space>
            ),
          },
        ]}
      />

      <Button onClick={() => navigate(-1)}>Back</Button>
    </Space>
  );
}
