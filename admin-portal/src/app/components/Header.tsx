import { memo, useState } from "react";
import { Dropdown, Modal, Typography, Space } from "antd";
import {
  DownOutlined,
  BellOutlined,
  UserOutlined,
  LockOutlined,
  SwapOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout as logoutAction } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/store/api/authApi";
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/store/api/notificationsApi";
import { ACCENT } from "../theme";

const { Text } = Typography;

const initialsOf = (name: string | undefined) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: recent } = useListNotificationsQuery();
  const { data: unread } = useListNotificationsQuery({ unread: true });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const hasUnread = (unread?.length ?? 0) > 0;
  const items = recent?.slice(0, 4) ?? [];

  return (
    <Dropdown
      trigger={[]}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      dropdownRender={() => (
        <div
          style={{
            width: 340,
            background: "#fff",
            border: "1px solid #E7E9EE",
            borderRadius: 10,
            boxShadow: "0 12px 32px rgba(20,23,31,.14)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderBottom: "1px solid #F0F1F4",
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>Notifications</div>
            <button
              type="button"
              onClick={() => markAllRead()}
              style={{
                background: "none",
                border: "none",
                color: ACCENT,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Mark all as read
            </button>
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {items.length === 0 && (
              <div style={{ padding: "24px 14px", fontSize: 12.5, color: "#8B93A1", textAlign: "center" }}>
                No notifications yet.
              </div>
            )}
            {items.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                }}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "12px 14px",
                  borderBottom: "1px solid #F0F1F4",
                  cursor: "pointer",
                  background: !n.is_read ? `${ACCENT}08` : "#fff",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: !n.is_read ? ACCENT : "#D8DBE1",
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: !n.is_read ? 700 : 600 }}>{n.title}</div>
                  {n.message && (
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                  )}
                  <div style={{ fontSize: 11.5, color: "#8B93A1", marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
            style={{
              width: "100%",
              textAlign: "center",
              padding: 11,
              border: "none",
              background: "#FAFBFC",
              color: ACCENT,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            View all notifications
          </button>
        </div>
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
        }}
        aria-label="Notifications"
      >
        <BellOutlined style={{ fontSize: 18, color: "#6B7280" }} />
        {hasUnread && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#DC2626",
              border: "1.5px solid #fff",
            }}
          />
        )}
      </button>
    </Dropdown>
  );
}

export const Header = memo(function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const activeTenant = useAppSelector((s) => s.auth.activeTenant);
  const tenants = useAppSelector((s) => s.auth.tenants);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const [logoutRequest] = useLogoutMutation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const doLogout = async () => {
    try {
      await logoutRequest({ refreshToken }).unwrap();
    } catch {
      // Even if the network call fails, clear local session state below.
    }
    dispatch(logoutAction());
    navigate("/login", { replace: true });
  };

  const menuItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 9,
    width: "100%",
    textAlign: "left",
    padding: "9px 10px",
    borderRadius: 7,
    border: "none",
    background: "none",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        height: 60,
        minHeight: 60,
        borderBottom: "1px solid #E7E9EE",
        background: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
      }}
    >
      <button
        type="button"
        onClick={() => tenants.length > 1 && navigate("/select-tenant")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#F6F7F9",
          border: "1px solid #E7E9EE",
          borderRadius: 8,
          padding: "7px 12px",
          cursor: tenants.length > 1 ? "pointer" : "default",
          fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#14171F" }}>
          {activeTenant?.tenant_name ?? "No workspace"}
        </span>
        {tenants.length > 1 && <DownOutlined style={{ fontSize: 11, color: "#9AA1AC" }} />}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <NotificationBell />

        <Dropdown
          trigger={[]}
          open={profileOpen}
          onOpenChange={setProfileOpen}
          placement="bottomRight"
          dropdownRender={() => (
            <div
              style={{
                width: 220,
                background: "#fff",
                border: "1px solid #E7E9EE",
                borderRadius: 10,
                boxShadow: "0 12px 32px rgba(20,23,31,.14)",
                padding: 6,
              }}
            >
              <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid #F0F1F4", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.full_name ?? "—"}</div>
                <div style={{ fontSize: 11.5, color: "#8B93A1" }}>{user?.role ?? "Member"}</div>
              </div>
              <button
                type="button"
                style={menuItemStyle}
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/account/profile");
                }}
              >
                <UserOutlined style={{ fontSize: 15 }} />
                My Profile
              </button>
              {tenants.length > 1 && (
                <button
                  type="button"
                  style={menuItemStyle}
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/select-tenant");
                  }}
                >
                  <SwapOutlined style={{ fontSize: 15 }} />
                  Switch workspace
                </button>
              )}
              <button
                type="button"
                style={menuItemStyle}
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/account/security");
                }}
              >
                <LockOutlined style={{ fontSize: 15 }} />
                Change password / Security
              </button>
              <div style={{ height: 1, background: "#F0F1F4", margin: "4px 0" }} />
              <button
                type="button"
                style={{ ...menuItemStyle, color: "#DC2626" }}
                onClick={() => {
                  setProfileOpen(false);
                  setLogoutModalOpen(true);
                }}
              >
                <LogoutOutlined style={{ fontSize: 15 }} />
                Logout
              </button>
            </div>
          )}
        >
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#E9EAFB",
                color: ACCENT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 12.5,
                flexShrink: 0,
              }}
            >
              {initialsOf(user?.full_name)}
            </div>
            <div style={{ lineHeight: 1.2, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#14171F" }}>
                {user?.full_name ?? "Admin"}
              </div>
              <div style={{ fontSize: 11.5, color: "#8B93A1" }}>{user?.role ?? "Member"}</div>
            </div>
            <DownOutlined style={{ fontSize: 11, color: "#9AA1AC" }} />
          </button>
        </Dropdown>
      </div>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            Log out?
          </Space>
        }
        open={logoutModalOpen}
        onCancel={() => setLogoutModalOpen(false)}
        onOk={doLogout}
        okText="Log out"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
      >
        <Text>You will need to sign in again to access the Tenant Admin Portal.</Text>
      </Modal>
    </div>
  );
});
