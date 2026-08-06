import { List, Button, Space, Tag, Popconfirm, Empty, Skeleton, Typography } from "antd";
import { CheckOutlined, DeleteOutlined, BellOutlined } from "@ant-design/icons";
import { PageHeader } from "../../components/PageHeader";
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from "@/store/api/notificationsApi";

const typeColors: Record<string, string> = {
  progress: "blue",
  assignment: "purple",
  reward: "gold",
  course: "green",
  general: "default",
};

// ADM-32 — Notification List (scoped to the current admin's own notifications; the backend
// exposes no tenant-wide notification feed to browse other users' messages).
export function NotificationList() {
  const { data: notifications, isLoading } = useListNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
  const [remove] = useDeleteNotificationMutation();

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Notifications"
        description="Reminders and system messages for your account."
        actions={
          unreadCount > 0 ? (
            <Button icon={<CheckOutlined />} loading={markingAll} onClick={() => markAllRead()}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Skeleton active />
      ) : !notifications || notifications.length === 0 ? (
        <Empty description="No notifications." />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(n) => (
            <List.Item
              style={{ background: n.is_read ? undefined : "#f0f7ff", padding: 12, borderRadius: 8 }}
              actions={[
                !n.is_read && (
                  <Button key="read" type="text" icon={<CheckOutlined />} onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                ),
                <Popconfirm key="delete" title="Delete this notification?" onConfirm={() => remove(n.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={<BellOutlined style={{ fontSize: 18, color: "#1677ff" }} />}
                title={
                  <Space>
                    {n.title}
                    <Tag color={typeColors[n.notification_type]}>{n.notification_type}</Tag>
                  </Space>
                }
                description={
                  <>
                    <div>{n.message}</div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </Typography.Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Space>
  );
}
