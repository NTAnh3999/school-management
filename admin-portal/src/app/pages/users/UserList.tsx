import { useMemo, useState } from "react";
import { Table, Button, Space, Input, Select, Tooltip, Popconfirm, message } from "antd";
import { UserAddOutlined, SearchOutlined, LockOutlined, UnlockOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { RoleTag } from "../../components/RoleTag";
import { PermissionGate } from "../../components/PermissionGate";
import { useListUsersQuery, useUpdateUserMutation } from "@/store/api/iamApi";
import { ACCENT, MONO_FONT_FAMILY } from "../../theme";
import type { IamUser } from "@/types";

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

// ADM-02 — User List: identity/account records for the current tenant/scope.
export function UserList() {
  const navigate = useNavigate();
  const { data: users, isLoading } = useListUsersQuery();
  const [updateUser] = useUpdateUserMutation();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();

  const filtered = useMemo(() => {
    if (!users) return [];
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesTerm =
        !term || u.full_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesTerm && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleToggleLock = async (user: IamUser) => {
    const nextStatus = user.status === "locked" ? "active" : "locked";
    try {
      await updateUser({ id: user.id, status: nextStatus }).unwrap();
      message.success(nextStatus === "locked" ? "User locked" : "User unlocked");
    } catch {
      message.error("Failed to update user status");
    }
  };

  const columns: ColumnsType<IamUser> = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <Space>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#E9EAFB",
              color: ACCENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11.5,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initialsOf(record.full_name)}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{record.full_name}</div>
            <div style={{ fontSize: 12, color: "#8B93A1" }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string | null) => <RoleTag role={role} />,
      filters: ["admin", "teacher", "student", "parent", "staff"].map((r) => ({
        text: r,
        value: r,
      })),
      onFilter: (value, record) => record.role === value,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: "Memberships",
      key: "memberships",
      render: (_, record) => record.memberships?.length ?? 0,
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (val: string) => (
        <span style={{ fontFamily: MONO_FONT_FAMILY, fontSize: 12.5, color: "#6B7280" }}>
          {new Date(val).toLocaleDateString()}
        </span>
      ),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/users/${record.id}`)} />
          </Tooltip>
          <PermissionGate permission="iam.user.manage">
            <Popconfirm
              title={record.status === "locked" ? "Unlock this user?" : "Lock this user?"}
              description="This action cannot be undone automatically and is recorded in the audit log."
              onConfirm={() => handleToggleLock(record)}
            >
              <Tooltip title={record.status === "locked" ? "Unlock" : "Lock"}>
                <Button
                  type="text"
                  danger={record.status !== "locked"}
                  icon={record.status === "locked" ? <UnlockOutlined /> : <LockOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Users"
        description="Identity and account records within your tenant scope."
        actions={
          <PermissionGate permission="iam.user.manage">
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate("/users/invite")}>
              Invite / Create User
            </Button>
          </PermissionGate>
        }
      />

      <Space wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          placeholder="Filter by role"
          allowClear
          value={roleFilter}
          onChange={setRoleFilter}
          style={{ width: 160 }}
          options={[
            { label: "Admin", value: "admin" },
            { label: "Teacher", value: "teacher" },
            { label: "Student", value: "student" },
            { label: "Parent", value: "parent" },
            { label: "Staff", value: "staff" },
          ]}
        />
      </Space>

      <Table<IamUser>
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10, showTotal: (total) => `${total} users` }}
        locale={{ emptyText: "No users found." }}
      />
    </Space>
  );
}
