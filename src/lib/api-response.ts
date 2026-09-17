import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function jsonError(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}
