import { useEffect } from "react";
import { Card, Descriptions, Form, Input, Button, Space, message, Skeleton, Tag } from "antd";
import { PageHeader } from "../../components/PageHeader";
import { useGetMeQuery, useUpdateMeMutation } from "@/store/api/usersApi";
import { useAppSelector } from "@/store/hooks";
import { getErrorMessage } from "@/lib/error";

// ADM-43 — My Profile: the current account's own identity and tenant context.
export function MyProfile() {
  const { data: me, isLoading } = useGetMeQuery();
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const [form] = Form.useForm<{ fullName: string }>();
  const activeTenant = useAppSelector((s) => s.auth.activeTenant);
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (me) form.setFieldsValue({ fullName: me.full_name });
  }, [me, form]);

  const handleSave = async (values: { fullName: string }) => {
    try {
      await updateMe(values).unwrap();
      message.success("Profile updated");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to update profile"));
    }
  };

  if (isLoading) return <Skeleton active />;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%", maxWidth: 560 }}>
      <PageHeader title="My Profile" description="Your account details and workspace context." />

      <Card title="Account">
        <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Email">{me?.email}</Descriptions.Item>
          <Descriptions.Item label="Role">{me?.role ? <Tag>{me.role.toUpperCase()}</Tag> : "—"}</Descriptions.Item>
          <Descriptions.Item label="Workspace">{activeTenant?.tenant_name ?? "—"}</Descriptions.Item>
        </Descriptions>

        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="fullName"
            label="Full name"
            rules={[{ required: true, message: "Full name is required." }]}
          >
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save changes
          </Button>
        </Form>
      </Card>

      {user && user.permissions.length > 0 && (
        <Card title="Your permissions in this workspace">
          <Space wrap>
            {user.permissions.map((p) => (
              <Tag key={p.id}>{p.code}</Tag>
            ))}
          </Space>
        </Card>
      )}
    </Space>
  );
}
