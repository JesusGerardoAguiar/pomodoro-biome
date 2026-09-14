use crate::game_state::BiomeState;
use crate::persistence::{data_file_path, save_state};
use crate::progression::complete_session;
use std::sync::Mutex;
use tauri::State;

pub struct AppState(pub Mutex<BiomeState>);

#[tauri::command]
pub fn get_biome_state(state: State<AppState>) -> BiomeState {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
pub fn end_session(state: State<AppState>, duration_minutes: u32) -> BiomeState {
    let mut biome = state.0.lock().unwrap();
    complete_session(&mut biome, duration_minutes);
    save_state(&data_file_path(), &biome).ok();
    biome.clone()
}
