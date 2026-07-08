"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getStoredAuthor, setStoredAuthor } from "@/lib/author";

interface AuthorContextValue {
  author: string | null;
  setAuthor: (name: string) => void;
}

const AuthorContext = createContext<AuthorContextValue>({
  author: null,
  setAuthor: () => {},
});

export function useAuthor() {
  return useContext(AuthorContext);
}

export default function AuthorProvider({ children }: { children: React.ReactNode }) {
  const [author, setAuthorState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setAuthorState(getStoredAuthor());
    setReady(true);
  }, []);

  const setAuthor = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setStoredAuthor(trimmed);
    setAuthorState(trimmed);
  }, []);

  if (!ready) return null;

  if (!author) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAuthor(draft);
          }}
          className="w-full max-w-sm rounded-2xl border border-base-border bg-base-panel p-6 shadow-xl"
        >
          <h2 className="text-lg font-semibold text-white">이름을 입력해주세요</h2>
          <p className="mt-1 text-sm text-white/60">
            팀 할일에 작성자로 표시돼요. 로그인 없이 이 브라우저에만 저장됩니다.
          </p>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="예: 희지"
            maxLength={20}
            className="mt-4 w-full rounded-lg border border-base-border bg-base-card px-3 py-2 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="mt-4 w-full rounded-lg bg-white py-2 font-medium text-black transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            시작하기
          </button>
        </form>
      </div>
    );
  }

  return (
    <AuthorContext.Provider value={{ author, setAuthor }}>
      {children}
    </AuthorContext.Provider>
  );
}
