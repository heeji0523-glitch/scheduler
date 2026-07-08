"use client";

import { useState } from "react";
import Link from "next/link";
import { removeTask } from "@/lib/api";
import { STATUS_LABEL_KO, Status, Task } from "@/lib/types";

const STATUS_DOT: Record<Status, string> = {
  NOT_STARTED: "bg-white/30",
  IN_PROGRESS: "bg-amber-400",
  DONE: "bg-emerald-400",
};

function initialOf(name: string): string {
  return name.trim().slice(0, 1) || "?";
}

export default function TaskCard({
  task,
  onRemove,
  overdueLabel,
}: {
  task: Task;
  onRemove: (id: string) => void;
  overdueLabel?: string;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    setBusy(true);
    try {
      await removeTask(task.id);
      onRemove(task.id);
    } finally {
      setBusy(false);
    }
  }

  if (confirmingDelete) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-2 text-xs text-red-200">
        <span>삭제할까요?</span>
        <div className="flex gap-1">
          <button
            disabled={busy}
            onClick={confirmDelete}
            className="rounded bg-red-500 px-2 py-1 font-medium text-white hover:bg-red-400 disabled:opacity-50"
          >
            삭제
          </button>
          <button
            onClick={() => setConfirmingDelete(false)}
            className="rounded bg-white/10 px-2 py-1 text-white/70 hover:bg-white/20"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-lg border border-base-border bg-base-card px-2.5 py-2 transition hover:border-white/30 ${
        busy ? "opacity-60" : ""
      }`}
    >
      <Link href={`/task/${task.id}`} className="block pr-4">
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-[13px] leading-snug text-white/90">
          {task.content}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1 text-[10px] text-white/40">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[task.status]}`} />
            <span className="shrink-0">{STATUS_LABEL_KO[task.status]}</span>
            {overdueLabel && (
              <span className="truncate rounded-full bg-amber-400/10 px-1.5 py-0.5 text-amber-300">
                {overdueLabel}
              </span>
            )}
          </span>
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-medium text-white/80"
            title={task.author}
          >
            {initialOf(task.author)}
          </span>
        </div>
      </Link>

      <button
        aria-label="삭제"
        onClick={(e) => {
          e.preventDefault();
          setConfirmingDelete(true);
        }}
        className="absolute right-1 top-1 rounded p-1 text-[11px] text-white/25 opacity-0 transition hover:bg-white/10 hover:text-red-300 group-hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
