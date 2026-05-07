"""
Prepare Vaulx logo for PDF use.
- Source: docs/archive/screenshots/vaulx - logo simple.png  (black on white, 2752×1536)
- Output 1: vaulx_logo_black.png  — black on transparent (for light backgrounds)
- Output 2: vaulx_logo_white.png  — white on transparent (for dark/black backgrounds)
"""
from PIL import Image
import os

SRC = "/Users/gogy/MyCODE/VAULX/docs/archive/screenshots/vaulx - logo simple.png"
OUT_DIR = "/Users/gogy/MyCODE/VAULX/.claude/worktrees/recursing-mcnulty-a36d0a/docs/colosseum"

img = Image.open(SRC).convert("RGBA")
W, H = img.size
print(f"Source logo: {W}×{H}")

# Convert white pixels to transparent, leaving the black wordmark
def make_transparent(im, color_target=(255, 255, 255), tolerance=20):
    data = im.getdata()
    new_data = []
    for px in data:
        r, g, b, a = px
        if (r >= 255 - tolerance and g >= 255 - tolerance and b >= 255 - tolerance):
            new_data.append((255, 255, 255, 0))   # transparent
        else:
            new_data.append((r, g, b, a))
    out = im.copy()
    out.putdata(new_data)
    return out

# 1. Black-on-transparent (for paper background)
black_t = make_transparent(img)
# Crop to bounding box of non-transparent content
bbox = black_t.getbbox()
if bbox:
    black_t = black_t.crop(bbox)
black_t.save(os.path.join(OUT_DIR, "vaulx_logo_black.png"), optimize=True)
print(f"Saved black logo: {black_t.size}")

# 2. White-on-transparent (for dark background)
# Take the cropped black logo and invert dark pixels to white
data = black_t.getdata()
new_data = []
for px in data:
    r, g, b, a = px
    if a > 0:  # non-transparent (the wordmark)
        new_data.append((255, 255, 255, a))
    else:
        new_data.append((255, 255, 255, 0))
white_t = black_t.copy()
white_t.putdata(new_data)
white_t.save(os.path.join(OUT_DIR, "vaulx_logo_white.png"), optimize=True)
print(f"Saved white logo: {white_t.size}")
