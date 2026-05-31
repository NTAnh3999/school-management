import { Col, Row, Typography, Card, List, Tag, Progress, Space } from "antd";
import {
  UserOutlined,
  BookOutlined,
  HomeOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { StatCard } from "../components/StatCard";
import { useGetDashboardStatsQuery } from "@/store/api/usersApi";

const { Title, Text } = Typography;

// Hoist static data to module level (server-hoist-static-io)
const recentActivities = [
  {
    id: 1,
    text: "Alice Johnson enrolled in React Advanced",
    time: "2 min ago",
    type: "enrollment",
  },
  {
    id: 2,
    text: 'New course "Node.js Fundamentals" published',
    time: "1 hour ago",
    type: "course",
  },
  {
    id: 3,
    text: "Bob Smith completed Web Design 101",
    time: "3 hours ago",
    type: "completion",
  },
  {
    id: 4,
    text: 'Classroom "Spring 2026 Cohort" created',
    time: "1 day ago",
    type: "classroom",
  },
];

const activityTagColors: Record<string, string> = {
  enrollment: "blue",
  course: "green",
  completion: "gold",
  classroom: "purple",
};

const topCourses = [
  { name: "React Fundamentals", enrollments: 124, completion: 78 },
  { name: "Node.js Masterclass", enrollments: 98, completion: 65 },
  { name: "UI/UX Design", enrollments: 87, completion: 82 },
  { name: "Data Science Basics", enrollments: 74, completion: 55 },
];

export function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStatsQuery();

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Dashboard
        </Title>
        <Text type="secondary">
          Welcome back! Here's what's happening today.
        </Text>
      </div>

      {/* Stats Grid — fetch in parallel via single RTK Query */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Students"
            value={stats?.totalStudents ?? 0}
            icon={<UserOutlined style={{ color: "#1677ff" }} />}
            iconBg="#e6f4ff"
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Teachers"
            value={stats?.totalTeachers ?? 0}
            icon={<TeamOutlined style={{ color: "#52c41a" }} />}
            iconBg="#f6ffed"
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Courses"
            value={stats?.totalCourses ?? 0}
            icon={<BookOutlined style={{ color: "#722ed1" }} />}
            iconBg="#f9f0ff"
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Avg. Completion"
            value={stats?.avgCompletionRate ?? 0}
            suffix="%"
            icon={<TrophyOutlined style={{ color: "#fa8c16" }} />}
            iconBg="#fff7e6"
            loading={isLoading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent Activity */}
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" style={{ height: "100%" }}>
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item
                  extra={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.time}
                    </Text>
                  }
                >
                  <Space>
                    <Tag color={activityTagColors[item.type]}>{item.type}</Tag>
                    <Text>{item.text}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Top Courses */}
        <Col xs={24} lg={12}>
          <Card title="Top Courses by Enrollment" style={{ height: "100%" }}>
            <Space direction="vertical" style={{ width: "100%" }} size={16}>
              {topCourses.map((course) => (
                <div key={course.name}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <Text>{course.name}</Text>
                    <Text type="secondary">{course.enrollments} enrolled</Text>
                  </div>
                  <Progress
                    percent={course.completion}
                    size="small"
                    format={(pct) => `${pct}% complete`}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Active Classrooms stat */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Classrooms"
            value={stats?.activeClassrooms ?? 0}
            icon={<HomeOutlined style={{ color: "#eb2f96" }} />}
            iconBg="#fff0f6"
            loading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Enrollments"
            value={stats?.totalEnrollments ?? 0}
            icon={<UserOutlined style={{ color: "#13c2c2" }} />}
            iconBg="#e6fffb"
            loading={isLoading}
          />
        </Col>
      </Row>
    </Space>
  );
}
