import { useEffect, useMemo } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Row,
  Col,
  message,
  Skeleton,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import {
  useCreateCourseMutation,
  useGetCourseByIdQuery,
  useUpdateCourseMutation,
  useUpdateCoursePrerequisitesMutation,
  useListCoursesQuery,
} from "@/store/api/coursesApi";
import type { CourseBody } from "@/store/api/coursesApi";
import { useListDepartmentsQuery } from "@/store/api/departmentsApi";
import { getErrorMessage } from "@/lib/error";

interface PrerequisiteRow {
  prerequisite_course_id: number;
}

interface CourseFormValues extends CourseBody {
  prerequisites?: PrerequisiteRow[];
  prerequisite_rule?: "ALL" | "ANY";
}

// ADM-12 / ADM-13 — Create / Edit Course share one form.
export function CourseForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const courseId = isEdit ? Number(id) : undefined;
  const navigate = useNavigate();
  const [form] = Form.useForm<CourseFormValues>();

  const { data: course, isLoading: loadingCourse } = useGetCourseByIdQuery(Number(id), {
    skip: !isEdit,
  });
  const { data: departments, isLoading: loadingDepartments } = useListDepartmentsQuery({
    page_size: 100,
  });
  const { data: allCourses, isLoading: loadingCourses } = useListCoursesQuery({ page_size: 100 });
  const prerequisiteRows = Form.useWatch("prerequisites", form);
  const hasPrerequisites = (prerequisiteRows?.length ?? 0) > 0;
  const [createCourse, { isLoading: creating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: updating }] = useUpdateCourseMutation();
  const [updateCoursePrerequisites, { isLoading: savingPrerequisites }] =
    useUpdateCoursePrerequisitesMutation();

  const departmentOptions = useMemo(
    () =>
      (departments?.departments ?? []).map((d) => ({
        value: d.id,
        label: `${d.department_name} (${d.department_code})`,
      })),
    [departments]
  );

  // A course can't be its own prerequisite — the backend rejects self-reference.
  const courseOptions = useMemo(
    () =>
      (allCourses?.courses ?? [])
        .filter((c) => c.id !== courseId)
        .map((c) => ({ value: c.id, label: `${c.course_code} — ${c.course_name}` })),
    [allCourses, courseId]
  );

  useEffect(() => {
    if (course) {
      const existingPrereqs = course.prerequisites ?? [];
      // Existing data could in theory mix ALL/ANY per row (legacy or API-direct writes);
      // this form only sets one rule for the whole list, so ANY wins only if every row is ANY.
      const inferredRule = existingPrereqs.length > 0 && existingPrereqs.every((p) => p.prerequisite_type === "ANY")
        ? "ANY"
        : "ALL";

      form.setFieldsValue({
        course_code: course.course_code,
        course_name: course.course_name,
        department_id: course.department_id,
        short_name: course.short_name ?? undefined,
        description: course.description ?? undefined,
        course_type: course.course_type,
        credit: course.credit ?? undefined,
        duration_hours: course.duration_hours ?? undefined,
        effective_from: course.effective_from ?? undefined,
        effective_to: course.effective_to ?? undefined,
        prerequisite_rule: inferredRule,
        prerequisites: existingPrereqs.map((p) => ({
          prerequisite_course_id: p.prerequisite_course_id,
        })),
      });
    }
  }, [course, form]);

  const handleSubmit = async (values: CourseFormValues) => {
    const { prerequisites, prerequisite_rule, ...courseValues } = values;
    let savedId: number;

    try {
      if (isEdit && course) {
        await updateCourse({ id: course.id, ...courseValues }).unwrap();
        savedId = course.id;
      } else {
        const created = await createCourse(courseValues).unwrap();
        savedId = created.id;
      }
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to save course"));
      return;
    }

    const rows = prerequisites ?? [];
    // Skip the second call when there's nothing to save and the course didn't have
    // prerequisites before — avoids a pointless request on every plain course save.
    // If the course DID have prerequisites, we still call through so clearing the
    // list in the form actually clears it server-side.
    const hadExistingPrerequisites = (course?.prerequisites?.length ?? 0) > 0;
    if (rows.length === 0 && !hadExistingPrerequisites) {
      message.success(isEdit ? "Course updated" : "Course created successfully.");
      navigate(`/courses/${savedId}`);
      return;
    }

    try {
      await updateCoursePrerequisites({
        id: savedId,
        prerequisites: rows.map((p) => ({
          prerequisite_course_id: p.prerequisite_course_id,
          prerequisite_type: prerequisite_rule ?? "ALL",
        })),
      }).unwrap();
      message.success(isEdit ? "Course updated" : "Course created successfully.");
    } catch (err) {
      message.error(getErrorMessage(err, "Course saved, but prerequisites failed to save."));
    }
    navigate(`/courses/${savedId}`);
  };

  if (isEdit && loadingCourse) return <Skeleton active />;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%", maxWidth: 1200 }}>
      <PageHeader
        title={isEdit ? "Edit Course" : "Create Course"}
        breadcrumb={[
          { label: "Courses", to: "/courses" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={24}>
          <Col span={16}>
            <Card title="Course information">
              <div style={{ display: "flex", gap: 16 }}>
                <Form.Item
                  name="course_code"
                  label="Course code"
                  style={{ flex: 1 }}
                  rules={[{ required: true, message: "Course code is required." }]}
                >
                  <Input placeholder="e.g. CS101" />
                </Form.Item>
                <Form.Item name="short_name" label="Short name" style={{ flex: 1 }}>
                  <Input placeholder="e.g. Intro CS" />
                </Form.Item>
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <Form.Item
                  name="course_name"
                  label="Course name"
                  style={{ flex: 6 }}
                  rules={[{ required: true, message: "Course name is required." }]}
                >
                  <Input placeholder="e.g. Introduction to Computer Science" />
                </Form.Item>
                <Form.Item
                  name="department_id"
                  label="Department"
                  style={{ flex: 4 }}
                  extra={
                    departments && departments.departments.length === 0 ? (
                      <>
                        No departments yet — <a href="/departments/new">create one</a> first.
                      </>
                    ) : undefined
                  }
                  rules={[{ required: true, message: "Department is required." }]}
                >
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Select or search department"
                    showSearch
                    optionFilterProp="label"
                    loading={loadingDepartments}
                    options={departmentOptions}
                  />
                </Form.Item>
              </div>

              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>

              <div style={{ display: "flex", gap: 16 }}>
                <Form.Item name="course_type" label="Course type" style={{ flex: 1 }}>
                  <Input placeholder="e.g. general" />
                </Form.Item>
                <Form.Item name="credit" label="Credit" style={{ flex: 1 }}>
                  <InputNumber style={{ width: "100%" }} min={0.01} step={0.5} />
                </Form.Item>
                <Form.Item name="duration_hours" label="Duration (hours)" style={{ flex: 1 }}>
                  <InputNumber style={{ width: "100%" }} min={0.01} step={1} />
                </Form.Item>
              </div>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="Prerequisites">
              <Form.Item
                name="prerequisite_rule"
                label="Prerequisite rule"
                initialValue="ALL"
                extra={
                  hasPrerequisites
                    ? "ALL: must complete every course listed below. ANY: completing one is enough."
                    : "Add a prerequisite course below to enable this."
                }
              >
                <Select
                  disabled={!hasPrerequisites}
                  options={[
                    { value: "ALL", label: "ALL — must complete all" },
                    { value: "ANY", label: "ANY — complete one of" },
                  ]}
                />
              </Form.Item>

              <Form.Item label="Prerequisite courses" style={{ marginBottom: 8 }}>
                <Form.List name="prerequisites">
                  {(fields, { add, remove }) => (
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      {fields.map((field) => (
                        <div key={field.key} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                          <Form.Item
                            {...field}
                            name={[field.name, "prerequisite_course_id"]}
                            dependencies={["prerequisites"]}
                            rules={[
                              { required: true, message: "Select a course." },
                              {
                                validator: (_, value) => {
                                  const rows: PrerequisiteRow[] =
                                    form.getFieldValue("prerequisites") ?? [];
                                  const occurrences = rows.filter(
                                    (r) => r?.prerequisite_course_id === value
                                  ).length;
                                  return occurrences > 1
                                    ? Promise.reject(new Error("Duplicate prerequisite course."))
                                    : Promise.resolve();
                                },
                              },
                            ]}
                            style={{ marginBottom: 0, flex: 1 }}
                          >
                            <Select
                              style={{ width: "100%" }}
                              placeholder="Select course"
                              showSearch
                              optionFilterProp="label"
                              loading={loadingCourses}
                              options={courseOptions}
                            />
                          </Form.Item>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        </div>
                      ))}
                      <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                        Add prerequisite
                      </Button>
                    </Space>
                  )}
                </Form.List>
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <Space style={{ marginTop: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={creating || updating || savingPrerequisites}
          >
            {isEdit ? "Save changes" : "Create course"}
          </Button>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
        </Space>
      </Form>
    </Space>
  );
}
