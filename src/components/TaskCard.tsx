"use client";

import { useState } from "react";
import { patchTask, removeTask } from "@/lib/api";
import { STATUSES, STATUS_LABEL_KO, Status, Task } from "@/lib/types";

const STATUS_DOT: Record<Status, string> = {
  NOT_STARTED: "bg-white/30",
  IN_PROGRESS: "bg-amber-400",
  DONE: "bg-emerald-400",
};

export default function TaskCard({
  task,
  onChange,
  onRemove,
  draggable = true,
}: {
  task: Task;
  onChange: (task: Task) => void;
  onRemove: (id: string) => void;
  draggable?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.content);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const statusIdx = STATUSES.indexOf(task.status);

  async function stepStatus(dir: -1 | 1) {
    const nextIdx = statusIdx + dir;
    if (nextIdx < 0 || nextIdx >= STATUSES.length) return;
    const nextStatus = STATUSES[nextIdx];
    setBusy(true);
    try {
      const updated = await patchTask(task.id, { status: nextStatus });
      onChange(updated);
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    const content = draft.trim();
    if (!content || content === task.content) {
      setEditing(false);
      setDraft(task.content);
      return;
    }
    setBusy(true);
    try {
      const updated = await patchTask(task.id, { content });
      onChange(updated);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await removeTask(task.id);
      onRemove(task.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      draggable={draggable && !editing}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`group rounded-xl border border-base-border bg-base-card p-3 shadow-sm transition ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${busy ? "opacity-60" : ""}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/70">
          {task.author}
        </span>
        {!confirmingDelete && (
          <div className="flex shrink-0 items-center gap-1 opacity-70 transition group-hover:opacity-100">
            <button
              aria-label="수정"
              onClick={() => setEditing((v) => !v)}
              className="rounded p-1 text-xs text-white/50 hover:bg-white/10 hover:text-white"
            >
              ✏️
            </button>
            <button
              aria-label="삭제"
              onClick={() => setConfirmingDelete(true)}
              className="rounded p-1 text-xs text-white/50 hover:bg-white/10 hover:text-red-300"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {confirmingDelete ? (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-200">
          <span>삭제할까요?</span>
          <div className="flex gap-1">
            <button
              onClick={confirmDelete}
              className="rounded bg-red-500 px-2 py-1 font-medium text-white hover:bg-red-400"
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
      ) : editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                saveEdit();
              }
              if (e.key === "Escape") {
                setEditing(false);
                setDraft(task.content);
              }
            }}
            rows={2}
            className="w-full resize-none rounded-lg border border-base-border bg-base-bg px-2 py-1.5 text-sm text-white focus:border-white/40 focus:outline-none"
          />
          <div className="flex justify-end gap-1">
            <button
              onClick={() => {
                setEditing(false);
                setDraft(task.content);
              }}
              className="rounded px-2 py-1 text-xs text-white/60 hover:bg-white/10"
            >
              취소
            </button>
            <button
              onClick={saveEdit}
              className="rounded bg-white px-2 py-1 text-xs font-medium text-black hover:bg-white/90"
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words text-sm leading-snug text-white/90">
          {task.content}
        </p>
      )}

      {!editing && !confirmingDelete && (
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50">
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[task.status]}`} />
            {STATUS_LABEL_KO[task.status]}
          </span>
          <div className="flex gap-1">
            <button
              disabled={statusIdx === 0 || busy}
              onClick={() => stepStatus(-1)}
              className="rounded px-1.5 py-0.5 text-xs text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20"
              aria-label="이전 단계"
            >
              ◀
            </button>
            <button
              disabled={statusIdx === STATUSES.length - 1 || busy}
              onClick={() => stepStatus(1)}
              className="rounded px-1.5 py-0.5 text-xs text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20"
              aria-label="다음 단계"
            >
              ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
