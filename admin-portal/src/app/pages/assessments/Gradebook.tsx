import { useEffect, useState } from "react";
import { Card, Space, Select, Table, Empty, Statistic, Row, Col } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useSearchParams } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { useListAssessmentsQuery, useGetAssessmentResultsQuery } from "@/store/api/assessmentsApi";
import type { AssessmentResult } from "@/types";

// ADM-29 — Gradebook / Result Review: aggregate grading status per assessment, for the
// oversight cases School Admin needs (exceptions, ungraded backlog) rather than per-question
// grading detail, which stays with Teacher.
export function Gradebook() {
  const [searchParams] = useSearchParams();
  const { data: assessments } = useListAssessmentsQuery();
  const [assessmentId, setAssessmentId] = useState<number | undefined>(
    searchParams.get("assessmentId") ? Number(searchParams.get("assessmentId")) : undefined,
  );

  useEffect(() => {
    const fromQuery = searchParams.get("assessmentId");
    if (fromQuery) setAssessmentId(Number(fromQuery));
  }, [searchParams]);

  const { data: results, isLoading } = useGetAssessmentResultsQuery(
    { id: assessmentId! },
    { skip: !assessmentId },
  );

  const graded = results?.filter((r) => r.grading_status === "graded").length ?? 0;
  const pending = (results?.length ?? 0) - graded;
  const avgScore =
    results && results.length > 0
      ? (
          results.reduce((sum, r) => sum + (r.score ?? 0), 0) / results.filter((r) => r.score != null).length
        ).toFixed(1)
      : "—";

  const columns: ColumnsType<AssessmentResult> = [
    { title: "Attempt", dataIndex: "attempt_id", key: "attempt_id" },
    { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
    {
      title: "Grading",
      dataIndex: "grading_status",
      key: "grading_status",
      render: (v) => <StatusTag status={v} />,
    },
    {
      title: "Score",
      key: "score",
      render: (_, r) => (r.score != null ? `${r.score} / ${r.max_score ?? "—"}` : "—"),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader title="Gradebook" description="Grading status and results by assessment." />

      <Select
        placeholder="Select an assessment"
        showSearch
        optionFilterProp="label"
        value={assessmentId}
        onChange={setAssessmentId}
        style={{ width: 420 }}
        options={assessments?.map((a) => ({ label: `${a.title} (${a.status})`, value: a.id }))}
      />

      {!assessmentId ? (
        <Empty description="Select an assessment to review its results." />
      ) : (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic title="Graded" value={graded} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="Pending grading" value={pending} valueStyle={pending > 0 ? { color: "#faad14" } : undefined} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="Average score" value={avgScore} />
              </Card>
            </Col>
          </Row>

          <Card title="Results">
            <Table<AssessmentResult>
              dataSource={results}
              columns={columns}
              rowKey="attempt_id"
              loading={isLoading}
              size="small"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: "No results yet." }}
            />
          </Card>
        </>
      )}
    </Space>
  );
}
