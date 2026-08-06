import { useState } from "react";
import {
  Card,
  Descriptions,
  Space,
  Button,
  Table,
  Popconfirm,
  Modal,
  Form,
  Input,
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
  useGetEnrollmentByIdQuery,
  useGetEnrollmentHistoryQuery,
  useActivateEnrollmentMutation,
  useSuspendEnrollmentMutation,
  useResumeEnrollmentMutation,
  useCancelEnrollmentMutation,
  useCompleteEnrollmentMutation,
} from "@/store/api/enrollmentsApi";
import type { EnrollmentHistoryEntry, EnrollmentStatus } from "@/types";
import { getErrorMessage } from "@/lib/error";

const simpleTransitions: Partial<Record<EnrollmentStatus, { key: "activate" | "resume" | "complete"; label: string }[]>> = {
  pending: [{ key: "activate", label: "Activate" }],
  active: [{ key: "complete", label: "Mark completed" }],
  suspended: [{ key: "resume", label: "Resume" }],
};

const cancellableFrom: EnrollmentStatus[] = ["pending", "active", "suspended", "waitlisted"];
const suspendableFrom: EnrollmentStatus[] = ["active"];

// ADM-23 — Enrollment Detail, with ADM-26 (Enrollment Status Management) as inline lifecycle actions.
export function EnrollmentDetail() {
  const { id } = useParams<{ id: string }>();
  const enrollmentId = Number(id);
  const navigate = useNavigate();
  const { data: enrollment, isLoading } = useGetEnrollmentByIdQuery(enrollmentId, { skip: !id });
  const { data: history } = useGetEnrollmentHistoryQuery(enrollmentId, { skip: !id });

  const [activate] = useActivateEnrollmentMutation();
  const [suspend] = useSuspendEnrollmentMutation();
  const [resume] = useResumeEnrollmentMutation();
  const [cancel] = useCancelEnrollmentMutation();
  const [complete] = useCompleteEnrollmentMutation();

  const [reasonModal, setReasonModal] = useState<"suspend" | "cancel" | null>(null);
  const [form] = Form.useForm<{ reason_message?: string }>();

  const runSimple = async (key: "activate" | "resume" | "complete") => {
    if (!enrollment) return;
    try {
      if (key === "activate") await activate(enrollment.id).unwrap();
      if (key === "resume") await resume(enrollment.id).unwrap();
      if (key === "complete") await complete(enrollment.id).unwrap();
      message.success("Enrollment updated");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to update enrollment"));
    }
  };

  const runWithReason = async (values: { reason_message?: string }) => {
    if (!enrollment || !reasonModal) return;
    try {
      if (reasonModal === "suspend") await suspend({ id: enrollment.id, ...values }).unwrap();
      if (reasonModal === "cancel") await cancel({ id: enrollment.id, ...values }).unwrap();
      message.success("Enrollment updated");
      setReasonModal(null);
      form.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to update enrollment"));
    }
  };

  const historyColumns: ColumnsType<EnrollmentHistoryEntry> = [
    {
      title: "Change",
      key: "change",
      render: (_, r) => (
        <Space size={6}>
          {r.from_status && <StatusTag status={r.from_status} />}
          {r.from_status && "→"}
          <StatusTag status={r.to_status} />
        </Space>
      ),
    },
    { title: "Reason", key: "reason", render: (_, r) => r.reason_message ?? r.reason_code ?? "—" },
    { title: "When", dataIndex: "created_at", key: "created_at", render: (v) => new Date(v).toLocaleString() },
  ];

  if (isLoading) return <Skeleton active />;
  if (!enrollment) return <Empty description="Enrollment not found." />;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title={enrollment.student?.full_name ?? `Enrollment #${enrollment.id}`}
        description={enrollment.course?.course_name}
        breadcrumb={[{ label: "Enrollments", to: "/enrollments" }, { label: `#${enrollment.id}` }]}
        actions={
          <PermissionGate permission="iam.user.manage">
            <Space>
              {(simpleTransitions[enrollment.status] ?? []).map((t) => (
                <Popconfirm key={t.key} title={`${t.label} this enrollment?`} onConfirm={() => runSimple(t.key)}>
                  <Button>{t.label}</Button>
                </Popconfirm>
              ))}
              {suspendableFrom.includes(enrollment.status) && (
                <Button onClick={() => setReasonModal("suspend")}>Suspend</Button>
              )}
              {cancellableFrom.includes(enrollment.status) && (
                <Button danger onClick={() => setReasonModal("cancel")}>
                  Cancel
                </Button>
              )}
            </Space>
          </PermissionGate>
        }
      />

      <Card title="Enrollment information">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Status">
            <StatusTag status={enrollment.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Source">{enrollment.request_source}</Descriptions.Item>
          <Descriptions.Item label="Learner">
            {enrollment.student?.full_name} ({enrollment.student?.email})
          </Descriptions.Item>
          <Descriptions.Item label="Course">{enrollment.course?.course_name}</Descriptions.Item>
          <Descriptions.Item label="Requested">
            {new Date(enrollment.requested_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Activated">
            {enrollment.activated_at ? new Date(enrollment.activated_at).toLocaleString() : "—"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Status history">
        <Table<EnrollmentHistoryEntry>
          dataSource={history}
          columns={historyColumns}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: "No history recorded yet." }}
        />
      </Card>

      <Button onClick={() => navigate(-1)}>Back</Button>

      <Modal
        title={reasonModal === "suspend" ? "Suspend enrollment" : "Cancel enrollment"}
        open={reasonModal !== null}
        onCancel={() => setReasonModal(null)}
        onOk={() => form.validateFields().then(runWithReason)}
        okButtonProps={{ danger: reasonModal === "cancel" }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="reason_message" label="Reason (optional)">
            <Input.TextArea rows={3} placeholder="Add context for the audit log..." />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
