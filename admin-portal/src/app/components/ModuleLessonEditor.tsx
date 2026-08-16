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
  List,
  Tag,
  Popconfirm,
  message,
  Typography,
  Empty,
  Alert,
  Divider,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined } from "@ant-design/icons";
import { PermissionGate } from "./PermissionGate";
import { LearningItemManager } from "./LearningItemEditor";
import {
  useListModulesQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useArchiveModuleMutation,
  useDeleteModuleMutation,
  useReorderModulesMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useArchiveLessonMutation,
  useDeleteLessonMutation,
} from "@/store/api/courseContentApi";
import type { CourseModule, Lesson } from "@/types";
import { getErrorMessage } from "@/lib/error";

interface ModuleFormValues {
  title: string;
  description?: string;
}

interface LessonFormValues {
  title: string;
  objective?: string;
  lessonSummary?: string;
  durationMinutes?: number;
}

interface ModuleLessonEditorProps {
  courseId: number;
}

// Authoring surface for a course's current open Draft (or, when no Draft is open, its Published
// version rendered read-only-in-effect since the backend rejects edits against a non-editable
// version — see module.service.js's _assertVersionEditable). Create/update/archive/delete are
// gated to the course's assigned Content Author(s) or an Admin/Academic-Admin holding
// content.version.manage.any (course-author.middleware.js + content.version.manage permission).
export function ModuleLessonEditor({ courseId }: ModuleLessonEditorProps) {
  const { data: modules, isLoading } = useListModulesQuery(courseId);

  const [createModule, { isLoading: creatingModule }] = useCreateModuleMutation();
  const [updateModule] = useUpdateModuleMutation();
  const [archiveModule] = useArchiveModuleMutation();
  const [deleteModule] = useDeleteModuleMutation();
  const [reorderModules] = useReorderModulesMutation();

  const [createLesson, { isLoading: creatingLesson }] = useCreateLessonMutation();
  const [updateLesson] = useUpdateLessonMutation();
  const [archiveLesson] = useArchiveLessonMutation();
  const [deleteLesson] = useDeleteLessonMutation();

  const [moduleModal, setModuleModal] = useState<{ mode: "create" | "edit"; module?: CourseModule } | null>(null);
  const [moduleForm] = Form.useForm<ModuleFormValues>();

  // Add lesson (no id yet -> no Learning Items section) vs. Edit lesson (has an id -> Learning
  // Items are managed inline in the same modal, matching the FSD-aligned mockup).
  const [lessonModal, setLessonModal] = useState<{ moduleId: number; lesson?: Lesson } | null>(null);
  const [lessonForm] = Form.useForm<LessonFormValues>();

  // All modules returned for a course share the same open content_version_id (the backend
  // resolves them together) — safe to read off the first one for create/reorder calls.
  const contentVersionId = modules?.[0]?.content_version_id;

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
        await updateModule({ id: moduleModal.module.id, revision: moduleModal.module.revision, ...values }).unwrap();
        message.success("Module updated");
      } else {
        if (!contentVersionId) {
          message.error("No open draft content version — create one from the Content versions panel first.");
          return;
        }
        await createModule({ versionId: contentVersionId, ...values }).unwrap();
        message.success("Module created");
      }
      setModuleModal(null);
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to save module"));
    }
  };

  const moveModule = async (moduleId: number, direction: -1 | 1) => {
    if (!modules || !contentVersionId) return;
    const ordered = [...modules].sort((a, b) => a.display_order - b.display_order);
    const index = ordered.findIndex((m) => m.id === moduleId);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return;
    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
    try {
      await reorderModules({ versionId: contentVersionId, orderedIds: ordered.map((m) => m.id) }).unwrap();
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to reorder modules"));
    }
  };

  const openCreateLesson = (moduleId: number) => {
    lessonForm.resetFields();
    setLessonModal({ moduleId });
  };
  const openEditLesson = (moduleId: number, lesson: Lesson) => {
    lessonForm.setFieldsValue({
      title: lesson.title,
      objective: lesson.objective ?? undefined,
      lessonSummary: lesson.lesson_summary ?? undefined,
      durationMinutes: lesson.duration_minutes,
    });
    setLessonModal({ moduleId, lesson });
  };

  const submitLesson = async (values: LessonFormValues) => {
    if (!lessonModal) return;
    try {
      if (lessonModal.lesson) {
        await updateLesson({ id: lessonModal.lesson.id, revision: lessonModal.lesson.revision, ...values }).unwrap();
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
        <PermissionGate permission="content.version.manage">
          <Button icon={<PlusOutlined />} onClick={openCreateModule} disabled={!contentVersionId}>
            Add module
          </Button>
        </PermissionGate>
      }
      loading={isLoading}
    >
      {!isLoading && !contentVersionId && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="No open draft content version"
          description="Create a content version from the panel below to start authoring modules and lessons."
        />
      )}
      {!modules || modules.length === 0 ? (
        <Empty description="No modules yet. Add one to start building this course's content." />
      ) : (
        <Collapse
          items={[...modules]
            .sort((a, b) => a.display_order - b.display_order)
            .map((m, index) => ({
            key: m.id,
            label: (
              <Space>
                {m.title}
                {m.status === "archived" && <Tag>archived</Tag>}
              </Space>
            ),
            extra: (
              <PermissionGate permission="content.version.manage">
                <Space onClick={(e) => e.stopPropagation()}>
                  <Button size="small" disabled={index === 0} onClick={() => moveModule(m.id, -1)}>
                    ↑
                  </Button>
                  <Button size="small" disabled={index === modules.length - 1} onClick={() => moveModule(m.id, 1)}>
                    ↓
                  </Button>
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
                <PermissionGate permission="content.version.manage">
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
                        onClick={() => openEditLesson(m.id, lesson)}
                        style={{ cursor: "pointer" }}
                        actions={[
                          <PermissionGate key="actions" permission="content.version.manage">
                            <Space onClick={(e) => e.stopPropagation()}>
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
                          description={lesson.objective || `${lesson.duration_minutes} min`}
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
        width={lessonModal?.lesson ? 640 : 520}
      >
        <Form form={lessonForm} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required." }]}>
            <Input placeholder="e.g. Lesson 1.1 — Introduction" />
          </Form.Item>
          <Form.Item name="objective" label="Objective (mục tiêu bài học)">
            <Input.TextArea rows={2} placeholder="What should learners be able to do after this lesson?" />
          </Form.Item>
          <Form.Item name="lessonSummary" label="Summary (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="durationMinutes" label="Duration (min)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>

        {lessonModal?.lesson && (
          <>
            <Divider style={{ margin: "8px 0 16px" }} />
            <LearningItemManager lessonId={lessonModal.lesson.id} active={!!lessonModal} />
          </>
        )}
      </Modal>
    </Card>
  );
}
