import { Collapse, Tag, List, Typography, Empty } from "antd";
import { PlayCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import type { CourseModule } from "@/types";

const lessonTypeIcon: Record<string, React.ReactNode> = {
  Standard: <FileTextOutlined />,
  Microlearning: <PlayCircleOutlined />,
  QuizOnly: <FileTextOutlined />,
};

interface ContentStructureTreeProps {
  modules: CourseModule[];
}

/** Read-only Module → Lesson tree, used for previewing a draft or an already-snapshotted
 * content version (spec §12.2 Detail Page Pattern: read-only related content). */
export function ContentStructureTree({ modules }: ContentStructureTreeProps) {
  if (!modules || modules.length === 0) {
    return <Empty description="No modules yet." />;
  }

  return (
    <Collapse
      items={modules.map((m) => ({
        key: m.id,
        label: (
          <span>
            {m.title}{" "}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ({m.lessons?.length ?? 0} lessons)
            </Typography.Text>
          </span>
        ),
        extra: m.status === "archived" ? <Tag>archived</Tag> : undefined,
        children: !m.lessons || m.lessons.length === 0 ? (
          <Typography.Text type="secondary">No lessons in this module yet.</Typography.Text>
        ) : (
          <List
            size="small"
            dataSource={m.lessons}
            renderItem={(lesson) => (
              <List.Item>
                <List.Item.Meta
                  avatar={lessonTypeIcon[lesson.lesson_type]}
                  title={lesson.title}
                  description={`${lesson.lesson_type} · ${lesson.duration_minutes} min${lesson.status === "archived" ? " · archived" : ""}`}
                />
              </List.Item>
            )}
          />
        ),
      }))}
    />
  );
}
