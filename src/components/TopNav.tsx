"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuthor } from "./AuthorProvider";

const TABS = [
  { href: "/board", label: "보드" },
  { href: "/weekly", label: "주간" },
  { href: "/monthly", label: "월간" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { author, setAuthor } = useAuthor();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(author ?? "");

  return (
    <header className="sticky top-0 z-40 border-b border-base-border bg-base-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-1 rounded-full bg-base-panel p-1">
          {TABS.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="text-sm">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAuthor(draft);
                setEditing(false);
              }}
              className="flex items-center gap-1"
            >
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={20}
                className="w-24 rounded-md border border-base-border bg-base-card px-2 py-1 text-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-white px-2 py-1 text-xs font-medium text-black"
              >
                저장
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setDraft(author ?? "");
                setEditing(true);
              }}
              className="rounded-full border border-base-border px-3 py-1.5 text-white/70 hover:text-white"
              title="이름 변경"
            >
              {author}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
