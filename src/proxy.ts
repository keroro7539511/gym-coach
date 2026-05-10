import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PREFIXES = ["/login", "/pair", "/_next", "/favicon", "/fonts", "/api/health"];

function getSecret() {
  const s = process.env.JWT_SECRET ?? "gym-coach-dev-secret-change-before-deploy";
  return new TextEncoder().encode(s);
}

async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 靜態資源和公開頁面直接放行
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 學員區：只匹配 /student 或 /student/... 不能誤判 /students
  if (pathname === "/student" || pathname.startsWith("/student/")) {
    const token = request.cookies.get("gs_student")?.value;
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const payload = await verifyJWT(token);
    if (!payload || payload.role !== "student") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // 教練區（其他所有路徑）
  const token = request.cookies.get("gs_coach")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  const payload = await verifyJWT(token);
  if (!payload || payload.role !== "coach") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
