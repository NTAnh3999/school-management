import { useNavigate } from "react-router";
import { useAppSelector } from "@/store/hooks";
import { useListUsersQuery } from "@/store/api/iamApi";
import { useListCoursesQuery } from "@/store/api/coursesApi";
import { useListClassroomsQuery } from "@/store/api/classroomsApi";
import { useListEnrollmentsQuery } from "@/store/api/enrollmentsApi";
import { useListAuditLogsQuery } from "@/store/api/iamApi";
import { KpiCard } from "../../components/KpiCard";
import { MONO_FONT_FAMILY } from "../../theme";

// ADM-01 — School Admin Dashboard. Entry point after login: tenant-wide operational snapshot
// plus recent admin activity and quick actions (UI/UX Spec §7.1). Layout follows the Tenant
// Admin Portal design mockup's admin dashboard (KPI row + "needs attention" / quick-actions
// columns); the mockup's "Needs attention" panel is alert data the real backend doesn't expose,
// so it's replaced here with operational counts genuinely derived from the API (draft courses,
// suspended/locked accounts, pending enrollments) — same client-side aggregation pattern already
// used in ReportingDashboard.
export function Dashboard() {
  const navigate = useNavigate();
  const tenantName = useAppSelector((s) => s.auth.activeTenant?.tenant_name);

  const { data: users, isLoading: usersLoading } = useListUsersQuery();
  const { data: activeCourses, isLoading: coursesLoading } = useListCoursesQuery({
    status: "active",
    page_size: 1,
  });
  const { data: draftCourses } = useListCoursesQuery({ status: "draft", page_size: 1 });
  const { data: openClassrooms, isLoading: classroomsLoading } = useListClassroomsQuery({
    status: "open",
    page_size: 1,
  });
  const { data: activeEnrollments, isLoading: enrollmentsLoading } = useListEnrollmentsQuery({
    status: "active",
    page_size: 1,
  });
  const { data: pendingEnrollments } = useListEnrollmentsQuery({ status: "pending", page_size: 1 });
  const { data: auditLogs, isLoading: auditLoading } = useListAuditLogsQuery();

  const suspendedUsers = users?.filter((u) => u.status === "suspended" || u.status === "locked") ?? [];

  const attentionItems = [
    (draftCourses?.total ?? 0) > 0 && {
      dot: "#4F46E5",
      title: `${draftCourses!.total} course${draftCourses!.total === 1 ? "" : "s"} in draft`,
      desc: "Not yet visible to students — review and publish when ready.",
      action: "Review",
      onClick: () => navigate("/courses"),
    },
    (pendingEnrollments?.total ?? 0) > 0 && {
      dot: "#D97706",
      title: `${pendingEnrollments!.total} pending enrollment${pendingEnrollments!.total === 1 ? "" : "s"}`,
      desc: "Awaiting confirmation before the student gets classroom access.",
      action: "Review",
      onClick: () => navigate("/enrollments"),
    },
    suspendedUsers.length > 0 && {
      dot: "#DC2626",
      title: `${suspendedUsers.length} account${suspendedUsers.length === 1 ? "" : "s"} suspended or locked`,
      desc: "These users currently cannot sign in.",
      action: "Investigate",
      onClick: () => navigate("/users"),
    },
  ].filter(Boolean) as { dot: string; title: string; desc: string; action: string; onClick: () => void }[];

  const quickActions = [
    { label: "+ Add user", onClick: () => navigate("/users/invite") },
    { label: "+ Create course", onClick: () => navigate("/courses/new") },
    { label: "+ Create classroom", onClick: () => navigate("/classrooms/new") },
    { label: "+ Create enrollment", onClick: () => navigate("/enrollments/new") },
  ];

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #E7E9EE",
    borderRadius: 12,
    padding: "18px 20px",
  };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}>Dashboard</div>
        <div style={{ fontSize: 13.5, color: "#6B7280", marginTop: 3 }}>
          {tenantName ? `Overview of activity for ${tenantName}.` : "Welcome back."}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        <KpiCard label="Total users" value={users?.length ?? 0} loading={usersLoading} />
        <KpiCard label="Active courses" value={activeCourses?.total ?? 0} loading={coursesLoading} />
        <KpiCard label="Open classrooms" value={openClassrooms?.total ?? 0} loading={classroomsLoading} />
        <KpiCard label="Active enrollments" value={activeEnrollments?.total ?? 0} loading={enrollmentsLoading} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, alignItems: "start" }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12 }}>Needs attention</div>
          {attentionItems.length === 0 ? (
            <div style={{ fontSize: 13, color: "#8B93A1", padding: "8px 0" }}>
              Nothing needs attention right now.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {attentionItems.map((item) => (
                <div
                  key={item.title}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "12px 0",
                    borderTop: "1px solid #F0F1F4",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: item.dot,
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={item.onClick}
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "#7C3AED",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12 }}>Quick actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                type="button"
                onClick={qa.onClick}
                style={{
                  textAlign: "left",
                  padding: "11px 12px",
                  borderRadius: 9,
                  border: "1px solid #E7E9EE",
                  background: "#FAFBFC",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {qa.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 14.5, fontWeight: 700, margin: "20px 0 10px" }}>Recent activity</div>
          {auditLoading ? (
            <div style={{ fontSize: 12.5, color: "#8B93A1" }}>Loading…</div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#8B93A1" }}>No admin activity recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                  <span style={{ color: "#14171F", fontWeight: 600 }}>
                    {log.actor?.full_name ?? "System"}
                  </span>
                  <span style={{ color: "#6B7280" }}>
                    {" "}
                    {log.action.toLowerCase().replace(/_/g, " ")}
                    {log.entity_type ? ` (${log.entity_type}${log.entity_id ? ` #${log.entity_id}` : ""})` : ""}.
                  </span>
                  <span style={{ color: "#B0B6C0", fontFamily: MONO_FONT_FAMILY, fontSize: 11 }}>
                    {" · "}
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => navigate("/administration/audit-log")}
                style={{
                  alignSelf: "flex-start",
                  marginTop: 4,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#7C3AED",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                View full audit log
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
