import { useEffect } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Button,
  Space,
  message,
  Skeleton,
} from "antd";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import {
  useCreateClassroomMutation,
  useGetClassroomByIdQuery,
  useUpdateClassroomMutation,
} from "@/store/api/classroomsApi";
import { useListCoursesQuery } from "@/store/api/coursesApi";
import { useListCampusesQuery } from "@/store/api/orgApi";
import type { ClassroomBody } from "@/store/api/classroomsApi";
import { useAppSelector } from "@/store/hooks";
import { getErrorMessage } from "@/lib/error";

type FormValues = Omit<ClassroomBody, "start_date" | "end_date"> & {
  start_date: dayjs.Dayjs;
  end_date: dayjs.Dayjs;
};

// ADM-18 / ADM-19 — Create / Edit Classroom.
export function ClassroomForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();

  const { data: classroom, isLoading: loadingClassroom } = useGetClassroomByIdQuery(Number(id), {
    skip: !isEdit,
  });
  const { data: courses } = useListCoursesQuery({ status: "active", page_size: 100 });
  const activeTenant = useAppSelector((s) => s.auth.activeTenant);
  const { data: campuses } = useListCampusesQuery({ tenantId: activeTenant?.id });
  const [createClassroom, { isLoading: creating }] = useCreateClassroomMutation();
  const [updateClassroom, { isLoading: updating }] = useUpdateClassroomMutation();

  useEffect(() => {
    if (classroom) {
      form.setFieldsValue({
        course_id: classroom.course_id,
        classroom_name: classroom.classroom_name,
        classroom_code: classroom.classroom_code,
        description: classroom.description ?? undefined,
        delivery_method: classroom.delivery_method,
        start_date: dayjs(classroom.start_date),
        end_date: dayjs(classroom.end_date),
        max_capacity: classroom.max_capacity,
        min_capacity: classroom.min_capacity ?? undefined,
        campus_id: classroom.campus_id ?? undefined,
        location: classroom.location ?? undefined,
        online_meeting_link: classroom.online_meeting_link ?? undefined,
        academic_year: classroom.academic_year ?? undefined,
        term: classroom.term ?? undefined,
        enrollment_mode: classroom.enrollment_mode,
        waitlist_enabled: classroom.waitlist_enabled,
        approval_required: classroom.approval_required,
        visibility: classroom.visibility,
      });
    }
  }, [classroom, form]);

  const handleSubmit = async (values: FormValues) => {
    const body: ClassroomBody = {
      ...values,
      start_date: values.start_date.format("YYYY-MM-DD"),
      end_date: values.end_date.format("YYYY-MM-DD"),
    };
    try {
      if (isEdit && classroom) {
        await updateClassroom({ id: classroom.id, ...body }).unwrap();
        message.success("Classroom updated");
        navigate(`/classrooms/${classroom.id}`);
      } else {
        const created = await createClassroom(body).unwrap();
        message.success("Classroom created successfully.");
        navigate(`/classrooms/${created.id}`);
      }
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to save classroom"));
    }
  };

  if (isEdit && loadingClassroom) return <Skeleton active />;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%", maxWidth: 680 }}>
      <PageHeader
        title={isEdit ? "Edit Classroom" : "Create Classroom"}
        breadcrumb={[
          { label: "Classrooms", to: "/classrooms" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ delivery_method: "offline", enrollment_mode: "manual", visibility: "internal" }}
        >
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
              disabled={isEdit}
            />
          </Form.Item>

          <Space size={16} style={{ display: "flex" }}>
            <Form.Item
              name="classroom_name"
              label="Classroom name"
              style={{ flex: 2 }}
              rules={[{ required: true, message: "Classroom name is required." }]}
            >
              <Input placeholder="e.g. CS101 - Spring 2026 Cohort A" />
            </Form.Item>
            <Form.Item name="classroom_code" label="Code" style={{ flex: 1 }}>
              <Input placeholder="Auto if blank" />
            </Form.Item>
          </Space>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Space size={16} style={{ display: "flex" }}>
            <Form.Item
              name="delivery_method"
              label="Delivery method"
              style={{ flex: 1 }}
              rules={[{ required: true }]}
            >
              <Select options={["online", "offline", "hybrid"].map((v) => ({ label: v, value: v }))} />
            </Form.Item>
            <Form.Item
              name="start_date"
              label="Start date"
              style={{ flex: 1 }}
              rules={[{ required: true, message: "Start date is required." }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="end_date"
              label="End date"
              style={{ flex: 1 }}
              rules={[{ required: true, message: "End date is required." }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Space>

          <Space size={16} style={{ display: "flex" }}>
            <Form.Item
              name="max_capacity"
              label="Max capacity"
              style={{ flex: 1 }}
              rules={[{ required: true, message: "Max capacity is required." }]}
            >
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
            <Form.Item name="min_capacity" label="Min capacity" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
            <Form.Item name="enrollment_mode" label="Enrollment mode" style={{ flex: 1 }}>
              <Select
                options={["manual", "self_enrollment", "invitation_only"].map((v) => ({ label: v, value: v }))}
              />
            </Form.Item>
          </Space>

          <Space size={16} style={{ display: "flex" }}>
            <Form.Item name="campus_id" label="Campus" style={{ flex: 1 }}>
              <Select
                allowClear
                placeholder="Select campus (optional)"
                options={campuses?.map((c) => ({ label: c.campus_name, value: c.id }))}
                notFoundContent="No campuses configured — add one in Tenant Settings."
              />
            </Form.Item>
            <Form.Item name="location" label="Room / building" style={{ flex: 1 }}>
              <Input placeholder="e.g. Room 301" />
            </Form.Item>
          </Space>

          <Form.Item name="online_meeting_link" label="Online meeting link">
            <Input placeholder="https://..." />
          </Form.Item>

          <Space size={16} style={{ display: "flex" }}>
            <Form.Item name="academic_year" label="Academic year" style={{ flex: 1 }}>
              <Input placeholder="e.g. 2025-2026" />
            </Form.Item>
            <Form.Item name="term" label="Term" style={{ flex: 1 }}>
              <Input placeholder="e.g. Spring" />
            </Form.Item>
            <Form.Item name="visibility" label="Visibility" style={{ flex: 1 }}>
              <Select options={["public", "private", "internal"].map((v) => ({ label: v, value: v }))} />
            </Form.Item>
          </Space>

          <Space size={32}>
            <Form.Item name="waitlist_enabled" label="Enable waitlist" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="approval_required" label="Require approval to join" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          <Space>
            <Button type="primary" htmlType="submit" loading={creating || updating}>
              {isEdit ? "Save changes" : "Create classroom"}
            </Button>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
