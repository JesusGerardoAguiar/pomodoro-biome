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
