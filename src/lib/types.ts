export interface Session {
  date: string;
  duration_minutes: number;
  actions_performed: string[];
}

export interface BiomeState {
  current_stage: number;
  progress_points: number;
  total_sessions: number;
  biome_type: string;
  last_updated: string;
  unlocked_actions: string[];
  session_history: Session[];
}
