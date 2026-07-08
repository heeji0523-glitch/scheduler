const KEY = "scheduler_author";

export function getStoredAuthor(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setStoredAuthor(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, name.trim());
}
