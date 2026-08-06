import { useState } from "react";
import { Card, List, Button, Typography, Empty, Alert, Tag } from "antd";
import { ApartmentOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAuthResponse, logout } from "@/features/auth/authSlice";
import { useSwitchTenantMutation } from "@/store/api/authApi";
import { getErrorMessage } from "@/lib/error";

// COMMON-04 — Select Tenant. Shown after login when the session has no active tenant, either
// because the user belongs to more than one tenant or none could be resolved automatically.
export function SelectTenant() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tenants = useAppSelector((s) => s.auth.tenants);
  const [switchTenant, { isLoading }] = useSwitchTenantMutation();
  const [error, setError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<number | null>(null);

  const handleSelect = async (tenantId: number) => {
    setError(null);
    setSelectingId(tenantId);
    try {
      const auth = await switchTenant({ selectedTenantId: tenantId }).unwrap();
      dispatch(setAuthResponse(auth));
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Could not switch tenant. Please try again."));
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <Card style={{ width: 440 }} title="Choose a workspace">
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      {tenants.length === 0 ? (
        <Empty
          description={
            <span>
              No tenant access found for this account.
              <br />
              Contact your administrator to request access.
            </span>
          }
        >
          <Button onClick={() => dispatch(logout())}>Back to sign in</Button>
        </Empty>
      ) : (
        <List
          dataSource={tenants}
          renderItem={(membership) => (
            <List.Item
              key={membership.id}
              onClick={() => membership.tenant && handleSelect(membership.tenant.id)}
              style={{
                cursor: "pointer",
                padding: "12px 8px",
                borderRadius: 8,
              }}
              actions={[
                <Button
                  key="enter"
                  type="text"
                  icon={<RightOutlined />}
                  loading={isLoading && selectingId === membership.tenant?.id}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={<ApartmentOutlined style={{ fontSize: 20, color: "#1677ff" }} />}
                title={membership.tenant?.tenant_name ?? `Tenant #${membership.tenant_id}`}
                description={
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {membership.scope_type === "tenant" ? (
                      "Full tenant access"
                    ) : (
                      <Tag style={{ marginInlineEnd: 0 }}>{membership.scope_type} scope</Tag>
                    )}
                  </Typography.Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
