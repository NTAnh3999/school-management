import {
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Progress,
} from "antd";
import {
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useGetDashboardStatsQuery } from "@/store/api/usersApi";
import { useGetCoursesQuery } from "@/store/api/coursesApi";

const { Title, Text } = Typography;

interface CourseReport {
  key: string;
  name: string;
  students: number;
  completionRate: number;
  status: string;
}

const reportColumns: ColumnsType<CourseReport> = [
  { title: "Course", dataIndex: "name", key: "name" },
  {
    title: "Students",
    dataIndex: "students",
    key: "students",
    align: "center",
  },
  {
    title: "Completion Rate",
    dataIndex: "completionRate",
    key: "completionRate",
    render: (rate: number) => (
      <Progress percent={rate} size="small" style={{ width: 120 }} />
    ),
    sorter: (a, b) => a.completionRate - b.completionRate,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: string) => (
      <Tag color={status === "published" ? "success" : "default"}>{status}</Tag>
    ),
  },
];

export function Reports() {
  // Parallel fetches via separate RTK Query hooks (async-parallel)
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: courses, isLoading: coursesLoading } = useGetCoursesQuery({
    page: 1,
    limit: 5,
  });

  const reportData: CourseReport[] =
    courses?.data.map((c) => ({
      key: String(c.id),
      name: c.title,
      students: c.enrollmentCount,
      completionRate: Math.floor(Math.random() * 40) + 60,
      status: c.status,
    })) ?? [];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Reports
        </Title>
        <Text type="secondary">Analytics and performance overview</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="Total Students"
              value={stats?.totalStudents ?? 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="Total Teachers"
              value={stats?.totalTeachers ?? 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="Total Courses"
              value={stats?.totalCourses ?? 0}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="Avg. Completion"
              value={stats?.avgCompletionRate ?? 0}
              suffix="%"
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Course Performance">
        <Table<CourseReport>
          dataSource={reportData}
          columns={reportColumns}
          loading={coursesLoading}
          pagination={false}
          size="small"
        />
      </Card>
    </Space>
  );
}
