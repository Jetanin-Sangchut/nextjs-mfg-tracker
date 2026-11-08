import { NextResponse } from "next/server"

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ data }, { status })
}

export function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}
