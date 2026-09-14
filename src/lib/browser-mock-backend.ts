import type { BiomeState } from "./types";

// Mirrors src-tauri/src/progression.rs — used only when no Tauri bridge is
// present (e.g. previewing the app in a regular browser tab), so the biome
// timer flow can still be exercised without a native backend.

const STAGE_THRESHOLDS = [0, 3, 6, 9, 12, 15, 18];

const STORAGE_KEY = "pomodoro-biome-mock-state";

function stageForSessions(totalSessions: number): number {
  let stage = 0;
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (totalSessions >= STAGE_THRESHOLDS[i]) stage = i;
  }
  return stage;
}

function defaultState(): BiomeState {
  return {
    current_stage: 0,
    total_sessions: 0,
    biome_type: "forest",
    last_updated: new Date().toISOString(),
    session_history: [],
  };
}

function loadState(): BiomeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw) as BiomeState;
  } catch {
    return defaultState();
  }
}

function saveState(state: BiomeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // browser preview only — persistence failure here is not fatal
  }
}

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function mockGetBiomeState(): Promise<BiomeState> {
  return loadState();
}

export async function mockEndSession(durationMinutes: number): Promise<BiomeState> {
  const state = loadState();
  state.total_sessions += 1;
  state.current_stage = stageForSessions(state.total_sessions);
  state.last_updated = new Date().toISOString();
  state.session_history.push({
    date: state.last_updated,
    duration_minutes: durationMinutes,
  });
  saveState(state);
  return state;
}
