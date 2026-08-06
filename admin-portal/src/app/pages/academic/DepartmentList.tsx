import { useState } from "react";
import { Table, Button, Space, Input, Tooltip, Popconfirm, message } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { PermissionGate } from "../../components/PermissionGate";
import { useListDepartmentsQuery, useDeleteDepartmentMutation } from "@/store/api/departmentsApi";
import type { Department } from "@/types";
import { getErrorMessage } from "@/lib/error";

// ADM-46 — Department List: tenant-scoped master data used by Course's department picker.
export function DepartmentList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");

  const { data, isLoading } = useListDepartmentsQuery({
    page,
    page_size: 10,
    keyword: keyword || undefined,
  });
  const [deleteDepartment, { isLoading: deleting }] = useDeleteDepartmentMutation();

  const handleDelete = async (department: Department) => {
    try {
      await deleteDepartment(department.id).unwrap();
      message.success("Department deleted");
    } catch (err) {
      message.error(getErrorMessage(err, "Failed to delete department"));
    }
  };

  const columns: ColumnsType<Department> = [
    { title: "Code", dataIndex: "department_code", key: "department_code", width: 140 },
    { title: "Name", dataIndex: "department_name", key: "department_name" },
    {
      title: "Courses",
      dataIndex: "course_count",
      key: "course_count",
      width: 100,
      render: (v?: number) => v ?? 0,
    },
    {
      title: "",
      key: "actions",
      align: "right",
      width: 100,
      render: (_, record) => (
        <PermissionGate permission="academic.department.manage">
          <Space size={4}>
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => navigate(`/departments/${record.id}/edit`)}
              />
            </Tooltip>
            <Popconfirm
              title="Delete this department?"
              description={
                record.course_count
                  ? `${record.course_count} course(s) still reference it — deletion will be blocked until they're moved.`
                  : "This action is recorded in the audit log."
              }
              onConfirm={() => handleDelete(record)}
            >
              <Tooltip title="Delete">
                <Button type="text" danger icon={<DeleteOutlined />} loading={deleting} />
              </Tooltip>
            </Popconfirm>
          </Space>
        </PermissionGate>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <PageHeader
        title="Departments"
        description="Departments own course data — every course belongs to one department in your tenant."
        actions={
          <PermissionGate permission="academic.department.manage">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/departments/new")}>
              Create Department
            </Button>
          </PermissionGate>
        }
      />

      <Space wrap>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name or code..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          style={{ width: 260 }}
          allowClear
        />
      </Space>

      <Table<Department>
        dataSource={data?.departments}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (total) => `${total} departments`,
        }}
        locale={{ emptyText: "No departments found. Create one to get started." }}
      />
    </Space>
  );
}
