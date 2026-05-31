import { Calendar, Typography, Space, Badge, Card } from "antd";
import type { Dayjs } from "dayjs";
import type { BadgeProps } from "antd";

const { Title, Text } = Typography;

// Static schedule data — hoisted to avoid re-creation (server-hoist-static-io)
const scheduleData: Record<
  string,
  Array<{ type: BadgeProps["status"]; content: string }>
> = {
  "2026-05-18": [
    { type: "success", content: "React Fundamentals – 10:00 AM" },
    { type: "warning", content: "Data Science – 2:00 PM" },
  ],
  "2026-05-20": [
    { type: "processing", content: "Node.js Masterclass – 9:00 AM" },
    { type: "success", content: "UI/UX Design – 3:00 PM" },
  ],
  "2026-05-22": [
    { type: "error", content: "Cancelled: Advanced JS – 1:00 PM" },
  ],
};

function getListData(value: Dayjs) {
  return scheduleData[value.format("YYYY-MM-DD")] ?? [];
}

function dateCellRender(value: Dayjs) {
  const listData = getListData(value);
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {listData.map((item, i) => (
        <li key={i}>
          <Badge status={item.type} text={item.content} />
        </li>
      ))}
    </ul>
  );
}

export function Schedule() {
  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Schedule
        </Title>
        <Text type="secondary">View and manage class schedules</Text>
      </div>

      <Card>
        <Calendar cellRender={dateCellRender} />
      </Card>
    </Space>
  );
}
