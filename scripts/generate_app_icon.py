from PIL import Image, ImageDraw

SIZE = 1024
S = SIZE / 512.0  # scale factor for all hand-tuned pixel offsets below
OUT_PATH = "app-icon-source.png"  # written to this scripts dir; not committed

BG_TOP = (127, 194, 90, 255)      # matches the app's Thriving Ecosystem green
BG_BOTTOM = (74, 108, 46, 255)    # darker forest green
FRAME = (245, 238, 222, 255)      # cream hourglass frame
FRAME_SHADOW = (196, 182, 150, 255)
SAND = (224, 168, 90, 255)
SAND_DARK = (196, 138, 66, 255)
GLASS_TINT = (255, 255, 255, 40)


def rounded_square_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def draw_vertical_gradient(size, top_color, bottom_color):
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    px = grad.load()
    for y in range(size):
        t = y / (size - 1)
        r = int(top_color[0] + (bottom_color[0] - top_color[0]) * t)
        g = int(top_color[1] + (bottom_color[1] - top_color[1]) * t)
        b = int(top_color[2] + (bottom_color[2] - top_color[2]) * t)
        for x in range(size):
            px[x, y] = (r, g, b, 255)
    return grad


def draw_hourglass(draw, cx, cy, half_w, half_h, cap_h):
    top = cy - half_h
    bottom = cy + half_h
    left = cx - half_w
    right = cx + half_w
    edge = 14 * S
    corner_r = 10 * S
    frame_w = int(4 * S)
    waist_w = 10 * S

    # Top and bottom caps (bars)
    draw.rounded_rectangle(
        [left - edge, top - cap_h, right + edge, top], radius=corner_r, fill=FRAME, outline=FRAME_SHADOW, width=frame_w
    )
    draw.rounded_rectangle(
        [left - edge, bottom, right + edge, bottom + cap_h], radius=corner_r, fill=FRAME, outline=FRAME_SHADOW, width=frame_w
    )

    # Glass silhouette: two triangles meeting at the waist
    draw.polygon(
        [
            (left, top), (right, top),
            (cx + waist_w, cy), (cx - waist_w, cy),
        ],
        fill=FRAME, outline=FRAME_SHADOW,
    )
    draw.polygon(
        [
            (cx - waist_w, cy), (cx + waist_w, cy),
            (right, bottom), (left, bottom),
        ],
        fill=FRAME, outline=FRAME_SHADOW,
    )

    # Sand: pile at bottom + trickle + small pile settling at top
    bottom_pile_top = bottom - (half_h * 0.55)
    draw.polygon(
        [
            (cx - (half_w * 0.6), bottom - 10 * S),
            (cx + (half_w * 0.6), bottom - 10 * S),
            (cx + waist_w - 2 * S, bottom_pile_top),
            (cx - waist_w + 2 * S, bottom_pile_top),
        ],
        fill=SAND,
    )
    draw.line([(cx, cy - 6 * S), (cx, bottom_pile_top + 6 * S)], fill=SAND_DARK, width=int(6 * S))

    top_pile_bottom = top + (half_h * 0.35)
    draw.polygon(
        [
            (cx - waist_w + 2 * S, cy - 4 * S),
            (cx + waist_w - 2 * S, cy - 4 * S),
            (cx + (half_w * 0.4), top_pile_bottom),
            (cx - (half_w * 0.4), top_pile_bottom),
        ],
        fill=SAND,
    )

    # Glass highlight streak
    draw.line([(left + edge, top + 10 * S), (cx - waist_w - 6 * S, cy - 10 * S)], fill=GLASS_TINT, width=int(6 * S))
    draw.line([(cx - waist_w - 4 * S, cy + 14 * S), (left + edge + 4 * S, bottom - 14 * S)], fill=GLASS_TINT, width=int(6 * S))


def main():
    bg = draw_vertical_gradient(SIZE, BG_TOP, BG_BOTTOM)
    mask = rounded_square_mask(SIZE, radius=int(100 * S))

    icon = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    icon.paste(bg, (0, 0), mask)

    draw = ImageDraw.Draw(icon)
    cx, cy = SIZE // 2, SIZE // 2 + int(8 * S)
    draw_hourglass(draw, cx, cy, half_w=100 * S, half_h=130 * S, cap_h=22 * S)

    icon.save(OUT_PATH)
    print(f"wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
