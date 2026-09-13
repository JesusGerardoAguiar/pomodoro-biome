use crate::game_state::BiomeState;
use std::path::{Path, PathBuf};

pub fn data_file_path() -> PathBuf {
    let home = std::env::var("HOME").expect("HOME environment variable must be set");
    Path::new(&home).join(".pomodoro-biome").join("data.json")
}

pub fn load_state(path: &Path) -> BiomeState {
    match std::fs::read_to_string(path) {
        Ok(contents) => serde_json::from_str(&contents).unwrap_or_else(|_| BiomeState::new()),
        Err(_) => BiomeState::new(),
    }
}

pub fn save_state(path: &Path, state: &BiomeState) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let json = serde_json::to_string_pretty(state)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    std::fs::write(path, json)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_path(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("pomodoro-biome-test-{name}-{}.json", std::process::id()))
    }

    #[test]
    fn load_state_returns_default_when_file_missing() {
        let path = temp_path("missing");
        let state = load_state(&path);
        assert_eq!(state.progress_points, 0);
        assert_eq!(state.current_stage, 0);
    }

    #[test]
    fn save_then_load_round_trips_state() {
        let path = temp_path("roundtrip");
        let mut state = BiomeState::new();
        state.progress_points = 12;
        state.current_stage = 2;
        state.total_sessions = 8;

        save_state(&path, &state).unwrap();
        let loaded = load_state(&path);

        assert_eq!(loaded.progress_points, 12);
        assert_eq!(loaded.current_stage, 2);
        assert_eq!(loaded.total_sessions, 8);

        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn load_state_returns_default_for_corrupt_file() {
        let path = temp_path("corrupt");
        std::fs::write(&path, "not valid json{{{").unwrap();

        let state = load_state(&path);
        assert_eq!(state.progress_points, 0);

        std::fs::remove_file(&path).ok();
    }
}
