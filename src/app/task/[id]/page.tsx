"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchTask, patchTask, removeTask } from "@/lib/api";
import { DAY_LABEL_KO, STATUSES, STATUS_LABEL_KO, Status, Task } from "@/lib/types";
import { parseISO, taskDateISO } from "@/lib/week";

const STATUS_ACCENT: Record<Status, string> = {
  NOT_STARTED: "border-white/30 text-white/70",
  IN_PROGRESS: "border-amber-400/60 text-amber-300",
  DONE: "border-emerald-400/60 text-emerald-300",
};

const STATUS_ACCENT_ACTIVE: Record<Status, string> = {
  NOT_STARTED: "bg-white text-black border-white",
  IN_PROGRESS: "bg-amber-400 text-black border-amber-400",
  DONE: "bg-emerald-400 text-black border-emerald-400",
};

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [task, setTask] = useState<Task | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState("");
  const [memo, setMemo] = useState("");
  const [savingContent, setSavingContent] = useState(false);
  const [savingMemo, setSavingMemo] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTask(id)
      .then((t) => {
        if (cancelled) return;
        setTask(t);
        setContent(t.content);
        setMemo(t.memo ?? "");
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function saveContent() {
    if (!task) return;
    const trimmed = content.trim();
    if (!trimmed || trimmed === task.content) {
      setContent(task.content);
      return;
    }
    setSavingContent(true);
    try {
      const updated = await patchTask(task.id, { content: trimmed });
      setTask(updated);
    } finally {
      setSavingContent(false);
    }
  }

  async function saveMemo() {
    if (!task) return;
    if (memo === (task.memo ?? "")) return;
    setSavingMemo(true);
    try {
      const updated = await patchTask(task.id, { memo });
      setTask(updated);
    } finally {
      setSavingMemo(false);
    }
  }

  async function changeStatus(status: Status) {
    if (!task || task.status === status) return;
    const prev = task;
    setTask({ ...task, status });
    try {
      const updated = await patchTask(task.id, { status });
      setTask(updated);
    } catch {
      setTask(prev);
    }
  }

  async function confirmDelete() {
    if (!task) return;
    await removeTask(task.id);
    router.back();
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-white/40">불러오는 중...</p>;
  }

  if (notFound || !task) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-white/60">할일을 찾을 수 없습니다. 이미 삭제되었을 수 있어요.</p>
        <Link href="/board" className="text-sm underline">
          보드로 돌아가기
        </Link>
      </div>
    );
  }

  const dateISO = taskDateISO(task.weekStart, task.day);
  const date = parseISO(dateISO);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-base-border px-2.5 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          ← 뒤로
        </button>
        <span className="text-sm text-white/40">
          {date.getMonth() + 1}월 {date.getDate()}일 ({DAY_LABEL_KO[task.day]})
        </span>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-white/40">할일 내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={saveContent}
          rows={3}
          className="w-full resize-none rounded-xl border border-base-border bg-base-card px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
        />
        {savingContent && <p className="text-[11px] text-white/30">저장 중...</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-white/40">상태</label>
        <div className="flex gap-2">
          {STATUSES.map((s) => {
            const active = task.status === s;
            return (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  active ? STATUS_ACCENT_ACTIVE[s] : STATUS_ACCENT[s]
                }`}
              >
                {STATUS_LABEL_KO[s]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/40">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px] font-medium text-white/80">
          {task.author.trim().slice(0, 1) || "?"}
        </span>
        <span>{task.author}</span>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-white/40">메모</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          onBlur={saveMemo}
          rows={5}
          placeholder="이 할일에 대한 메모를 남겨보세요"
          className="w-full resize-none rounded-xl border border-base-border bg-base-card px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
        />
        {savingMemo && <p className="text-[11px] text-white/30">저장 중...</p>}
      </div>

      <div className="border-t border-base-border pt-4">
        {confirmingDelete ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            <span>이 할일을 삭제할까요?</span>
            <div className="flex gap-1.5">
              <button
                onClick={confirmDelete}
                className="rounded bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-400"
              >
                삭제
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded bg-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/20"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-sm text-red-300/80 hover:text-red-300"
          >
            할일 삭제
          </button>
        )}
      </div>
    </div>
  );
}
