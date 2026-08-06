import { useState } from "react";
import { Table, Button, Space, Input, Select, Tooltip, Progress } from "antd";
import { PlusOutlined, SearchOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { PermissionGate } from "../../components/PermissionGate";
import { useListClassroomsQuery } from "@/store/api/classroomsApi";
import type { Classroom, ClassroomStatus, DeliveryMethod } from "@/types";

// ADM-16 — Classroom List.
export function ClassroomList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<ClassroomStatus | undefined>();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | undefined>();

  const { data, isLoading } = useListClassroomsQuery({
    page,
    page_size: 10,
    keyword: keyword || undefined,
    status,
    delivery_method: deliveryMethod,
  });

  const columns: ColumnsType<Classroom> = [
    { title: "Code", dataIndex: "classroom_code", key: "classroom_code", width: 130 },
    {
      title: "Classroom",
      key: "name",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.classroom_name}</div>
          <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
            {record.course?.course_name ?? `Course #${record.course_id}`}
          </div>
        </div>
      ),
    },
    {
      title: "Teacher",
      key: "teacher",
      render: (_, record) => {
        const main = record.teachers?.find((t) => t.role_in_classroom === "main_teacher");
        return main?.user?.full_name ?? <span style={{ color: "rgba(0,0,0,0.35)" }}>Unassigned</span>;
      },
    },
    { title: "Delivery", dataIndex: "delivery_method", key: "delivery_method", render: (v) => <span>{v}</span> },
    {
      title: "Capacity",
      key: "capacity",
      width: 160,
      render: (_, record) => (
        <Progress
          percent={Math.round((record.enrolled_count / (record.max_capacity || 1)) * 100)}
          size="small"
          format={() => `${record.enrolled_count}/${record.max_capacity}`}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: ClassroomStatus) => <StatusTag status={v} />,
      filters: ["draft", "open", "full", "in_progress", "completed", "cancelled", "archived"].map((s) => ({
        text: s,
        value: s,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Tooltip title="View">
          <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/classrooms/${record.id}`)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Classrooms"
        description="Classrooms and cohorts running in your tenant."
        actions={
          <PermissionGate permission="iam.user.manage">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/classrooms/new")}>
              Create Classroom
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
          options={["draft", "open", "full", "in_progress", "completed", "cancelled", "archived"].map((s) => ({
            label: s,
            value: s,
          }))}
        />
        <Select
          placeholder="Delivery"
          allowClear
          value={deliveryMethod}
          onChange={(v) => {
            setDeliveryMethod(v);
            setPage(1);
          }}
          style={{ width: 140 }}
          options={["online", "offline", "hybrid"].map((s) => ({ label: s, value: s }))}
        />
      </Space>

      <Table<Classroom>
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        onRow={(record) => ({ onClick: () => navigate(`/classrooms/${record.id}`), style: { cursor: "pointer" } })}
        pagination={{
          current: page,
          total: data?.total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (total) => `${total} classrooms`,
        }}
        locale={{ emptyText: "No classrooms available." }}
      />
    </Space>
  );
}
