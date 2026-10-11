import Link from "next/link";
import { DoorOpen, UserMinus } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonClass } from "./ui";

// COMMON-07 Permission Denied (design component "AccessNotice"). Always one
// CTA back to the role's home; no error codes, no red warning icon.
export function AccessNotice({
  variant = "generic",
  title = "Bạn chưa có quyền xem nội dung này",
  message = "Nội dung có thể đã thay đổi hoặc không còn dành cho tài khoản của bạn.",
  ctaLabel = "Về Trang chủ",
  ctaHref = "/dashboard",
  help,
  framed = true,
}: {
  variant?: "generic" | "revoked";
  title?: string;
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
  help?: string;
  framed?: boolean;
}) {
  const revoked = variant === "revoked";
  const Icon = revoked ? UserMinus : DoorOpen;

  return (
    <div className={cn(framed && "grid min-h-[60vh] place-items-center py-8")}>
      <div
        role="alert"
        className={cn(
          "mx-auto flex w-full max-w-[480px] flex-col items-center gap-3.5 px-7 text-center",
          framed && "rounded-3xl border border-line bg-white py-10",
        )}
      >
        <div aria-hidden className="relative h-[124px] w-[148px]">
          <div
            className={cn(
              "absolute left-[18px] top-2.5 h-[108px] w-[108px] rounded-full",
              revoked ? "bg-secondary-soft" : "bg-primary-soft",
            )}
          />
          <div className="absolute right-2 top-0 h-10 w-10 rounded-full bg-highlight-soft" />
          <div className="absolute bottom-1.5 left-0 h-6 w-6 rounded-full bg-secondary-soft" />
          <div
            className={cn(
              "absolute left-10 top-8 grid h-16 w-16 place-items-center rounded-[20px] border-2 bg-white",
              revoked ? "border-secondary text-secondary" : "border-primary text-primary",
            )}
          >
            <Icon className="h-[30px] w-[30px]" strokeWidth={1.75} />
          </div>
        </div>
        <div className="text-balance text-xl font-bold leading-snug">{title}</div>
        <div className="text-pretty text-sm leading-relaxed text-ink-2">{message}</div>
        <Link href={ctaHref} className={cn(buttonClass("primary", "lg"), "mt-1.5 min-w-[220px]")}>
          {ctaLabel}
        </Link>
        {help ? <div className="text-xs leading-normal text-muted-foreground">{help}</div> : null}
      </div>
    </div>
  );
}
