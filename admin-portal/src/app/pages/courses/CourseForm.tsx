import { useEffect, useMemo } from "react";
import { Card, Form, Input, InputNumber, Select, Button, Space, message, Skeleton } from "antd";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import {
  useCreateCourseMutation,
  useGetCourseByIdQuery,
  useUpdateCourseMutation,
} from "@/store/api/coursesApi";
import type { CourseBody } from "@/store/api/coursesApi";
import { useListDepartmentsQuery } from "@/store/api/departmentsApi";
import { getErrorMessage } from "@/lib/error";

// ADM-12 / ADM-13 — Create / Edit Course share one form.
export function CourseForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form] = Form.useForm<CourseBody>();

  const { data: course, isLoading: loadingCourse } = useGetCourseByIdQuery(Number(id), {
    skip: !isEdit,
  });
  const { data: departments, isLoading: loadingDepartments } = useListDepartmentsQuery({
    page_size: 100,
  });
  const [createCourse, { isLoading: creating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: updating }] = useUpdateCourseMutation();

  const departmentOptions = useMemo(
    () =>
      (departments?.departments ?? []).map((d) => ({
        value: d.id,
        label: `${d.department_name} (${d.department_code})`,
      })),
    [departments]
  );

  useEffect(() => {
    if (course) {
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
      });
    }
  }, [course, form]);

  const handleSubmit = async (values: CourseBody) => {
    try {
      if (isEdit && course) {
        await updateCourse({ id: course.id, ...values }).unwrap();
        message.success("Course updated");
        navigate(`/courses/${course.id}`);
      } else {
        const created = await createCourse(values).unwrap();
        message.success("Course created successfully.");
        navigate(`/courses/${created.id}`);
      }
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to save course"));
    }
  };

  if (isEdit && loadingCourse) return <Skeleton active />;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%", maxWidth: 640 }}>
      <PageHeader
        title={isEdit ? "Edit Course" : "Create Course"}
        breadcrumb={[
          { label: "Courses", to: "/courses" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space size={16} style={{ display: "flex" }}>
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
          </Space>

          <Form.Item
            name="course_name"
            label="Course name"
            rules={[{ required: true, message: "Course name is required." }]}
          >
            <Input placeholder="e.g. Introduction to Computer Science" />
          </Form.Item>

          <Form.Item
            name="department_id"
            label="Department"
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
              placeholder="Select or search department"
              showSearch
              optionFilterProp="label"
              loading={loadingDepartments}
              options={departmentOptions}
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Space size={16} style={{ display: "flex" }}>
            <Form.Item name="course_type" label="Course type" style={{ flex: 1 }}>
              <Input placeholder="e.g. general" />
            </Form.Item>
            <Form.Item name="credit" label="Credit" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0.01} step={0.5} />
            </Form.Item>
            <Form.Item name="duration_hours" label="Duration (hours)" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0.01} step={1} />
            </Form.Item>
          </Space>

          <Space>
            <Button type="primary" htmlType="submit" loading={creating || updating}>
              {isEdit ? "Save changes" : "Create course"}
            </Button>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
