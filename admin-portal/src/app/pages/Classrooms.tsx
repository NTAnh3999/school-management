import { memo, useState, useMemo } from "react";
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
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  useGetClassroomsQuery,
  useDeleteClassroomMutation,
  useCreateClassroomMutation,
} from "@/store/api/classroomsApi";
import type { Classroom, ClassroomStatus } from "@/types";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const statusColors: Record<ClassroomStatus, string> = {
  active: "success",
  upcoming: "processing",
  completed: "default",
};

const buildColumns = (
  onDelete: (id: number) => void,
): ColumnsType<Classroom> => [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    render: (name: string, record) => (
      <div>
        <Text strong>{name}</Text>
        <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
          {record.courseName}
        </Text>
      </div>
    ),
  },
  {
    title: "Instructor",
    dataIndex: "instructorName",
    key: "instructor",
  },
  {
    title: "Students",
    key: "students",
    render: (_, record) => (
      <Space direction="vertical" size={2} style={{ width: 120 }}>
        <Text style={{ fontSize: 12 }}>
          {record.enrolledStudents}/{record.maxStudents}
        </Text>
        <Progress
          percent={Math.round(
            (record.enrolledStudents / record.maxStudents) * 100,
          )}
          size="small"
          showInfo={false}
        />
      </Space>
    ),
    sorter: (a, b) => a.enrolledStudents - b.enrolledStudents,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: ClassroomStatus) => (
      <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
    ),
    filters: [
      { text: "Active", value: "active" },
      { text: "Upcoming", value: "upcoming" },
      { text: "Completed", value: "completed" },
    ],
    onFilter: (value, record) => record.status === value,
  },
  {
    title: "Period",
    key: "period",
    render: (_, record) => (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {new Date(record.startDate).toLocaleDateString()} –{" "}
        {new Date(record.endDate).toLocaleDateString()}
      </Text>
    ),
  },
  {
    title: "Actions",
    key: "actions",
    align: "right",
    render: (_, record) => (
      <Space>
        <Tooltip title="Edit">
          <Button type="text" icon={<EditOutlined />} />
        </Tooltip>
        <Popconfirm
          title="Delete this classroom?"
          onConfirm={() => onDelete(record.id)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Delete">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      </Space>
    ),
  },
];

const ClassroomModal = memo(function ClassroomModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<Classroom>) => void;
  loading: boolean;
}) {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Create Classroom"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="Classroom Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="maxStudents"
          label="Max Students"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={500} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="dateRange" label="Period" rules={[{ required: true }]}>
          <RangePicker style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
});

export function Classrooms() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useGetClassroomsQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter,
  });

  const [deleteClassroom] = useDeleteClassroomMutation();
  const [createClassroom, { isLoading: creating }] =
    useCreateClassroomMutation();

  const handleDelete = async (id: number) => {
    try {
      await deleteClassroom(id).unwrap();
      message.success("Classroom deleted");
    } catch {
      message.error("Failed to delete classroom");
    }
  };

  const handleCreate = async (values: Partial<Classroom>) => {
    try {
      await createClassroom(values).unwrap();
      message.success("Classroom created");
      setModalOpen(false);
    } catch {
      message.error("Failed to create classroom");
    }
  };

  const columns = useMemo(() => buildColumns(handleDelete), []);

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Classrooms
          </Title>
          <Text type="secondary">Manage cohort-based learning sessions</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Create Classroom
        </Button>
      </div>

      <Space wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search classrooms..."
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
            { label: "Upcoming", value: "upcoming" },
            { label: "Completed", value: "completed" },
          ]}
        />
      </Space>

      <Table<Classroom>
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
          showTotal: (total) => `${total} classrooms`,
        }}
      />

      <ClassroomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        loading={creating}
      />
    </Space>
  );
}
