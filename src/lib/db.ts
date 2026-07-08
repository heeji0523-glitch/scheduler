import { Status, Task, TaskInput, TaskUpdate } from "./types";
import { readAll, writeAll } from "./store";
import { taskDateISO } from "./week";

// Storage-agnostic task repository. The actual backend (local JSON file vs.
// Upstash/Vercel KV) is chosen in ./store based on environment variables.
// Writes within a single Node process are serialized through an in-memory
// queue so concurrent requests can't clobber each other's read-modify-write.
// (On serverless platforms each invocation may be its own process, so this
// only protects a single warm instance — acceptable for a small team tool.)

let writeQueue: Promise<unknown> = Promise.resolve();

/** Runs `fn` with exclusive access to the store, serialized after any pending writes. */
function withLock<T>(fn: (tasks: Task[]) => Promise<T> | T): Promise<T> {
  const run = async () => {
    const tasks = await readAll();
    return fn(tasks);
  };
  const result = writeQueue.then(run, run);
  // Keep the queue alive regardless of success/failure of this step.
  writeQueue = result.catch(() => undefined);
  return result;
}

function genId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Fills in defaults for fields added after some tasks were already stored. */
function normalize(task: Task): Task {
  return { ...task, memo: task.memo ?? "" };
}

export async function listTasks(filter?: {
  weekStart?: string;
  weekStartIn?: string[];
  /** Only tasks whose actual calendar date is strictly before this yyyy-MM-dd. */
  overdueBefore?: string;
  statusIn?: Status[];
}): Promise<Task[]> {
  const tasks = (await readAll()).map(normalize);
  let result = tasks;
  if (filter?.weekStart) {
    result = result.filter((t) => t.weekStart === filter.weekStart);
  }
  if (filter?.weekStartIn) {
    const set = new Set(filter.weekStartIn);
    result = result.filter((t) => set.has(t.weekStart));
  }
  if (filter?.overdueBefore) {
    result = result.filter((t) => taskDateISO(t.weekStart, t.day) < filter.overdueBefore!);
  }
  if (filter?.statusIn) {
    const set = new Set(filter.statusIn);
    result = result.filter((t) => set.has(t.status));
  }
  return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getTask(id: string): Promise<Task | null> {
  const tasks = await readAll();
  const found = tasks.find((t) => t.id === id);
  return found ? normalize(found) : null;
}

export async function createTask(input: TaskInput): Promise<Task> {
  return withLock(async (tasks) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: genId(),
      content: input.content.trim(),
      day: input.day,
      weekStart: input.weekStart,
      status: "NOT_STARTED",
      author: input.author.trim() || "익명",
      memo: "",
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(task);
    await writeAll(tasks);
    return task;
  });
}

export async function updateTask(
  id: string,
  patch: TaskUpdate
): Promise<Task | null> {
  return withLock(async (tasks) => {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const updated: Task = {
      ...normalize(tasks[idx]),
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    tasks[idx] = updated;
    await writeAll(tasks);
    return updated;
  });
}

export async function deleteTask(id: string): Promise<boolean> {
  return withLock(async (tasks) => {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    await writeAll(tasks);
    return true;
  });
}
