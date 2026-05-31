import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Divider,
  Space,
  Typography,
  message,
} from "antd";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setTheme } from "@/features/ui/uiSlice";

const { Title, Text } = Typography;

export function Settings() {
  const [profileForm] = Form.useForm();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const theme = useAppSelector((s) => s.ui.theme);

  const handleProfileSave = () => {
    message.success("Profile updated (demo)");
  };

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Settings
        </Title>
        <Text type="secondary">Manage your account and portal preferences</Text>
      </div>

      {/* Profile */}
      <Card title="Profile">
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.email,
          }}
          style={{ maxWidth: 480 }}
          onFinish={handleProfileSave}
        >
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
            rules={[{ required: true }, { type: "email" }]}
          >
            <Input disabled />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Save Profile
          </Button>
        </Form>
      </Card>

      <Divider />

      {/* Appearance */}
      <Card title="Appearance">
        <Form layout="vertical" style={{ maxWidth: 480 }}>
          <Form.Item label="Theme">
            <Select
              value={theme}
              onChange={(val) => dispatch(setTheme(val))}
              options={[
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
              ]}
              style={{ width: 180 }}
            />
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      {/* Security */}
      <Card title="Security">
        <Form layout="vertical" style={{ maxWidth: 480 }}>
          <Form.Item label="Current Password">
            <Input.Password />
          </Form.Item>
          <Form.Item label="New Password">
            <Input.Password />
          </Form.Item>
          <Form.Item label="Confirm New Password">
            <Input.Password />
          </Form.Item>
          <Button onClick={() => message.info("Password change (demo)")}>
            Change Password
          </Button>
        </Form>
      </Card>
    </Space>
  );
}
