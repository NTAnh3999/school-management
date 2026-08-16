import { useState } from "react";
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Popconfirm, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { StatusTag } from "./StatusTag";
import { PermissionGate } from "./PermissionGate";
import {
  useListContentAssetsQuery,
  useCreateContentAssetMutation,
  useUpdateAssetProcessingStatusMutation,
} from "@/store/api/courseContentApi";
import type { ContentAsset } from "@/types";
import { getErrorMessage } from "@/lib/error";

interface AssetFormValues {
  filename: string;
  mediaType: string;
  mimeType: string;
  storageKey: string;
  sizeBytes?: number;
  durationSeconds?: number;
  thumbnailUrl?: string;
}

const MEDIA_TYPES = ["video", "image", "document", "audio"];

// CCA-06: Manage Content Asset metadata. This module registers metadata/storage references only
// — binary upload, transcoding, and CDN delivery are explicitly out of scope (FSD §2.2); the
// "Mark ready" action here is a manual stand-in for whatever external pipeline would otherwise
// PATCH /content-assets/:id/processing-status once real transcoding exists.
export function ContentAssetLibrary() {
  const { data: assets, isLoading } = useListContentAssetsQuery();
  const [createAsset, { isLoading: creating }] = useCreateContentAssetMutation();
  const [updateProcessingStatus] = useUpdateAssetProcessingStatusMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm<AssetFormValues>();

  const handleCreate = async (values: AssetFormValues) => {
    try {
      await createAsset(values).unwrap();
      message.success("Content asset registered");
      setCreateOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to register content asset"));
    }
  };

  const markReady = async (id: number) => {
    try {
      await updateProcessingStatus({ id, processingStatus: "ready" }).unwrap();
      message.success("Asset marked ready");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to update processing status"));
    }
  };

  const columns: ColumnsType<ContentAsset> = [
    { title: "Filename", dataIndex: "filename", key: "filename" },
    { title: "Media type", dataIndex: "media_type", key: "media_type" },
    { title: "MIME type", dataIndex: "mime_type", key: "mime_type" },
    {
      title: "Processing",
      dataIndex: "processing_status",
      key: "processing_status",
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, record) =>
        record.processing_status !== "ready" ? (
          <PermissionGate permission="content.asset.manage">
            <Popconfirm title="Mark this asset as ready?" onConfirm={() => markReady(record.id)}>
              <Button size="small" icon={<CheckCircleOutlined />}>
                Mark ready
              </Button>
            </Popconfirm>
          </PermissionGate>
        ) : null,
    },
  ];

  return (
    <Card
      title="Content assets"
      extra={
        <PermissionGate permission="content.asset.manage">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Register asset
          </Button>
        </PermissionGate>
      }
    >
      <Table<ContentAsset>
        dataSource={assets}
        columns={columns}
        rowKey="id"
        size="small"
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: "No content assets registered yet." }}
      />

      <Modal
        title="Register content asset"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.validateFields().then(handleCreate)}
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="filename" label="Filename" rules={[{ required: true, message: "Filename is required." }]}>
            <Input placeholder="e.g. intro-video.mp4" />
          </Form.Item>
          <Space size={16} style={{ display: "flex" }}>
            <Form.Item
              name="mediaType"
              label="Media type"
              style={{ flex: 1 }}
              rules={[{ required: true, message: "Media type is required." }]}
            >
              <Input placeholder="video / image / document / audio" list="media-types" />
            </Form.Item>
            <Form.Item
              name="mimeType"
              label="MIME type"
              style={{ flex: 1 }}
              rules={[{ required: true, message: "MIME type is required." }]}
            >
              <Input placeholder="video/mp4" />
            </Form.Item>
          </Space>
          <datalist id="media-types">
            {MEDIA_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <Form.Item
            name="storageKey"
            label="Storage key"
            rules={[{ required: true, message: "Storage key is required." }]}
            tooltip="Opaque reference to wherever the binary actually lives — this module never uploads or stores files itself."
          >
            <Input placeholder="e.g. s3://bucket/path/to/file" />
          </Form.Item>
          <Space size={16} style={{ display: "flex" }}>
            <Form.Item name="sizeBytes" label="Size (bytes)" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
            <Form.Item name="durationSeconds" label="Duration (sec)" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="thumbnailUrl" label="Thumbnail URL (optional)">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
