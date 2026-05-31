import { memo } from "react";
import { Layout, Menu, Typography, Avatar } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  HomeOutlined,
  BarsOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router";
import { useAppSelector } from "@/store/hooks";

const { Sider } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/users", icon: <UserOutlined />, label: "Users" },
  { key: "/courses", icon: <BookOutlined />, label: "Courses" },
  { key: "/classrooms", icon: <HomeOutlined />, label: "Classrooms" },
  { key: "/enrollments", icon: <BarsOutlined />, label: "Enrollments" },
  { key: "/schedule", icon: <CalendarOutlined />, label: "Schedule" },
  { key: "/reports", icon: <BarChartOutlined />, label: "Reports" },
  { key: "/permissions", icon: <SafetyOutlined />, label: "Permissions" },
  { key: "/settings", icon: <SettingOutlined />, label: "Settings" },
];

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar = memo(function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <Sider
      collapsed={collapsed}
      width={240}
      style={{ height: "100vh", position: "sticky", top: 0, overflow: "auto" }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? 0 : "0 24px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          gap: 10,
        }}
      >
        <TeamOutlined style={{ fontSize: 24, color: "#1677ff" }} />
        {!collapsed && (
          <Text strong style={{ color: "#fff", fontSize: 16 }}>
            SchoolHub
          </Text>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0 }}
      />

      {/* Current user footer */}
      {user && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Avatar size="small" icon={<UserOutlined />} src={user.avatar} />
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <Text
                ellipsis
                style={{
                  color: "rgba(255,255,255,0.85)",
                  display: "block",
                  fontSize: 13,
                }}
              >
                {user.firstName} {user.lastName}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                {user.role}
              </Text>
            </div>
          )}
        </div>
      )}
    </Sider>
  );
});
