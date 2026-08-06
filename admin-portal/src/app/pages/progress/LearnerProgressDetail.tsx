import { Card, Descriptions, Space, Progress, Table, Button, Popconfirm, message, Skeleton, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { PermissionGate } from "../../components/PermissionGate";
import {
  useGetEnrollmentProgressQuery,
  useGetProgressEventLogsQuery,
  useRecomputeProgressMutation,
} from "@/store/api/progressApi";
import type { ProgressEventLog } from "@/types";
import { getErrorMessage } from "@/lib/error";

// ADM-31 — Learner Progress Detail: snapshot, checklist counters, and the event-log trail
// behind it, plus an admin recompute override for stuck/incorrect progress.
export function LearnerProgressDetail() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const id = Number(enrollmentId);
  const navigate = useNavigate();
  const { data: progress, isLoading } = useGetEnrollmentProgressQuery(id, { skip: !id });
  const { data: eventLogs } = useGetProgressEventLogsQuery(id, { skip: !id });
  const [recompute, { isLoading: recomputing }] = useRecomputeProgressMutation();

  const handleRecompute = async () => {
    try {
      await recompute({ enrollmentId: id, reason: "Admin manual recompute" }).unwrap();
      message.success("Progress recomputed");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to recompute progress"));
    }
  };

  const eventColumns: ColumnsType<ProgressEventLog> = [
    { title: "Source", key: "source", render: (_, r) => `${r.source_module} · ${r.source_event_name}` },
    { title: "Status", dataIndex: "process_status", key: "process_status", render: (v) => <StatusTag status={v} /> },
    { title: "Error", key: "error", render: (_, r) => r.error_message ?? "—" },
    { title: "Received", dataIndex: "received_at", key: "received_at", render: (v) => new Date(v).toLocaleString() },
  ];

  if (isLoading) return <Skeleton active />;
  if (!progress) return <Empty description="No progress record found for this enrollment." />;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title={`Enrollment #${id} progress`}
        breadcrumb={[{ label: "Progress", to: "/progress" }, { label: `Enrollment #${id}` }]}
        actions={
          <PermissionGate permission="iam.user.manage">
            <Popconfirm
              title="Recompute progress for this enrollment?"
              description="Use this if progress looks stuck or incorrect. This is recorded in the audit log."
              onConfirm={handleRecompute}
            >
              <Button loading={recomputing}>Recompute progress</Button>
            </Popconfirm>
          </PermissionGate>
        }
      />

      <Card title="Progress snapshot">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Status">
            <StatusTag status={progress.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Completion">
            <Progress percent={Math.round(progress.completion_percentage)} />
          </Descriptions.Item>
          <Descriptions.Item label="Items completed">
            {progress.completed_item_count} / {progress.total_item_count}
          </Descriptions.Item>
          <Descriptions.Item label="Time spent">{progress.total_time_spent_minutes} min</Descriptions.Item>
          <Descriptions.Item label="Started">
            {progress.started_at ? new Date(progress.started_at).toLocaleString() : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Last computed">
            {progress.last_computed_at ? new Date(progress.last_computed_at).toLocaleString() : "—"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Event log">
        <Table<ProgressEventLog>
          dataSource={eventLogs}
          columns={eventColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "No progress events recorded yet." }}
        />
      </Card>

      <Button onClick={() => navigate(-1)}>Back</Button>
    </Space>
  );
}
