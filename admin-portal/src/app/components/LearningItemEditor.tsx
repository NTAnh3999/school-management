import { useState } from "react";
import { Modal, List, Button, Space, Tag, Popconfirm, Form, Input, InputNumber, Select, Checkbox, Radio, message, Typography, Empty } from "antd";
import { PlusOutlined, EditOutlined, InboxOutlined } from "@ant-design/icons";
import { PermissionGate } from "./PermissionGate";
import {
  useListLearningItemsQuery,
  useCreateLearningItemMutation,
  useUpdateLearningItemMutation,
  useArchiveLearningItemMutation,
  useListContentAssetsQuery,
} from "@/store/api/courseContentApi";
import type { LearningItem, LearningItemType, LearningItemCompletionRule, LearningItemVideoSource } from "@/types";
import { getErrorMessage } from "@/lib/error";

const ITEM_TYPES: LearningItemType[] = [
  "Text",
  "Video",
  "Document",
  "Infographic",
  "ExternalLink",
  "KnowledgeCheck",
  "AssessmentReference",
  "Model3D",
  "InteractivePackage",
];

// FSD 5.4's fixed item_type -> completion_rule mapping, mirrored from the backend's
// COMPLETION_RULE_BY_ITEM_TYPE — shown read-only next to the type selector so authors see how
// the item will be marked complete without needing to pick it themselves.
const COMPLETION_RULE_BY_TYPE: Record<LearningItemType, LearningItemCompletionRule> = {
  Text: "dwell_time",
  Video: "watch_percentage",
  Document: "opened",
  Infographic: "opened",
  ExternalLink: "clicked",
  KnowledgeCheck: "submitted",
  AssessmentReference: "delegated",
  Model3D: "interacted",
  InteractivePackage: "xapi_statement",
};

// Item types whose reference_id must point at a registered ContentAsset (FSD 7.2/8.4 — subject
// to processing_status readiness gating at publish time).
const ASSET_REFERENCED_TYPES: LearningItemType[] = ["Document", "Infographic", "Model3D", "InteractivePackage"];

const ASSET_HELP: Partial<Record<LearningItemType, string>> = {
  Document: "Suggested formats: pdf, docx, pptx (≤ 50MB, pending Product/Infra confirmation).",
  Infographic: "Suggested formats: jpg, png, svg, webp (≤ 10MB, pending Product/Infra confirmation).",
  Model3D: "A .glb/.gltf asset, rendered with an embeddable 3D viewer.",
  InteractivePackage: "An H5P .h5p package, authored at h5p.org and uploaded here as a ContentAsset; played back via h5p-standalone.",
};

interface ItemFormValues {
  itemType: LearningItemType;
  title: string;
  isRequired?: boolean;
  estimatedDuration?: number;
  assetId?: number;
  source?: LearningItemVideoSource;
  url?: string;
  provider?: string;
  openInNewTab?: boolean;
  assessmentId?: number;
  body?: string;
}

interface LearningItemManagerProps {
  lessonId: number;
  /** Skip the list query until the host surface (e.g. a lesson edit modal) is actually open. */
  active: boolean;
}

// CCA-05: Manage Learning Item, per FSD 5.4's per-item_type payload/reference/completion_rule
// table — Text/Video/Document/Infographic/ExternalLink/KnowledgeCheck/AssessmentReference/
// Model3D/InteractivePackage. AssessmentReference only ever stores { assessment_id } per the
// FSD's Assessment boundary rule — no lookup against the Assessment module happens here.
// InteractivePackage/Model3D register asset metadata only; this module doesn't host an H5P
// runtime or 3D viewer itself (out of scope, same as every other ContentAsset-backed type).
//
// Bare content (no Modal wrapper) so it can be embedded directly inside the lesson edit modal,
// per the FSD-aligned "Edit lesson" layout — a lesson must already have an id for items to
// attach to, so this only renders once a lesson exists (see ModuleLessonEditor).
export function LearningItemManager({ lessonId, active }: LearningItemManagerProps) {
  const { data: items, isLoading } = useListLearningItemsQuery(lessonId, { skip: !active });
  const { data: assets } = useListContentAssetsQuery(undefined, { skip: !active });
  const [createItem, { isLoading: creating }] = useCreateLearningItemMutation();
  const [updateItem] = useUpdateLearningItemMutation();
  const [archiveItem] = useArchiveLearningItemMutation();

  const [itemModal, setItemModal] = useState<{ mode: "create" | "edit"; item?: LearningItem } | null>(null);
  const [form] = Form.useForm<ItemFormValues>();
  const itemType = Form.useWatch("itemType", form);
  const videoSource = Form.useWatch("source", form);

  const openCreate = () => {
    form.resetFields();
    setItemModal({ mode: "create" });
  };

  const openEdit = (item: LearningItem) => {
    form.setFieldsValue({
      itemType: item.item_type,
      title: item.title,
      isRequired: item.is_required,
      estimatedDuration: item.estimated_duration ?? undefined,
      assetId: item.asset_id ?? undefined,
      source: item.source ?? undefined,
      url:
        item.item_type === "ExternalLink" || (item.item_type === "Video" && item.source === "external")
          ? (item.content_payload?.url as string | undefined)
          : undefined,
      provider: item.item_type === "Video" ? (item.content_payload?.provider as string | undefined) : undefined,
      openInNewTab:
        item.item_type === "ExternalLink" ? (item.content_payload?.open_in_new_tab as boolean | undefined) : undefined,
      assessmentId:
        item.item_type === "AssessmentReference"
          ? (item.content_payload?.assessment_id as number | undefined)
          : undefined,
      body: item.item_type === "Text" ? (item.content_payload?.body as string | undefined) : undefined,
    });
    setItemModal({ mode: "edit", item });
  };

  const submit = async (values: ItemFormValues) => {
    let contentPayload: Record<string, unknown> | undefined;
    if (values.itemType === "Text") {
      contentPayload = { format: "richtext", body: values.body };
    } else if (values.itemType === "ExternalLink") {
      contentPayload = { url: values.url, open_in_new_tab: values.openInNewTab ?? false };
    } else if (values.itemType === "Video" && values.source === "external") {
      contentPayload = { url: values.url, provider: values.provider || undefined };
    } else if (values.itemType === "AssessmentReference") {
      contentPayload = { assessment_id: values.assessmentId };
    }

    const isAssetReferenced = ASSET_REFERENCED_TYPES.includes(values.itemType);
    const assetId = isAssetReferenced || (values.itemType === "Video" && values.source === "uploaded")
      ? values.assetId
      : undefined;

    try {
      if (itemModal?.mode === "edit" && itemModal.item) {
        await updateItem({
          id: itemModal.item.id,
          revision: itemModal.item.revision,
          title: values.title,
          contentPayload,
          assetId,
          source: values.itemType === "Video" ? values.source : undefined,
          estimatedDuration: values.estimatedDuration,
          isRequired: values.isRequired,
        }).unwrap();
        message.success("Learning item updated");
      } else {
        await createItem({
          lessonId,
          itemType: values.itemType,
          title: values.title,
          contentPayload,
          assetId,
          source: values.itemType === "Video" ? values.source : undefined,
          estimatedDuration: values.estimatedDuration,
          isRequired: values.isRequired,
        }).unwrap();
        message.success("Learning item created");
      }
      setItemModal(null);
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to save learning item"));
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={12}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Typography.Text strong>Learning items {items ? `(${items.length})` : ""}</Typography.Text>
        <PermissionGate permission="content.version.manage">
          <Button size="small" icon={<PlusOutlined />} onClick={openCreate}>
            Add content
          </Button>
        </PermissionGate>
      </Space>

      {!isLoading && (!items || items.length === 0) ? (
        <Empty description="No learning items in this lesson yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          loading={isLoading}
          size="small"
          bordered
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              actions={[
                <PermissionGate key="actions" permission="content.version.manage">
                  <Space>
                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(item)} />
                    <Popconfirm title="Archive this item?" onConfirm={() => archiveItem(item.id)}>
                      <Button size="small" type="text" icon={<InboxOutlined />} disabled={item.status === "archived"} />
                    </Popconfirm>
                  </Space>
                </PermissionGate>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {item.title}
                    <Tag>{item.item_type}</Tag>
                    {item.source && <Tag color="purple">{item.source}</Tag>}
                    {item.is_required && <Tag color="blue">required</Tag>}
                    {item.status === "archived" && <Tag>archived</Tag>}
                  </Space>
                }
                description={[
                  item.completion_rule,
                  item.estimated_duration ? `${item.estimated_duration} min` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        title={itemModal?.mode === "edit" ? "Edit learning item" : "Add learning item"}
        open={!!itemModal}
        onCancel={() => setItemModal(null)}
        onOk={() => form.validateFields().then(submit)}
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="itemType" label="Type" rules={[{ required: true }]}>
            <Select
              disabled={itemModal?.mode === "edit"}
              options={ITEM_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
          {itemType && (
            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: -12, marginBottom: 16 }}>
              Completion rule: <Typography.Text code>{COMPLETION_RULE_BY_TYPE[itemType]}</Typography.Text>
            </Typography.Text>
          )}
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required." }]}>
            <Input placeholder="e.g. Introduction video" />
          </Form.Item>

          {itemType === "Text" && (
            <Form.Item name="body" label="Body" rules={[{ required: true, message: "Body text is required." }]}>
              <Input.TextArea rows={4} placeholder="Rich text content..." />
            </Form.Item>
          )}

          {itemType === "Video" && (
            <>
              <Form.Item name="source" label="Source" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio.Button value="uploaded">Uploaded asset</Radio.Button>
                  <Radio.Button value="external">External link</Radio.Button>
                </Radio.Group>
              </Form.Item>
              {videoSource === "uploaded" && (
                <Form.Item name="assetId" label="Video asset" rules={[{ required: true, message: "An uploaded video asset is required." }]}>
                  <Select
                    placeholder="Select a registered video asset"
                    options={assets?.filter((a) => a.media_type === "video").map((a) => ({ label: a.filename, value: a.id }))}
                  />
                </Form.Item>
              )}
              {videoSource === "external" && (
                <>
                  <Form.Item name="url" label="URL" rules={[{ required: true, type: "url" }]}>
                    <Input placeholder="https://youtube.com/watch?v=..." />
                  </Form.Item>
                  <Form.Item name="provider" label="Provider (optional)">
                    <Input placeholder="youtube / vimeo" />
                  </Form.Item>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Watch-percentage tracking only works if the provider supports embed tracking (e.g.
                    YouTube, Vimeo). See OQ-CCA-11 for the fallback policy on unsupported providers.
                  </Typography.Text>
                </>
              )}
            </>
          )}

          {itemType === "ExternalLink" && (
            <>
              <Form.Item name="url" label="URL" rules={[{ required: true, type: "url" }]}>
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item name="openInNewTab" valuePropName="checked">
                <Checkbox>Open in new tab</Checkbox>
              </Form.Item>
            </>
          )}

          {itemType === "AssessmentReference" && (
            <Form.Item
              name="assessmentId"
              label="Assessment ID"
              rules={[{ required: true, message: "An assessment_id is required." }]}
              tooltip="References an existing Assessment by id — grading/questions stay owned by the Assessment module."
            >
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
          )}

          {itemType === "KnowledgeCheck" && (
            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
              Lightweight quiz — % correct is tracked internally for statistics only and never pushed
              as a formal grade/transcript entry (FSD 5.4).
            </Typography.Text>
          )}

          {ASSET_REFERENCED_TYPES.includes(itemType) && (
            <Form.Item
              name="assetId"
              label="Content asset"
              rules={[{ required: true, message: "A content asset is required." }]}
              tooltip={ASSET_HELP[itemType]}
            >
              <Select
                placeholder="Select a registered asset"
                options={assets?.map((a) => ({ label: a.filename, value: a.id }))}
              />
            </Form.Item>
          )}

          <Space size={16} style={{ display: "flex" }}>
            <Form.Item name="estimatedDuration" label="Estimated duration (min)" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
            <Form.Item name="isRequired" valuePropName="checked" label=" " style={{ flex: 1 }}>
              <Checkbox>Required to complete the lesson</Checkbox>
            </Form.Item>
          </Space>
          {itemModal?.mode === "edit" && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Item type cannot be changed after creation — archive and re-create instead.
            </Typography.Text>
          )}
        </Form>
      </Modal>
    </Space>
  );
}
