import { describe, it, expect, beforeEach } from "vitest";
import { mockGetBiomeState, mockEndSession, mockPerformAction } from "./browser-mock-backend";

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
    expect(state.progress_points).toBe(0);
  });

  it("completing a session adds one point and records history", async () => {
    const state = await mockEndSession(25);
    expect(state.progress_points).toBe(1);
    expect(state.total_sessions).toBe(1);
    expect(state.session_history).toHaveLength(1);
  });

  it("reaching 5 points advances to stage 1 and unlocks plant_seed", async () => {
    for (let i = 0; i < 5; i++) {
      await mockEndSession(25);
    }
    const state = await mockGetBiomeState();
    expect(state.current_stage).toBe(1);
    expect(state.unlocked_actions).toEqual(["plant_seed"]);
  });

  it("rejects a locked action", async () => {
    await expect(mockPerformAction("water_plant")).rejects.toThrow();
  });

  it("applies an unlocked action's points", async () => {
    for (let i = 0; i < 5; i++) {
      await mockEndSession(25);
    }
    const state = await mockPerformAction("plant_seed");
    expect(state.progress_points).toBe(7);
  });
});
