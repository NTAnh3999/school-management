import { useState } from "react";
import { Modal, Form, Radio, Input, List, Space, Typography, Empty, message } from "antd";
import { useDecideContentReviewMutation, useListContentReviewsQuery } from "@/store/api/courseContentApi";
import type { ContentReviewDecision } from "@/types";
import { getErrorMessage } from "@/lib/error";

interface ContentReviewPanelProps {
  versionId: number;
  open: boolean;
  onClose: () => void;
}

interface ReviewFormValues {
  decision: ContentReviewDecision;
  comment?: string;
}

// CCA-13: Review/Approve/Request Changes. Comment is required when requesting changes (FSD 5.3
// CCA-13: "Decision phải có actor, timestamp và comment/reason khi RequestChanges").
export function ContentReviewPanel({ versionId, open, onClose }: ContentReviewPanelProps) {
  const { data: reviews } = useListContentReviewsQuery(versionId, { skip: !open });
  const [decideReview, { isLoading: deciding }] = useDecideContentReviewMutation();
  const [form] = Form.useForm<ReviewFormValues>();
  const [decision, setDecision] = useState<ContentReviewDecision>("APPROVED");

  const handleSubmit = async (values: ReviewFormValues) => {
    try {
      await decideReview({ id: versionId, decision: values.decision, comment: values.comment }).unwrap();
      message.success(
        values.decision === "APPROVED" ? "Content version approved" : "Changes requested",
      );
      form.resetFields();
      setDecision("APPROVED");
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to record review decision"));
    }
  };

  return (
    <Modal
      title="Review content version"
      open={open}
      onCancel={onClose}
      onOk={() => form.validateFields().then(handleSubmit)}
      confirmLoading={deciding}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ decision: "APPROVED" }}>
        <Form.Item name="decision" label="Decision" rules={[{ required: true }]}>
          <Radio.Group onChange={(e) => setDecision(e.target.value)}>
            <Radio.Button value="APPROVED">Approve</Radio.Button>
            <Radio.Button value="CHANGES_REQUESTED">Request changes</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="comment"
          label="Comment"
          rules={[
            {
              required: decision === "CHANGES_REQUESTED",
              message: "A comment is required when requesting changes.",
            },
          ]}
        >
          <Input.TextArea rows={3} placeholder="What needs to change..." />
        </Form.Item>
      </Form>

      {reviews && reviews.length > 0 && (
        <>
          <Typography.Title level={5} style={{ marginTop: 16 }}>
            Review history
          </Typography.Title>
          <List
            size="small"
            dataSource={reviews}
            renderItem={(review) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Typography.Text strong>{review.decision === "APPROVED" ? "Approved" : "Changes requested"}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(review.decided_at).toLocaleString()}
                      </Typography.Text>
                    </Space>
                  }
                  description={review.comment || undefined}
                />
              </List.Item>
            )}
          />
        </>
      )}
      {reviews && reviews.length === 0 && (
        <Empty description="No review decisions yet." style={{ marginTop: 16 }} />
      )}
    </Modal>
  );
}
