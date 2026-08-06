import { Card, List, Space, Tag, Typography } from "antd";
import { RightOutlined } from "@ant-design/icons";

const { Text } = Typography;

// Mirrors api/src/database/seed.js DEFAULT_ACCOUNTS exactly — update both together if the
// backend's seed defaults or env-var overrides ever change.
const DEMO_ACCOUNTS = [
  { role: "admin", label: "Admin", email: "admin@schoolhub.io", password: "Admin@123" },
  { role: "teacher", label: "Teacher", email: "teacher@schoolhub.io", password: "Teacher@123" },
  { role: "student", label: "Student", email: "student@schoolhub.io", password: "Student@123" },
  { role: "parent", label: "Parent", email: "parent@schoolhub.io", password: "Parent@123" },
] as const;

const roleColors: Record<string, string> = {
  admin: "red",
  teacher: "blue",
  student: "green",
  parent: "purple",
};

interface DemoAccountsCardProps {
  onSelect: (email: string, password: string) => void;
}

// Dev-only convenience so you don't have to check the seeded DB for credentials — only the
// Admin and Teacher accounts do anything useful in this portal (Student/Parent belong to the
// Learning Portal), but all four are seeded and shown for completeness.
export function DemoAccountsCard({ onSelect }: DemoAccountsCardProps) {
  return (
    <Card
      size="small"
      style={{ width: 380, marginTop: 16 }}
      title="Demo accounts (dev only)"
      styles={{ body: { paddingBottom: 8 } }}
    >
      <List
        size="small"
        dataSource={DEMO_ACCOUNTS}
        renderItem={(account) => (
          <List.Item
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(account.email, account.password)}
            actions={[<RightOutlined key="go" style={{ fontSize: 12, color: "rgba(0,0,0,0.35)" }} />]}
          >
            <Space direction="vertical" size={0}>
              <Space size={6}>
                <Tag color={roleColors[account.role]} style={{ marginInlineEnd: 0 }}>
                  {account.label}
                </Tag>
                <Text style={{ fontSize: 12 }}>{account.email}</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
                {account.password}
              </Text>
            </Space>
          </List.Item>
        )}
      />
      <Text type="secondary" style={{ fontSize: 11 }}>
        Click a row to fill the form above.
      </Text>
    </Card>
  );
}
