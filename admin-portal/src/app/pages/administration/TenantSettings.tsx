import { useState } from "react";
import { Card, Tabs, Table, Button, Space, Select, Modal, Form, Input, InputNumber, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { PermissionGate } from "../../components/PermissionGate";
import {
  useListBranchesQuery,
  useCreateBranchMutation,
  useListCampusesQuery,
  useCreateCampusMutation,
  useListLocationsQuery,
  useCreateLocationMutation,
} from "@/store/api/orgApi";
import { useAppSelector } from "@/store/hooks";
import type { Branch, Campus, LocationType, OrgLocation } from "@/types";
import { getErrorMessage } from "@/lib/error";

// ADM-42 — Tenant Settings. The UI/UX spec describes this as "cấu hình vận hành... mà Platform
// Admin cho phép tenant tự cấu hình" — the tenant's Branch → Campus → Location org structure
// (api/src/routes/org-structure.routes.js) is exactly that kind of self-service configuration,
// so it lives here rather than as a separate nav item.
function BranchesTab({ tenantId }: { tenantId: number }) {
  const { data: branches, isLoading } = useListBranchesQuery({ tenantId });
  const [createBranch, { isLoading: creating }] = useCreateBranchMutation();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{ branchCode: string; branchName: string }>();

  const handleCreate = async (values: { branchCode: string; branchName: string }) => {
    try {
      await createBranch({ tenantId, ...values }).unwrap();
      message.success("Branch created");
      setOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to create branch"));
    }
  };

  const columns: ColumnsType<Branch> = [
    { title: "Code", dataIndex: "branch_code", key: "branch_code" },
    { title: "Name", dataIndex: "branch_name", key: "branch_name" },
    { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <PermissionGate permission="org.branch.manage">
        <Button icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Add branch
        </Button>
      </PermissionGate>
      <Table<Branch>
        dataSource={branches}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={false}
        locale={{ emptyText: "No branches configured yet." }}
      />
      <Modal
        title="Add branch"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then(handleCreate)}
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="branchCode" label="Branch code" rules={[{ required: true }]}>
            <Input placeholder="e.g. HN" />
          </Form.Item>
          <Form.Item name="branchName" label="Branch name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Hanoi Branch" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

function CampusesTab({ tenantId }: { tenantId: number }) {
  const { data: branches } = useListBranchesQuery({ tenantId });
  const [branchId, setBranchId] = useState<number | undefined>();
  const { data: campuses, isLoading } = useListCampusesQuery({ tenantId, branchId });
  const [createCampus, { isLoading: creating }] = useCreateCampusMutation();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{ branchId: number; campusCode: string; campusName: string }>();

  const handleCreate = async (values: { branchId: number; campusCode: string; campusName: string }) => {
    try {
      await createCampus(values).unwrap();
      message.success("Campus created");
      setOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to create campus"));
    }
  };

  const columns: ColumnsType<Campus> = [
    { title: "Code", dataIndex: "campus_code", key: "campus_code" },
    { title: "Name", dataIndex: "campus_name", key: "campus_name" },
    {
      title: "Branch",
      key: "branch",
      render: (_, record) => branches?.find((b) => b.id === record.branch_id)?.branch_name ?? `#${record.branch_id}`,
    },
    { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
        <Select
          placeholder="Filter by branch"
          allowClear
          value={branchId}
          onChange={setBranchId}
          style={{ width: 240 }}
          options={branches?.map((b) => ({ label: b.branch_name, value: b.id }))}
        />
        <PermissionGate permission="org.campus.manage">
          <Button icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Add campus
          </Button>
        </PermissionGate>
      </Space>
      <Table<Campus>
        dataSource={campuses}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={false}
        locale={{ emptyText: "No campuses configured yet." }}
      />
      <Modal
        title="Add campus"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then(handleCreate)}
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="branchId" label="Branch" rules={[{ required: true, message: "Select a branch." }]}>
            <Select options={branches?.map((b) => ({ label: b.branch_name, value: b.id }))} />
          </Form.Item>
          <Form.Item name="campusCode" label="Campus code" rules={[{ required: true }]}>
            <Input placeholder="e.g. HN-01" />
          </Form.Item>
          <Form.Item name="campusName" label="Campus name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Cau Giay Campus" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

function LocationsTab({ tenantId }: { tenantId: number }) {
  const { data: campuses } = useListCampusesQuery({ tenantId });
  const [campusId, setCampusId] = useState<number | undefined>();
  const { data: locations, isLoading } = useListLocationsQuery({ tenantId, campusId });
  const [createLocation, { isLoading: creating }] = useCreateLocationMutation();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{
    campusId: number;
    locationCode: string;
    locationName: string;
    locationType: LocationType;
    capacity?: number;
  }>();

  const handleCreate = async (values: {
    campusId: number;
    locationCode: string;
    locationName: string;
    locationType: LocationType;
    capacity?: number;
  }) => {
    try {
      await createLocation(values).unwrap();
      message.success("Location created");
      setOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to create location"));
    }
  };

  const columns: ColumnsType<OrgLocation> = [
    { title: "Code", dataIndex: "location_code", key: "location_code" },
    { title: "Name", dataIndex: "location_name", key: "location_name" },
    { title: "Type", dataIndex: "location_type", key: "location_type", render: (v) => <Tag>{v}</Tag> },
    { title: "Capacity", dataIndex: "capacity", key: "capacity", render: (v) => v ?? "—" },
    { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
        <Select
          placeholder="Filter by campus"
          allowClear
          value={campusId}
          onChange={setCampusId}
          style={{ width: 240 }}
          options={campuses?.map((c) => ({ label: c.campus_name, value: c.id }))}
        />
        <PermissionGate permission="org.location.manage">
          <Button icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Add location
          </Button>
        </PermissionGate>
      </Space>
      <Table<OrgLocation>
        dataSource={locations}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={false}
        locale={{ emptyText: "No locations configured yet." }}
      />
      <Modal
        title="Add location"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then(handleCreate)}
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ locationType: "room" }}>
          <Form.Item name="campusId" label="Campus" rules={[{ required: true, message: "Select a campus." }]}>
            <Select options={campuses?.map((c) => ({ label: c.campus_name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="locationCode" label="Location code" rules={[{ required: true }]}>
            <Input placeholder="e.g. R-301" />
          </Form.Item>
          <Form.Item name="locationName" label="Location name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Room 301" />
          </Form.Item>
          <Space size={16} style={{ display: "flex" }}>
            <Form.Item name="locationType" label="Type" style={{ flex: 1 }}>
              <Select options={["room", "building", "hall", "lab", "other"].map((t) => ({ label: t, value: t }))} />
            </Form.Item>
            <Form.Item name="capacity" label="Capacity" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Space>
  );
}

export function TenantSettings() {
  const tenantId = useAppSelector((s) => s.auth.activeTenant?.id);

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Tenant Settings"
        description="Organizational structure — branches, campuses, and locations — for your tenant."
      />

      {!tenantId ? (
        <Card>No active tenant.</Card>
      ) : (
        <Card>
          <Tabs
            items={[
              { key: "branches", label: "Branches", children: <BranchesTab tenantId={tenantId} /> },
              { key: "campuses", label: "Campuses", children: <CampusesTab tenantId={tenantId} /> },
              { key: "locations", label: "Locations", children: <LocationsTab tenantId={tenantId} /> },
            ]}
          />
        </Card>
      )}
    </Space>
  );
}
