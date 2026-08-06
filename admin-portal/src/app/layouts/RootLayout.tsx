import { Outlet } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { useAppSelector } from "@/store/hooks";

export function RootLayout() {
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: "#F6F7F9",
        color: "#14171F",
        overflow: "hidden",
      }}
    >
      <Sidebar collapsed={collapsed} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        <Header />
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px 60px" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
