// Vietnamese display helpers shared by the redesigned student screens.

function words(fullName?: string | null) {
  return (fullName ?? "").trim().split(/\s+/).filter(Boolean);
}

// Vietnamese names put the given name last: "Nguyễn Minh An" -> "An".
export function givenName(fullName?: string | null) {
  const parts = words(fullName);
  return parts[parts.length - 1] ?? "";
}

// Short display name used in the header pill: "Nguyễn Minh An" -> "Minh An".
export function shortName(fullName?: string | null) {
  return words(fullName).slice(-2).join(" ");
}

// Avatar initials from the last two words: "Nguyễn Minh An" -> "MA".
export function initials(fullName?: string | null) {
  const letters = words(fullName)
    .slice(-2)
    .map((word) => word[0])
    .join("");
  return letters.toUpperCase() || "?";
}

export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 13) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const relative = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// "1 giờ trước", "Hôm qua", "24/09"
export function relativeTimeVi(value: string | Date, now = new Date()) {
  const date = new Date(value);
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return relative.format(-minutes, "minute");
  if (minutes < 60 * 12) return relative.format(-Math.round(minutes / 60), "hour");

  const days = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000,
  );
  if (days <= 1) return capitalize(relative.format(-days, "day"));
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// "Hôm qua, 20:14", "Hôm nay, 08:30", "24/09, 10:11"
export function dayTimeVi(value: string | Date, now = new Date()) {
  const date = new Date(value);
  const days = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000,
  );
  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const day =
    days === 0
      ? "Hôm nay"
      : days === 1
        ? "Hôm qua"
        : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  return `${day}, ${time}`;
}
