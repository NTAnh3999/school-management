import { Collapse, Tag, List, Typography, Empty, Space } from "antd";
import {
  PlayCircleOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FileOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ProfileOutlined,
  RotateRightOutlined,
  AppstoreOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import type { CourseModule, LearningItemType } from "@/types";

const itemTypeIcon: Record<LearningItemType, React.ReactNode> = {
  Text: <FileTextOutlined />,
  Video: <PlayCircleOutlined />,
  Document: <FileOutlined />,
  Infographic: <FileImageOutlined />,
  ExternalLink: <LinkOutlined />,
  KnowledgeCheck: <CheckCircleOutlined />,
  AssessmentReference: <ProfileOutlined />,
  Model3D: <RotateRightOutlined />,
  InteractivePackage: <AppstoreOutlined />,
};

interface ContentStructureTreeProps {
  modules: CourseModule[];
}

/** Read-only Module → Lesson → Learning Item tree, used for previewing a draft or an already-
 * snapshotted content version (spec §12.2 Detail Page Pattern: read-only related content). */
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
                <Space direction="vertical" style={{ width: "100%" }} size={4}>
                  <List.Item.Meta
                    avatar={<ReadOutlined />}
                    title={lesson.title}
                    description={[lesson.objective, `${lesson.duration_minutes} min`, lesson.status === "archived" ? "archived" : null]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                  {lesson.learning_items && lesson.learning_items.length > 0 && (
                    <List
                      size="small"
                      style={{ marginLeft: 32, width: "100%" }}
                      dataSource={lesson.learning_items}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={itemTypeIcon[item.item_type]}
                            title={
                              <Space>
                                {item.title}
                                {item.is_required && <Tag color="blue">required</Tag>}
                                {item.status === "archived" && <Tag>archived</Tag>}
                              </Space>
                            }
                            description={item.item_type}
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Space>
              </List.Item>
            )}
          />
        ),
      }))}
    />
  );
}
