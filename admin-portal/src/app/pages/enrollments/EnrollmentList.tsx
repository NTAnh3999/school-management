import { useState } from "react";
import { Table, Button, Space, Select, Tooltip } from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { PermissionGate } from "../../components/PermissionGate";
import { useListEnrollmentsQuery } from "@/store/api/enrollmentsApi";
import { useListCoursesQuery } from "@/store/api/coursesApi";
import type { Enrollment, EnrollmentStatus } from "@/types";

// ADM-22 — Enrollment List.
export function EnrollmentList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<EnrollmentStatus | undefined>();
  const [courseId, setCourseId] = useState<number | undefined>();

  const { data, isLoading } = useListEnrollmentsQuery({
    page,
    page_size: 10,
    status,
    course_id: courseId,
  });
  const { data: courses } = useListCoursesQuery({ page_size: 100 });

  const columns: ColumnsType<Enrollment> = [
    {
      title: "Learner",
      key: "student",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.student?.full_name ?? `#${record.student_id}`}</div>
          <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{record.student?.email}</div>
        </div>
      ),
    },
    {
      title: "Course",
      key: "course",
      render: (_, record) => record.course?.course_name ?? `#${record.course_id}`,
    },
    { title: "Source", dataIndex: "request_source", key: "request_source" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: EnrollmentStatus) => <StatusTag status={v} />,
      filters: ["pending", "active", "suspended", "cancelled", "completed", "rejected", "waitlisted"].map(
        (s) => ({ text: s, value: s }),
      ),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Requested",
      dataIndex: "requested_at",
      key: "requested_at",
      render: (v: string) => new Date(v).toLocaleDateString(),
      sorter: (a, b) => new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime(),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Tooltip title="View">
          <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/enrollments/${record.id}`)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Enrollments"
        description="Course enrollments by learner and status across your tenant."
        actions={
          <PermissionGate permission="iam.user.manage">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/enrollments/new")}>
              Create Enrollment
            </Button>
          </PermissionGate>
        }
      />

      <Space wrap>
        <Select
          placeholder="Course"
          allowClear
          showSearch
          optionFilterProp="label"
          value={courseId}
          onChange={(v) => {
            setCourseId(v);
            setPage(1);
          }}
          style={{ width: 260 }}
          options={courses?.courses.map((c) => ({ label: `${c.course_code} — ${c.course_name}`, value: c.id }))}
        />
        <Select
          placeholder="Status"
          allowClear
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          style={{ width: 160 }}
          options={["pending", "active", "suspended", "cancelled", "completed", "rejected", "waitlisted"].map(
            (s) => ({ label: s, value: s }),
          )}
        />
      </Space>

      <Table<Enrollment>
        dataSource={data?.enrollments}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        onRow={(record) => ({ onClick: () => navigate(`/enrollments/${record.id}`), style: { cursor: "pointer" } })}
        pagination={{
          current: page,
          total: data?.total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (total) => `${total} enrollments`,
        }}
        locale={{ emptyText: "No enrollments found." }}
      />
    </Space>
  );
}
