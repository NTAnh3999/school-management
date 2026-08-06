import { Layout, Typography, Space } from "antd";
import { ReadOutlined } from "@ant-design/icons";
import { Outlet } from "react-router";
import { ACCENT } from "../theme";

const { Content } = Layout;
const { Title, Text } = Typography;

// Centered, chrome-free shell for Login / Select Tenant — COMMON-01 / COMMON-04. Kept visually
// distinct from the admin shell since no tenant/session context exists yet; the Tenant Admin
// Portal design mockup doesn't model these screens, so only the shared accent color carries over.
export function AuthLayout() {
  return (
    <Layout style={{ minHeight: "100vh", background: "#F6F7F9" }}>
      <Content
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Space direction="vertical" align="center" size={4} style={{ marginBottom: 24 }}>
          <Space align="center" size={10}>
            <ReadOutlined style={{ fontSize: 28, color: ACCENT }} />
            <Title level={3} style={{ margin: 0 }}>
              EdTech Platform
            </Title>
          </Space>
          <Text type="secondary">Tenant Admin Portal</Text>
        </Space>
        <Outlet />
      </Content>
    </Layout>
  );
}
