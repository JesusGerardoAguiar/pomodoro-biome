import type { BiomeState } from "./types";

// Mirrors src-tauri/src/progression.rs — used only when no Tauri bridge is
// present (e.g. previewing the app in a regular browser tab), so the biome
// timer/action flow can still be exercised without a native backend.

const STAGE_THRESHOLDS = [0, 5, 10, 15, 20, 25, 30];

interface ActionDef {
  name: string;
  unlockStage: number;
  points: number;
}

const ACTION_DEFS: ActionDef[] = [
  { name: "plant_seed", unlockStage: 1, points: 2 },
  { name: "water_plant", unlockStage: 2, points: 1 },
  { name: "add_nutrients", unlockStage: 3, points: 3 },
  { name: "tend_ecosystem", unlockStage: 4, points: 2 },
];

const STORAGE_KEY = "pomodoro-biome-mock-state";

function stageForPoints(points: number): number {
  let stage = 0;
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (points >= STAGE_THRESHOLDS[i]) stage = i;
  }
  return stage;
}

function unlockedActionsForStage(stage: number): string[] {
  return ACTION_DEFS.filter((a) => stage >= a.unlockStage).map((a) => a.name);
}

function defaultState(): BiomeState {
  return {
    current_stage: 0,
    progress_points: 0,
    total_sessions: 0,
    biome_type: "forest",
    last_updated: new Date().toISOString(),
    unlocked_actions: [],
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
  state.progress_points += 1;
  state.total_sessions += 1;
  state.current_stage = stageForPoints(state.progress_points);
  state.unlocked_actions = unlockedActionsForStage(state.current_stage);
  state.last_updated = new Date().toISOString();
  state.session_history.push({
    date: state.last_updated,
    duration_minutes: durationMinutes,
    actions_performed: [],
  });
  saveState(state);
  return state;
}

export async function mockPerformAction(actionName: string): Promise<BiomeState> {
  const state = loadState();
  const def = ACTION_DEFS.find((a) => a.name === actionName);
  if (!def) {
    throw new Error(`Unknown action: ${actionName}`);
  }
  if (state.current_stage < def.unlockStage) {
    throw new Error(
      `Action '${actionName}' requires stage ${def.unlockStage}, current stage is ${state.current_stage}`,
    );
  }

  state.progress_points += def.points;
  state.current_stage = stageForPoints(state.progress_points);
  state.unlocked_actions = unlockedActionsForStage(state.current_stage);
  state.last_updated = new Date().toISOString();

  const lastSession = state.session_history[state.session_history.length - 1];
  if (lastSession) {
    lastSession.actions_performed.push(actionName);
  }

  saveState(state);
  return state;
}
