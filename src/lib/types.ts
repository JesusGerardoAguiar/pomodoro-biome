export interface Session {
  date: string;
  duration_minutes: number;
}

export interface BiomeState {
  current_stage: number;
  total_sessions: number;
  biome_type: string;
  last_updated: string;
  session_history: Session[];
}
