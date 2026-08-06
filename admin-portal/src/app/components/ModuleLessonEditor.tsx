import { useState } from "react";
import {
  Card,
  Collapse,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  List,
  Tag,
  Popconfirm,
  message,
  Typography,
  Empty,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined } from "@ant-design/icons";
import { PermissionGate } from "./PermissionGate";
import {
  useListModulesQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useArchiveModuleMutation,
  useDeleteModuleMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useArchiveLessonMutation,
  useDeleteLessonMutation,
} from "@/store/api/courseContentApi";
import type { CourseModule, Lesson, LessonType } from "@/types";
import { getErrorMessage } from "@/lib/error";

interface ModuleFormValues {
  title: string;
  description?: string;
}

interface LessonFormValues {
  title: string;
  lessonSummary?: string;
  lessonType: LessonType;
  videoUrl?: string;
  durationMinutes?: number;
}

interface ModuleLessonEditorProps {
  courseId: number;
}

// Authoring surface for a course's draft content structure — feeds ContentVersionsPanel's
// "Create version" snapshot. Create/update/archive/delete are all ROLES.ADMIN-only on the
// backend (module.routes.js, lesson.routes.js), so gated the same as other admin actions here.
export function ModuleLessonEditor({ courseId }: ModuleLessonEditorProps) {
  const { data: modules, isLoading } = useListModulesQuery(courseId);

  const [createModule, { isLoading: creatingModule }] = useCreateModuleMutation();
  const [updateModule] = useUpdateModuleMutation();
  const [archiveModule] = useArchiveModuleMutation();
  const [deleteModule] = useDeleteModuleMutation();

  const [createLesson, { isLoading: creatingLesson }] = useCreateLessonMutation();
  const [updateLesson] = useUpdateLessonMutation();
  const [archiveLesson] = useArchiveLessonMutation();
  const [deleteLesson] = useDeleteLessonMutation();

  const [moduleModal, setModuleModal] = useState<{ mode: "create" | "edit"; module?: CourseModule } | null>(null);
  const [moduleForm] = Form.useForm<ModuleFormValues>();

  const [lessonModal, setLessonModal] = useState<{ moduleId: number; lesson?: Lesson } | null>(null);
  const [lessonForm] = Form.useForm<LessonFormValues>();

  const openCreateModule = () => {
    moduleForm.resetFields();
    setModuleModal({ mode: "create" });
  };
  const openEditModule = (m: CourseModule) => {
    moduleForm.setFieldsValue({ title: m.title, description: m.description ?? undefined });
    setModuleModal({ mode: "edit", module: m });
  };

  const submitModule = async (values: ModuleFormValues) => {
    try {
      if (moduleModal?.mode === "edit" && moduleModal.module) {
        await updateModule({ id: moduleModal.module.id, ...values }).unwrap();
        message.success("Module updated");
      } else {
        await createModule({ courseId, ...values }).unwrap();
        message.success("Module created");
      }
      setModuleModal(null);
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to save module"));
    }
  };

  const openCreateLesson = (moduleId: number) => {
    lessonForm.resetFields();
    lessonForm.setFieldsValue({ lessonType: "Standard" });
    setLessonModal({ moduleId });
  };
  const openEditLesson = (moduleId: number, lesson: Lesson) => {
    lessonForm.setFieldsValue({
      title: lesson.title,
      lessonSummary: lesson.lesson_summary ?? undefined,
      lessonType: lesson.lesson_type,
      videoUrl: lesson.video_url ?? undefined,
      durationMinutes: lesson.duration_minutes,
    });
    setLessonModal({ moduleId, lesson });
  };

  const submitLesson = async (values: LessonFormValues) => {
    if (!lessonModal) return;
    try {
      if (lessonModal.lesson) {
        await updateLesson({ id: lessonModal.lesson.id, ...values }).unwrap();
        message.success("Lesson updated");
      } else {
        await createLesson({ moduleId: lessonModal.moduleId, ...values }).unwrap();
        message.success("Lesson created");
      }
      setLessonModal(null);
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to save lesson"));
    }
  };

  return (
    <Card
      title="Modules & lessons"
      extra={
        <PermissionGate permission="iam.user.manage">
          <Button icon={<PlusOutlined />} onClick={openCreateModule}>
            Add module
          </Button>
        </PermissionGate>
      }
      loading={isLoading}
    >
      {!modules || modules.length === 0 ? (
        <Empty description="No modules yet. Add one to start building this course's content." />
      ) : (
        <Collapse
          items={modules.map((m) => ({
            key: m.id,
            label: (
              <Space>
                {m.title}
                {m.status === "archived" && <Tag>archived</Tag>}
              </Space>
            ),
            extra: (
              <PermissionGate permission="iam.user.manage">
                <Space onClick={(e) => e.stopPropagation()}>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEditModule(m)} />
                  <Popconfirm title="Archive this module?" onConfirm={() => archiveModule(m.id)}>
                    <Button size="small" icon={<InboxOutlined />} disabled={m.status === "archived"} />
                  </Popconfirm>
                  <Popconfirm
                    title="Delete this module?"
                    description="Deletes it and cannot be undone."
                    onConfirm={() => deleteModule(m.id)}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </PermissionGate>
            ),
            children: (
              <Space direction="vertical" style={{ width: "100%" }}>
                <PermissionGate permission="iam.user.manage">
                  <Button size="small" icon={<PlusOutlined />} onClick={() => openCreateLesson(m.id)}>
                    Add lesson
                  </Button>
                </PermissionGate>
                {!m.lessons || m.lessons.length === 0 ? (
                  <Typography.Text type="secondary">No lessons in this module yet.</Typography.Text>
                ) : (
                  <List
                    size="small"
                    dataSource={m.lessons}
                    renderItem={(lesson) => (
                      <List.Item
                        actions={[
                          <PermissionGate key="actions" permission="iam.user.manage">
                            <Space>
                              <Button
                                size="small"
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => openEditLesson(m.id, lesson)}
                              />
                              <Popconfirm title="Archive this lesson?" onConfirm={() => archiveLesson(lesson.id)}>
                                <Button size="small" type="text" icon={<InboxOutlined />} disabled={lesson.status === "archived"} />
                              </Popconfirm>
                              <Popconfirm title="Delete this lesson?" onConfirm={() => deleteLesson(lesson.id)}>
                                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          </PermissionGate>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              {lesson.title}
                              {lesson.status === "archived" && <Tag>archived</Tag>}
                            </Space>
                          }
                          description={`${lesson.lesson_type} · ${lesson.duration_minutes} min`}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Space>
            ),
          }))}
        />
      )}

      <Modal
        title={moduleModal?.mode === "edit" ? "Edit module" : "Add module"}
        open={!!moduleModal}
        onCancel={() => setModuleModal(null)}
        onOk={() => moduleForm.validateFields().then(submitModule)}
        confirmLoading={creatingModule}
        destroyOnClose
      >
        <Form form={moduleForm} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required." }]}>
            <Input placeholder="e.g. Module 1 — Getting Started" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={lessonModal?.lesson ? "Edit lesson" : "Add lesson"}
        open={!!lessonModal}
        onCancel={() => setLessonModal(null)}
        onOk={() => lessonForm.validateFields().then(submitLesson)}
        confirmLoading={creatingLesson}
        destroyOnClose
      >
        <Form form={lessonForm} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required." }]}>
            <Input placeholder="e.g. Lesson 1.1 — Introduction" />
          </Form.Item>
          <Form.Item name="lessonSummary" label="Summary">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space size={16} style={{ display: "flex" }}>
            <Form.Item name="lessonType" label="Type" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select
                options={["Standard", "Microlearning", "QuizOnly"].map((t) => ({ label: t, value: t }))}
              />
            </Form.Item>
            <Form.Item name="durationMinutes" label="Duration (min)" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="videoUrl" label="Video URL (optional)">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
