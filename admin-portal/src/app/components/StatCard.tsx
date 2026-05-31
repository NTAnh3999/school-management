import { memo } from "react";
import { Card, Statistic } from "antd";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  iconBg: string;
  suffix?: string;
  trend?: { value: number; positive: boolean };
  loading?: boolean;
}

export const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  iconBg,
  suffix,
  loading,
}: StatCardProps) {
  return (
    <Card loading={loading} hoverable>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <Statistic
          title={title}
          value={value}
          suffix={suffix}
          valueStyle={{ fontSize: 24 }}
        />
      </div>
    </Card>
  );
});
