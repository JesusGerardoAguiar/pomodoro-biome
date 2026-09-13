#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod game_state;
mod persistence;
mod progression;

use commands::AppState;
use persistence::{data_file_path, load_state, save_state};
use std::sync::Mutex;
use tauri::Manager;

fn main() {
    let initial_state = load_state(&data_file_path());

    tauri::Builder::default()
        .manage(AppState(Mutex::new(initial_state)))
        .invoke_handler(tauri::generate_handler![
            commands::get_biome_state,
            commands::end_session,
            commands::perform_action,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let state = window.state::<AppState>();
                let biome = state.0.lock().unwrap();
                save_state(&data_file_path(), &biome).ok();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
