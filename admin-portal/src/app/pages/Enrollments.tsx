import { useState, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Select,
  Progress,
  Tooltip,
  Popconfirm,
  message,
} from "antd";
import { SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  useGetEnrollmentsQuery,
  useDeleteEnrollmentMutation,
} from "@/store/api/enrollmentsApi";
import type { Enrollment, EnrollmentStatus } from "@/types";

const { Title, Text } = Typography;

const statusColors: Record<EnrollmentStatus, string> = {
  active: "processing",
  completed: "success",
  dropped: "error",
};

const buildColumns = (
  onDelete: (id: number) => void,
): ColumnsType<Enrollment> => [
  {
    title: "Student",
    dataIndex: "studentName",
    key: "studentName",
    sorter: (a, b) => a.studentName.localeCompare(b.studentName),
  },
  {
    title: "Course",
    dataIndex: "courseName",
    key: "courseName",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: EnrollmentStatus) => (
      <Tag color={statusColors[status]}>{status}</Tag>
    ),
    filters: [
      { text: "Active", value: "active" },
      { text: "Completed", value: "completed" },
      { text: "Dropped", value: "dropped" },
    ],
    onFilter: (value, record) => record.status === value,
  },
  {
    title: "Progress",
    dataIndex: "progress",
    key: "progress",
    render: (progress: number) => (
      <Progress percent={progress} size="small" style={{ width: 120 }} />
    ),
    sorter: (a, b) => a.progress - b.progress,
  },
  {
    title: "Enrolled At",
    dataIndex: "enrolledAt",
    key: "enrolledAt",
    render: (val: string) => new Date(val).toLocaleDateString(),
    sorter: (a, b) =>
      new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime(),
  },
  {
    title: "Actions",
    key: "actions",
    align: "right",
    render: (_, record) => (
      <Popconfirm
        title="Remove enrollment?"
        onConfirm={() => onDelete(record.id)}
        okText="Remove"
        okButtonProps={{ danger: true }}
      >
        <Tooltip title="Remove">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Tooltip>
      </Popconfirm>
    ),
  },
];

export function Enrollments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetEnrollmentsQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter,
  });

  const [deleteEnrollment] = useDeleteEnrollmentMutation();

  const handleDelete = async (id: number) => {
    try {
      await deleteEnrollment(id).unwrap();
      message.success("Enrollment removed");
    } catch {
      message.error("Failed to remove enrollment");
    }
  };

  const columns = useMemo(() => buildColumns(handleDelete), []);

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Enrollments
        </Title>
        <Text type="secondary">
          Track and manage student course enrollments
        </Text>
      </div>

      <Space wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by student or course..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          placeholder="Filter by status"
          allowClear
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          style={{ width: 180 }}
          options={[
            { label: "All Status", value: undefined },
            { label: "Active", value: "active" },
            { label: "Completed", value: "completed" },
            { label: "Dropped", value: "dropped" },
          ]}
        />
      </Space>

      <Table<Enrollment>
        dataSource={data?.data}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.total,
          pageSize: 10,
          onChange: setPage,
          showSizeChanger: false,
          showTotal: (total) => `${total} enrollments`,
        }}
      />
    </Space>
  );
}
