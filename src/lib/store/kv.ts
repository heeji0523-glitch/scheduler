import { Redis } from "@upstash/redis";
import { Task } from "../types";

// Upstash Redis (Vercel KV / Marketplace "Upstash" integration) backend.
// Vercel injects KV_REST_API_URL / KV_REST_API_TOKEN once the integration
// is connected to the project; we also accept the raw Upstash env var names
// in case someone wires it up manually.

const KEY = "scheduler:tasks";

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

let client: Redis | null = null;

function getClient(): Redis {
  if (!client) {
    if (!url || !token) {
      throw new Error("Upstash/KV 환경 변수가 설정되지 않았습니다.");
    }
    client = new Redis({ url, token });
  }
  return client;
}

export function isConfigured(): boolean {
  return Boolean(url && token);
}

export async function readAll(): Promise<Task[]> {
  const data = await getClient().get<Task[]>(KEY);
  return Array.isArray(data) ? data : [];
}

export async function writeAll(tasks: Task[]): Promise<void> {
  await getClient().set(KEY, tasks);
}
