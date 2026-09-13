from PIL import Image, ImageDraw
import os

SIZE = 32
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(SCRIPT_DIR, "..", "src", "assets", "biome")

# Palette
GLASS = (205, 232, 236, 90)
GLASS_EDGE = (150, 190, 200, 200)
GLASS_HIGHLIGHT = (255, 255, 255, 110)
CORK = (168, 122, 74, 255)
CORK_EDGE = (120, 84, 48, 255)
SOIL_TOP = (107, 74, 46, 255)
SOIL_MID = (84, 58, 36, 255)
SOIL_DARK = (61, 42, 27, 255)
SEED = (196, 164, 104, 255)
SEED_EDGE = (140, 110, 66, 255)
STEM = (74, 108, 46, 255)
STEM_DARK = (56, 84, 34, 255)
LEAF_1 = (79, 107, 47, 255)
LEAF_2 = (84, 130, 56, 255)
LEAF_3 = (90, 148, 64, 255)
LEAF_4 = (107, 171, 74, 255)
FLOWER_PINK = (224, 143, 176, 255)
FLOWER_YELLOW = (242, 201, 76, 255)
FLOWER_CENTER = (196, 150, 60, 255)
BUTTERFLY = (232, 214, 120, 255)
BUTTERFLY_EDGE = (180, 150, 70, 255)
MOSS = (100, 140, 70, 255)

# Jar geometry (interior we can draw content in)
JAR_LEFT, JAR_RIGHT = 6, 25
JAR_TOP, JAR_BOTTOM = 9, 29
INNER_LEFT, INNER_RIGHT = JAR_LEFT + 1, JAR_RIGHT - 1
SOIL_TOP_Y = 22


def new_canvas():
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def draw_jar_background(draw):
    # Glass fill sits behind soil/plant content, drawn first
    draw.rectangle([JAR_LEFT, JAR_TOP, JAR_RIGHT, JAR_BOTTOM], fill=GLASS)


def draw_jar_glass_edges(draw):
    # Cork lid
    draw.rectangle([11, 3, 20, 5], fill=CORK, outline=CORK_EDGE)
    draw.rectangle([9, 6, 22, 8], fill=CORK, outline=CORK_EDGE)

    # Jar outline drawn last so glass edges read as being in front
    draw.rectangle([JAR_LEFT, JAR_TOP, JAR_RIGHT, JAR_BOTTOM], outline=GLASS_EDGE)
    for (x, y) in [(JAR_LEFT, JAR_TOP), (JAR_RIGHT, JAR_TOP), (JAR_LEFT, JAR_BOTTOM), (JAR_RIGHT, JAR_BOTTOM)]:
        draw.point((x, y), fill=(0, 0, 0, 0))
    # base foot
    draw.rectangle([JAR_LEFT - 1, JAR_BOTTOM, JAR_RIGHT + 1, JAR_BOTTOM + 1], fill=GLASS_EDGE)
    # glass highlight streak
    draw.line([(JAR_LEFT + 2, JAR_TOP + 2), (JAR_LEFT + 2, JAR_BOTTOM - 3)], fill=GLASS_HIGHLIGHT)


def draw_soil(draw):
    draw.rectangle([INNER_LEFT, SOIL_TOP_Y, INNER_RIGHT, JAR_BOTTOM - 1], fill=SOIL_MID)
    draw.line([(INNER_LEFT, SOIL_TOP_Y), (INNER_RIGHT, SOIL_TOP_Y)], fill=SOIL_TOP)
    draw.rectangle([INNER_LEFT, JAR_BOTTOM - 2, INNER_RIGHT, JAR_BOTTOM - 1], fill=SOIL_DARK)


def draw_seed(draw):
    cx = (INNER_LEFT + INNER_RIGHT) // 2
    draw.ellipse([cx - 1, SOIL_TOP_Y - 2, cx + 1, SOIL_TOP_Y], fill=SEED, outline=SEED_EDGE)


def draw_stem(draw, base_x, base_y, height, color=STEM):
    draw.line([(base_x, base_y), (base_x, base_y - height)], fill=color, width=1)


def draw_leaf(draw, x, y, direction, color):
    # direction: -1 left, 1 right
    if direction < 0:
        draw.polygon([(x, y), (x - 3, y - 1), (x - 3, y + 1)], fill=color)
    else:
        draw.polygon([(x, y), (x + 3, y - 1), (x + 3, y + 1)], fill=color)


def draw_flower(draw, x, y, color):
    draw.point((x - 1, y), fill=color)
    draw.point((x + 1, y), fill=color)
    draw.point((x, y - 1), fill=color)
    draw.point((x, y + 1), fill=color)
    draw.point((x, y), fill=FLOWER_CENTER)


def draw_butterfly(draw, x, y):
    draw.point((x - 1, y - 1), fill=BUTTERFLY)
    draw.point((x + 1, y - 1), fill=BUTTERFLY)
    draw.point((x - 1, y + 1), fill=BUTTERFLY_EDGE)
    draw.point((x + 1, y + 1), fill=BUTTERFLY_EDGE)


def stage_0_seed():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    draw_jar_background(d)
    draw_soil(d)
    draw_seed(d)
    draw_jar_glass_edges(d)
    return img


def stage_1_sprout():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    draw_jar_background(d)
    draw_soil(d)
    cx = (INNER_LEFT + INNER_RIGHT) // 2
    draw_stem(d, cx, SOIL_TOP_Y, 3, STEM_DARK)
    draw_leaf(d, cx, SOIL_TOP_Y - 3, -1, LEAF_1)
    draw_leaf(d, cx, SOIL_TOP_Y - 2, 1, LEAF_1)
    draw_jar_glass_edges(d)
    return img


def stage_2_young():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    draw_jar_background(d)
    draw_soil(d)
    cx = (INNER_LEFT + INNER_RIGHT) // 2
    draw_stem(d, cx, SOIL_TOP_Y, 6, STEM)
    draw_leaf(d, cx, SOIL_TOP_Y - 2, -1, LEAF_2)
    draw_leaf(d, cx, SOIL_TOP_Y - 4, 1, LEAF_2)
    draw_leaf(d, cx, SOIL_TOP_Y - 6, -1, LEAF_1)
    draw_jar_glass_edges(d)
    return img


def stage_3_growing():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    draw_jar_background(d)
    draw_soil(d)
    cx = (INNER_LEFT + INNER_RIGHT) // 2
    draw_stem(d, cx, SOIL_TOP_Y, 9, STEM)
    draw_leaf(d, cx, SOIL_TOP_Y - 2, -1, LEAF_2)
    draw_leaf(d, cx, SOIL_TOP_Y - 4, 1, LEAF_3)
    draw_leaf(d, cx, SOIL_TOP_Y - 6, -1, LEAF_3)
    draw_leaf(d, cx, SOIL_TOP_Y - 8, 1, LEAF_2)
    draw_jar_glass_edges(d)
    return img


def stage_4_mature():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    draw_jar_background(d)
    draw_soil(d)
    cx = (INNER_LEFT + INNER_RIGHT) // 2
    draw_stem(d, cx, SOIL_TOP_Y, 12, STEM)
    draw_leaf(d, cx, SOIL_TOP_Y - 2, -1, LEAF_2)
    draw_leaf(d, cx, SOIL_TOP_Y - 4, 1, LEAF_3)
    draw_leaf(d, cx, SOIL_TOP_Y - 6, -1, LEAF_3)
    draw_leaf(d, cx, SOIL_TOP_Y - 8, 1, LEAF_4)
    draw_leaf(d, cx, SOIL_TOP_Y - 10, -1, LEAF_4)
    draw_leaf(d, cx, SOIL_TOP_Y - 11, 1, LEAF_3)
    draw_jar_glass_edges(d)
    return img


def stage_5_blooming():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    draw_jar_background(d)
    draw_soil(d)
    cx = (INNER_LEFT + INNER_RIGHT) // 2
    draw_stem(d, cx, SOIL_TOP_Y, 12, STEM)
    draw_leaf(d, cx, SOIL_TOP_Y - 2, -1, LEAF_2)
    draw_leaf(d, cx, SOIL_TOP_Y - 4, 1, LEAF_3)
    draw_leaf(d, cx, SOIL_TOP_Y - 6, -1, LEAF_3)
    draw_leaf(d, cx, SOIL_TOP_Y - 8, 1, LEAF_4)
    draw_leaf(d, cx, SOIL_TOP_Y - 10, -1, LEAF_4)
    draw_flower(d, cx + 2, SOIL_TOP_Y - 11, FLOWER_PINK)
    draw_flower(d, cx - 2, SOIL_TOP_Y - 9, FLOWER_YELLOW)
    draw_flower(d, cx, SOIL_TOP_Y - 12, FLOWER_PINK)
    draw_jar_glass_edges(d)
    return img


def stage_6_thriving():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    draw_jar_background(d)
    draw_soil(d)
    cx = (INNER_LEFT + INNER_RIGHT) // 2
    # main plant
    draw_stem(d, cx, SOIL_TOP_Y, 12, STEM)
    draw_leaf(d, cx, SOIL_TOP_Y - 2, -1, LEAF_2)
    draw_leaf(d, cx, SOIL_TOP_Y - 4, 1, LEAF_3)
    draw_leaf(d, cx, SOIL_TOP_Y - 6, -1, LEAF_3)
    draw_leaf(d, cx, SOIL_TOP_Y - 8, 1, LEAF_4)
    draw_leaf(d, cx, SOIL_TOP_Y - 10, -1, LEAF_4)
    draw_flower(d, cx + 2, SOIL_TOP_Y - 11, FLOWER_PINK)
    draw_flower(d, cx, SOIL_TOP_Y - 12, FLOWER_YELLOW)
    # secondary small plant
    sx = cx - 5
    draw_stem(d, sx, SOIL_TOP_Y, 5, STEM)
    draw_leaf(d, sx, SOIL_TOP_Y - 2, -1, LEAF_1)
    draw_flower(d, sx, SOIL_TOP_Y - 5, FLOWER_YELLOW)
    # moss patches
    d.point((INNER_LEFT + 1, SOIL_TOP_Y), fill=MOSS)
    d.point((INNER_RIGHT - 1, SOIL_TOP_Y), fill=MOSS)
    # butterfly
    draw_butterfly(d, cx + 4, SOIL_TOP_Y - 14)
    draw_jar_glass_edges(d)
    return img


STAGES = [
    ("stage-0-seed.png", stage_0_seed),
    ("stage-1-sprout.png", stage_1_sprout),
    ("stage-2-young-plant.png", stage_2_young),
    ("stage-3-growing-plant.png", stage_3_growing),
    ("stage-4-mature-plant.png", stage_4_mature),
    ("stage-5-blooming.png", stage_5_blooming),
    ("stage-6-thriving-ecosystem.png", stage_6_thriving),
]

os.makedirs(OUT_DIR, exist_ok=True)
for filename, fn in STAGES:
    img = fn()
    img.save(os.path.join(OUT_DIR, filename))
    print(f"wrote {filename}")

# Also build a contact sheet for quick visual review, scaled up 8x
contact = Image.new("RGBA", (SIZE * 8 * len(STAGES), SIZE * 8), (30, 30, 30, 255))
for i, (filename, fn) in enumerate(STAGES):
    img = fn().resize((SIZE * 8, SIZE * 8), Image.NEAREST)
    contact.paste(img, (i * SIZE * 8, 0), img)
contact.save("/tmp/pomodoro-biome-contact-sheet.png")
print("wrote contact sheet")
