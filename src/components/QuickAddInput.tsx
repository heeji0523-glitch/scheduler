"use client";

import { useState } from "react";

export default function QuickAddInput({
  onAdd,
  placeholder = "할일을 입력하고 Enter",
  compact = false,
}: {
  onAdd: (content: string) => Promise<void> | void;
  placeholder?: string;
  compact?: boolean;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const content = value.trim();
    if (!content || busy) return;
    setBusy(true);
    try {
      await onAdd(content);
      setValue("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        disabled={busy}
        className={`w-full rounded-lg border border-base-border bg-base-card text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
        }`}
      />
      <button
        onClick={submit}
        disabled={busy || !value.trim()}
        className={`shrink-0 rounded-lg bg-white font-medium text-black transition disabled:cursor-not-allowed disabled:opacity-30 ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        추가
      </button>
    </div>
  );
}
