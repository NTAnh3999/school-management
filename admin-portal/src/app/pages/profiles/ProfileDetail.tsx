import { useState } from "react";
import {
  Card,
  Descriptions,
  Space,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
  Skeleton,
  Empty,
  List,
  Avatar,
  Typography,
} from "antd";
import { EditOutlined, PlusOutlined, UserOutlined, IdcardOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { PermissionGate } from "../../components/PermissionGate";
import {
  useGetProfileByIdQuery,
  useUpdateProfileMutation,
  useChangeProfileStatusMutation,
  useGetLinkedStudentsQuery,
  useLinkParentToStudentMutation,
  useListProfilesQuery,
} from "@/store/api/profilesApi";
import type { ProfileStatus } from "@/types";
import { getErrorMessage } from "@/lib/error";

interface EditForm {
  fullName: string;
  contactEmail?: string;
  phoneNumber?: string;
}

const nextStatusOptions: Record<ProfileStatus, ProfileStatus[]> = {
  draft: ["active"],
  active: ["inactive", "archived"],
  inactive: ["active", "archived"],
  archived: [],
};

// ADM-07 — Profile Detail. Includes ADM-08 (Create/Edit Profile) as an edit modal and, for
// Parent profiles, ADM-09 (Relationship Management) as an inline linked-students section —
// the backend only exposes relationships from the parent side (GET /profiles/parent/:id/students).
export function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const profileId = Number(id);
  const navigate = useNavigate();
  const { data: profile, isLoading } = useGetProfileByIdQuery(profileId, { skip: !profileId });
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [changeStatus] = useChangeProfileStatusMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [form] = Form.useForm<EditForm>();

  const isParent = profile?.profile_type === "parent";
  const { data: linkedStudents } = useGetLinkedStudentsQuery(profileId, { skip: !isParent });
  const [linkOpen, setLinkOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const { data: studentOptions } = useListProfilesQuery(
    { profileType: "student", search: studentSearch || undefined, limit: 20 },
    { skip: !linkOpen },
  );
  const [linkStudent, { isLoading: linking }] = useLinkParentToStudentMutation();
  const [linkForm] = Form.useForm<{ studentProfileId: number }>();

  const handleEdit = async (values: EditForm) => {
    if (!profile) return;
    try {
      await updateProfile({ id: profile.id, ...values }).unwrap();
      message.success("Profile updated");
      setEditOpen(false);
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to update profile"));
    }
  };

  const handleStatusChange = async (status: ProfileStatus) => {
    if (!profile) return;
    try {
      await changeStatus({ id: profile.id, status }).unwrap();
      message.success(`Profile marked ${status}`);
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to update status"));
    }
  };

  const handleLink = async (values: { studentProfileId: number }) => {
    if (!profile) return;
    try {
      await linkStudent({ parentProfileId: profile.id, studentProfileId: values.studentProfileId }).unwrap();
      message.success("Student linked");
      setLinkOpen(false);
      linkForm.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to link student"));
    }
  };

  if (isLoading) return <Skeleton active />;
  if (!profile) return <Empty description="Profile not found." />;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title={profile.display_name || profile.full_name}
        description={`${profile.profile_type[0].toUpperCase()}${profile.profile_type.slice(1)} profile`}
        breadcrumb={[{ label: "Profiles", to: "/profiles" }, { label: profile.full_name }]}
        actions={
          <PermissionGate permission="iam.user.manage">
            <Space>
              {(nextStatusOptions[profile.status] ?? []).map((next) => (
                <Popconfirm
                  key={next}
                  title={`Mark this profile as ${next}?`}
                  onConfirm={() => handleStatusChange(next)}
                >
                  <Button danger={next === "archived"}>Mark {next}</Button>
                </Popconfirm>
              ))}
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  form.setFieldsValue({
                    fullName: profile.full_name,
                    contactEmail: profile.contact_email ?? undefined,
                    phoneNumber: profile.phone_number ?? undefined,
                  });
                  setEditOpen(true);
                }}
              >
                Edit
              </Button>
            </Space>
          </PermissionGate>
        }
      />

      <Card title="Profile information">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Status">
            <StatusTag status={profile.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Visibility">
            <Tag>{profile.visibility}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Contact email">{profile.contact_email ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="Phone">{profile.phone_number ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>
            {profile.address ?? "—"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {isParent && (
        <Card
          title="Linked students"
          extra={
            <PermissionGate permission="iam.user.manage">
              <Button icon={<PlusOutlined />} onClick={() => setLinkOpen(true)}>
                Link student
              </Button>
            </PermissionGate>
          }
        >
          {!linkedStudents || linkedStudents.length === 0 ? (
            <Typography.Text type="secondary">No students linked to this parent yet.</Typography.Text>
          ) : (
            <List
              dataSource={linkedStudents}
              renderItem={(student) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <a onClick={() => navigate(`/profiles/${student.id}`)}>{student.full_name}</a>
                    }
                    description={student.contact_email ?? "No contact email"}
                  />
                  <StatusTag status={student.status} />
                </List.Item>
              )}
            />
          )}
        </Card>
      )}

      <Button onClick={() => navigate(-1)}>Back</Button>

      <Modal
        title="Edit profile"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => form.validateFields().then(handleEdit)}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="fullName" label="Full name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactEmail" label="Contact email" rules={[{ type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Phone number">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Link student"
        open={linkOpen}
        onCancel={() => setLinkOpen(false)}
        onOk={() => linkForm.validateFields().then(handleLink)}
        confirmLoading={linking}
        destroyOnClose
      >
        <Form form={linkForm} layout="vertical">
          <Form.Item
            name="studentProfileId"
            label="Student"
            rules={[{ required: true, message: "Select a student." }]}
          >
            <Select
              showSearch
              placeholder="Search students by name..."
              filterOption={false}
              onSearch={setStudentSearch}
              notFoundContent={null}
              options={studentOptions?.profiles.map((s) => ({
                label: `${s.full_name}${s.contact_email ? ` · ${s.contact_email}` : ""}`,
                value: s.id,
              }))}
              suffixIcon={<IdcardOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
