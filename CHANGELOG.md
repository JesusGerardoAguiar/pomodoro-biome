# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-13

### Added
- Initial release of Pomodoro Biome
- 25-minute focus sessions with 5-minute breaks
- Living biome progression (7 stages: Seed → Thriving Ecosystem)
- Break-action screen to earn progress points (Plant, Water, Nutrients, Tend)
- macOS menu bar tray icon with live countdown
- Local persistence (`~/.pomodoro-biome/data.json`)
- Tauri 2 desktop app wrapper
- React frontend with TypeScript
- Rust backend with game state and progression logic
- Test suites for progression logic and time formatting
- Browser fallback for running outside Tauri

### Fixed
- Timer undercounting elapsed time when window backgrounded
- Dev-mode rebuild loop stability
- App icon rendering (hourglass on green gradient)

### Known Limitations
- Single biome type (linear 7-stage progression)
- macOS only (Tauri supports cross-platform, but currently optimized for macOS)
- Placeholder pixel art (planned refinement in future versions)

## Planned for Future Releases

### Multiple Biome Types
- Unlock forest, ocean, desert, etc.
- Each biome with independent progression
- Different visual themes and creature types

### Interactive Ecosystem
- More creatures and finer-grained interactions
- Creature behavior as biome matures
- Environmental events and surprises

### Visual Polish
- Refined plant shapes and jar design
- Animation improvements
- Smoother transitions between stages
