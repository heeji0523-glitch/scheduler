"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import TaskCard from "@/components/TaskCard";
import QuickAddInput from "@/components/QuickAddInput";
import { useAuthor } from "@/components/AuthorProvider";
import { createTask, fetchTasks } from "@/lib/api";
import { DAY_LABEL_KO, Task } from "@/lib/types";
import { dayOfWeek, formatISO, getMonday, parseISO } from "@/lib/week";

export default function DayDetailPage() {
  const params = useParams<{ date: string }>();
  const router = useRouter();
  const { author } = useAuthor();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const dateISO = params.date;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(dateISO ?? "");
  const date = useMemo(() => (valid ? parseISO(dateISO) : new Date()), [dateISO, valid]);
  const day = useMemo(() => dayOfWeek(date), [date]);
  const weekStartISO = useMemo(() => formatISO(getMonday(date)), [date]);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    setLoading(true);
    fetchTasks({ weekStart: weekStartISO })
      .then((data) => {
        if (!cancelled) setTasks(data.filter((t) => t.day === day));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weekStartISO, day, valid]);

  if (!valid) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-white/60">잘못된 날짜입니다.</p>
        <Link href="/monthly" className="text-sm underline">
          월간 보기로 돌아가기
        </Link>
      </div>
    );
  }

  async function handleAdd(content: string) {
    if (!author) return;
    const task = await createTask({ content, day, weekStart: weekStartISO, author });
    setTasks((prev) => [...prev, task]);
  }

  function handleChange(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleRemove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-base-border px-2.5 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          ← 뒤로
        </button>
        <h1 className="text-lg font-semibold">
          {date.getMonth() + 1}월 {date.getDate()}일 ({DAY_LABEL_KO[day]})
        </h1>
        <Link
          href="/monthly"
          className="rounded-lg border border-base-border px-2.5 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          월간
        </Link>
      </div>

      {!loading && tasks.length > 0 && (
        <p className="text-sm text-white/40">
          {doneCount}/{tasks.length}개 완료
        </p>
      )}

      <QuickAddInput placeholder="이 날짜에 할일 추가하고 Enter" onAdd={handleAdd} />

      {loading ? (
        <p className="py-10 text-center text-sm text-white/40">불러오는 중...</p>
      ) : tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-base-border py-10 text-center text-sm text-white/30">
          할일 없음
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onChange={handleChange}
              onRemove={handleRemove}
              draggable={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
