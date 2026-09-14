import { describe, it, expect, beforeEach } from "vitest";
import { mockGetBiomeState, mockEndSession } from "./browser-mock-backend";

// A minimal localStorage stand-in, since this suite runs under Vitest's
// "node" environment (see vitest.config.ts) where localStorage isn't global.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  clear() {
    this.store.clear();
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();
});

describe("browser mock backend", () => {
  it("starts at stage 0 with no progress", async () => {
    const state = await mockGetBiomeState();
    expect(state.current_stage).toBe(0);
    expect(state.total_sessions).toBe(0);
  });

  it("completing a session increments total_sessions and records history", async () => {
    const state = await mockEndSession(25);
    expect(state.total_sessions).toBe(1);
    expect(state.session_history).toHaveLength(1);
  });

  it("does not advance stage before 3 completed sessions", async () => {
    await mockEndSession(25);
    const state = await mockEndSession(25);
    expect(state.total_sessions).toBe(2);
    expect(state.current_stage).toBe(0);
  });

  it("reaching 3 completed sessions advances to stage 1", async () => {
    for (let i = 0; i < 3; i++) {
      await mockEndSession(25);
    }
    const state = await mockGetBiomeState();
    expect(state.current_stage).toBe(1);
  });
});
