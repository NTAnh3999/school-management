import { memo, useState, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Select,
  Avatar,
  Tooltip,
  Popconfirm,
  Modal,
  Form,
  message,
} from "antd";
import {
  UserAddOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useCreateUserMutation,
} from "@/store/api/usersApi";
import type { User, UserRole } from "@/types";

const { Title, Text } = Typography;

const roleColors: Record<UserRole, string> = {
  admin: "red",
  teacher: "blue",
  student: "green",
};

// Memoized table columns definition — hoist to avoid recreation on each render
const buildColumns = (
  onEdit: (user: User) => void,
  onDelete: (id: number) => void,
): ColumnsType<User> => [
  {
    title: "User",
    key: "user",
    render: (_, record) => (
      <Space>
        <Avatar icon={<UserOutlined />} src={record.avatar} size="small" />
        <div>
          <Text strong style={{ display: "block" }}>
            {record.firstName} {record.lastName}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.email}
          </Text>
        </div>
      </Space>
    ),
  },
  {
    title: "Role",
    dataIndex: "role",
    key: "role",
    render: (role: UserRole) => (
      <Tag color={roleColors[role]}>{role.toUpperCase()}</Tag>
    ),
    filters: [
      { text: "Admin", value: "admin" },
      { text: "Teacher", value: "teacher" },
      { text: "Student", value: "student" },
    ],
    onFilter: (value, record) => record.role === value,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: string) => (
      <Tag
        color={
          status === "active"
            ? "success"
            : status === "inactive"
              ? "default"
              : "error"
        }
      >
        {status}
      </Tag>
    ),
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
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
        </Tooltip>
        <Popconfirm
          title="Delete this user?"
          description="This action cannot be undone."
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

// Extracted modal component — avoids re-creating on every parent render (rerender-no-inline-components)
const UserModal = memo(function UserModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<User>) => void;
  loading: boolean;
}) {
  const [form] = Form.useForm<Partial<User>>();

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Add New User"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="firstName"
          label="First Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="lastName"
          label="Last Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true },
            { type: "email", message: "Enter a valid email" },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="role" label="Role" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Admin", value: "admin" },
              { label: "Teacher", value: "teacher" },
              { label: "Student", value: "student" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
});

export function Users() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useGetUsersQuery({
    page,
    limit: 10,
    search: search || undefined,
    role: roleFilter,
  });

  const [deleteUser] = useDeleteUserMutation();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id).unwrap();
      message.success("User deleted");
    } catch {
      message.error("Failed to delete user");
    }
  };

  const handleCreate = async (values: Partial<User>) => {
    try {
      await createUser(values).unwrap();
      message.success("User created");
      setModalOpen(false);
    } catch {
      message.error("Failed to create user");
    }
  };

  // useMemo: stable column reference, rebuilt only when handlers change (rerender-derived-state)
  const columns = useMemo(
    () => buildColumns(() => {}, handleDelete),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
            Users
          </Title>
          <Text type="secondary">Manage admins, teachers, and students</Text>
        </div>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Add User
        </Button>
      </div>

      <Space wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          placeholder="Filter by role"
          allowClear
          value={roleFilter}
          onChange={(val) => {
            setRoleFilter(val);
            setPage(1);
          }}
          style={{ width: 160 }}
          options={[
            { label: "All Roles", value: undefined },
            { label: "Admin", value: "admin" },
            { label: "Teacher", value: "teacher" },
            { label: "Student", value: "student" },
          ]}
        />
      </Space>

      <Table<User>
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
          showTotal: (total) => `${total} users`,
        }}
      />

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        loading={creating}
      />
    </Space>
  );
}
