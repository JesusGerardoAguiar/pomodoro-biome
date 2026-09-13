# scripts

## generate_biome_art.py

Regenerates the 7 biome-stage pixel art sprites in `../src/assets/biome/`.

Requires Pillow:

```bash
python3 -m venv /tmp/pixelart-venv
/tmp/pixelart-venv/bin/pip install Pillow
/tmp/pixelart-venv/bin/python3 generate_biome_art.py
```

Also writes a contact sheet (all 7 stages side by side, scaled 8x) to
`/tmp/pomodoro-biome-contact-sheet.png` for quick visual review.

## generate_app_icon.py

Regenerates `app-icon-source.png` (1024x1024, an hourglass on a green
gradient rounded square) in this directory. Uses the same Pillow venv as
above:

```bash
/tmp/pixelart-venv/bin/python3 generate_app_icon.py
```

Then feed that source into Tauri's icon generator to produce the actual
`.icns`/`.png` set the app bundles:

```bash
cd ..
npm run tauri icon scripts/app-icon-source.png
```

This project targets macOS only, so after running it, delete the
iOS/Android/Windows-Appx output it also generates:

```bash
cd src-tauri/icons
rm -rf android ios Square*.png StoreLogo.png icon.ico
```
