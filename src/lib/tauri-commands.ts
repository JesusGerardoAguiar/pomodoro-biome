import { invoke } from "@tauri-apps/api/core";
import type { BiomeState } from "./types";

export function getBiomeState(): Promise<BiomeState> {
  return invoke("get_biome_state");
}

export function endSession(durationMinutes: number): Promise<BiomeState> {
  return invoke("end_session", { durationMinutes });
}

export function performAction(actionName: string): Promise<BiomeState> {
  return invoke("perform_action", { actionName });
}
