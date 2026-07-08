import { Day, Status, Task } from "./types";

async function handle(res: Response) {
  if (!res.ok) {
    let message = "요청에 실패했습니다.";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchTasks(params: {
  weekStart?: string;
  weeks?: string[];
}): Promise<Task[]> {
  const usp = new URLSearchParams();
  if (params.weekStart) usp.set("weekStart", params.weekStart);
  if (params.weeks && params.weeks.length) usp.set("weeks", params.weeks.join(","));
  const res = await fetch(`/api/tasks?${usp.toString()}`, { cache: "no-store" });
  const data = await handle(res);
  return data.tasks as Task[];
}

export async function createTask(input: {
  content: string;
  day: Day;
  weekStart: string;
  author: string;
}): Promise<Task> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await handle(res);
  return data.task as Task;
}

export async function patchTask(
  id: string,
  patch: Partial<{ content: string; day: Day; status: Status }>
): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await handle(res);
  return data.task as Task;
}

export async function removeTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  await handle(res);
}
