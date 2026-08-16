import type { ThemeConfig } from "antd";

// Design tokens ported from the "Tenant Admin Portal" Claude Design mockup
// (claude.ai/design project aff5e7bf-5d11-4be2-8d11-7e4ded70a8a6). The mockup renders with fake
// Vietnamese tenant data — only its visual language (colors, type scale, spacing, radii,
// interaction patterns) is ported here; screen content stays wired to the real api/ backend.
export const ACCENT = "#7C3AED";
export const ACCENT_HOVER = "#6D28D9";

export const FONT_FAMILY = "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const MONO_FONT_FAMILY = "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace";

export const COLOR = {
  textPrimary: "#14171F",
  textSecondary: "#6B7280",
  textTertiary: "#8B93A1",
  border: "#E7E9EE",
  borderLight: "#F0F1F4",
  bgLayout: "#F6F7F9",
  bgSubtle: "#FAFBFC",
};

// The mockup's `statusStyle()` / `roleStyle()` helpers reduce every status to a handful of pill
// colors (padding:3px 10px; border-radius:6px; font-size:12px; font-weight:700). The real
// backend has a much richer status vocabulary (see StatusTag), so each bucket below absorbs
// several real statuses rather than the mockup's literal 4.
export const STATUS_PILL_COLORS = {
  success: { bg: "#DCFCE7", text: "#166534" }, // active, published, completed, enrolled, graded...
  neutral: { bg: "#F1F5F9", text: "#475569" }, // draft, archived, inactive, withdrawn...
  warning: { bg: "#FEF3C7", text: "#92400E" }, // pending, waitlisted, suspended-pending...
  danger: { bg: "#FEE2E2", text: "#991B1B" }, // suspended, cancelled, rejected, expired, locked...
  info: { bg: "#EEF2FF", text: "#4338CA" }, // in_progress, processing, submitted...
} as const;

export type StatusBucket = keyof typeof STATUS_PILL_COLORS;

export const ROLE_PILL_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: "#F1F5F9", text: "#334155" },
  teacher: { bg: "#EEF2FF", text: "#4338CA" },
  student: { bg: "#ECFDF5", text: "#047857" },
  parent: { bg: "#FFF7ED", text: "#9A3412" },
  staff: { bg: "#F5F3FF", text: "#6D28D9" },
};

/** Shared inline-style shape for a status/role pill, matching the mockup's `statusStyle()`. */
export function pillStyle(colors: { bg: string; text: string }): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    background: colors.bg,
    color: colors.text,
    lineHeight: 1.5,
  };
}

export const antTheme: ThemeConfig = {
  token: {
    colorPrimary: ACCENT,
    colorPrimaryHover: ACCENT_HOVER,
    colorLink: ACCENT,
    colorLinkHover: ACCENT_HOVER,
    colorText: COLOR.textPrimary,
    colorTextSecondary: COLOR.textSecondary,
    colorTextTertiary: COLOR.textTertiary,
    colorBorder: COLOR.border,
    colorBorderSecondary: COLOR.borderLight,
    colorBgLayout: COLOR.bgLayout,
    fontFamily: FONT_FAMILY,
    fontSize: 13.5,
    borderRadius: 8,
    borderRadiusLG: 12,
    controlHeight: 36,
    colorSuccess: "#16A34A",
    colorWarning: "#D97706",
    colorError: "#DC2626",
  },
  components: {
    Layout: {
      bodyBg: COLOR.bgLayout,
      headerBg: "#FFFFFF",
      siderBg: "#FFFFFF",
    },
    Card: {
      borderRadiusLG: 12,
      headerFontSize: 14.5,
      colorBorderSecondary: COLOR.border,
      boxShadowTertiary: "none",
    },
    Table: {
      headerBg: COLOR.bgSubtle,
      headerColor: COLOR.textSecondary,
      borderColor: COLOR.borderLight,
      rowHoverBg: "#FAFAFC",
      cellFontSize: 13.5,
    },
    Button: {
      borderRadius: 9,
      fontWeight: 600,
      controlHeight: 38,
      primaryShadow: "none",
    },
    Input: { borderRadius: 8, controlHeight: 36 },
    Select: { borderRadius: 8, controlHeight: 36 },
    Tag: { borderRadiusSM: 6 },
    Tabs: {
      itemColor: COLOR.textSecondary,
      itemSelectedColor: ACCENT,
      itemHoverColor: ACCENT_HOVER,
      inkBarColor: ACCENT,
      titleFontSizeLG: 13.5,
    },
    Menu: {
      itemSelectedBg: `${ACCENT}14`,
      itemSelectedColor: ACCENT,
      itemHoverBg: "#F6F7F9",
      itemHoverColor: COLOR.textPrimary,
      itemColor: "#3A3F4B",
      itemBorderRadius: 8,
    },
    Modal: { borderRadiusLG: 14 },
    Badge: { colorError: "#DC2626" },
    // Default vertical-layout label padding is "0 0 8px" — tightened ~30% to bring
    // labels closer to their inputs across every form in the portal.
    Form: { verticalLabelPadding: "0 0 5px" },
  },
};
