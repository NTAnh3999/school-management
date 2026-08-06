import { MONO_FONT_FAMILY } from "../theme";

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendColor?: string;
  loading?: boolean;
}

// KPI tile matching the design mockup's dashboard/reporting stat cards: plain label, a large
// monospace value (no icon — the mockup deliberately keeps these text-only), and an optional
// colored trend line.
export function KpiCard({ label, value, trend, trendColor = "#6B7280", loading }: KpiCardProps) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E7E9EE",
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div style={{ fontSize: 12.5, color: "#6B7280", fontWeight: 600 }}>{label}</div>
      <div
        style={{
          fontFamily: MONO_FONT_FAMILY,
          fontSize: 26,
          fontWeight: 600,
          marginTop: 8,
          letterSpacing: "-0.01em",
          color: "#14171F",
        }}
      >
        {loading ? "—" : value}
      </div>
      {trend && (
        <div style={{ fontSize: 12, marginTop: 6, color: trendColor, fontWeight: 600 }}>{trend}</div>
      )}
    </div>
  );
}
