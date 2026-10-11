"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Check, Lock, LogOut } from "lucide-react";

import { useLogout } from "@/app/(auth)/_feature/hooks";
import { useMyProfile, useUpdateMyProfile } from "@/_shared/profile/hooks";
import { LoadError, PageSkeleton, buttonClass, surface } from "@/components/edu/ui";
import { apiErrorStatus } from "@/lib/api-error";
import { initials } from "@/lib/format-vi";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import type { UserProfile } from "@/types/models";

// COMMON-05 My Profile (design: Desktop - Student 7i; mobile 6a–6e for the
// read, validation, success and logout states).

type Values = { display: string; email: string; phone: string };
type Field = keyof Values;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_OK = (value: string) => /^0\d{9}$/.test(value.replace(/\s/g, ""));
const LABELS: Record<Field, string> = {
  display: "Tên hiển thị",
  email: "Email liên hệ",
  phone: "Số điện thoại",
};

function validate(values: Values): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (values.display.trim().length > 60) errors.display = "Tên hiển thị tối đa 60 ký tự.";
  if (values.email.trim() && !EMAIL_RE.test(values.email.trim())) {
    errors.email = "Email chưa đúng định dạng, ví dụ: ten@gmail.com";
  }
  if (values.phone.trim() && !PHONE_OK(values.phone)) {
    errors.phone = "Số điện thoại cần 10 chữ số, bắt đầu bằng 0";
  }
  return errors;
}

function valuesOf(profile: UserProfile): Values {
  return {
    display: profile.display_name ?? "",
    email: profile.contact_email ?? "",
    phone: profile.phone_number ?? "",
  };
}

function TextField({
  field,
  value,
  error,
  type,
  autoComplete,
  inputRef,
  onChange,
  onBlur,
}: {
  field: Field;
  value: string;
  error?: string;
  type: string;
  autoComplete: string;
  inputRef: (element: HTMLInputElement | null) => void;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-2">
        {LABELS[field]}
      </label>
      <input
        id={id}
        ref={inputRef}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "h-12 rounded-xl bg-white px-3.5 text-[15px] text-ink",
          error ? "border-2 border-danger" : "border-[1.5px] border-line focus:border-primary",
        )}
      />
      {error ? (
        <span id={`${id}-error`} className="flex items-center gap-1.5 text-xs font-semibold text-danger">
          <AlertCircle aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          {error}
        </span>
      ) : null}
    </div>
  );
}

function ProfileForm({ profile, loginEmail }: { profile: UserProfile; loginEmail?: string }) {
  const update = useUpdateMyProfile();
  const [baseline, setBaseline] = useState<Values>(() => valuesOf(profile));
  const [values, setValues] = useState<Values>(baseline);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const inputs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const focusSummary = useRef(false);

  // The error summary only exists after the failed-submit render; focus it then.
  useEffect(() => {
    if (!focusSummary.current) return;
    focusSummary.current = false;
    summaryRef.current?.focus();
  });

  const errors = validate(values);
  const visibleErrors = (Object.keys(errors) as Field[]).filter((field) => tried || touched[field]);
  const dirty = (Object.keys(values) as Field[]).some((field) => values[field].trim() !== baseline[field].trim());

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (field: Field, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setSaved(false);
    setSaveError(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const invalid = Object.keys(errors) as Field[];
    if (invalid.length) {
      setTried(true);
      // Multiple errors: focus the summary; otherwise the field itself.
      if (invalid.length > 1) focusSummary.current = true;
      else inputs.current[invalid[0]]?.focus();
      return;
    }
    try {
      await update.mutateAsync({
        id: profile.id,
        data: {
          displayName: values.display.trim() || null,
          contactEmail: values.email.trim() || null,
          phoneNumber: values.phone.trim() || null,
        },
      });
      const next = {
        display: values.display.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
      };
      setBaseline(next);
      setValues(next);
      setTried(false);
      setTouched({});
      setSaved(true);
    } catch {
      setSaveError(true);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="grid content-start gap-4">
      {saved ? (
        <div role="status" className="flex items-center gap-2.5 rounded-[14px] bg-success-soft px-3.5 py-3 text-sm">
          <Check aria-hidden className="h-5 w-5 shrink-0 text-success-strong" strokeWidth={2.5} />
          <b className="font-semibold">Đã cập nhật hồ sơ thành công.</b>
        </div>
      ) : null}
      {tried && visibleErrors.length ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2.5 rounded-[14px] bg-danger-soft px-3.5 py-3 text-sm outline-none"
        >
          <AlertCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            Kiểm tra lại <b>{visibleErrors.length} trường</b> bên dưới:
            <ul className="mt-1 list-disc pl-5">
              {visibleErrors.map((field) => (
                <li key={field}>
                  <button
                    type="button"
                    onClick={() => inputs.current[field]?.focus()}
                    className="font-semibold text-danger underline"
                  >
                    {LABELS[field]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {saveError ? (
        <div role="alert" className="rounded-[14px] bg-danger-soft px-3.5 py-3 text-sm text-danger">
          Chưa lưu được thay đổi. Kiểm tra kết nối mạng rồi thử lại.
        </div>
      ) : null}

      <section className={cn(surface, "grid gap-x-[18px] gap-y-4 p-[22px] sm:grid-cols-2")}>
        <div className="flex items-center justify-between gap-3 sm:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-[.06em] text-muted-foreground">Thông tin cá nhân</h2>
          {dirty ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-warning">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warning" />
              Chưa lưu
            </span>
          ) : null}
        </div>
        <TextField
          field="display"
          type="text"
          autoComplete="nickname"
          value={values.display}
          error={visibleErrors.includes("display") ? errors.display : undefined}
          inputRef={(element) => {
            inputs.current.display = element;
          }}
          onChange={(value) => change("display", value)}
          onBlur={() => setTouched((t) => ({ ...t, display: true }))}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-2">Email đăng nhập</span>
          <div
            aria-readonly="true"
            className="flex h-12 items-center gap-2 rounded-xl border-[1.5px] border-dashed border-line bg-background px-3.5 text-sm text-muted-foreground"
          >
            <Lock aria-hidden className="h-4 w-4 shrink-0" />
            <span className="truncate">{loginEmail ?? "—"}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">Do nhà trường quản lý — không thể sửa ở đây.</span>
        </div>
        <TextField
          field="email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={visibleErrors.includes("email") ? errors.email : undefined}
          inputRef={(element) => {
            inputs.current.email = element;
          }}
          onChange={(value) => change("email", value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        />
        <TextField
          field="phone"
          type="tel"
          autoComplete="tel"
          value={values.phone}
          error={visibleErrors.includes("phone") ? errors.phone : undefined}
          inputRef={(element) => {
            inputs.current.phone = element;
          }}
          onChange={(value) => change("phone", value)}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
        />
        <p className="text-xs leading-normal text-muted-foreground sm:col-span-2">
          Họ tên, lớp và trường do nhà trường quản lý. Cần sửa, hãy liên hệ giáo viên chủ nhiệm.
        </p>
      </section>

      <div className="flex justify-end gap-2.5">
        <button
          type="button"
          disabled={!dirty || update.isPending}
          onClick={() => {
            setValues(baseline);
            setTouched({});
            setTried(false);
          }}
          className={buttonClass("outline", "lg")}
        >
          Huỷ
        </button>
        <button type="submit" disabled={!dirty || update.isPending} className={cn(buttonClass("primary", "lg"), "px-7")}>
          {update.isPending ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}

function LogoutControl() {
  const logout = useLogout();
  const [asking, setAsking] = useState(false);

  if (asking) {
    return (
      <div role="group" aria-label="Xác nhận đăng xuất" className="flex flex-col gap-3 rounded-2xl bg-danger-soft p-3.5">
        <div className="text-sm leading-normal">
          <b>Đăng xuất khỏi thiết bị này?</b>
          <br />
          <span className="text-ink-2">Tiến độ học đã được lưu.</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => setAsking(false)} className={buttonClass("outline", "md")}>
            Ở lại
          </button>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className={buttonClass("destructive", "md")}
          >
            {logout.isPending ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      </div>
    );
  }
  return (
    <button type="button" onClick={() => setAsking(true)} className={cn(buttonClass("danger", "lg"), "w-full")}>
      <LogOut aria-hidden className="h-[18px] w-[18px]" />
      Đăng xuất
    </button>
  );
}

export default function ProfilePage() {
  const user = useSessionStore((state) => state.user);
  const profileQuery = useMyProfile();
  const profile = profileQuery.data;
  const notFound = apiErrorStatus(profileQuery.error) === 404;

  if (profileQuery.isLoading) return <PageSkeleton label="Đang tải hồ sơ" />;
  if (profileQuery.isError && !notFound) {
    return <LoadError title="Không tải được hồ sơ." onRetry={() => profileQuery.refetch()} />;
  }

  const fullName = profile?.full_name ?? user?.fullName ?? "";
  const level = profile?.student_profile?.current_level;
  const roleLine = [
    profile?.profile_type === "parent" ? "Phụ huynh" : "Học sinh",
    level ? `Lớp ${level}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid max-w-[960px] gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
      <div className="grid content-start gap-4">
        <section className={cn(surface, "flex flex-col items-center gap-3 p-[22px] text-center")}>
          <span
            aria-hidden
            className="grid h-24 w-24 place-items-center rounded-full bg-primary-soft text-[32px] font-bold text-primary-strong"
          >
            {initials(fullName)}
          </span>
          <div>
            <h1 className="text-[17px] font-bold">{fullName || "Tài khoản"}</h1>
            <div className="text-[13px] text-ink-2">{roleLine}</div>
            {profile?.student_profile?.student_code ? (
              <div className="mt-0.5 text-xs text-muted-foreground">
                Mã học sinh: {profile.student_profile.student_code}
              </div>
            ) : null}
          </div>
        </section>
        <LogoutControl />
      </div>

      {profile ? (
        <ProfileForm key={profile.id} profile={profile} loginEmail={user?.email} />
      ) : (
        <section className={cn(surface, "px-6 py-8 text-sm leading-relaxed text-ink-2")}>
          Nhà trường chưa tạo hồ sơ cho tài khoản này. Liên hệ giáo viên chủ nhiệm hoặc phòng giáo vụ để được hỗ trợ.
        </section>
      )}
    </div>
  );
}
