import { useState } from "react";
import { Table, Button, Space, Input, Select, Tooltip, Progress, Upload, message, Modal, List, Typography } from "antd";
import type { UploadProps } from "antd";
import { PlusOutlined, SearchOutlined, EyeOutlined, UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { PermissionGate } from "../../components/PermissionGate";
import {
  useListClassroomsQuery,
  useImportClassroomsMutation,
  useLazyExportClassroomsQuery,
} from "@/store/api/classroomsApi";
import { getErrorMessage } from "@/lib/error";
import type { Classroom, ClassroomStatus, DeliveryMethod } from "@/types";

// ADM-16 — Classroom List.
export function ClassroomList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<ClassroomStatus | undefined>();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | undefined>();

  const { data, isLoading } = useListClassroomsQuery({
    page,
    page_size: 10,
    keyword: keyword || undefined,
    status,
    delivery_method: deliveryMethod,
  });

  const [importClassrooms, { isLoading: importing }] = useImportClassroomsMutation();
  const [triggerExport, { isFetching: exporting }] = useLazyExportClassroomsQuery();
  const [importResult, setImportResult] = useState<{
    created: number;
    skipped: number;
    errors: { row: number; error: string }[];
  } | null>(null);

  const uploadProps: UploadProps = {
    accept: ".xlsx,.xls",
    showUploadList: false,
    disabled: importing,
    customRequest: async (options) => {
      const file = options.file as File;
      try {
        const result = await importClassrooms(file).unwrap();
        setImportResult(result);
        options.onSuccess?.(result);
      } catch (err) {
        message.error(getErrorMessage(err, "Import failed"));
        options.onError?.(err as Error);
      }
    },
  };

  const handleExport = async () => {
    try {
      const blob = await triggerExport({
        keyword: keyword || undefined,
        status,
        delivery_method: deliveryMethod,
      }).unwrap();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `classrooms_${Date.now()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      message.error(getErrorMessage(err, "Export failed"));
    }
  };

  const columns: ColumnsType<Classroom> = [
    { title: "Code", dataIndex: "classroom_code", key: "classroom_code", width: 130 },
    {
      title: "Classroom",
      key: "name",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.classroom_name}</div>
          <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
            {record.course?.course_name ?? `Course #${record.course_id}`}
          </div>
        </div>
      ),
    },
    {
      title: "Teacher",
      key: "teacher",
      render: (_, record) => {
        const main = record.teachers?.find((t) => t.role_in_classroom === "main_teacher");
        return main?.user?.full_name ?? <span style={{ color: "rgba(0,0,0,0.35)" }}>Unassigned</span>;
      },
    },
    { title: "Delivery", dataIndex: "delivery_method", key: "delivery_method", render: (v) => <span>{v}</span> },
    {
      title: "Capacity",
      key: "capacity",
      width: 160,
      render: (_, record) => (
        <Progress
          percent={Math.round((record.enrolled_count / (record.max_capacity || 1)) * 100)}
          size="small"
          format={() => `${record.enrolled_count}/${record.max_capacity}`}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: ClassroomStatus) => <StatusTag status={v} />,
      filters: ["draft", "open", "full", "in_progress", "completed", "cancelled", "archived"].map((s) => ({
        text: s,
        value: s,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Tooltip title="View">
          <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/classrooms/${record.id}`)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Classrooms"
        description="Classrooms and cohorts running in your tenant."
        actions={
          <PermissionGate permission="iam.user.manage">
            <Space>
              <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
                Export
              </Button>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} loading={importing}>
                  Import
                </Button>
              </Upload>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/classrooms/new")}>
                Create Classroom
              </Button>
            </Space>
          </PermissionGate>
        }
      />

      <Modal
        title="Import result"
        open={!!importResult}
        onCancel={() => setImportResult(null)}
        onOk={() => setImportResult(null)}
        okText="Close"
        cancelButtonProps={{ style: { display: "none" } }}
      >
        {importResult && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Typography.Text>
              {importResult.created} created, {importResult.skipped} skipped,{" "}
              {importResult.errors.length} failed.
            </Typography.Text>
            {importResult.errors.length > 0 && (
              <List
                size="small"
                bordered
                dataSource={importResult.errors}
                style={{ maxHeight: 240, overflowY: "auto" }}
                renderItem={(item) => (
                  <List.Item>
                    Row {item.row}: {item.error}
                  </List.Item>
                )}
              />
            )}
          </Space>
        )}
      </Modal>

      <Space wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name or code..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          style={{ width: 260 }}
          allowClear
        />
        <Select
          placeholder="Status"
          allowClear
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          style={{ width: 160 }}
          options={["draft", "open", "full", "in_progress", "completed", "cancelled", "archived"].map((s) => ({
            label: s,
            value: s,
          }))}
        />
        <Select
          placeholder="Delivery"
          allowClear
          value={deliveryMethod}
          onChange={(v) => {
            setDeliveryMethod(v);
            setPage(1);
          }}
          style={{ width: 140 }}
          options={["online", "offline", "hybrid"].map((s) => ({ label: s, value: s }))}
        />
      </Space>

      <Table<Classroom>
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        onRow={(record) => ({ onClick: () => navigate(`/classrooms/${record.id}`), style: { cursor: "pointer" } })}
        pagination={{
          current: page,
          total: data?.total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (total) => `${total} classrooms`,
        }}
        locale={{ emptyText: "No classrooms available." }}
      />
    </Space>
  );
}
