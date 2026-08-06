import { useMemo, useState } from "react";
import { Table, Space, Select, Drawer, Descriptions, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageHeader } from "../../components/PageHeader";
import { useListAuditLogsQuery } from "@/store/api/iamApi";
import { useListUsersQuery } from "@/store/api/iamApi";
import type { IamAuditLog } from "@/types";

// ADM-40 — Tenant Audit Log, with ADM-41 (Audit Log Detail) as a side drawer.
export function AuditLog() {
  const [actorUserId, setActorUserId] = useState<number | undefined>();
  const { data: logs, isLoading } = useListAuditLogsQuery(
    actorUserId ? { actorUserId } : undefined,
  );
  const { data: users } = useListUsersQuery();
  const [selected, setSelected] = useState<IamAuditLog | null>(null);

  const actorOptions = useMemo(
    () => users?.map((u) => ({ label: u.full_name, value: u.id })),
    [users],
  );

  const columns: ColumnsType<IamAuditLog> = [
    { title: "Action", dataIndex: "action", key: "action" },
    { title: "Entity", key: "entity", render: (_, r) => `${r.entity_type}${r.entity_id ? ` #${r.entity_id}` : ""}` },
    { title: "Actor", key: "actor", render: (_, r) => r.actor?.full_name ?? "System" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: string) => <Tag color={v === "success" ? "success" : "error"}>{v}</Tag>,
    },
    {
      title: "When",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => new Date(v).toLocaleString(),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: "descend",
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Tenant Audit Log"
        description="Sensitive administrative actions recorded within your tenant scope."
      />

      <Select
        placeholder="Filter by actor"
        allowClear
        showSearch
        optionFilterProp="label"
        value={actorUserId}
        onChange={setActorUserId}
        style={{ width: 280 }}
        options={actorOptions}
      />

      <Table<IamAuditLog>
        dataSource={logs}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        onRow={(record) => ({ onClick: () => setSelected(record), style: { cursor: "pointer" } })}
        pagination={{ pageSize: 15, showTotal: (total) => `${total} records` }}
        locale={{ emptyText: "No audit records found." }}
      />

      <Drawer title="Audit log detail" open={!!selected} onClose={() => setSelected(null)} width={420}>
        {selected && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Action">{selected.action}</Descriptions.Item>
            <Descriptions.Item label="Entity">
              {selected.entity_type} {selected.entity_id ? `#${selected.entity_id}` : ""}
            </Descriptions.Item>
            <Descriptions.Item label="Actor">{selected.actor?.full_name ?? "System"}</Descriptions.Item>
            <Descriptions.Item label="Actor email">{selected.actor?.email ?? "—"}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selected.status === "success" ? "success" : "error"}>{selected.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Timestamp">
              {new Date(selected.created_at).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Details">
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#fafafa", padding: 8, borderRadius: 6 }}>
                {selected.details ? JSON.stringify(selected.details, null, 2) : "—"}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Space>
  );
}
