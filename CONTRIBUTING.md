# Contributing to Pomodoro Biome

Thanks for your interest in contributing! This project is in active development and all contributions are welcome.

## Getting Started

1. **Fork & clone** the repository
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start development:**
   ```bash
   npm run tauri dev
   ```

## Development Workflow

- **Frontend changes:** React components auto-reload via Vite
- **Rust backend changes:** Restart `npm run tauri dev` to rebuild
- **Run tests before pushing:**
  ```bash
  npm test                    # Frontend tests
  cd src-tauri && cargo test  # Rust tests
  ```

## Code Style

- Use **TypeScript** for all frontend code (strict mode)
- Keep components focused and single-responsibility
- Write tests for new progression logic in Rust
- Follow existing commit message style (descriptive, present tense)

## Before Submitting a PR

- [ ] Tests pass (`npm test` + `cargo test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Commit messages are clear and descriptive
- [ ] Changes follow the existing code style

## Ideas Welcome

Have ideas for features? Open an issue to discuss:
- Multiple biome types
- Creature interactions
- Visual polish
- Bug fixes

Even small contributions (typo fixes, documentation improvements) are appreciated!

---

Questions? Feel free to open an issue or start a discussion.
