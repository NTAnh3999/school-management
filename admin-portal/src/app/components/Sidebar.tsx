import { memo, useState } from "react";
import {
  DashboardOutlined,
  UserOutlined,
  IdcardOutlined,
  ApartmentOutlined,
  ClusterOutlined,
  BookOutlined,
  CheckSquareOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  SolutionOutlined,
  FileTextOutlined,
  TableOutlined,
  LineChartOutlined,
  BarChartOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  SettingOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar } from "@/features/ui/uiSlice";
import { ACCENT } from "../theme";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  /** Also highlighted when the current path starts with any of these prefixes. */
  matchPrefixes?: string[];
  /** Prefixes that opt back out of matchPrefixes, for a more specific sibling route. */
  excludePrefixes?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Nav structure mirrors the Tenant Admin Portal design mockup's ADMIN NAV: Dashboard standalone,
// then People / Academic Management / Learning Operations / Insights / Billing / Administration.
// The mockup has no sidebar entry for Notifications or My Profile — both live in the header
// (bell dropdown, profile dropdown) — so neither appears here.
const NAV_GROUPS: NavGroup[] = [
  {
    label: "People",
    items: [
      { to: "/users", label: "Users", icon: <UserOutlined /> },
      { to: "/profiles", label: "Profiles", icon: <IdcardOutlined /> },
      { to: "/relationships", label: "Relationships", icon: <ApartmentOutlined /> },
    ],
  },
  {
    label: "Academic Management",
    items: [
      {
        to: "/departments",
        label: "Departments",
        icon: <ClusterOutlined />,
        matchPrefixes: ["/departments"],
      },
      {
        to: "/courses",
        label: "Courses",
        icon: <BookOutlined />,
        matchPrefixes: ["/courses"],
        excludePrefixes: ["/courses/content-approval"],
      },
      { to: "/courses/content-approval", label: "Content Approval", icon: <CheckSquareOutlined /> },
      { to: "/content-assets", label: "Content Assets", icon: <FolderOpenOutlined /> },
      { to: "/classrooms", label: "Classrooms", icon: <HomeOutlined /> },
      { to: "/enrollments", label: "Enrollments", icon: <SolutionOutlined /> },
    ],
  },
  {
    label: "Learning Operations",
    items: [
      { to: "/assessments", label: "Assessments", icon: <FileTextOutlined /> },
      { to: "/gradebook", label: "Gradebook", icon: <TableOutlined /> },
      { to: "/progress", label: "Progress", icon: <LineChartOutlined /> },
    ],
  },
  {
    label: "Insights",
    items: [{ to: "/reporting", label: "Reporting", icon: <BarChartOutlined /> }],
  },
  {
    label: "Billing",
    items: [{ to: "/billing", label: "Billing", icon: <CreditCardOutlined /> }],
  },
  {
    label: "Administration",
    items: [
      { to: "/administration/audit-log", label: "Audit Log", icon: <HistoryOutlined /> },
      { to: "/administration/settings", label: "Tenant Settings", icon: <SettingOutlined /> },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar = memo(function Sidebar({ collapsed }: SidebarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTenant = useAppSelector((s) => s.auth.activeTenant);
  const [hoverBrand, setHoverBrand] = useState(false);

  const width = collapsed ? 72 : 260;
  const tenantName = activeTenant?.tenant_name ?? "Tenant Admin Portal";
  const brandLetter = tenantName.trim().charAt(0).toUpperCase() || "T";
  const showOverlayToggle = collapsed && hoverBrand;

  const isActive = (item: NavItem) => {
    if (location.pathname === item.to) return true;
    if ((item.excludePrefixes ?? []).some((p) => location.pathname.startsWith(p))) return false;
    return (item.matchPrefixes ?? []).some((p) => location.pathname.startsWith(p));
  };

  const navBtnStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    textAlign: "left",
    padding: "9px 10px",
    borderRadius: 8,
    border: "none",
    background: active ? `${ACCENT}14` : "none",
    color: active ? ACCENT : "#3A3F4B",
    fontFamily: "inherit",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    justifyContent: collapsed ? "center" : "flex-start",
  });

  return (
    <div
      style={{
        width,
        minWidth: width,
        background: "#FFFFFF",
        borderRight: "1px solid #E7E9EE",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        transition: "width .15s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 16px",
          borderBottom: "1px solid #EEF0F3",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <div
            onMouseEnter={() => setHoverBrand(true)}
            onMouseLeave={() => setHoverBrand(false)}
            style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: ACCENT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
                position: "absolute",
                inset: 0,
                opacity: showOverlayToggle ? 0 : 1,
                transition: "opacity .1s ease",
              }}
            >
              {brandLetter}
            </div>
            <button
              type="button"
              onClick={() => dispatch(toggleSidebar())}
              aria-label="Expand sidebar"
              style={{
                position: "absolute",
                inset: 0,
                width: 28,
                height: 28,
                borderRadius: 7,
                border: "1px solid #E7E9EE",
                background: "#fff",
                display: collapsed ? "flex" : "none",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                opacity: showOverlayToggle ? 1 : 0,
                pointerEvents: showOverlayToggle ? "auto" : "none",
                transition: "opacity .1s ease",
              }}
            >
              <RightOutlined style={{ fontSize: 11, color: "#6B7280" }} />
            </button>
          </div>
          {!collapsed && (
            <div
              style={{
                fontWeight: 700,
                fontSize: 14.5,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {tenantName}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Collapse sidebar"
          style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            borderRadius: 6,
            border: "1px solid #E7E9EE",
            background: "#fff",
            display: collapsed ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <LeftOutlined style={{ fontSize: 11, color: "#6B7280" }} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px 12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <button type="button" onClick={() => navigate("/")} style={navBtnStyle(location.pathname === "/")}>
            <DashboardOutlined style={{ fontSize: 16, flexShrink: 0 }} />
            {!collapsed && <span>Dashboard</span>}
          </button>

          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "0 10px 6px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    color: "#98A0AE",
                    textTransform: "uppercase",
                  }}
                >
                  {group.label}
                </div>
              )}
              {collapsed && <div style={{ marginTop: 12 }} />}
              {group.items.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => navigate(item.to)}
                  style={navBtnStyle(isActive(item))}
                  title={collapsed ? item.label : undefined}
                >
                  <span style={{ fontSize: 16, flexShrink: 0, display: "flex" }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
