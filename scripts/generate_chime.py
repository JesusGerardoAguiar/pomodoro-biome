"""Synthesizes a soft two-tone chime for the "15 seconds left" alert.

No external dependencies — pure stdlib (wave + math), so no venv needed.
"""

import math
import os
import struct
import wave

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.join(SCRIPT_DIR, "..", "src", "assets", "sounds", "chime.wav")

SAMPLE_RATE = 44100


def tone(freq_hz: float, duration_s: float, start_amplitude: float = 0.5) -> list[float]:
    """A sine tone with a quick attack and exponential decay envelope."""
    n_samples = int(SAMPLE_RATE * duration_s)
    attack_samples = int(SAMPLE_RATE * 0.008)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        if i < attack_samples:
            envelope = i / attack_samples
        else:
            decay_t = (i - attack_samples) / SAMPLE_RATE
            envelope = math.exp(-decay_t * 4.5)
        samples.append(start_amplitude * envelope * math.sin(2 * math.pi * freq_hz * t))
    return samples


def mix(*tracks_with_offsets: tuple[list[float], int]) -> list[float]:
    """Mixes tracks together, each starting at its own sample offset."""
    total_len = max(offset + len(track) for track, offset in tracks_with_offsets)
    out = [0.0] * total_len
    for track, offset in tracks_with_offsets:
        for i, sample in enumerate(track):
            out[offset + i] += sample
    # Clamp to avoid clipping if tones overlap
    return [max(-1.0, min(1.0, s)) for s in out]


def main():
    note_a = tone(880.0, 0.35)  # A5
    note_e = tone(1318.51, 0.55)  # E6, a perfect fifth up — classic "chime" interval

    overlap_offset = int(SAMPLE_RATE * 0.12)
    mixed = mix((note_a, 0), (note_e, overlap_offset))

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with wave.open(OUT_PATH, "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        frames = b"".join(struct.pack("<h", int(s * 32767)) for s in mixed)
        wav_file.writeframes(frames)

    print(f"wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
