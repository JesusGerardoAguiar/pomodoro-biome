import type { BiomeState } from "./types";
import { isTauriRuntime, mockGetBiomeState, mockEndSession, mockPerformAction } from "./browser-mock-backend";

// @tauri-apps/api/core has module-level side effects that assume a Tauri
// environment, so it's only imported when actually running inside Tauri —
// importing it eagerly breaks the browser-preview fallback.
async function realInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

export function getBiomeState(): Promise<BiomeState> {
  if (!isTauriRuntime()) return mockGetBiomeState();
  return realInvoke("get_biome_state");
}

export function endSession(durationMinutes: number): Promise<BiomeState> {
  if (!isTauriRuntime()) return mockEndSession(durationMinutes);
  return realInvoke("end_session", { durationMinutes });
}

export function performAction(actionName: string): Promise<BiomeState> {
  if (!isTauriRuntime()) return mockPerformAction(actionName);
  return realInvoke("perform_action", { actionName });
}
