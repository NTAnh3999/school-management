import { useState } from "react";
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Upload, Popconfirm, message, Image, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadProps } from "antd";
import { PlusOutlined, CheckCircleOutlined, UploadOutlined, FileOutlined, PlayCircleOutlined, SoundOutlined } from "@ant-design/icons";
import { StatusTag } from "./StatusTag";
import { PermissionGate } from "./PermissionGate";
import {
  useListContentAssetsQuery,
  useCreateContentAssetMutation,
  useUploadContentAssetMutation,
  useUpdateAssetProcessingStatusMutation,
} from "@/store/api/courseContentApi";
import type { ContentAsset } from "@/types";
import { getErrorMessage } from "@/lib/error";
import { resolveAssetPreviewUrl } from "@/lib/content-asset";

interface AssetFormValues {
  filename: string;
  mediaType: string;
  mimeType: string;
  storageKey: string;
  sizeBytes?: number;
  durationSeconds?: number;
  thumbnailUrl?: string;
}

const MEDIA_TYPES = ["video", "image", "document", "audio", "model3d", "h5p"];

// CCA-06: Manage Content Asset metadata. "Upload file" saves directly to local disk as a
// dev-environment stand-in for real object storage/CDN (see content-asset.service.js's
// UPLOAD_DIR note — FSD §2.2 keeps binary storage/transcoding/CDN out of this module's long-term
// scope). "Register asset" stays for metadata-only registration against a file that already
// lives somewhere else (e.g. an existing CDN URL). "Mark ready" is a manual stand-in for
// whatever external pipeline would otherwise PATCH /content-assets/:id/processing-status once
// real transcoding exists.
export function ContentAssetLibrary() {
  const { data: assets, isLoading } = useListContentAssetsQuery();
  const [createAsset, { isLoading: creating }] = useCreateContentAssetMutation();
  const [uploadAsset, { isLoading: uploading }] = useUploadContentAssetMutation();
  const [updateProcessingStatus] = useUpdateAssetProcessingStatusMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<ContentAsset | null>(null);
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

  const uploadProps: UploadProps = {
    showUploadList: false,
    disabled: uploading,
    customRequest: async (options) => {
      const file = options.file as File;
      try {
        await uploadAsset({ file }).unwrap();
        message.success(`${file.name} uploaded`);
        options.onSuccess?.(file);
        setUploadOpen(false);
      } catch (err) {
        message.error(getErrorMessage(err, "Upload failed"));
        options.onError?.(err as Error);
      }
    },
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
    {
      title: "",
      key: "preview",
      width: 56,
      render: (_, record) => {
        const url = resolveAssetPreviewUrl(record);
        if (record.media_type === "image" && url) {
          return (
            <Image
              src={url}
              alt={record.filename}
              width={40}
              height={40}
              style={{ objectFit: "cover", borderRadius: 4 }}
              placeholder
            />
          );
        }
        if (record.media_type === "video" && url) {
          return (
            <Button
              type="text"
              icon={<PlayCircleOutlined style={{ fontSize: 20 }} />}
              onClick={() => setPreviewAsset(record)}
            />
          );
        }
        if (record.media_type === "audio" && url) {
          return (
            <Button
              type="text"
              icon={<SoundOutlined style={{ fontSize: 20 }} />}
              onClick={() => setPreviewAsset(record)}
            />
          );
        }
        return <FileOutlined style={{ fontSize: 20, color: "#bbb" }} />;
      },
    },
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
          <Space>
            <Button icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>
              Upload file
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Register asset
            </Button>
          </Space>
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

      <Modal title="Upload content asset" open={uploadOpen} onCancel={() => setUploadOpen(false)} footer={null}>
        <Upload.Dragger {...uploadProps} style={{ padding: 16 }}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag a file to upload</p>
          <p className="ant-upload-hint">
            Registers a ContentAsset automatically — filename, media type, and size are read from
            the file itself.
          </p>
        </Upload.Dragger>
      </Modal>

      <Modal
        title={previewAsset?.filename}
        open={!!previewAsset}
        onCancel={() => setPreviewAsset(null)}
        footer={null}
        destroyOnClose
      >
        {previewAsset && previewAsset.media_type === "video" && (
          <video
            src={resolveAssetPreviewUrl(previewAsset) ?? undefined}
            controls
            style={{ width: "100%", maxHeight: 480 }}
          />
        )}
        {previewAsset && previewAsset.media_type === "audio" && (
          <audio src={resolveAssetPreviewUrl(previewAsset) ?? undefined} controls style={{ width: "100%" }} />
        )}
        {previewAsset && !resolveAssetPreviewUrl(previewAsset) && (
          <Typography.Text type="secondary">
            This asset's storage key doesn't point to a browser-resolvable location.
          </Typography.Text>
        )}
      </Modal>
    </Card>
  );
}
