# Pomodoro Biome: Design Specification

**Date:** 2026-09-12  
**Author:** Claude Haiku 4.5  
**Status:** Design Approved  

---

## Overview

Pomodoro Biome is a macOS productivity app that combines a Pomodoro timer (25-minute focused work sessions) with a persistent ecosystem that evolves as you complete work. Each completed session advances your biome through distinct stages—from seed to thriving ecosystem—creating a satisfying visual reward for productivity.

The app serves as both a work timer and an idle/incremental game, tying your real-time work directly to the growth of a virtual biome you tend to during break periods.

### User Goal
Use focused work sessions to grow a personal biome, providing both productivity structure and a rewarding game-like progression system.

---

## Architecture

### Technology Stack

- **Backend:** Rust + Tauri framework
  - Manages timer state, biome progression, file I/O
  - Exposes Tauri commands for frontend to invoke
  - Handles all game logic (progression, rewards, unlocks)
  
- **Frontend:** Web-based (React or vanilla JS + Canvas)
  - Timer UI (countdown display, controls)
  - Biome rendering (2D pixel art canvas)
  - Break-time action menu
  - Dashboard showing stats and progress

- **Data Storage:** Local JSON file or SQLite database
  - No cloud sync (local-only for privacy and simplicity)
  - Persists all session history and biome state

### Data Flow

```
User starts session
    ↓
Frontend calls Rust command: start_session()
    ↓
Timer counts down on frontend (visual-only)
    ↓
At 25min complete, frontend calls: end_session()
    ↓
Rust calculates rewards, saves session to disk
    ↓
Break-time screen shows available actions
    ↓
User performs actions → frontend calls: perform_action(action_name)
    ↓
Rust updates biome state, calculates progress
    ↓
Break ends → biome visual updates
    ↓
Return to timer ready for next session
```

---

## Biome State & Progression System

### Progression Model (Proof of Concept - Approach A)

The biome progresses through **7 stages**, each with a distinct visual representation:

1. **Seed** (0-4 points) — bare ground with a seed visible
2. **Sprout** (5-9 points) — small green shoot emerging
3. **Young Plant** (10-14 points) — small plant with a few leaves
4. **Growing Plant** (15-19 points) — noticeably larger, fuller
5. **Mature Plant** (20-24 points) — full-grown, healthy plant
6. **Blooming** (25-29 points) — flowers appear, small creatures emerge
7. **Thriving Ecosystem** (30+ points) — rich ecosystem with plants, flowers, insects, birds

**Progression mechanics:**
- Each completed 25-minute Pomodoro = 1 progress point
- Progress points accumulate toward the next stage
- Completing a stage unlocks new break-time actions

### Break-Time Actions (5 minutes)

During the 5-minute break after each session, the user can perform optional actions to advance their biome:

| Action | Unlocks at Stage | Progress | Effect |
|--------|------------------|----------|--------|
| Plant Seed | 2 | +2 points | Game feels proactive |
| Water Plant | 3 | +1 point | Reinforces care |
| Add Nutrients | 4 | +3 points | Large reward for engagement |
| Tend Ecosystem | 5 | +2 points | Aesthetic changes (birds, flowers) |

Each action is optional—finishing a Pomodoro alone progresses the biome by 1 point, but performing actions accelerates growth and adds interactivity.

### Data Structure

```rust
pub struct BiomeState {
    pub current_stage: u32,         // 0-6 (7 stages)
    pub progress_points: u32,       // Points toward next stage
    pub total_sessions: u32,        // Total Pomodoros completed
    pub biome_type: String,         // "forest" (future: ocean, desert, etc.)
    pub last_updated: DateTime,     // When state was last modified
    pub unlocked_actions: Vec<String>, // Available actions
    pub session_history: Vec<Session>, // Historical session data
}

pub struct Session {
    pub date: DateTime,
    pub duration_minutes: u32,
    pub actions_performed: Vec<String>,
}
```

---

## UI/UX Flow

### Main App Layout

1. **Timer View** (primary)
   - Large countdown display (MM:SS format)
   - Start / Pause / Stop buttons
   - Current biome stage visualization (canvas)
   - Progress bar showing points toward next stage
   - Session count ("24 Pomodoros completed")

2. **Break Screen** (appears after 25min)
   - "5-minute break" header with countdown
   - Biome visual at current stage
   - Grid of available actions (Plant, Water, Tend, etc.)
   - "Skip break" option to go directly to next session

3. **Dashboard** (summary view)
   - Total sessions this week/month
   - Current biome stage
   - Next milestone (e.g., "5 more sessions to Blooming stage")
   - Biome history/evolution timeline

---

## Implementation Structure

### Frontend Components

```
src/
├── components/
│   ├── Timer.tsx              // 25min countdown, start/pause/stop
│   ├── BiomeView.tsx          // Canvas rendering of current stage
│   ├── BreakActions.tsx       // Action buttons during 5min break
│   ├── Dashboard.tsx          // Stats and progress display
│   └── ProgressBar.tsx        // Visual progress toward next stage
├── pages/
│   ├── Main.tsx               // Main app layout
│   └── Settings.tsx           // Future: preferences
├── lib/
│   ├── tauri-commands.ts      // Wrappers for Rust commands
│   └── biome-renderer.ts      // Canvas rendering logic
├── assets/
│   └── biomes/                // 2D pixel art for each stage
└── App.tsx
```

### Rust Backend Structure

```
src-tauri/src/
├── main.rs                    // Tauri setup, command registration
├── game_state.rs              // BiomeState struct, core types
├── commands.rs                // Tauri command handlers
│   ├── start_session()
│   ├── end_session()
│   ├── perform_action()
│   ├── get_biome_state()
│   └── save_progress()
├── progression.rs             // Progression logic
├── persistence.rs             // Save/load from disk
└── Cargo.toml
```

### Core Tauri Commands

```rust
// Start a work session
#[tauri::command]
async fn start_session(state: tauri::State<'_, GameState>) -> Result<(), String>

// End a work session (called at 25min)
#[tauri::command]
async fn end_session(state: tauri::State<'_, GameState>) -> Result<BiomeState, String>

// Perform a break-time action
#[tauri::command]
async fn perform_action(
    state: tauri::State<'_, GameState>,
    action: String,
) -> Result<BiomeState, String>

// Get current biome state
#[tauri::command]
async fn get_biome_state(state: tauri::State<'_, GameState>) -> Result<BiomeState, String>

// Save state to disk
#[tauri::command]
async fn save_progress(state: tauri::State<'_, GameState>) -> Result<(), String>
```

---

## Data Persistence

### Storage Format

- **Location:** `~/.pomodoro-biome/data.json` (local user directory)
- **Format:** JSON for simplicity and human-readability in POC
- **Load on startup:** App loads persisted state when launched
- **Save on quit:** Tauri's `on_window_event` hook saves state when app closes
- **Checkpoint:** After each session completes, auto-save to disk

### Example Saved State

```json
{
  "current_stage": 3,
  "progress_points": 7,
  "total_sessions": 27,
  "biome_type": "forest",
  "last_updated": "2026-09-12T18:30:45Z",
  "unlocked_actions": ["plant_seed", "water_plant", "add_nutrients"],
  "session_history": [
    {
      "date": "2026-09-12T17:05:00Z",
      "duration_minutes": 25,
      "actions_performed": ["water_plant"]
    }
  ]
}
```

---

## App Flow & User Experience

### Session Lifecycle

1. **Start:** User opens app → loads saved biome state from disk
2. **Idle:** User clicks "Start Session" → 25-minute countdown begins
3. **Work:** Timer counts down, user focuses on work
4. **Complete:** Timer reaches 0:00 → automatic transition to break screen
5. **Break:** 5-minute countdown + optional action buttons
6. **Actions:** User clicks actions (if desired) → each updates biome
7. **Next:** Break ends → return to timer, ready for next session
8. **Quit:** User closes app → state auto-saves to disk

### Visual Feedback

- **Timer progression:** Real-time countdown
- **Biome evolution:** Stage change when progressing to next level
- **Action feedback:** Immediate visual change when performing break-time actions
- **Progress indication:** Progress bar filling as you approach next stage

---

## Future Extensions (Toward Approaches B & C)

The architecture is designed to evolve toward richer gameplay:

### Approach B: Multiple Biome Types
- Unlock additional biome types (ocean, desert, mountains, etc.)
- Each biome has independent progression
- User can switch between active biomes
- Added visual variety and replayability

### Approach C: Interactive Ecosystem
- Multiple living things (plants, animals, insects) appear as you progress
- More granular interactions (plant different seeds, attract specific animals)
- Seasonal changes or time-based visual shifts
- Achievements/badges for milestones

Both extensions use the same `BiomeState` structure and progression system, so the POC foundation supports them without architectural changes.

---

## Success Criteria

**MVP (Proof of Concept):**
- ✓ 25-minute timer with visual countdown
- ✓ Biome progresses through 7 stages
- ✓ Each Pomodoro = 1 progress point
- ✓ Break-time actions advance progress
- ✓ State persists across app sessions
- ✓ Visual biome rendering with stage-specific art

**Polish (Post-MVP):**
- Smooth transitions between stages
- Sound/haptic feedback on session complete
- Statistics dashboard
- Keyboard shortcuts
- App menu (about, preferences)

---

## Technical Decisions & Rationale

### Why Tauri + Rust?
- **Tauri:** Lightweight alternative to Electron, better macOS integration, smaller app footprint
- **Rust:** Type-safe, great for game state management, good learning opportunity while staying practical

### Why local-only storage?
- Simpler implementation (no backend server needed)
- Privacy-preserving (no data leaves the user's machine)
- Works offline
- Still achieves persistence goal for a POC

### Why React/Canvas frontend?
- React handles UI state well (timer, break screen transitions)
- Canvas gives fine control over biome rendering
- Web-based frontend keeps separation clean between game logic (Rust) and presentation (web)

### Why 7 stages?
- Achievable in reasonable timeframe (35 Pomodoros for full progression)
- Enough variety to feel rewarding
- Easy to extend with more stages later

---

## Known Unknowns & Future Decisions

1. **Asset sourcing:** Which Kubold-style assets to use/license for initial biome art?
2. **Animation:** Do we animate stage transitions, or use static images?
3. **Notifications:** Should we notify user when stages complete, or only on app focus?
4. **Mobile:** No mobile version in scope for POC (desktop-only via Tauri)

---

## Appendix: Glossary

- **Pomodoro:** 25-minute focused work session (from Pomodoro Technique)
- **Biome:** The virtual ecosystem the user tends to (grows with completed sessions)
- **Progress Points:** Currency for biome advancement (earned per Pomodoro + actions)
- **Stage:** One of 7 biome evolution states (Seed → Thriving Ecosystem)
- **Break-time Action:** Optional interaction during 5-minute break (Plant, Water, etc.)
