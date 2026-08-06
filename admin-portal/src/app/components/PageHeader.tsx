import { Space, Breadcrumb } from "antd";
import type { ReactNode } from "react";
import { Link } from "react-router";

interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: Crumb[];
  /** Primary/secondary action buttons, e.g. <Button type="primary">Create</Button> */
  actions?: ReactNode;
}

// Shared page-title block used across List and Detail pages — spec section 12.1/12.2:
// "Page title. Description ngắn. Primary action button." Typography matches the Tenant Admin
// Portal design mockup's screen-title pattern (22px/800 title, 13.5px grey description).
export function PageHeader({ title, description, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <Breadcrumb
            style={{ marginBottom: 8 }}
            items={breadcrumb.map((c) => ({
              title: c.to ? <Link to={c.to}>{c.label}</Link> : c.label,
            }))}
          />
        )}
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em", color: "#14171F" }}>
          {title}
        </div>
        {description && (
          <div style={{ fontSize: 13.5, color: "#6B7280", marginTop: 3 }}>{description}</div>
        )}
      </div>
      {actions && <Space wrap>{actions}</Space>}
    </div>
  );
}
