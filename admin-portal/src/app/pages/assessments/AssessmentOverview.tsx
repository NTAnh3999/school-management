import { useMemo, useState } from "react";
import { Table, Space, Select, Input, Tooltip, Button } from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { useListAssessmentsQuery } from "@/store/api/assessmentsApi";
import type { Assessment, AssessmentStatus } from "@/types";

// ADM-27 — Assessment Overview: monitoring across course/classroom. School Admin oversees
// assessments (publish/close/archive, review results) rather than authoring them — authoring
// stays with Teacher per the Portal Strategy doc.
export function AssessmentOverview() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AssessmentStatus | undefined>();
  const [search, setSearch] = useState("");
  const { data: assessments, isLoading } = useListAssessmentsQuery({ status });

  const filtered = useMemo(() => {
    if (!assessments) return [];
    const term = search.trim().toLowerCase();
    return term ? assessments.filter((a) => a.title.toLowerCase().includes(term)) : assessments;
  }, [assessments, search]);

  const columns: ColumnsType<Assessment> = [
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Type", dataIndex: "assessment_type", key: "assessment_type" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: AssessmentStatus) => <StatusTag status={v} />,
    },
    {
      title: "Grading",
      dataIndex: "grading_method",
      key: "grading_method",
    },
    {
      title: "Window",
      key: "window",
      render: (_, r) =>
        r.open_at || r.close_at
          ? `${r.open_at ? new Date(r.open_at).toLocaleDateString() : "—"} → ${
              r.close_at ? new Date(r.close_at).toLocaleDateString() : "—"
            }`
          : "—",
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Tooltip title="View">
          <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/assessments/${record.id}`)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Assessments"
        description="Monitor assessment status and grading progress across the tenant."
      />

      <Space wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
          allowClear
        />
        <Select
          placeholder="Status"
          allowClear
          value={status}
          onChange={setStatus}
          style={{ width: 160 }}
          options={["draft", "published", "closed", "archived"].map((s) => ({ label: s, value: s }))}
        />
      </Space>

      <Table<Assessment>
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        onRow={(record) => ({ onClick: () => navigate(`/assessments/${record.id}`), style: { cursor: "pointer" } })}
        pagination={{ pageSize: 10, showTotal: (total) => `${total} assessments` }}
        locale={{ emptyText: "No assessments require attention." }}
      />
    </Space>
  );
}
