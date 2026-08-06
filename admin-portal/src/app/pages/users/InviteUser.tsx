import { Card, Form, Input, Select, Button, Space, message } from "antd";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { useCreateUserMutation, useListRolesQuery } from "@/store/api/iamApi";
import { useAppSelector } from "@/store/hooks";
import { getErrorMessage } from "@/lib/error";

interface InviteForm {
  fullName: string;
  email: string;
  password: string;
  roleId?: number;
  phone?: string;
}

// ADM-04 — Invite / Create User. Creates the IAM account and, when a role is selected, its
// initial tenant membership + role assignment in one call (api/src/services/iam.service.js
// createUser).
export function InviteUser() {
  const navigate = useNavigate();
  const [form] = Form.useForm<InviteForm>();
  const activeTenant = useAppSelector((s) => s.auth.activeTenant);
  const { data: roles } = useListRolesQuery();
  const [createUser, { isLoading }] = useCreateUserMutation();

  const handleSubmit = async (values: InviteForm) => {
    try {
      const user = await createUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone,
        roleId: values.roleId,
        tenantId: activeTenant?.id,
      }).unwrap();
      message.success("User created successfully.");
      navigate(`/users/${user.id}`, { replace: true });
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to create user."));
    }
  };

  return (
    <Space direction="vertical" size={24} style={{ width: "100%", maxWidth: 560 }}>
      <PageHeader
        title="Invite / Create User"
        description="Create a Student, Parent, Teacher, or admin account in your tenant."
        breadcrumb={[{ label: "Users", to: "/users" }, { label: "Invite / Create User" }]}
      />

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark>
          <Form.Item
            name="fullName"
            label="Full name"
            rules={[{ required: true, message: "Full name is required." }]}
          >
            <Input placeholder="e.g. Nguyen Van A" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required." },
              { type: "email", message: "Enter a valid email address." },
            ]}
          >
            <Input placeholder="name@school.edu" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Temporary password"
            extra="The user should change this after first login."
            rules={[
              { required: true, message: "A temporary password is required." },
              { min: 6, message: "Must be at least 6 characters." },
            ]}
          >
            <Input.Password placeholder="At least 6 characters" />
          </Form.Item>
          <Form.Item name="phone" label="Phone (optional)">
            <Input placeholder="e.g. 0901234567" />
          </Form.Item>
          <Form.Item
            name="roleId"
            label="Role"
            extra="Grants a tenant-wide membership with this role immediately. You can adjust scope later from the user's detail page."
          >
            <Select
              placeholder="Select a role (optional)"
              allowClear
              options={roles?.map((r) => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Create user
            </Button>
            <Button onClick={() => navigate("/users")}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
