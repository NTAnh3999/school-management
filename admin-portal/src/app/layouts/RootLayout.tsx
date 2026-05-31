import { Layout } from "antd";
import { Outlet } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { useAppSelector } from "@/store/hooks";

const { Content } = Layout;

export function RootLayout() {
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} />
      <Layout>
        <Header />
        <Content style={{ margin: "24px", minHeight: "calc(100vh - 112px)" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
