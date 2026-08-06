import { useEffect } from "react";
import { Card, Form, Input, Button, Space, message, Skeleton, Modal } from "antd";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import {
  useCreateDepartmentMutation,
  useGetDepartmentByIdQuery,
  useUpdateDepartmentMutation,
} from "@/store/api/departmentsApi";
import type { DepartmentBody } from "@/store/api/departmentsApi";
import { getErrorMessage } from "@/lib/error";

// ADM-47 — Create / Edit Department share one form.
export function DepartmentForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form] = Form.useForm<DepartmentBody>();

  const { data: department, isLoading: loadingDepartment } = useGetDepartmentByIdQuery(Number(id), {
    skip: !isEdit,
  });
  const [createDepartment, { isLoading: creating }] = useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: updating }] = useUpdateDepartmentMutation();

  useEffect(() => {
    if (department) {
      form.setFieldsValue({
        departmentCode: department.department_code,
        departmentName: department.department_name,
      });
    }
  }, [department, form]);

  const submit = async (values: DepartmentBody) => {
    try {
      if (isEdit && department) {
        await updateDepartment({ id: department.id, ...values }).unwrap();
        message.success("Department updated");
        navigate("/departments");
      } else {
        await createDepartment(values).unwrap();
        message.success("Department created");
        navigate("/departments");
      }
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to save department"));
    }
  };

  const handleSubmit = (values: DepartmentBody) => {
    // Renaming/re-coding a department that already backs live courses is allowed, but the admin
    // should know it affects those courses -- confirm before applying, per the ADM-47 spec.
    if (isEdit && department?.course_count) {
      Modal.confirm({
        title: "This department is in use",
        content: `${department.course_count} course(s) currently reference this department. Saving will update it for all of them.`,
        okText: "Save changes",
        onOk: () => submit(values),
      });
      return;
    }
    submit(values);
  };

  if (isEdit && loadingDepartment) return <Skeleton active />;

  return (
    <Space direction="vertical" size={24} style={{ width: "100%", maxWidth: 480 }}>
      <PageHeader
        title={isEdit ? "Edit Department" : "Create Department"}
        breadcrumb={[
          { label: "Departments", to: "/departments" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="departmentCode"
            label="Department code"
            extra="Must be unique within your tenant."
            rules={[{ required: true, message: "Department code is required." }]}
          >
            <Input placeholder="e.g. CS" />
          </Form.Item>

          <Form.Item
            name="departmentName"
            label="Department name"
            rules={[{ required: true, message: "Department name is required." }]}
          >
            <Input placeholder="e.g. Computer Science" />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={creating || updating}>
              {isEdit ? "Save changes" : "Create department"}
            </Button>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
