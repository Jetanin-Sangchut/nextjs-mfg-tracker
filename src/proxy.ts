import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { signSession, verifySession } from "@/lib/admin-session"

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

const COOKIE_NAME = "__admin_session"

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 86400,
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (pathname.startsWith("/api/")) {
    if (!token || !(await verifySession(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  const response = NextResponse.next()

  if (!token || !(await verifySession(token))) {
    response.cookies.set(COOKIE_NAME, await signSession(), cookieOptions)
  }

  return response
}
