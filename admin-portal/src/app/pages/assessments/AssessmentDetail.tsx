import {
  Card,
  Descriptions,
  Space,
  Button,
  Table,
  Popconfirm,
  message,
  Skeleton,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { PermissionGate } from "../../components/PermissionGate";
import {
  useGetAssessmentByIdQuery,
  useGetAssessmentAttemptsQuery,
  usePublishAssessmentMutation,
  useCloseAssessmentMutation,
  useArchiveAssessmentMutation,
} from "@/store/api/assessmentsApi";
import type { AssessmentAttempt } from "@/types";
import { getErrorMessage } from "@/lib/error";

// ADM-28 — Assessment Detail: configuration, attempt summary, and governance actions
// (publish / close / archive). Question authoring and per-submission grading remain with
// Teacher; School Admin oversees status and reviews aggregate results (see Gradebook).
export function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const assessmentId = Number(id);
  const navigate = useNavigate();
  const { data: assessment, isLoading } = useGetAssessmentByIdQuery(assessmentId, { skip: !id });
  const { data: attempts } = useGetAssessmentAttemptsQuery({ id: assessmentId }, { skip: !id });

  const [publish] = usePublishAssessmentMutation();
  const [close] = useCloseAssessmentMutation();
  const [archive] = useArchiveAssessmentMutation();

  const runAction = async (action: "publish" | "close" | "archive") => {
    if (!assessment) return;
    try {
      if (action === "publish") await publish(assessment.id).unwrap();
      if (action === "close") await close({ id: assessment.id }).unwrap();
      if (action === "archive") await archive({ id: assessment.id }).unwrap();
      message.success("Assessment updated");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to update assessment"));
    }
  };

  const attemptColumns: ColumnsType<AssessmentAttempt> = [
    { title: "Attempt #", dataIndex: "attempt_number", key: "attempt_number", width: 100 },
    { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
    { title: "Score", dataIndex: "score", key: "score", render: (v: number | null) => v ?? "—" },
    {
      title: "Submitted",
      dataIndex: "submitted_at",
      key: "submitted_at",
      render: (v: string | null) => (v ? new Date(v).toLocaleString() : "—"),
    },
  ];

  if (isLoading) return <Skeleton active />;
  if (!assessment) return <Empty description="Assessment not found." />;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title={assessment.title}
        description={assessment.assessment_type}
        breadcrumb={[{ label: "Assessments", to: "/assessments" }, { label: assessment.title }]}
        actions={
          <PermissionGate permission="iam.user.manage">
            <Space>
              {assessment.status === "draft" && (
                <Popconfirm title="Publish this assessment?" onConfirm={() => runAction("publish")}>
                  <Button type="primary">Publish</Button>
                </Popconfirm>
              )}
              {assessment.status === "published" && (
                <Popconfirm title="Close this assessment? No further attempts will be accepted." onConfirm={() => runAction("close")}>
                  <Button danger>Close</Button>
                </Popconfirm>
              )}
              {assessment.status === "closed" && (
                <Popconfirm title="Archive this assessment?" onConfirm={() => runAction("archive")}>
                  <Button>Archive</Button>
                </Popconfirm>
              )}
            </Space>
          </PermissionGate>
        }
      />

      <Card title="Configuration">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Status">
            <StatusTag status={assessment.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Grading method">{assessment.grading_method}</Descriptions.Item>
          <Descriptions.Item label="Passing score">{assessment.passing_score}</Descriptions.Item>
          <Descriptions.Item label="Max score">{assessment.max_score ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="Max attempts">{assessment.max_attempts}</Descriptions.Item>
          <Descriptions.Item label="Time limit">
            {assessment.time_limit_minutes ? `${assessment.time_limit_minutes} min` : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Open">
            {assessment.open_at ? new Date(assessment.open_at).toLocaleString() : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Close">
            {assessment.close_at ? new Date(assessment.close_at).toLocaleString() : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {assessment.description ?? "—"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="Attempts"
        extra={
          <Button type="link" onClick={() => navigate(`/gradebook?assessmentId=${assessment.id}`)}>
            View in Gradebook
          </Button>
        }
      >
        <Table<AssessmentAttempt>
          dataSource={attempts}
          columns={attemptColumns}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: "No attempts recorded yet." }}
        />
      </Card>

      <Button onClick={() => navigate(-1)}>Back</Button>
    </Space>
  );
}
