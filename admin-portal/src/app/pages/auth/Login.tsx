import { useState } from "react";
import { Card, Form, Input, Button, Alert, Typography } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router";
import { useAppDispatch } from "@/store/hooks";
import { setAuthResponse } from "@/features/auth/authSlice";
import { useLoginMutation } from "@/store/api/authApi";
import { getErrorMessage } from "@/lib/error";
import { DemoAccountsCard } from "../../components/DemoAccountsCard";

const { Text, Link: AntLink } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

// COMMON-01 — Login. On success, routes to tenant selection if the session has no active
// tenant yet, otherwise straight into the portal (see ProtectedRoute for the same check).
export function Login() {
  const [form] = Form.useForm<LoginForm>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: LoginForm) => {
    setError(null);
    try {
      const auth = await login(values).unwrap();
      dispatch(setAuthResponse(auth));
      if (auth.tenant_context_required) {
        navigate("/select-tenant", { replace: true });
      } else {
        const from = (location.state as { from?: Location })?.from;
        navigate(from?.pathname || "/", { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password."));
    }
  };

  const fillDemoAccount = (email: string, password: string) => {
    setError(null);
    form.setFieldsValue({ email, password });
  };

  return (
    <>
      <Card style={{ width: 380 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          {error && (
            <Form.Item>
              <Alert type="error" showIcon message={error} />
            </Form.Item>
          )}
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required." },
              { type: "email", message: "Enter a valid email address." },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@school.edu" autoFocus />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Password is required." }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 12 }}>
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              Sign in
            </Button>
          </Form.Item>
          <div style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Forgot your password? <AntLink href="#">Reset it</AntLink>
            </Text>
          </div>
        </Form>
      </Card>
      {import.meta.env.DEV && <DemoAccountsCard onSelect={fillDemoAccount} />}
    </>
  );
}
