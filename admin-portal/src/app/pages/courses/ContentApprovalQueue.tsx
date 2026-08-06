import { useState } from "react";
import { Space, Select, Empty } from "antd";
import { PageHeader } from "../../components/PageHeader";
import { ContentVersionsPanel } from "../../components/ContentVersionsPanel";
import { useListCoursesQuery } from "@/store/api/coursesApi";

// ADM-14 — Content Approval Queue. The backend has no single cross-course endpoint for
// pending content versions (GET /content/courses/:courseId/versions is per-course), so this
// is a course picker in front of that course's ContentVersionsPanel rather than a flat global
// queue — see ContentVersionsPanel for what "approval" maps to on this backend.
export function ContentApprovalQueue() {
  const { data: courses } = useListCoursesQuery({ page_size: 100 });
  const [courseId, setCourseId] = useState<number | undefined>();

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Content Approval"
        description="Review a course's draft content and publish or archive its versions."
      />

      <Select
        placeholder="Select a course"
        showSearch
        optionFilterProp="label"
        value={courseId}
        onChange={setCourseId}
        style={{ width: 420 }}
        options={courses?.courses.map((c) => ({ label: `${c.course_code} — ${c.course_name}`, value: c.id }))}
      />

      {!courseId ? (
        <Empty description="Select a course to review its content versions." />
      ) : (
        <ContentVersionsPanel courseId={courseId} />
      )}
    </Space>
  );
}
