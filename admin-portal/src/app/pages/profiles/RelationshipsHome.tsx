import { useState } from "react";
import { List, Avatar, Input, Space, Typography, Empty, Skeleton } from "antd";
import { UserOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { StatusTag } from "../../components/StatusTag";
import { useListProfilesQuery } from "@/store/api/profilesApi";

// ADM-09 — Relationship Management entry point. The backend only exposes parent–student links
// from the parent side (GET /profiles/parent/:id/students, POST /profiles/relationships/link),
// so this lists Parent profiles and hands off to each one's detail page — where "Linked
// students" lives — rather than a fabricated global relationships table.
export function RelationshipsHome() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListProfilesQuery({
    profileType: "parent",
    search: search || undefined,
    limit: 50,
  });

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Relationships"
        description="Manage Parent–Student links. Select a parent to view and edit their linked students."
      />

      <Input
        prefix={<SearchOutlined />}
        placeholder="Search parents by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: 320 }}
        allowClear
      />

      {isLoading ? (
        <Skeleton active />
      ) : !data || data.profiles.length === 0 ? (
        <Empty description="No parent profiles found." />
      ) : (
        <List
          dataSource={data.profiles}
          renderItem={(parent) => (
            <List.Item
              onClick={() => navigate(`/profiles/${parent.id}`)}
              style={{ cursor: "pointer" }}
              actions={[<a key="manage">Manage students →</a>]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={parent.full_name}
                description={parent.contact_email ?? "No contact email"}
              />
              <StatusTag status={parent.status} />
            </List.Item>
          )}
        />
      )}

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Looking for a student's linked parents instead? Open the student's profile — reverse
        lookup isn't exposed by the API yet.
      </Typography.Text>
    </Space>
  );
}
