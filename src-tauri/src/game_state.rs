use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub date: DateTime<Utc>,
    pub duration_minutes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BiomeState {
    pub current_stage: u32,
    pub total_sessions: u32,
    pub biome_type: String,
    pub last_updated: DateTime<Utc>,
    pub session_history: Vec<Session>,
}

impl BiomeState {
    pub fn new() -> Self {
        BiomeState {
            current_stage: 0,
            total_sessions: 0,
            biome_type: "forest".to_string(),
            last_updated: Utc::now(),
            session_history: vec![],
        }
    }
}

impl Default for BiomeState {
    fn default() -> Self {
        Self::new()
    }
}
