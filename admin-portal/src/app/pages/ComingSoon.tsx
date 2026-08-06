import { Empty, Typography } from "antd";
import { PageHeader } from "../components/PageHeader";

interface ComingSoonProps {
  title: string;
  description: string;
  note: string;
}

// Placeholder for screens the UI/UX spec defers to a later design round (Billing, advanced
// Tenant Settings, Change Password/Security) — kept in the nav so the information architecture
// matches the spec, without fabricating data the backend doesn't yet expose.
export function ComingSoon({ title, description, note }: ComingSoonProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div style={{ marginTop: 24 }}>
        <Empty description={<Typography.Text type="secondary">{note}</Typography.Text>} />
      </div>
    </>
  );
}
