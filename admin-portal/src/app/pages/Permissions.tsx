import {
  Card,
  Tabs,
  Table,
  Tag,
  Switch,
  Space,
  Typography,
  Button,
  Divider,
  List,
} from "antd";
import { SafetyOutlined, LockOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface RolePermission {
  key: string;
  resource: string;
  admin: boolean;
  teacher: boolean;
  student: boolean;
}

// Hoist static data (server-hoist-static-io)
const permissionsData: RolePermission[] = [
  {
    key: "1",
    resource: "Manage Users",
    admin: true,
    teacher: false,
    student: false,
  },
  {
    key: "2",
    resource: "View Users",
    admin: true,
    teacher: true,
    student: false,
  },
  {
    key: "3",
    resource: "Create Courses",
    admin: true,
    teacher: true,
    student: false,
  },
  {
    key: "4",
    resource: "Edit Courses",
    admin: true,
    teacher: true,
    student: false,
  },
  {
    key: "5",
    resource: "Delete Courses",
    admin: true,
    teacher: false,
    student: false,
  },
  {
    key: "6",
    resource: "Enroll Students",
    admin: true,
    teacher: true,
    student: false,
  },
  {
    key: "7",
    resource: "View Reports",
    admin: true,
    teacher: true,
    student: false,
  },
  {
    key: "8",
    resource: "Manage Classrooms",
    admin: true,
    teacher: true,
    student: false,
  },
  {
    key: "9",
    resource: "Access Course Content",
    admin: true,
    teacher: true,
    student: true,
  },
  {
    key: "10",
    resource: "Submit Assignments",
    admin: false,
    teacher: false,
    student: true,
  },
];

const columns: ColumnsType<RolePermission> = [
  {
    title: "Resource / Action",
    dataIndex: "resource",
    key: "resource",
    render: (resource: string) => (
      <Space>
        <LockOutlined />
        <Text>{resource}</Text>
      </Space>
    ),
  },
  {
    title: () => <Tag color="red">Admin</Tag>,
    dataIndex: "admin",
    key: "admin",
    align: "center",
    render: (val: boolean) => <Switch checked={val} disabled size="small" />,
  },
  {
    title: () => <Tag color="blue">Teacher</Tag>,
    dataIndex: "teacher",
    key: "teacher",
    align: "center",
    render: (val: boolean) => <Switch checked={val} disabled size="small" />,
  },
  {
    title: () => <Tag color="green">Student</Tag>,
    dataIndex: "student",
    key: "student",
    align: "center",
    render: (val: boolean) => <Switch checked={val} disabled size="small" />,
  },
];

const auditLogs = [
  {
    id: 1,
    action: "User alice@school.com created",
    by: "admin@school.com",
    at: "2026-05-17 10:30",
  },
  {
    id: 2,
    action: 'Course "React Fundamentals" published',
    by: "teacher@school.com",
    at: "2026-05-17 09:15",
  },
  {
    id: 3,
    action: "Enrollment removed for student#42",
    by: "admin@school.com",
    at: "2026-05-16 16:00",
  },
];

export function Permissions() {
  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Permissions
        </Title>
        <Text type="secondary">Role-based access control and audit logs</Text>
      </div>

      <Tabs
        items={[
          {
            key: "roles",
            label: (
              <Space>
                <SafetyOutlined />
                Role Permissions
              </Space>
            ),
            children: (
              <Card>
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 16 }}
                >
                  Read-only overview of permissions per role. Contact a
                  super-admin to make changes.
                </Text>
                <Table<RolePermission>
                  dataSource={permissionsData}
                  columns={columns}
                  pagination={false}
                  size="small"
                />
                <Divider />
                <Button type="primary" disabled>
                  Request Permission Change
                </Button>
              </Card>
            ),
          },
          {
            key: "audit",
            label: "Audit Log",
            children: (
              <Card>
                <List
                  dataSource={auditLogs}
                  renderItem={(item) => (
                    <List.Item
                      extra={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.at}
                        </Text>
                      }
                    >
                      <List.Item.Meta
                        title={item.action}
                        description={`by ${item.by}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ),
          },
        ]}
      />
    </Space>
  );
}
