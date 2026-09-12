# Pomodoro Biome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working POC of Pomodoro Biome — a Tauri (Rust + React) macOS app where completing 25-minute Pomodoro sessions grows a 7-stage biome, with optional break-time actions to accelerate growth.

**Architecture:** Rust backend (Tauri) owns all game state (biome progression, session history) behind a `Mutex<GameState>`, exposing commands the React frontend calls via `@tauri-apps/api`. Frontend is presentation-only: it renders the timer, biome canvas, and break actions, and never computes progression itself — every state change happens in Rust and is returned to the frontend to render.

**Tech Stack:** Rust (via rustup), Tauri 2.x, serde/serde_json, chrono. React 18 + TypeScript + Vite for the frontend. Vitest for frontend unit tests, `cargo test` for Rust unit tests.

**Spec:** [docs/superpowers/specs/2026-09-12-pomodoro-biome-design.md](../specs/2026-09-12-pomodoro-biome-design.md)

## Global Constraints

- Local-only persistence — no network calls, no cloud sync (spec: Data Storage).
- Biome progression logic lives entirely in Rust — the frontend only displays state Rust returns (spec: Data Flow).
- 7 fixed stages for this POC (Approach A), data structures must not preclude adding `biome_type` variants or multiple living things later (spec: Future Extensions).
- State persists to `~/.pomodoro-biome/data.json`, loaded on startup, saved after every session/action and on quit (spec: Data Persistence).
- Session = 25 minutes, break = 5 minutes (spec: Overview, confirmed in conversation).

---

## File Structure

```
pomodoro-biome/
├── package.json                 # root frontend + tauri CLI deps
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── index.html
├── vitest.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── lib/
│   │   ├── types.ts             # TS mirrors of Rust BiomeState/Session
│   │   ├── tauri-commands.ts    # invoke() wrappers
│   │   ├── time.ts              # formatTime() pure fn + test
│   │   └── biome-visuals.ts     # stage -> label/color mapping + test
│   ├── components/
│   │   ├── Timer.tsx
│   │   ├── BiomeView.tsx
│   │   ├── BreakActions.tsx
│   │   └── ProgressBar.tsx
│   └── pages/
│       └── Main.tsx
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    ├── capabilities/
    │   └── default.json
    └── src/
        ├── main.rs
        ├── game_state.rs        # structs: BiomeState, Session, GameState
        ├── progression.rs       # pure progression logic + unit tests
        ├── persistence.rs       # load/save JSON + unit tests
        └── commands.rs          # #[tauri::command] handlers
```

---

### Task 1: Install Rust and scaffold the Tauri + React project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/capabilities/default.json`
- Create: `src-tauri/src/main.rs`

**Interfaces:**
- Produces: a running Tauri shell that opens a blank window titled "Pomodoro Biome" — later tasks fill in real UI and commands.

- [ ] **Step 1: Install Rust via rustup**

Run:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```
Expected: `cargo --version` and `rustc --version` print version numbers afterward.

- [ ] **Step 2: Verify Rust install**

Run: `source "$HOME/.cargo/env" && cargo --version && rustc --version`
Expected: two version lines, no "command not found" errors.

- [ ] **Step 3: Create root `package.json`**

```json
{
  "name": "pomodoro-biome",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "test": "vitest run"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.1.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.1.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: true,
  },
});
```

- [ ] **Step 5: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 6: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Pomodoro Biome</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create `src/main.tsx`**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 9: Create placeholder `src/App.tsx` and `src/App.css`**

```typescript
function App() {
  return (
    <div className="app">
      <h1>Pomodoro Biome</h1>
      <p>Scaffold running.</p>
    </div>
  );
}

export default App;
```

```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #1a1f16;
  color: #e8ede4;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
}
```

- [ ] **Step 10: Create `src-tauri/Cargo.toml`**

```toml
[package]
name = "pomodoro-biome"
version = "0.1.0"
description = "A Pomodoro timer that grows a biome as you work"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }

[[bin]]
name = "pomodoro-biome"
path = "src/main.rs"
```

- [ ] **Step 11: Create `src-tauri/build.rs`**

```rust
fn main() {
    tauri_build::build()
}
```

- [ ] **Step 12: Create `src-tauri/tauri.conf.json`**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Pomodoro Biome",
  "version": "0.1.0",
  "identifier": "com.jesusaguiar.pomodoro-biome",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Pomodoro Biome",
        "width": 480,
        "height": 720,
        "resizable": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["app"],
    "icon": []
  }
}
```

- [ ] **Step 13: Create `src-tauri/capabilities/default.json`**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default permissions for the main window",
  "windows": ["main"],
  "permissions": ["core:default"]
}
```

- [ ] **Step 14: Create minimal `src-tauri/src/main.rs`**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 15: Install frontend dependencies**

Run: `npm install`
Expected: `node_modules/` populated, no errors.

- [ ] **Step 16: Verify the shell builds and launches**

Run:
```bash
source "$HOME/.cargo/env"
npm run tauri dev
```
Expected: a window opens titled "Pomodoro Biome" showing "Scaffold running." Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 17: Commit**

```bash
git add package.json vite.config.ts tsconfig.json tsconfig.node.json index.html src/main.tsx src/App.tsx src/App.css src-tauri/
git commit -m "Scaffold Tauri + React project shell

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Core Rust types and pure progression logic

**Files:**
- Create: `src-tauri/src/game_state.rs`
- Create: `src-tauri/src/progression.rs`
- Modify: `src-tauri/src/main.rs` (add `mod` declarations)

**Interfaces:**
- Consumes: nothing (pure domain layer, no Tauri dependency)
- Produces:
  - `game_state::BiomeState { current_stage: u32, progress_points: u32, total_sessions: u32, biome_type: String, last_updated: chrono::DateTime<chrono::Utc>, unlocked_actions: Vec<String>, session_history: Vec<Session> }`
  - `game_state::Session { date: chrono::DateTime<chrono::Utc>, duration_minutes: u32, actions_performed: Vec<String> }`
  - `game_state::BiomeState::new() -> BiomeState`
  - `progression::STAGE_THRESHOLDS: [u32; 7]` (points required to *enter* each stage: `[0, 5, 10, 15, 20, 25, 30]`)
  - `progression::stage_for_points(points: u32) -> u32`
  - `progression::action_definitions() -> Vec<ActionDef>` where `ActionDef { name: &'static str, unlock_stage: u32, points: u32 }`
  - `progression::unlocked_actions_for_stage(stage: u32) -> Vec<String>`
  - `progression::complete_session(state: &mut BiomeState, duration_minutes: u32)`
  - `progression::apply_action(state: &mut BiomeState, action_name: &str) -> Result<(), String>`

- [ ] **Step 1: Write `src-tauri/src/game_state.rs`**

```rust
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
```

- [ ] **Step 2: Write failing unit tests in `src-tauri/src/progression.rs`**

```rust
use crate::game_state::BiomeState;

pub const STAGE_THRESHOLDS: [u32; 7] = [0, 5, 10, 15, 20, 25, 30];

pub struct ActionDef {
    pub name: &'static str,
    pub unlock_stage: u32,
    pub points: u32,
}

pub fn action_definitions() -> Vec<ActionDef> {
    vec![
        ActionDef { name: "plant_seed", unlock_stage: 1, points: 2 },
        ActionDef { name: "water_plant", unlock_stage: 2, points: 1 },
        ActionDef { name: "add_nutrients", unlock_stage: 3, points: 3 },
        ActionDef { name: "tend_ecosystem", unlock_stage: 4, points: 2 },
    ]
}

pub fn stage_for_points(points: u32) -> u32 {
    let mut stage = 0;
    for (i, &threshold) in STAGE_THRESHOLDS.iter().enumerate() {
        if points >= threshold {
            stage = i as u32;
        }
    }
    stage
}

pub fn unlocked_actions_for_stage(stage: u32) -> Vec<String> {
    action_definitions()
        .into_iter()
        .filter(|a| stage >= a.unlock_stage)
        .map(|a| a.name.to_string())
        .collect()
}

pub fn complete_session(state: &mut BiomeState, duration_minutes: u32) {
    state.progress_points += 1;
    state.total_sessions += 1;
    state.current_stage = stage_for_points(state.progress_points);
    state.unlocked_actions = unlocked_actions_for_stage(state.current_stage);
    state.last_updated = chrono::Utc::now();
    state.session_history.push(crate::game_state::Session {
        date: state.last_updated,
        duration_minutes,
        actions_performed: vec![],
    });
}

pub fn apply_action(state: &mut BiomeState, action_name: &str) -> Result<(), String> {
    let def = action_definitions()
        .into_iter()
        .find(|a| a.name == action_name)
        .ok_or_else(|| format!("Unknown action: {action_name}"))?;

    if state.current_stage < def.unlock_stage {
        return Err(format!(
            "Action '{action_name}' requires stage {}, current stage is {}",
            def.unlock_stage, state.current_stage
        ));
    }

    state.progress_points += def.points;
    state.current_stage = stage_for_points(state.progress_points);
    state.unlocked_actions = unlocked_actions_for_stage(state.current_stage);
    state.last_updated = chrono::Utc::now();

    if let Some(last_session) = state.session_history.last_mut() {
        last_session.actions_performed.push(action_name.to_string());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stage_for_points_at_stage_boundaries() {
        assert_eq!(stage_for_points(0), 0);
        assert_eq!(stage_for_points(4), 0);
        assert_eq!(stage_for_points(5), 1);
        assert_eq!(stage_for_points(29), 5);
        assert_eq!(stage_for_points(30), 6);
        assert_eq!(stage_for_points(100), 6);
    }

    #[test]
    fn complete_session_adds_one_point_and_records_history() {
        let mut state = BiomeState::new();
        complete_session(&mut state, 25);

        assert_eq!(state.progress_points, 1);
        assert_eq!(state.total_sessions, 1);
        assert_eq!(state.current_stage, 0);
        assert_eq!(state.session_history.len(), 1);
        assert_eq!(state.session_history[0].duration_minutes, 25);
    }

    #[test]
    fn complete_session_advances_stage_at_threshold() {
        let mut state = BiomeState::new();
        state.progress_points = 4;
        complete_session(&mut state, 25);

        assert_eq!(state.progress_points, 5);
        assert_eq!(state.current_stage, 1);
        assert_eq!(state.unlocked_actions, vec!["plant_seed".to_string()]);
    }

    #[test]
    fn apply_action_rejects_locked_action() {
        let mut state = BiomeState::new();
        let result = apply_action(&mut state, "water_plant");
        assert!(result.is_err());
        assert_eq!(state.progress_points, 0);
    }

    #[test]
    fn apply_action_rejects_unknown_action() {
        let mut state = BiomeState::new();
        state.current_stage = 5;
        let result = apply_action(&mut state, "dance");
        assert!(result.is_err());
    }

    #[test]
    fn apply_action_adds_points_and_updates_last_session() {
        let mut state = BiomeState::new();
        complete_session(&mut state, 25); // stage 0, 1 point
        state.progress_points = 5;
        state.current_stage = 1;

        apply_action(&mut state, "plant_seed").unwrap();

        assert_eq!(state.progress_points, 7);
        assert_eq!(
            state.session_history.last().unwrap().actions_performed,
            vec!["plant_seed".to_string()]
        );
    }
}
```

- [ ] **Step 3: Register modules in `src-tauri/src/main.rs`**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod game_state;
mod progression;

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: Run the tests**

Run:
```bash
source "$HOME/.cargo/env"
cd src-tauri && cargo test
```
Expected: all 5 tests in `progression::tests` pass. `game_state` compiles with no warnings about unused code (it's used by `progression.rs` and `main.rs`).

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/game_state.rs src-tauri/src/progression.rs src-tauri/src/main.rs
git commit -m "Add BiomeState model and progression logic with unit tests

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Persistence layer (load/save JSON)

**Files:**
- Create: `src-tauri/src/persistence.rs`
- Modify: `src-tauri/src/main.rs` (add `mod persistence`)

**Interfaces:**
- Consumes: `game_state::BiomeState` (from Task 2)
- Produces:
  - `persistence::data_file_path() -> std::path::PathBuf` — resolves to `~/.pomodoro-biome/data.json`
  - `persistence::load_state(path: &std::path::Path) -> BiomeState` — returns `BiomeState::new()` if file missing or unparseable
  - `persistence::save_state(path: &std::path::Path, state: &BiomeState) -> std::io::Result<()>`

- [ ] **Step 1: Write `src-tauri/src/persistence.rs` with tests**

```rust
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
```

- [ ] **Step 2: Register module in `src-tauri/src/main.rs`**

```rust
mod game_state;
mod persistence;
mod progression;
```

- [ ] **Step 3: Run tests**

Run: `cd src-tauri && cargo test`
Expected: 3 new tests in `persistence::tests` pass, plus the 5 from Task 2 still pass (8 total).

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/persistence.rs src-tauri/src/main.rs
git commit -m "Add JSON persistence layer with load/save tests

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Tauri commands wiring state, progression, and persistence together

**Files:**
- Create: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs` (managed state, command registration, save-on-close)

**Interfaces:**
- Consumes: `game_state::BiomeState`, `progression::{complete_session, apply_action}`, `persistence::{load_state, save_state, data_file_path}`
- Produces (Tauri commands invokable from the frontend as `invoke("command_name", args)`):
  - `get_biome_state() -> BiomeState`
  - `end_session(duration_minutes: u32) -> BiomeState`
  - `perform_action(action_name: String) -> Result<BiomeState, String>`

Note: `start_session` needs no Rust-side state change (the countdown is purely a frontend concern per the spec's data flow — Rust only needs to know when a session *completes*), so it is intentionally omitted; the frontend just starts its own countdown. This keeps the command surface minimal or the plan and spec become inconsistent — the spec's `start_session()` command is a no-op with no state to mutate, so we skip it here and note the deviation in the commit message.

- [ ] **Step 1: Write `src-tauri/src/commands.rs`**

```rust
use crate::game_state::BiomeState;
use crate::persistence::{data_file_path, save_state};
use crate::progression::{apply_action, complete_session};
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

#[tauri::command]
pub fn perform_action(state: State<AppState>, action_name: String) -> Result<BiomeState, String> {
    let mut biome = state.0.lock().unwrap();
    apply_action(&mut biome, &action_name)?;
    save_state(&data_file_path(), &biome).ok();
    Ok(biome.clone())
}
```

Note: this requires `#[derive(Clone)]` on `BiomeState` and `Session` — add it now.

- [ ] **Step 2: Add `Clone` derive to `game_state.rs`**

In `src-tauri/src/game_state.rs`, change both derive lines:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
```

and

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BiomeState {
```

(These should already say `Clone` if you copied Task 2's code verbatim — verify both structs have it before moving on.)

- [ ] **Step 3: Wire everything into `src-tauri/src/main.rs`**

```rust
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
```

- [ ] **Step 4: Run existing tests to confirm nothing broke**

Run: `cd src-tauri && cargo test`
Expected: all 8 tests from Tasks 2-3 still pass. `cargo build` succeeds with no errors.

- [ ] **Step 5: Manually verify commands are wired**

Run:
```bash
source "$HOME/.cargo/env"
npm run tauri dev
```
Expected: app launches with no console errors about missing commands. (Frontend doesn't call them yet — this just confirms the Rust side compiles and registers correctly.) Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/commands.rs src-tauri/src/game_state.rs src-tauri/src/main.rs
git commit -m "Wire Tauri commands to progression and persistence layers

Deviates from spec's command list: start_session/save_progress are
omitted since the countdown is frontend-only and every mutating
command already persists on write.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Frontend types and Tauri command wrappers

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/tauri-commands.ts`

**Interfaces:**
- Consumes: nothing yet (will be called by components in later tasks)
- Produces:
  - `types.ts`: `interface Session { date: string; duration_minutes: number; actions_performed: string[] }`, `interface BiomeState { current_stage: number; progress_points: number; total_sessions: number; biome_type: string; last_updated: string; unlocked_actions: string[]; session_history: Session[] }`
  - `tauri-commands.ts`: `getBiomeState(): Promise<BiomeState>`, `endSession(durationMinutes: number): Promise<BiomeState>`, `performAction(actionName: string): Promise<BiomeState>`

- [ ] **Step 1: Write `src/lib/types.ts`**

```typescript
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
```

- [ ] **Step 2: Write `src/lib/tauri-commands.ts`**

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/tauri-commands.ts
git commit -m "Add frontend types and Tauri command wrappers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Timer countdown logic and component

**Files:**
- Create: `src/lib/time.ts`
- Create: `src/lib/time.test.ts`
- Create: `src/components/Timer.tsx`
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `time.ts`: `formatTime(totalSeconds: number): string` — formats as `MM:SS`
  - `Timer.tsx`: `<Timer durationSeconds={number} onComplete={() => void} isRunning={boolean} onToggle={() => void} />`

- [ ] **Step 1: Write `vitest.config.ts`**

All tests in this plan are pure-function tests (no component rendering), so the default Node test environment is sufficient — no `jsdom` or `@testing-library/react` needed.

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 2: Write failing test `src/lib/time.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { formatTime } from "./time";

describe("formatTime", () => {
  it("formats zero as 00:00", () => {
    expect(formatTime(0)).toBe("00:00");
  });

  it("formats seconds under a minute", () => {
    expect(formatTime(45)).toBe("00:45");
  });

  it("formats exactly one minute", () => {
    expect(formatTime(60)).toBe("01:00");
  });

  it("formats 25 minutes", () => {
    expect(formatTime(25 * 60)).toBe("25:00");
  });

  it("pads single-digit seconds", () => {
    expect(formatTime(65)).toBe("01:05");
  });
});
```

- [ ] **Step 3: Run test, confirm it fails**

Run: `npx vitest run src/lib/time.test.ts`
Expected: FAIL — `time.ts` module not found.

- [ ] **Step 4: Write `src/lib/time.ts`**

```typescript
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
```

- [ ] **Step 5: Run test, confirm it passes**

Run: `npx vitest run src/lib/time.test.ts`
Expected: PASS, all 5 tests green.

- [ ] **Step 6: Write `src/components/Timer.tsx`**

```typescript
import { useEffect, useRef, useState } from "react";
import { formatTime } from "../lib/time";

interface TimerProps {
  durationSeconds: number;
  isRunning: boolean;
  onToggle: () => void;
  onComplete: () => void;
}

export function Timer({ durationSeconds, isRunning, onToggle, onComplete }: TimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="timer">
      <div className="timer-display">{formatTime(remaining)}</div>
      <button onClick={onToggle}>{isRunning ? "Pause" : "Start"}</button>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts src/lib/time.ts src/lib/time.test.ts src/components/Timer.tsx
git commit -m "Add Timer component with tested countdown formatting

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Biome visuals mapping and BiomeView component

**Files:**
- Create: `src/lib/biome-visuals.ts`
- Create: `src/lib/biome-visuals.test.ts`
- Create: `src/components/BiomeView.tsx`

**Interfaces:**
- Consumes: `BiomeState.current_stage` (from Task 5's types)
- Produces:
  - `biome-visuals.ts`: `STAGE_INFO: { name: string; color: string; emoji: string }[]` (index 0-6), `getStageInfo(stage: number): { name: string; color: string; emoji: string }`
  - `BiomeView.tsx`: `<BiomeView stage={number} />`

Placeholder visuals (colored panel + emoji + label) stand in for real pixel art — the spec flags asset sourcing as an open question (Known Unknowns). Swapping in real sprites later only touches `biome-visuals.ts` and `BiomeView.tsx`.

- [ ] **Step 1: Write failing test `src/lib/biome-visuals.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { getStageInfo, STAGE_INFO } from "./biome-visuals";

describe("getStageInfo", () => {
  it("has exactly 7 stages", () => {
    expect(STAGE_INFO).toHaveLength(7);
  });

  it("returns the seed stage for 0", () => {
    expect(getStageInfo(0).name).toBe("Seed");
  });

  it("returns the thriving ecosystem stage for 6", () => {
    expect(getStageInfo(6).name).toBe("Thriving Ecosystem");
  });

  it("clamps out-of-range stages to the last stage", () => {
    expect(getStageInfo(99).name).toBe("Thriving Ecosystem");
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

Run: `npx vitest run src/lib/biome-visuals.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/biome-visuals.ts`**

```typescript
export interface StageInfo {
  name: string;
  color: string;
  emoji: string;
}

export const STAGE_INFO: StageInfo[] = [
  { name: "Seed", color: "#3d3223", emoji: "\u{1FAD8}" },
  { name: "Sprout", color: "#4a5c2e", emoji: "\u{1F331}" },
  { name: "Young Plant", color: "#4f6b2f", emoji: "\u{1F33F}" },
  { name: "Growing Plant", color: "#548238", emoji: "\u{1F33E}" },
  { name: "Mature Plant", color: "#5a9440", emoji: "\u{1F333}" },
  { name: "Blooming", color: "#6bab4a", emoji: "\u{1F338}" },
  { name: "Thriving Ecosystem", color: "#7fc25a", emoji: "\u{1F30D}" },
];

export function getStageInfo(stage: number): StageInfo {
  const index = Math.min(Math.max(stage, 0), STAGE_INFO.length - 1);
  return STAGE_INFO[index];
}
```

- [ ] **Step 4: Run test, confirm it passes**

Run: `npx vitest run src/lib/biome-visuals.test.ts`
Expected: PASS, all 4 tests green.

- [ ] **Step 5: Write `src/components/BiomeView.tsx`**

```typescript
import { getStageInfo } from "../lib/biome-visuals";

interface BiomeViewProps {
  stage: number;
}

export function BiomeView({ stage }: BiomeViewProps) {
  const info = getStageInfo(stage);

  return (
    <div className="biome-view" style={{ backgroundColor: info.color }}>
      <span className="biome-emoji">{info.emoji}</span>
      <span className="biome-name">{info.name}</span>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/biome-visuals.ts src/lib/biome-visuals.test.ts src/components/BiomeView.tsx
git commit -m "Add biome stage visuals mapping and BiomeView component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: BreakActions and ProgressBar components

**Files:**
- Create: `src/components/BreakActions.tsx`
- Create: `src/components/ProgressBar.tsx`
- Create: `src/lib/biome-visuals.ts` (modify — add action labels)

**Interfaces:**
- Consumes: `BiomeState.unlocked_actions` (Task 5), `performAction` (Task 5)
- Produces:
  - `BreakActions.tsx`: `<BreakActions unlockedActions={string[]} onAction={(name: string) => void} disabled={boolean} />`
  - `ProgressBar.tsx`: `<ProgressBar current={number} nextThreshold={number} previousThreshold={number} />`

- [ ] **Step 1: Add action display labels to `src/lib/biome-visuals.ts`**

Append to the file:

```typescript
export const ACTION_LABELS: Record<string, string> = {
  plant_seed: "Plant a Seed",
  water_plant: "Water the Plant",
  add_nutrients: "Add Nutrients",
  tend_ecosystem: "Tend the Ecosystem",
};

export function getActionLabel(actionName: string): string {
  return ACTION_LABELS[actionName] ?? actionName;
}
```

- [ ] **Step 2: Write `src/components/BreakActions.tsx`**

```typescript
import { getActionLabel } from "../lib/biome-visuals";

interface BreakActionsProps {
  unlockedActions: string[];
  onAction: (actionName: string) => void;
  disabled: boolean;
}

export function BreakActions({ unlockedActions, onAction, disabled }: BreakActionsProps) {
  if (unlockedActions.length === 0) {
    return <p className="break-actions-empty">Keep completing sessions to unlock actions here.</p>;
  }

  return (
    <div className="break-actions">
      {unlockedActions.map((action) => (
        <button key={action} disabled={disabled} onClick={() => onAction(action)}>
          {getActionLabel(action)}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/ProgressBar.tsx`**

```typescript
interface ProgressBarProps {
  current: number;
  previousThreshold: number;
  nextThreshold: number;
}

export function ProgressBar({ current, previousThreshold, nextThreshold }: ProgressBarProps) {
  const span = nextThreshold - previousThreshold;
  const progressed = current - previousThreshold;
  const percent = span <= 0 ? 100 : Math.min(100, Math.max(0, (progressed / span) * 100));

  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      <span className="progress-bar-label">
        {current} / {nextThreshold} points
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/biome-visuals.ts src/components/BreakActions.tsx src/components/ProgressBar.tsx
git commit -m "Add BreakActions and ProgressBar components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: Main page — session lifecycle state machine

**Files:**
- Create: `src/pages/Main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `Timer` (Task 6), `BiomeView` (Task 7), `BreakActions` + `ProgressBar` (Task 8), `getBiomeState`/`endSession`/`performAction` (Task 5), `progression::STAGE_THRESHOLDS` equivalent on the frontend
- Produces: the fully assembled app screen with phases `idle -> working -> break -> idle`

Note on thresholds: the frontend needs `STAGE_THRESHOLDS` to drive the `ProgressBar`. Rather than duplicating the Rust array by hand (drift risk), this task hardcodes the same 7 values `[0, 5, 10, 15, 20, 25, 30]` in `Main.tsx` with a comment pointing at `src-tauri/src/progression.rs::STAGE_THRESHOLDS` as the source of truth — acceptable duplication for a POC per the spec's YAGNI guidance; revisit only if thresholds become configurable.

- [ ] **Step 1: Write `src/pages/Main.tsx`**

```typescript
import { useEffect, useState } from "react";
import { Timer } from "../components/Timer";
import { BiomeView } from "../components/BiomeView";
import { BreakActions } from "../components/BreakActions";
import { ProgressBar } from "../components/ProgressBar";
import { getBiomeState, endSession, performAction } from "../lib/tauri-commands";
import type { BiomeState } from "../lib/types";

// Mirrors src-tauri/src/progression.rs::STAGE_THRESHOLDS
const STAGE_THRESHOLDS = [0, 5, 10, 15, 20, 25, 30];

const SESSION_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

type Phase = "idle" | "working" | "break";

export function Main() {
  const [biome, setBiome] = useState<BiomeState | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    getBiomeState().then(setBiome);
  }, []);

  if (!biome) {
    return <div className="loading">Loading your biome...</div>;
  }

  const nextThreshold =
    STAGE_THRESHOLDS[Math.min(biome.current_stage + 1, STAGE_THRESHOLDS.length - 1)];
  const previousThreshold = STAGE_THRESHOLDS[biome.current_stage];

  function handleStartWork() {
    setPhase("working");
    setIsRunning(true);
  }

  async function handleWorkComplete() {
    setIsRunning(false);
    const updated = await endSession(25);
    setBiome(updated);
    setPhase("break");
    setIsRunning(true);
  }

  function handleBreakComplete() {
    setIsRunning(false);
    setPhase("idle");
  }

  async function handleAction(actionName: string) {
    const updated = await performAction(actionName);
    setBiome(updated);
  }

  return (
    <div className="main">
      <BiomeView stage={biome.current_stage} />
      <ProgressBar
        current={biome.progress_points}
        previousThreshold={previousThreshold}
        nextThreshold={nextThreshold}
      />
      <p className="session-count">{biome.total_sessions} Pomodoros completed</p>

      {phase === "idle" && <button onClick={handleStartWork}>Start Session</button>}

      {phase === "working" && (
        <Timer
          durationSeconds={SESSION_SECONDS}
          isRunning={isRunning}
          onToggle={() => setIsRunning((r) => !r)}
          onComplete={handleWorkComplete}
        />
      )}

      {phase === "break" && (
        <>
          <h2>Break time</h2>
          <Timer
            durationSeconds={BREAK_SECONDS}
            isRunning={isRunning}
            onToggle={() => setIsRunning((r) => !r)}
            onComplete={handleBreakComplete}
          />
          <BreakActions
            unlockedActions={biome.unlocked_actions}
            onAction={handleAction}
            disabled={false}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `src/App.tsx`**

```typescript
import { Main } from "./pages/Main";

function App() {
  return <Main />;
}

export default App;
```

- [ ] **Step 3: Update `src/App.css` with full layout styles**

```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #1a1f16;
  color: #e8ede4;
}

.main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  padding: 2rem 1rem;
  gap: 1rem;
  box-sizing: border-box;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.biome-view {
  width: 200px;
  height: 200px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.6s ease;
}

.biome-emoji {
  font-size: 4rem;
}

.biome-name {
  font-weight: 600;
}

.progress-bar-track {
  position: relative;
  width: 260px;
  height: 24px;
  background: #2b3324;
  border-radius: 12px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #7fc25a;
  transition: width 0.4s ease;
}

.progress-bar-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.session-count {
  opacity: 0.8;
  font-size: 0.9rem;
}

.timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.timer-display {
  font-size: 3rem;
  font-variant-numeric: tabular-nums;
}

button {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  border: none;
  background: #7fc25a;
  color: #12160e;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.break-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  max-width: 320px;
}

.break-actions-empty {
  opacity: 0.7;
  font-size: 0.85rem;
  text-align: center;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Main.tsx src/App.tsx src/App.css
git commit -m "Assemble Main page with idle/working/break session lifecycle

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: End-to-end manual verification and time-shortened smoke test

**Files:**
- Modify: `src/pages/Main.tsx` (temporarily, for verification only — revert after)

**Interfaces:**
- Consumes: the complete app from Tasks 1-9
- Produces: confidence the full flow works; no new production code

Waiting a real 25+5 minutes to verify is impractical. This task temporarily shortens both durations to a few seconds, verifies the full loop, then reverts — keeping the 25/5 minute constants in the committed code as the spec requires.

- [ ] **Step 1: Temporarily shorten durations for testing**

In `src/pages/Main.tsx`, temporarily change:
```typescript
const SESSION_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
```
to:
```typescript
const SESSION_SECONDS = 5;
const BREAK_SECONDS = 5;
```

Do NOT commit this change.

- [ ] **Step 2: Launch the app**

Run:
```bash
source "$HOME/.cargo/env"
npm run tauri dev
```
Expected: window opens showing the Seed stage biome, progress bar at 0/5, "0 Pomodoros completed", and a "Start Session" button.

- [ ] **Step 3: Verify one full session + break cycle**

In the running app:
1. Click "Start Session" — timer counts down from 00:05.
2. Wait for it to hit 00:00 — should auto-transition to break screen.
3. Break screen shows a new 00:05 timer and "Keep completing sessions to unlock actions here." (since stage 0 has no unlocked actions yet).
4. Wait for break timer to hit 00:00 — should return to idle screen.
5. Confirm progress bar now shows 1/5 points and "1 Pomodoros completed".

Expected: all five behaviors match. If anything diverges, fix the underlying code (not the test) before proceeding.

- [ ] **Step 4: Verify action unlocking**

Repeat the cycle from Step 3 four more times (5 total sessions) to reach stage 1 (5 points).
Expected: on the break screen after the 5th session, a "Plant a Seed" button appears. Click it.
Expected: after clicking, the button becomes briefly disabled-then-updates are reflected — verify progress bar jumps by 2 more points (to 7/10) after the action call resolves.

- [ ] **Step 5: Verify persistence across restarts**

Quit the app (Cmd+Q or close the window). Run `cat ~/.pomodoro-biome/data.json` and confirm it shows `progress_points: 7` (or whatever value you reached) and `total_sessions: 5`.

Relaunch with `npm run tauri dev` and confirm the app loads showing the same progress instead of resetting to the Seed stage.

- [ ] **Step 6: Revert the temporary duration change**

In `src/pages/Main.tsx`, change back to:
```typescript
const SESSION_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
```

Run: `git diff src/pages/Main.tsx`
Expected: no diff (file matches what Task 9 committed).

- [ ] **Step 7: Clean up test data**

Run: `rm -f ~/.pomodoro-biome/data.json`
This ensures the user's real app starts fresh from Seed stage rather than from test data.

- [ ] **Step 8: Run full test suites one final time**

Run:
```bash
source "$HOME/.cargo/env"
cd src-tauri && cargo test && cd ..
npx vitest run
npx tsc --noEmit
```
Expected: all Rust tests pass (8), all Vitest tests pass (9), no TypeScript errors.

No commit for this task — it's verification-only and step 6 confirms no uncommitted drift.

---

## Post-MVP Notes (Not in Scope for This Plan)

Per the spec's "Future Extensions" section, these are intentionally deferred:
- Multiple biome types (Approach B) — would add a `biome_type` selector and per-type progression tables.
- Living-thing interactivity (Approach C) — would extend `BiomeState` with entities beyond a single stage counter.
- Real pixel art assets replacing the emoji/color placeholders in `biome-visuals.ts`.
- Notifications, sound feedback, keyboard shortcuts, settings page (spec's "Polish" tier).

These are good candidates for their own future spec + plan once the POC is validated in daily use.
