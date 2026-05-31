import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "schoolhub.accessToken";

export function middleware(request: NextRequest) {
  const hasAccessToken = Boolean(
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
  );

  if (request.nextUrl.pathname === "/login" && hasAccessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login"],
};
