import { NextRequest, NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/lib/db";
import { DAYS, STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const { content, day, status } = (body ?? {}) as Record<string, unknown>;
  const patch: { content?: string; day?: (typeof DAYS)[number]; status?: (typeof STATUSES)[number] } = {};

  if (content !== undefined) {
    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "할일 내용을 입력해주세요." }, { status: 400 });
    }
    patch.content = content.trim();
  }
  if (day !== undefined) {
    if (typeof day !== "string" || !DAYS.includes(day as (typeof DAYS)[number])) {
      return NextResponse.json({ error: "요일 값이 올바르지 않습니다." }, { status: 400 });
    }
    patch.day = day as (typeof DAYS)[number];
  }
  if (status !== undefined) {
    if (typeof status !== "string" || !STATUSES.includes(status as (typeof STATUSES)[number])) {
      return NextResponse.json({ error: "상태 값이 올바르지 않습니다." }, { status: 400 });
    }
    patch.status = status as (typeof STATUSES)[number];
  }

  const task = await updateTask(params.id, patch);
  if (!task) {
    return NextResponse.json({ error: "할일을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ task });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ok = await deleteTask(params.id);
  if (!ok) {
    return NextResponse.json({ error: "할일을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
