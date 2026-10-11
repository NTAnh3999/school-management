import type { ComponentType, ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

// Shared building blocks for the redesigned student screens (Claude Design
// "EdTech Platform Client Redesign"). Colour pairs below are checked for
// WCAG AA text contrast; prefer the *-strong text tokens on soft tints.

type Icon = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>;

export const surface = "rounded-[18px] border border-line bg-white";

export type Tone =
  | "primary"
  | "secondary"
  | "highlight"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

const softTone: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary-strong",
  secondary: "bg-secondary-soft text-secondary",
  highlight: "bg-highlight-soft text-highlight-strong",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-muted text-ink-2",
};

export function Pill({
  tone = "neutral",
  icon: IconCmp,
  children,
  className,
}: {
  tone?: Tone;
  icon?: Icon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11px] font-bold",
        softTone[tone],
        className,
      )}
    >
      {IconCmp ? <IconCmp className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
      {children}
    </span>
  );
}

export function IconTile({
  icon: IconCmp,
  tone = "neutral",
  size = "md",
  children,
}: {
  icon?: Icon;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
}) {
  const box = { sm: "h-9 w-9 rounded-[10px]", md: "h-11 w-11 rounded-xl", lg: "h-14 w-14 rounded-[14px]" }[size];
  const glyph = { sm: "h-[18px] w-[18px]", md: "h-[22px] w-[22px]", lg: "h-7 w-7" }[size];
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center font-bold", box, softTone[tone])}
    >
      {IconCmp ? <IconCmp className={glyph} strokeWidth={1.75} /> : children}
    </span>
  );
}

export function ProgressBar({
  pct,
  className = "bg-primary",
  track = "bg-background",
  thick = false,
}: {
  pct: number;
  className?: string;
  track?: string;
  thick?: boolean;
}) {
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div className={cn("flex-1 rounded-full", thick ? "h-2.5" : "h-2", track)}>
      <div className={cn("h-full rounded-full", className)} style={{ width: `${width}%` }} />
    </div>
  );
}

type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "danger" | "destructive";
type ButtonSize = "lg" | "md" | "sm";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-strong",
  dark: "bg-ink text-white hover:bg-ink-2",
  outline: "border-[1.5px] border-line bg-white text-ink hover:bg-accent",
  ghost: "text-ink-2 hover:bg-accent",
  danger: "border-[1.5px] border-line bg-white text-danger hover:bg-danger-soft",
  destructive: "bg-danger text-white hover:bg-danger/90",
};

const sizeClass: Record<ButtonSize, string> = {
  lg: "h-[52px] rounded-[14px] px-6 text-base",
  md: "h-12 rounded-[14px] px-5 text-sm",
  sm: "h-10 rounded-xl px-3.5 text-[13px]",
};

// Class string for <button>, <Link> or <a>; one primary CTA per screen.
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variantClass[variant],
    sizeClass[size],
  );
}

export function FilterChip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-10 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold transition-colors",
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-ink-2 hover:bg-accent",
      )}
    >
      {children}
      {count !== undefined ? (
        <span className={cn("text-[11px] tabular-nums", active ? "text-white/80" : "text-muted-foreground")}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function SectionTitle({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-[17px] font-bold">{children}</h2>
      {aside}
    </div>
  );
}

export function EmptyState({
  icon: IconCmp,
  tone = "primary",
  title,
  description,
  children,
  className,
}: {
  icon: Icon;
  tone?: Tone;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-10 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("grid h-20 w-20 place-items-center rounded-full", softTone[tone])}
      >
        <IconCmp className="h-[34px] w-[34px]" strokeWidth={1.75} />
      </span>
      <div className="max-w-[420px] text-balance text-lg font-bold leading-snug">{title}</div>
      {description ? (
        <div className="max-w-[420px] text-pretty text-[13px] leading-relaxed text-ink-2">
          {description}
        </div>
      ) : null}
      {children ? <div className="mt-1 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}

export function LoadError({
  title = "Không tải được dữ liệu.",
  onRetry,
}: {
  title?: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className={cn(surface, "mx-auto flex max-w-[480px] flex-col items-center gap-3 px-6 py-10 text-center")}
    >
      <div className="text-lg font-bold">{title}</div>
      <div className="text-[13px] text-ink-2">Kiểm tra kết nối mạng rồi thử lại.</div>
      <button type="button" onClick={onRetry} className={cn(buttonClass("dark", "md"), "mt-1")}>
        Tải lại
      </button>
    </div>
  );
}

// Accent-insensitive Vietnamese search: "hinh hoc" matches "Hình học".
export function matchesQuery(text: string, query: string) {
  const fold = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  return fold(text).includes(fold(query.trim()));
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-line", className)} />;
}

export function PageSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="grid gap-5 motion-safe:animate-pulse">
      <SkeletonBlock className="h-8 w-1/3 rounded-lg" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-4">
          <div className={cn(surface, "h-40")} />
          <div className={cn(surface, "h-24")} />
          <div className={cn(surface, "h-24")} />
        </div>
        <div className="grid content-start gap-4">
          <div className={cn(surface, "h-48")} />
          <div className={cn(surface, "h-32")} />
        </div>
      </div>
    </div>
  );
}
