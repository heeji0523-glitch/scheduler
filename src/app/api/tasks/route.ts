import { NextRequest, NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/db";
import { DAYS, STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart") ?? undefined;
  const weeksParam = searchParams.get("weeks");
  const weekStartIn = weeksParam ? weeksParam.split(",").filter(Boolean) : undefined;
  const overdueBefore = searchParams.get("overdueBefore") ?? undefined;
  const statusInParam = searchParams.get("statusIn");
  const statusIn = statusInParam
    ? statusInParam
        .split(",")
        .filter((s): s is (typeof STATUSES)[number] =>
          (STATUSES as readonly string[]).includes(s)
        )
    : undefined;

  const tasks = await listTasks({ weekStart, weekStartIn, overdueBefore, statusIn });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const { content, day, weekStart, author } = (body ?? {}) as Record<string, unknown>;

  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "할일 내용을 입력해주세요." }, { status: 400 });
  }
  if (typeof day !== "string" || !DAYS.includes(day as (typeof DAYS)[number])) {
    return NextResponse.json({ error: "요일 값이 올바르지 않습니다." }, { status: 400 });
  }
  if (typeof weekStart !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json({ error: "weekStart 값이 올바르지 않습니다." }, { status: 400 });
  }
  if (typeof author !== "string" || !author.trim()) {
    return NextResponse.json({ error: "작성자 이름이 필요합니다." }, { status: 400 });
  }

  const task = await createTask({
    content,
    day: day as (typeof DAYS)[number],
    weekStart,
    author,
  });
  return NextResponse.json({ task }, { status: 201 });
}
