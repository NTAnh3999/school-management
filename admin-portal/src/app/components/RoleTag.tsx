import { pillStyle, ROLE_PILL_COLORS } from "../theme";

const humanize = (value: string) => value.replace(/\b\w/g, (c) => c.toUpperCase());

interface RoleTagProps {
  role: string | null | undefined;
}

// Role pill matching the design mockup's `roleStyle()` — one soft color per role, distinct from
// the status pill palette in StatusTag so role and status never read as the same kind of signal.
export function RoleTag({ role }: RoleTagProps) {
  if (!role) return <span style={pillStyle(ROLE_PILL_COLORS.admin)}>—</span>;
  const colors = ROLE_PILL_COLORS[role.toLowerCase()] ?? ROLE_PILL_COLORS.admin;
  return <span style={pillStyle(colors)}>{humanize(role)}</span>;
}
