import { useState } from "react";
import {
  Card,
  Descriptions,
  Space,
  Tag,
  Button,
  Tabs,
  Table,
  Popconfirm,
  Modal,
  Form,
  Select,
  message,
  Skeleton,
  Empty,
  List,
  Progress,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { PermissionGate } from "../../components/PermissionGate";
import {
  useGetClassroomByIdQuery,
  usePublishClassroomMutation,
  useStartClassroomMutation,
  useCancelClassroomMutation,
  useCompleteClassroomMutation,
  useArchiveClassroomMutation,
  useAssignTeachersMutation,
  useListClassroomStudentsQuery,
  useAddClassroomStudentMutation,
  useListClassroomSessionsQuery,
} from "@/store/api/classroomsApi";
import { useListUsersQuery } from "@/store/api/iamApi";
import { useListProfilesQuery } from "@/store/api/profilesApi";
import type { ClassroomSession, ClassroomStudentEnrollment } from "@/types";
import { getErrorMessage } from "@/lib/error";

const transitions: Record<string, { key: string; label: string; danger?: boolean }[]> = {
  draft: [{ key: "publish", label: "Publish" }, { key: "cancel", label: "Cancel", danger: true }],
  open: [{ key: "start", label: "Start" }, { key: "cancel", label: "Cancel", danger: true }],
  full: [{ key: "start", label: "Start" }, { key: "cancel", label: "Cancel", danger: true }],
  in_progress: [{ key: "complete", label: "Complete" }, { key: "cancel", label: "Cancel", danger: true }],
  completed: [{ key: "archive", label: "Archive" }],
  cancelled: [{ key: "archive", label: "Archive" }],
  archived: [],
};

// ADM-17 — Classroom Detail, with ADM-20 (Teacher Assignment) and a roster view (ADM-21,
// simplified) as tabs.
export function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const classroomId = Number(id);
  const navigate = useNavigate();
  const { data: classroom, isLoading } = useGetClassroomByIdQuery(classroomId, { skip: !id });

  const [publish] = usePublishClassroomMutation();
  const [start] = useStartClassroomMutation();
  const [cancel] = useCancelClassroomMutation();
  const [complete] = useCompleteClassroomMutation();
  const [archive] = useArchiveClassroomMutation();
  const [assignTeachers, { isLoading: assigning }] = useAssignTeachersMutation();

  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [teacherForm] = Form.useForm<{ main_teacher_id?: number }>();
  const { data: users } = useListUsersQuery(undefined, { skip: !teacherModalOpen });

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const { data: studentOptions } = useListProfilesQuery(
    { profileType: "student", search: studentSearch || undefined, limit: 20 },
    { skip: !studentModalOpen },
  );
  const [studentForm] = Form.useForm<{ student_id: number }>();
  const [addStudent, { isLoading: addingStudent }] = useAddClassroomStudentMutation();

  const { data: roster, isLoading: rosterLoading } = useListClassroomStudentsQuery(
    { id: classroomId },
    { skip: !classroomId },
  );
  const { data: sessions } = useListClassroomSessionsQuery(classroomId, { skip: !classroomId });

  const runTransition = async (action: string) => {
    if (!classroom) return;
    try {
      if (action === "publish") await publish(classroom.id).unwrap();
      if (action === "start") await start(classroom.id).unwrap();
      if (action === "cancel") await cancel({ id: classroom.id }).unwrap();
      if (action === "complete") await complete(classroom.id).unwrap();
      if (action === "archive") await archive(classroom.id).unwrap();
      message.success("Classroom updated");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to update classroom"));
    }
  };

  const handleAssignTeacher = async (values: { main_teacher_id?: number }) => {
    if (!classroom) return;
    try {
      await assignTeachers({ id: classroom.id, ...values }).unwrap();
      message.success("Teacher assigned");
      setTeacherModalOpen(false);
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to assign teacher"));
    }
  };

  const handleAddStudent = async (values: { student_id: number }) => {
    if (!classroom) return;
    try {
      await addStudent({ id: classroom.id, ...values }).unwrap();
      message.success("Student added to classroom");
      setStudentModalOpen(false);
      studentForm.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to add student"));
    }
  };

  const rosterColumns: ColumnsType<ClassroomStudentEnrollment> = [
    { title: "Student", key: "student", render: (_, r) => r.student?.full_name ?? `#${r.student_id}` },
    { title: "Status", dataIndex: "enrollment_status", key: "status", render: (v) => <StatusTag status={v} /> },
    {
      title: "Attendance",
      dataIndex: "attendance_rate",
      key: "attendance_rate",
      render: (v: number | null) => (v != null ? <Progress percent={Math.round(v)} size="small" /> : "—"),
    },
  ];

  const sessionColumns: ColumnsType<ClassroomSession> = [
    { title: "Date", dataIndex: "session_date", key: "session_date" },
    { title: "Time", key: "time", render: (_, r) => `${r.start_time} – ${r.end_time}` },
    { title: "Title", dataIndex: "session_title", key: "title", render: (v) => v ?? "—" },
    { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
  ];

  if (isLoading) return <Skeleton active />;
  if (!classroom) return <Empty description="Classroom not found." />;

  const mainTeacher = classroom.teachers?.find((t) => t.role_in_classroom === "main_teacher");

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title={classroom.classroom_name}
        description={classroom.classroom_code}
        breadcrumb={[{ label: "Classrooms", to: "/classrooms" }, { label: classroom.classroom_name }]}
        actions={
          <PermissionGate permission="iam.user.manage">
            <Space>
              {(transitions[classroom.status] ?? []).map((t) => (
                <Popconfirm
                  key={t.key}
                  title={`${t.label} this classroom?`}
                  onConfirm={() => runTransition(t.key)}
                >
                  <Button danger={t.danger}>{t.label}</Button>
                </Popconfirm>
              ))}
              <Button icon={<EditOutlined />} onClick={() => navigate(`/classrooms/${classroom.id}/edit`)}>
                Edit
              </Button>
            </Space>
          </PermissionGate>
        }
      />

      <Card title="Classroom information">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Status">
            <StatusTag status={classroom.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Course">
            {classroom.course?.course_name ?? `#${classroom.course_id}`}
          </Descriptions.Item>
          <Descriptions.Item label="Delivery">{classroom.delivery_method}</Descriptions.Item>
          <Descriptions.Item label="Dates">
            {classroom.start_date} → {classroom.end_date}
          </Descriptions.Item>
          <Descriptions.Item label="Capacity">
            {classroom.enrolled_count}/{classroom.max_capacity}
          </Descriptions.Item>
          <Descriptions.Item label="Enrollment mode">{classroom.enrollment_mode}</Descriptions.Item>
          <Descriptions.Item label="Location">{classroom.location ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="Visibility">
            <Tag>{classroom.visibility}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs
          items={[
            {
              key: "teachers",
              label: "Teachers",
              children: (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <PermissionGate permission="iam.user.manage">
                    <Button icon={<TeamOutlined />} onClick={() => setTeacherModalOpen(true)}>
                      Assign teacher
                    </Button>
                  </PermissionGate>
                  {!classroom.teachers || classroom.teachers.length === 0 ? (
                    <Empty description="No teacher assigned yet." />
                  ) : (
                    <List
                      dataSource={classroom.teachers}
                      renderItem={(t) => (
                        <List.Item>
                          <List.Item.Meta
                            title={t.user?.full_name ?? `User #${t.user_id}`}
                            description={t.role_in_classroom.replace(/_/g, " ")}
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Space>
              ),
            },
            {
              key: "roster",
              label: `Roster (${roster?.total ?? classroom.enrolled_count})`,
              children: (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <PermissionGate permission="iam.user.manage">
                    <Button icon={<PlusOutlined />} onClick={() => setStudentModalOpen(true)}>
                      Add student
                    </Button>
                  </PermissionGate>
                  <Table<ClassroomStudentEnrollment>
                    dataSource={roster?.items}
                    columns={rosterColumns}
                    rowKey="id"
                    size="small"
                    loading={rosterLoading}
                    pagination={false}
                    locale={{ emptyText: "No students enrolled yet." }}
                  />
                </Space>
              ),
            },
            {
              key: "sessions",
              label: "Sessions",
              children: (
                <Table<ClassroomSession>
                  dataSource={sessions}
                  columns={sessionColumns}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  locale={{ emptyText: "No sessions scheduled yet." }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Button onClick={() => navigate(-1)}>Back</Button>

      <Modal
        title={`Assign teacher${mainTeacher ? " (replace current)" : ""}`}
        open={teacherModalOpen}
        onCancel={() => setTeacherModalOpen(false)}
        onOk={() => teacherForm.validateFields().then(handleAssignTeacher)}
        confirmLoading={assigning}
        destroyOnClose
      >
        <Form form={teacherForm} layout="vertical">
          <Form.Item
            name="main_teacher_id"
            label="Main teacher"
            rules={[{ required: true, message: "Select a teacher." }]}
          >
            <Select
              showSearch
              placeholder="Search by name or email"
              optionFilterProp="label"
              options={users
                ?.filter((u) => u.role === "teacher")
                .map((u) => ({ label: `${u.full_name} (${u.email})`, value: u.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add student to classroom"
        open={studentModalOpen}
        onCancel={() => setStudentModalOpen(false)}
        onOk={() => studentForm.validateFields().then(handleAddStudent)}
        confirmLoading={addingStudent}
        destroyOnClose
      >
        <Form form={studentForm} layout="vertical">
          <Form.Item
            name="student_id"
            label="Student"
            extra="Matches the student's user account, not their profile record."
            rules={[{ required: true, message: "Select a student." }]}
          >
            <Select
              showSearch
              placeholder="Search students by name..."
              filterOption={false}
              onSearch={setStudentSearch}
              notFoundContent={null}
              options={studentOptions?.profiles.map((s) => ({
                label: `${s.full_name}${s.contact_email ? ` · ${s.contact_email}` : ""}`,
                value: s.user_id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
