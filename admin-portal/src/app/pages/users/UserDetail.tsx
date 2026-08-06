import { useMemo, useState } from "react";
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Popconfirm,
  message,
  Skeleton,
  Empty,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined, CheckOutlined, LeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { StatusTag } from "../../components/StatusTag";
import { RoleTag } from "../../components/RoleTag";
import { PermissionGate } from "../../components/PermissionGate";
import {
  useListUsersQuery,
  useListRolesQuery,
  useCreateMembershipMutation,
  useRevokeMembershipMutation,
  useUpdateUserMutation,
  useListAuditLogsQuery,
} from "@/store/api/iamApi";
import { useListBranchesQuery, useListCampusesQuery, useListLocationsQuery } from "@/store/api/orgApi";
import { useAppSelector } from "@/store/hooks";
import { ACCENT, MONO_FONT_FAMILY, pillStyle, STATUS_PILL_COLORS } from "../../theme";
import type { Membership, ScopeType } from "@/types";
import { getErrorMessage } from "@/lib/error";

interface MembershipForm {
  roleId?: number;
  scopeType: ScopeType;
  branchId?: number;
  campusId?: number;
  locationId?: number;
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

const fieldLabel: React.CSSProperties = {
  fontSize: 11.5,
  color: "#8B93A1",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: ".03em",
};
const fieldValue: React.CSSProperties = { fontSize: 13.5, fontWeight: 600, marginTop: 3 };
const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E7E9EE",
  borderRadius: 12,
  padding: 20,
};

// ADM-03 — User Detail, with Role Assignment (ADM-05) as an inline section: memberships are
// the unit a role is actually attached to (see api/src/services/iam.service.js createMembership).
// Header block + Overview/Membership/Activity tabs follow the Tenant Admin Portal design
// mockup's user-detail layout; "Reset password" / "Edit" from the mockup aren't wired up since
// no such endpoint exists yet, so only the real Suspend/Reactivate toggle (already used in
// UserList) is offered as a header action.
export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const activeTenant = useAppSelector((s) => s.auth.activeTenant);
  const { data: users, isLoading } = useListUsersQuery();
  const { data: roles } = useListRolesQuery();
  const [createMembership, { isLoading: assigning }] = useCreateMembershipMutation();
  const [revokeMembership] = useRevokeMembershipMutation();
  const [updateUser, { isLoading: updatingStatus }] = useUpdateUserMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<MembershipForm>();
  const [scopeBranchFilter, setScopeBranchFilter] = useState<number | undefined>();
  const [scopeCampusFilter, setScopeCampusFilter] = useState<number | undefined>();

  const { data: orgBranches } = useListBranchesQuery(
    { tenantId: activeTenant?.id },
    { skip: !modalOpen || !activeTenant },
  );
  const { data: orgCampuses } = useListCampusesQuery(
    { tenantId: activeTenant?.id, branchId: scopeBranchFilter },
    { skip: !modalOpen || !activeTenant },
  );
  const { data: orgLocations } = useListLocationsQuery(
    { tenantId: activeTenant?.id, campusId: scopeCampusFilter },
    { skip: !modalOpen || !activeTenant },
  );

  const user = useMemo(() => users?.find((u) => u.id === Number(id)), [users, id]);
  const { data: userActivity, isLoading: activityLoading } = useListAuditLogsQuery(
    user ? { actorUserId: user.id } : undefined,
    { skip: !user },
  );

  const handleAssign = async (values: MembershipForm) => {
    if (!user || !activeTenant) return;
    try {
      await createMembership({
        userId: user.id,
        tenantId: activeTenant.id,
        scopeType: values.scopeType,
        branchId: values.branchId,
        campusId: values.campusId,
        locationId: values.locationId,
        roleId: values.roleId,
      }).unwrap();
      message.success("Role assigned");
      setModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to assign role"));
    }
  };

  const handleRevoke = async (membershipId: number) => {
    try {
      await revokeMembership(membershipId).unwrap();
      message.success("Membership revoked");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to revoke membership"));
    }
  };

  const handleToggleSuspend = async () => {
    if (!user) return;
    const next = user.status === "suspended" ? "active" : "suspended";
    try {
      await updateUser({ id: user.id, status: next }).unwrap();
      message.success(next === "suspended" ? "User suspended" : "User reactivated");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to update user status"));
    }
  };

  const membershipColumns: ColumnsType<Membership> = [
    { title: "Tenant", key: "tenant", render: (_, m) => m.tenant?.tenant_name ?? `#${m.tenant_id}` },
    {
      title: "Scope",
      dataIndex: "scope_type",
      key: "scope_type",
      render: (v: string) => (
        <span style={pillStyle(STATUS_PILL_COLORS.neutral)}>{v.charAt(0).toUpperCase() + v.slice(1)}</span>
      ),
    },
    { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
    {
      title: "Expires",
      dataIndex: "expires_at",
      key: "expires_at",
      render: (v: string | null) => (v ? new Date(v).toLocaleDateString() : "Never"),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, m) => (
        <PermissionGate permission="iam.membership.manage">
          <Popconfirm
            title="Revoke this membership?"
            description="The user will lose access granted at this scope. This is recorded in the audit log."
            onConfirm={() => handleRevoke(m.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} disabled={m.status === "revoked"} />
          </Popconfirm>
        </PermissionGate>
      ),
    },
  ];

  if (isLoading) return <Skeleton active />;
  if (!user) return <Empty description="User not found." />;

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate("/users")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "#6B7280",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0,
          marginBottom: 16,
        }}
      >
        <LeftOutlined style={{ fontSize: 13 }} /> Back to Users
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 22,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#E9EAFB",
              color: ACCENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 19,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initialsOf(user.full_name)}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>{user.full_name}</div>
              <StatusTag status={user.status} />
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 3 }}>
              {user.email}
              {user.role && <> · <RoleTag role={user.role} /></>}
            </div>
          </div>
        </div>
        <PermissionGate permission="iam.user.manage">
          <Popconfirm
            title={user.status === "suspended" ? "Reactivate this user?" : "Suspend this user?"}
            description="This action is recorded in the audit log."
            onConfirm={handleToggleSuspend}
          >
            <Button
              danger={user.status !== "suspended"}
              loading={updatingStatus}
              style={
                user.status !== "suspended"
                  ? { background: "#FEF2F2", borderColor: "#FCA5A5", color: "#DC2626", fontWeight: 700 }
                  : undefined
              }
            >
              {user.status === "suspended" ? "Reactivate" : "Suspend"}
            </Button>
          </Popconfirm>
        </PermissionGate>
      </div>

      <Tabs
        items={[
          {
            key: "overview",
            label: "Overview",
            children: (
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 14 }}>Identity</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
                    <div>
                      <div style={fieldLabel}>Email</div>
                      <div style={fieldValue}>{user.email}</div>
                    </div>
                    <div>
                      <div style={fieldLabel}>Username</div>
                      <div style={fieldValue}>{user.username ?? "—"}</div>
                    </div>
                    <div>
                      <div style={fieldLabel}>Phone</div>
                      <div style={fieldValue}>{user.phone ?? "—"}</div>
                    </div>
                    <div>
                      <div style={fieldLabel}>Primary role</div>
                      <div style={fieldValue}>{user.role ? <RoleTag role={user.role} /> : "—"}</div>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={fieldLabel}>Created</div>
                      <div style={{ ...fieldValue, fontFamily: MONO_FONT_FAMILY, fontWeight: 400 }}>
                        {new Date(user.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 14 }}>Role &amp; permissions</div>
                  {user.permissions.length === 0 ? (
                    <Typography.Text type="secondary">
                      No permissions resolved from the current role assignments.
                    </Typography.Text>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {user.permissions.map((p) => (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                          <CheckOutlined style={{ fontSize: 13, color: "#16A34A" }} />
                          <span>{p.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "membership",
            label: "Membership",
            children: (
              <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 18px 0" }}>
                  <PermissionGate permission="iam.membership.manage">
                    <Button icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                      Assign role
                    </Button>
                  </PermissionGate>
                </div>
                <Table<Membership>
                  dataSource={user.memberships}
                  columns={membershipColumns}
                  rowKey="id"
                  pagination={false}
                  style={{ marginTop: 12 }}
                  locale={{ emptyText: "No memberships in this tenant yet." }}
                />
              </div>
            ),
          },
          {
            key: "activity",
            label: "Activity",
            children: (
              <div style={{ ...cardStyle, padding: "6px 20px" }}>
                {activityLoading ? (
                  <Skeleton active />
                ) : !userActivity || userActivity.length === 0 ? (
                  <Typography.Text type="secondary">No recorded activity for this user yet.</Typography.Text>
                ) : (
                  userActivity.map((log) => (
                    <div
                      key={log.id}
                      style={{ display: "flex", gap: 14, padding: "14px 0", borderTop: "1px solid #F0F1F4" }}
                    >
                      <div
                        style={{
                          fontFamily: MONO_FONT_FAMILY,
                          fontSize: 12,
                          color: "#8B93A1",
                          width: 150,
                          flexShrink: 0,
                        }}
                      >
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>{log.actor?.full_name ?? "System"}</span>{" "}
                        <span style={{ color: "#6B7280" }}>
                          {log.action.toLowerCase().replace(/_/g, " ")}
                          {log.entity_type ? ` — ${log.entity_type}${log.entity_id ? ` #${log.entity_id}` : ""}` : ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal
        title="Assign role"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.validateFields().then(handleAssign)}
        confirmLoading={assigning}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ scopeType: "tenant" }}>
          <Form.Item name="roleId" label="Role" rules={[{ required: true, message: "Select a role." }]}>
            <Select
              placeholder="Select role"
              options={roles?.map((r) => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>
          <Form.Item name="scopeType" label="Scope" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "Tenant-wide", value: "tenant" },
                { label: "Branch", value: "branch" },
                { label: "Campus", value: "campus" },
                { label: "Location", value: "location" },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.scopeType !== cur.scopeType}>
            {({ getFieldValue }) => {
              const scope: ScopeType = getFieldValue("scopeType");
              if (scope === "tenant") return null;

              if (scope === "branch") {
                return (
                  <Form.Item
                    name="branchId"
                    label="Branch"
                    rules={[{ required: true, message: "Select a branch." }]}
                  >
                    <Select
                      placeholder="Select branch"
                      options={orgBranches?.map((b) => ({ label: b.branch_name, value: b.id }))}
                      notFoundContent="No branches configured for this tenant yet."
                    />
                  </Form.Item>
                );
              }

              if (scope === "campus") {
                return (
                  <>
                    <Form.Item label="Branch (filter)">
                      <Select
                        placeholder="All branches"
                        allowClear
                        value={scopeBranchFilter}
                        onChange={setScopeBranchFilter}
                        options={orgBranches?.map((b) => ({ label: b.branch_name, value: b.id }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name="campusId"
                      label="Campus"
                      rules={[{ required: true, message: "Select a campus." }]}
                    >
                      <Select
                        placeholder="Select campus"
                        options={orgCampuses?.map((c) => ({ label: c.campus_name, value: c.id }))}
                        notFoundContent="No campuses found."
                      />
                    </Form.Item>
                  </>
                );
              }

              return (
                <>
                  <Form.Item label="Campus (filter)">
                    <Select
                      placeholder="All campuses"
                      allowClear
                      value={scopeCampusFilter}
                      onChange={setScopeCampusFilter}
                      options={orgCampuses?.map((c) => ({ label: c.campus_name, value: c.id }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name="locationId"
                    label="Location"
                    rules={[{ required: true, message: "Select a location." }]}
                  >
                    <Select
                      placeholder="Select location"
                      options={orgLocations?.map((l) => ({ label: l.location_name, value: l.id }))}
                      notFoundContent="No locations found."
                    />
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
