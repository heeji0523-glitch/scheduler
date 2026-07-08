import * as fileStore from "./file";
import * as kvStore from "./kv";

// Picks the storage backend at call time (not module-load time) so that
// tests/builds without env vars still work, and so the choice always
// reflects the current environment.
function backend() {
  return kvStore.isConfigured() ? kvStore : fileStore;
}

export async function readAll() {
  return backend().readAll();
}

export async function writeAll(tasks: Parameters<typeof fileStore.writeAll>[0]) {
  return backend().writeAll(tasks);
}
