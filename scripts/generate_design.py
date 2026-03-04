import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# CONFIGURATION
OUTPUT_PATH = Path("public/designs/paused_my_org_claw.png")
WIDTH, HEIGHT = 4500, 5400
BG_COLOR = (0, 0, 0, 0)  # Transparent

# COLORS
WHITE = "#FFFFFF"
BLACK = "#000000"
FORUM_BLUE = "#3E5F97"  # The "Looksmax" Header Blue

# FONT SETTINGS
FONT_SIZE_MAIN = 500
FONT_SIZE_ORG = 650  # Larger for emphasis

FONT_CANDIDATES = [
    Path("fonts/Impact.ttf"),
    Path("Impact.ttf"),
    Path(__file__).resolve().parent / "Impact.ttf",
    Path("/usr/share/fonts/truetype/msttcorefonts/Impact.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
]


def load_font(size):
    for candidate in FONT_CANDIDATES:
        if candidate.exists():
            try:
                return ImageFont.truetype(str(candidate), size)
            except OSError:
                continue
    print("Impact font not found. Falling back to default PIL font.")
    return ImageFont.load_default()


def draw_text_with_stroke(draw, text, x, y, font, text_color, stroke_color, stroke_width=15):
    # Draw stroke (offsets)
    for off_x in range(-stroke_width, stroke_width + 1):
        for off_y in range(-stroke_width, stroke_width + 1):
            draw.text((x + off_x, y + off_y), text, font=font, fill=stroke_color, anchor="mm")
    # Draw main text
    draw.text((x, y), text, font=font, fill=text_color, anchor="mm")


def draw_rotated_rect(draw, cx, cy, w, h, angle_rad, fill):
    import math

    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)
    dx = w / 2
    dy = h / 2
    corners = []
    for sx, sy in [(-dx, -dy), (dx, -dy), (dx, dy), (-dx, dy)]:
        x = cx + sx * cos_a - sy * sin_a
        y = cy + sx * sin_a + sy * cos_a
        corners.append((x, y))
    draw.polygon(corners, fill=fill)


def draw_claw_hammer(draw, x, y, size):
    import math

    angle = math.pi / 4
    handle_h = size * 1.1
    handle_w_top = size * 0.12
    handle_w_bottom = size * 0.18
    head_h = size * 0.25
    head_w = size * 0.42
    face_w = size * 0.22

    # Local centers before rotation
    handle_center_local = (0, handle_h / 2)
    head_center_local = (0, -head_h / 2)

    def to_global(local):
        lx, ly = local
        gx = x + lx * math.cos(angle) - ly * math.sin(angle)
        gy = y + lx * math.sin(angle) + ly * math.cos(angle)
        return gx, gy

    # Handle (slightly tapered)
    handle_top = to_global((0, 0))
    handle_bottom = to_global((0, handle_h))
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)
    hx = cos_a
    hy = sin_a

    top_left = (handle_top[0] - handle_w_top / 2 * hx, handle_top[1] - handle_w_top / 2 * hy)
    top_right = (handle_top[0] + handle_w_top / 2 * hx, handle_top[1] + handle_w_top / 2 * hy)
    bottom_left = (
        handle_bottom[0] - handle_w_bottom / 2 * hx,
        handle_bottom[1] - handle_w_bottom / 2 * hy,
    )
    bottom_right = (
        handle_bottom[0] + handle_w_bottom / 2 * hx,
        handle_bottom[1] + handle_w_bottom / 2 * hy,
    )
    draw.polygon([top_left, top_right, bottom_right, bottom_left], fill=BLACK)

    # Head block
    draw_rotated_rect(
        draw,
        *to_global(head_center_local),
        head_w,
        head_h,
        angle,
        BLACK,
    )

    # Striking face to the right
    face_center_local = (head_w / 2 + face_w / 2, -head_h / 2 + head_h * 0.1)
    draw_rotated_rect(
        draw,
        *to_global(face_center_local),
        face_w,
        head_h * 0.8,
        angle,
        BLACK,
    )

    # Claw curve to the left
    claw_start_local = (-head_w / 2, -head_h * 0.65)
    claw_ctrl1_local = (-head_w / 2 - size * 0.18, -head_h * 0.9)
    claw_ctrl2_local = (-head_w / 2 - size * 0.2, -head_h * 0.3)
    claw_end_local = (-head_w / 2, -head_h * 0.1)

    claw_start = to_global(claw_start_local)
    claw_ctrl1 = to_global(claw_ctrl1_local)
    claw_ctrl2 = to_global(claw_ctrl2_local)
    claw_end = to_global(claw_end_local)
    draw.line([claw_start, claw_ctrl1, claw_ctrl2, claw_end], fill=BLACK, width=int(size * 0.08))


def apply_grunge(img, density=0.12):
    import random

    pixels = img.load()
    width, height = img.size
    total = int(width * height * density)
    for _ in range(total):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        r, g, b, a = pixels[x, y]
        if a == 0:
            continue
        if random.random() < 0.5:
            pixels[x, y] = (r, g, b, 0)
        else:
            pixels[x, y] = (r, g, b, int(a * 0.4))


def create_design():
    # 1. Setup Canvas
    img = Image.new("RGBA", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # 2. Load Fonts
    font_main = load_font(FONT_SIZE_MAIN)
    font_org = load_font(FONT_SIZE_ORG)

    # 3. Draw "I PAUSED MY"
    draw_text_with_stroke(draw, "I PAUSED MY", WIDTH / 2, 1400, font_main, WHITE, BLACK, stroke_width=15)

    # 4. Hyperlink row (.ORG + hammer)
    org_text = ".ORG"
    org_y = 2200
    org_color = "#0000EE"
    draw_text_with_stroke(draw, org_text, WIDTH / 2, org_y, font_org, org_color, BLACK, stroke_width=20)
    org_bbox = draw.textbbox((WIDTH / 2, org_y), org_text, font=font_org, anchor="mm")
    underline_y = 2600
    draw.line([(org_bbox[0], underline_y), (org_bbox[2], underline_y)], fill=org_color, width=32)

    hammer_size = 600
    org_width = org_bbox[2] - org_bbox[0]
    group_width = org_width + 40 + hammer_size
    group_start_x = WIDTH / 2 - group_width / 2
    hammer_x = group_start_x + org_width + 40 + hammer_size / 2
    draw_claw_hammer(draw, hammer_x, org_y - 60, hammer_size)

    # 5. Bottom anchor box + text
    box_w, box_h = 3200, 750
    box_x = (WIDTH - box_w) / 2
    box_y = 2600
    draw.rectangle([box_x, box_y, box_x + box_w, box_y + box_h], fill=BLACK)
    draw.text((WIDTH / 2, box_y + box_h / 2), "TO BE HERE", font=font_main, fill=WHITE, anchor="mm")

    # 6. Grunge texture
    apply_grunge(img, density=0.12)

    # 7. Save
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUTPUT_PATH, dpi=(300, 300))
    print(f"Generated meme design at: {OUTPUT_PATH.resolve()}")


if __name__ == "__main__":
    create_design()
