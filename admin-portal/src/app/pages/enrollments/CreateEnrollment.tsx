import { useState } from "react";
import { Card, Form, Select, Button, Space, message, Alert } from "antd";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { useCreateEnrollmentMutation, useLazyCheckEligibilityQuery } from "@/store/api/enrollmentsApi";
import { useListCoursesQuery } from "@/store/api/coursesApi";
import { useListProfilesQuery } from "@/store/api/profilesApi";
import { getErrorMessage } from "@/lib/error";

interface FormValues {
  learner_id: number;
  course_id: number;
}

// ADM-24 — Create Enrollment. Runs an eligibility check (ENR-02) before submitting so the
// admin sees why a request would be rejected instead of a raw error.
export function CreateEnrollment() {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [studentSearch, setStudentSearch] = useState("");
  const { data: students } = useListProfilesQuery({
    profileType: "student",
    search: studentSearch || undefined,
    limit: 20,
  });
  const { data: courses } = useListCoursesQuery({ status: "active", page_size: 100 });
  const [checkEligibility, { data: eligibility, isFetching: checking }] = useLazyCheckEligibilityQuery();
  const [createEnrollment, { isLoading: creating }] = useCreateEnrollmentMutation();
  const [checkedFor, setCheckedFor] = useState<string | null>(null);

  const handleCheck = async () => {
    const values = await form.validateFields(["learner_id", "course_id"]);
    setCheckedFor(`${values.learner_id}-${values.course_id}`);
    await checkEligibility({ learner_id: values.learner_id, course_id: values.course_id });
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      const enrollment = await createEnrollment(values).unwrap();
      message.success("Enrollment request created");
      navigate(`/enrollments/${enrollment.id}`);
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to create enrollment"));
    }
  };

  const currentKey = (v: Partial<FormValues>) =>
    v.learner_id && v.course_id ? `${v.learner_id}-${v.course_id}` : null;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%", maxWidth: 560 }}>
      <PageHeader
        title="Create Enrollment"
        description="Enroll a learner into an active course."
        breadcrumb={[{ label: "Enrollments", to: "/enrollments" }, { label: "Create" }]}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(_, all) => {
            if (currentKey(all) !== checkedFor) setCheckedFor(null);
          }}
        >
          <Form.Item
            name="learner_id"
            label="Learner"
            extra="Enrolls the student's linked user account."
            rules={[{ required: true, message: "Select a learner." }]}
          >
            <Select
              showSearch
              placeholder="Search students by name..."
              filterOption={false}
              onSearch={setStudentSearch}
              notFoundContent={null}
              options={students?.profiles.map((s) => ({
                label: `${s.full_name}${s.contact_email ? ` · ${s.contact_email}` : ""}`,
                value: s.user_id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="course_id"
            label="Course"
            rules={[{ required: true, message: "Select a course." }]}
          >
            <Select
              showSearch
              placeholder="Select course"
              optionFilterProp="label"
              options={courses?.courses.map((c) => ({
                label: `${c.course_code} — ${c.course_name}`,
                value: c.id,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <Button onClick={handleCheck} loading={checking}>
              Check eligibility
            </Button>
          </Form.Item>

          {eligibility && checkedFor === currentKey(form.getFieldsValue()) && (
            <Alert
              style={{ marginBottom: 16 }}
              type={eligibility.eligible ? "success" : "warning"}
              showIcon
              message={eligibility.eligible ? "Learner is eligible for this course." : "Learner may not be eligible."}
              description={!eligibility.eligible ? JSON.stringify(eligibility) : undefined}
            />
          )}

          <Space>
            <Button type="primary" htmlType="submit" loading={creating}>
              Create enrollment
            </Button>
            <Button onClick={() => navigate("/enrollments")}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
