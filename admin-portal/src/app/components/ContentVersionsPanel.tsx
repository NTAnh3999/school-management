import { useState } from "react";
import { Card, Table, Button, Space, Modal, Form, Input, Popconfirm, message, Empty, Typography, List } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { StatusTag } from "./StatusTag";
import { ContentStructureTree } from "./ContentStructureTree";
import { ContentReviewPanel } from "./ContentReviewPanel";
import { PermissionGate } from "./PermissionGate";
import {
  useListContentVersionsQuery,
  useCreateContentVersionMutation,
  usePublishContentVersionMutation,
  useArchiveContentVersionMutation,
  useSubmitContentVersionForReviewMutation,
  useLazyPreviewDraftQuery,
  useLazyValidateContentVersionQuery,
} from "@/store/api/courseContentApi";
import type { ContentVersion } from "@/types";
import { getErrorMessage } from "@/lib/error";

interface ContentVersionsPanelProps {
  courseId: number;
}

// ADM-14/15 — Content Approval Queue / Review Detail, implementing the FSD 6-state lifecycle:
// Draft -> InReview -> ChangesRequested (loops back to InReview) -> Approved -> Published, with
// Draft -> Published direct only when a tenant/course disables the approval workflow. Archive is
// only reachable from Published. See api/src/constants/content.js's CONTENT_VERSION_TRANSITIONS
// for the enforced source of truth this UI mirrors.
export function ContentVersionsPanel({ courseId }: ContentVersionsPanelProps) {
  const { data: versions, isLoading } = useListContentVersionsQuery(courseId);
  const [createVersion, { isLoading: creating }] = useCreateContentVersionMutation();
  const [submitForReview] = useSubmitContentVersionForReviewMutation();
  const [publish] = usePublishContentVersionMutation();
  const [archive] = useArchiveContentVersionMutation();
  const [triggerPreview, { data: preview, isFetching: previewLoading }] = useLazyPreviewDraftQuery();
  const [triggerValidate, { data: validation }] = useLazyValidateContentVersionQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm<{ versionLabel: string; changelog?: string }>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snapshotView, setSnapshotView] = useState<ContentVersion | null>(null);
  const [reviewVersionId, setReviewVersionId] = useState<number | null>(null);

  const handleCreate = async (values: { versionLabel: string; changelog?: string }) => {
    try {
      await createVersion({ courseId, ...values }).unwrap();
      message.success("Content version created" + (preview?.version_id ? "" : " from the published structure"));
      setCreateOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to create content version"));
    }
  };

  const handlePreviewDraft = () => {
    setSnapshotView(null);
    setPreviewOpen(true);
    triggerPreview(courseId);
  };

  const handleSubmitForReview = async (id: number) => {
    try {
      await submitForReview(id).unwrap();
      message.success("Submitted for review");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to submit for review — check publish readiness"));
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await publish(id).unwrap();
      message.success("Content version published");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to publish — check every module has at least one lesson"));
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await archive(id).unwrap();
      message.success("Content version archived");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to archive content version"));
    }
  };

  const handleValidate = (id: number) => {
    triggerValidate(id);
  };

  const columns: ColumnsType<ContentVersion> = [
    { title: "Version", dataIndex: "version_no", key: "version_no", width: 90, render: (v) => `v${v}` },
    { title: "Label", dataIndex: "version_label", key: "version_label" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: string) => <StatusTag status={v.toLowerCase()} />,
    },
    {
      title: "Published",
      dataIndex: "published_at",
      key: "published_at",
      render: (v: string | null) => (v ? new Date(v).toLocaleString() : "—"),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {
              setSnapshotView(record);
              setPreviewOpen(true);
            }}
          >
            View
          </Button>
          <PermissionGate permission="content.version.manage">
            <Space>
              {record.status === "DRAFT" && (
                <>
                  <Button size="small" onClick={() => handleValidate(record.id)}>
                    Check readiness
                  </Button>
                  <Popconfirm
                    title="Submit this draft for review?"
                    onConfirm={() => handleSubmitForReview(record.id)}
                  >
                    <Button size="small">Submit for review</Button>
                  </Popconfirm>
                </>
              )}
              {record.status === "CHANGES_REQUESTED" && (
                <Popconfirm title="Resubmit this version for review?" onConfirm={() => handleSubmitForReview(record.id)}>
                  <Button size="small">Resubmit</Button>
                </Popconfirm>
              )}
              {(record.status === "DRAFT" || record.status === "APPROVED") && (
                <Popconfirm
                  title="Publish this content version?"
                  description="This becomes the live structure for the course; any previously published version is archived."
                  onConfirm={() => handlePublish(record.id)}
                >
                  <Button type="primary" size="small">
                    Publish
                  </Button>
                </Popconfirm>
              )}
              {record.status === "PUBLISHED" && (
                <Popconfirm title="Archive this content version?" onConfirm={() => handleArchive(record.id)}>
                  <Button size="small">Archive</Button>
                </Popconfirm>
              )}
            </Space>
          </PermissionGate>
          {record.status === "IN_REVIEW" && (
            <PermissionGate permission="content.review.decide">
              <Button size="small" onClick={() => setReviewVersionId(record.id)}>
                Review
              </Button>
            </PermissionGate>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Content versions"
      extra={
        <Space>
          <Button icon={<EyeOutlined />} onClick={handlePreviewDraft}>
            Preview current draft
          </Button>
          <PermissionGate permission="content.version.manage">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Create version
            </Button>
          </PermissionGate>
        </Space>
      }
    >
      {validation && (
        <div style={{ marginBottom: 16 }}>
          {validation.ready ? (
            <Typography.Text type="success">Ready to publish.</Typography.Text>
          ) : (
            <List
              size="small"
              header={<Typography.Text type="warning">Not ready to publish:</Typography.Text>}
              dataSource={validation.issues}
              renderItem={(issue) => <List.Item>{issue}</List.Item>}
            />
          )}
        </div>
      )}

      <Table<ContentVersion>
        dataSource={versions}
        columns={columns}
        rowKey="id"
        size="small"
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: "No content versions yet — create one to snapshot the current draft." }}
      />

      <Modal
        title="Create content version"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.validateFields().then(handleCreate)}
        confirmLoading={creating}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
          Starts a new Draft, cloned from the course's currently published version (or empty if
          none exists yet). Editing this draft never affects what's live until you publish it.
        </Typography.Paragraph>
        <Form form={form} layout="vertical">
          <Form.Item
            name="versionLabel"
            label="Version label"
            rules={[{ required: true, message: "A version label is required." }]}
          >
            <Input placeholder="e.g. Spring 2026 refresh" />
          </Form.Item>
          <Form.Item name="changelog" label="Changelog (optional)">
            <Input.TextArea rows={3} placeholder="What changed in this version..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={snapshotView ? `v${snapshotView.version_no} — ${snapshotView.version_label}` : "Current draft"}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={640}
      >
        {snapshotView ? (
          <ContentStructureTree modules={snapshotView.snapshot_ref ?? []} />
        ) : previewLoading ? (
          <Empty description="Loading..." />
        ) : (
          <ContentStructureTree modules={preview?.structure ?? []} />
        )}
      </Modal>

      {reviewVersionId !== null && (
        <ContentReviewPanel
          versionId={reviewVersionId}
          open={reviewVersionId !== null}
          onClose={() => setReviewVersionId(null)}
        />
      )}
    </Card>
  );
}
