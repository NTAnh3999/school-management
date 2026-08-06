import { useState } from "react";
import { Table, Button, Space, Input, Select, Tooltip } from "antd";
import { PlusOutlined, SearchOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { PermissionGate } from "../../components/PermissionGate";
import { useListCoursesQuery } from "@/store/api/coursesApi";
import type { Course, CourseStatus } from "@/types";

// ADM-10 — Course List: course master data for the tenant.
export function CourseList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<CourseStatus | undefined>();

  const { data, isLoading } = useListCoursesQuery({
    page,
    page_size: 10,
    keyword: keyword || undefined,
    status,
  });

  const columns: ColumnsType<Course> = [
    { title: "Code", dataIndex: "course_code", key: "course_code", width: 120 },
    {
      title: "Course",
      key: "course_name",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.course_name}</div>
          {record.short_name && (
            <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{record.short_name}</div>
          )}
        </div>
      ),
    },
    {
      title: "Department",
      key: "department",
      render: (_, record) => record.department?.department_name ?? `#${record.department_id}`,
    },
    { title: "Type", dataIndex: "course_type", key: "course_type" },
    { title: "Credit", dataIndex: "credit", key: "credit", render: (v) => v ?? "—" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: CourseStatus) => <StatusTag status={v} />,
      filters: ["draft", "active", "inactive", "archived"].map((s) => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Tooltip title="View">
          <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/courses/${record.id}`)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Courses"
        description="Course master data, lifecycle, and prerequisites for your tenant."
        actions={
          <PermissionGate permission="iam.user.manage">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/courses/new")}>
              Create Course
            </Button>
          </PermissionGate>
        }
      />

      <Space wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name or code..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          style={{ width: 260 }}
          allowClear
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
          options={["draft", "active", "inactive", "archived"].map((s) => ({ label: s, value: s }))}
        />
      </Space>

      <Table<Course>
        dataSource={data?.courses}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        onRow={(record) => ({ onClick: () => navigate(`/courses/${record.id}`), style: { cursor: "pointer" } })}
        pagination={{
          current: page,
          total: data?.total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (total) => `${total} courses`,
        }}
        locale={{ emptyText: "No courses found. Create a new course to get started." }}
      />
    </Space>
  );
}
