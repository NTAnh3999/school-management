import { Typography } from "antd";

// AntD's semantic status colors — reused so a breakdown bar reads consistently with StatusTag
// badges elsewhere in the portal (same status → same color).
const BAR_COLORS: Record<string, string> = {
  success: "#52c41a",
  processing: "#1677ff",
  warning: "#faad14",
  error: "#ff4d4f",
  gold: "#faad14",
  default: "#8c8c8c",
};

const SEMANTIC: Record<string, string> = {
  active: "success",
  published: "success",
  open: "success",
  completed: "success",
  in_progress: "processing",
  draft: "default",
  pending: "warning",
  suspended: "warning",
  full: "gold",
  cancelled: "error",
  rejected: "error",
  archived: "default",
  waitlisted: "warning",
};

interface StatusBreakdownProps {
  data: { label: string; value: number }[];
}

/** Simple horizontal breakdown bar for a status distribution — value + proportional bar + label,
 * so identity never relies on color alone (spec §15 Accessibility). */
export function StatusBreakdown({ data }: StatusBreakdownProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Typography.Text style={{ width: 110, fontSize: 13, textTransform: "capitalize" }}>
            {d.label.replace(/_/g, " ")}
          </Typography.Text>
          <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 10, overflow: "hidden" }}>
            <div
              style={{
                width: `${(d.value / max) * 100}%`,
                background: BAR_COLORS[SEMANTIC[d.label] ?? "default"],
                height: "100%",
                borderRadius: 4,
                transition: "width 0.3s",
              }}
            />
          </div>
          <Typography.Text strong style={{ width: 36, textAlign: "right", fontSize: 13 }}>
            {d.value}
          </Typography.Text>
        </div>
      ))}
    </div>
  );
}
