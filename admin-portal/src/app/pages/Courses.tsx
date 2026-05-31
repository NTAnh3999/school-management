import { memo, useState, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Select,
  Tooltip,
  Popconfirm,
  Modal,
  Form,
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
  useGetCoursesQuery,
  useDeleteCourseMutation,
  useCreateCourseMutation,
} from "@/store/api/coursesApi";
import type { Course, CourseStatus } from "@/types";

const { Title, Text } = Typography;

const statusColors: Record<CourseStatus, string> = {
  draft: "default",
  published: "success",
  archived: "warning",
};

const buildColumns = (onDelete: (id: number) => void): ColumnsType<Course> => [
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
    render: (title: string, record) => (
      <div>
        <Text strong>{title}</Text>
        <Text
          type="secondary"
          style={{ display: "block", fontSize: 12 }}
          ellipsis
        >
          {record.description}
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
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: CourseStatus) => (
      <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
    ),
    filters: [
      { text: "Draft", value: "draft" },
      { text: "Published", value: "published" },
      { text: "Archived", value: "archived" },
    ],
    onFilter: (value, record) => record.status === value,
  },
  {
    title: "Enrollments",
    dataIndex: "enrollmentCount",
    key: "enrollmentCount",
    sorter: (a, b) => a.enrollmentCount - b.enrollmentCount,
    align: "center",
  },
  {
    title: "Created",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (val: string) => new Date(val).toLocaleDateString(),
    sorter: (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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
          title="Delete this course?"
          description="All related enrollments will be removed."
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

// Standalone modal to prevent inline component re-creation (rerender-no-inline-components)
const CourseModal = memo(function CourseModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<Course>) => void;
  loading: boolean;
}) {
  const [form] = Form.useForm<Partial<Course>>();

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Create Course"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="status" label="Status" initialValue="draft">
          <Select
            options={[
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
});

export function Courses() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useGetCoursesQuery({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter,
  });

  const [deleteCourse] = useDeleteCourseMutation();
  const [createCourse, { isLoading: creating }] = useCreateCourseMutation();

  const handleDelete = async (id: number) => {
    try {
      await deleteCourse(id).unwrap();
      message.success("Course deleted");
    } catch {
      message.error("Failed to delete course");
    }
  };

  const handleCreate = async (values: Partial<Course>) => {
    try {
      await createCourse(values).unwrap();
      message.success("Course created");
      setModalOpen(false);
    } catch {
      message.error("Failed to create course");
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
            Courses
          </Title>
          <Text type="secondary">Manage the course catalog</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Create Course
        </Button>
      </div>

      <Space wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search courses..."
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
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
            { label: "Archived", value: "archived" },
          ]}
        />
      </Space>

      <Table<Course>
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
          showTotal: (total) => `${total} courses`,
        }}
      />

      <CourseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        loading={creating}
      />
    </Space>
  );
}
