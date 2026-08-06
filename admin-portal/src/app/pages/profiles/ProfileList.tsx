import { useState } from "react";
import { Table, Button, Space, Input, Select, Avatar, Tooltip, Modal, Form, Tag, message } from "antd";
import { PlusOutlined, SearchOutlined, EyeOutlined, IdcardOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { PermissionGate } from "../../components/PermissionGate";
import { useListProfilesQuery, useCreateProfileMutation } from "@/store/api/profilesApi";
import { useListUsersQuery } from "@/store/api/iamApi";
import type { Profile, ProfileStatus, ProfileType } from "@/types";
import { getErrorMessage } from "@/lib/error";

interface CreateProfileForm {
  userId: number;
  profileType: ProfileType;
  fullName: string;
  contactEmail?: string;
  phoneNumber?: string;
}

const typeColors: Record<ProfileType, string> = {
  student: "green",
  parent: "purple",
  teacher: "blue",
  staff: "gold",
  admin: "red",
};

// ADM-06 — Profile List: business profiles (Student / Parent / Teacher / Staff / Admin),
// distinct from the identity/account records in Users (spec §10.7 Identity/Profile Separation).
export function ProfileList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [profileType, setProfileType] = useState<ProfileType | undefined>();
  const [status, setStatus] = useState<ProfileStatus | undefined>();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<CreateProfileForm>();

  const { data, isLoading } = useListProfilesQuery({
    page,
    limit: 10,
    profileType,
    status,
    search: search || undefined,
  });
  const { data: users } = useListUsersQuery();
  const [createProfile, { isLoading: creating }] = useCreateProfileMutation();

  const handleCreate = async (values: CreateProfileForm) => {
    try {
      await createProfile(values).unwrap();
      message.success("Profile created");
      setModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to create profile"));
    }
  };

  const columns: ColumnsType<Profile> = [
    {
      title: "Profile",
      key: "profile",
      render: (_, record) => (
        <Space>
          <Avatar icon={<IdcardOutlined />} size="small" src={record.avatar_url ?? undefined} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.display_name || record.full_name}</div>
            <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
              {record.contact_email ?? "No contact email"}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "profile_type",
      key: "profile_type",
      render: (v: ProfileType) => <Tag color={typeColors[v]}>{v.toUpperCase()}</Tag>,
      filters: (Object.keys(typeColors) as ProfileType[]).map((t) => ({ text: t, value: t })),
      onFilter: (value, record) => record.profile_type === value,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: ProfileStatus) => <StatusTag status={v} />,
    },
    {
      title: "Phone",
      dataIndex: "phone_number",
      key: "phone_number",
      render: (v: string | null) => v ?? "—",
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Tooltip title="View">
          <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/profiles/${record.id}`)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Profiles"
        description="Student, parent, teacher, and staff profiles in your tenant."
        actions={
          <PermissionGate permission="iam.user.manage">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              New Profile
            </Button>
          </PermissionGate>
        }
      />

      <Space wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 260 }}
          allowClear
        />
        <Select
          placeholder="Profile type"
          allowClear
          value={profileType}
          onChange={(v) => {
            setProfileType(v);
            setPage(1);
          }}
          style={{ width: 160 }}
          options={["student", "parent", "teacher", "staff", "admin"].map((t) => ({
            label: t[0].toUpperCase() + t.slice(1),
            value: t,
          }))}
        />
        <Select
          placeholder="Status"
          allowClear
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          style={{ width: 140 }}
          options={["draft", "active", "inactive", "archived"].map((s) => ({ label: s, value: s }))}
        />
      </Space>

      <Table<Profile>
        dataSource={data?.profiles}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (total) => `${total} profiles`,
        }}
        locale={{ emptyText: "No profiles found." }}
      />

      <Modal
        title="New profile"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.validateFields().then(handleCreate)}
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="userId"
            label="Linked user account"
            rules={[{ required: true, message: "Select the user this profile belongs to." }]}
          >
            <Select
              showSearch
              placeholder="Search by name or email"
              optionFilterProp="label"
              options={users?.map((u) => ({ label: `${u.full_name} (${u.email})`, value: u.id }))}
            />
          </Form.Item>
          <Form.Item
            name="profileType"
            label="Profile type"
            rules={[{ required: true, message: "Select a profile type." }]}
          >
            <Select
              options={["student", "parent", "teacher", "staff", "admin"].map((t) => ({
                label: t[0].toUpperCase() + t.slice(1),
                value: t,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="fullName"
            label="Full name"
            rules={[{ required: true, message: "Full name is required." }]}
          >
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
    </Space>
  );
}
