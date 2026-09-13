use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub date: DateTime<Utc>,
    pub duration_minutes: u32,
    pub actions_performed: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BiomeState {
    pub current_stage: u32,
    pub progress_points: u32,
    pub total_sessions: u32,
    pub biome_type: String,
    pub last_updated: DateTime<Utc>,
    pub unlocked_actions: Vec<String>,
    pub session_history: Vec<Session>,
}

impl BiomeState {
    pub fn new() -> Self {
        BiomeState {
            current_stage: 0,
            progress_points: 0,
            total_sessions: 0,
            biome_type: "forest".to_string(),
            last_updated: Utc::now(),
            unlocked_actions: vec![],
            session_history: vec![],
        }
    }
}

impl Default for BiomeState {
    fn default() -> Self {
        Self::new()
    }
}
