import { Tooltip } from "antd";
import { pillStyle, STATUS_PILL_COLORS, type StatusBucket } from "../theme";

// Centralizes the status → color mapping so every entity (user, course, classroom, enrollment,
// assessment, profile, membership...) reads consistently across the portal — per UI/UX spec
// 10.8 (Status Clarity): "Các entity cần status badge nhất quán". Pill shape/weight matches the
// Tenant Admin Portal design mockup's `statusStyle()`; the real backend's status vocabulary is
// richer than the mockup's 4 buckets, so each bucket below absorbs several real statuses.
const STATUS_BUCKET: Record<string, StatusBucket> = {
  active: "success",
  published: "success",
  open: "success",
  completed: "success",
  enrolled: "success",
  graded: "success",
  in_progress: "info",
  processing: "info",
  submitted: "info",
  in_review: "info",
  approved: "info",
  ready: "success",
  changes_requested: "warning",
  draft: "neutral",
  not_started: "neutral",
  inactive: "neutral",
  archived: "neutral",
  withdrawn: "neutral",
  transferred: "neutral",
  closed: "neutral",
  pending: "warning",
  pending_approval: "warning",
  waitlisted: "warning",
  waitlist: "warning",
  full: "warning",
  suspended: "danger",
  cancelled: "danger",
  rejected: "danger",
  revoked: "danger",
  expired: "danger",
  failed: "danger",
  locked: "danger",
  blocked: "danger",
  not_completed: "danger",
};

const humanize = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

interface StatusTagProps {
  status: string | null | undefined;
  tooltip?: string;
}

export function StatusTag({ status, tooltip }: StatusTagProps) {
  if (!status) return <span style={pillStyle(STATUS_PILL_COLORS.neutral)}>Unknown</span>;
  const bucket = STATUS_BUCKET[status] ?? "neutral";
  const tag = <span style={pillStyle(STATUS_PILL_COLORS[bucket])}>{humanize(status)}</span>;
  return tooltip ? <Tooltip title={tooltip}>{tag}</Tooltip> : tag;
}
