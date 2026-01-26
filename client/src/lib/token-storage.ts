const ACCESS_TOKEN_COOKIE = "schoolhub.accessToken";
const DEFAULT_MAX_AGE = 60 * 15; // 15 minutes

const getCookieString = () => {
  if (typeof document === "undefined") return "";
  return document.cookie ?? "";
};

export const getAccessTokenFromCookie = (): string | null => {
  const cookieString = getCookieString();
  if (!cookieString) return null;
  const cookies = cookieString.split(";").map((cookie) => cookie.trim());
  const entry = cookies.find((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
  if (!entry) return null;
  return decodeURIComponent(entry.split("=")[1]);
};

export const persistAccessTokenCookie = (token: string | null, maxAgeSeconds = DEFAULT_MAX_AGE) => {
  if (typeof document === "undefined") return;
  if (!token) {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; sameSite=Lax`;
    return;
  }
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; sameSite=Lax`;
};

export const clearAccessTokenCookie = () => {
  persistAccessTokenCookie(null);
};
