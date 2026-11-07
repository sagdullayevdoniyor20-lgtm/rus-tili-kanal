"""Har bir mavzu uchun rasm yasaydi: content/topics.json -> images/<id>.png
Ishlatish: python3 tools/render.py [kanal_nomi]
"""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = "/usr/share/fonts/opentype/inter/"
EMOJI_FONT = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
HANDLE = sys.argv[1] if len(sys.argv) > 1 else ""

W, H = 1080, 1350

def font(name, size):
    return ImageFont.truetype(FONT_DIR + name, size)

_emoji_font = ImageFont.truetype(EMOJI_FONT, 109)
def emoji_img(ch, size):
    im = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((80, 80), ch, font=_emoji_font, embedded_color=True, anchor="mm")
    bbox = im.getbbox() or (0, 0, 160, 160)
    im = im.crop(bbox)
    scale = size / max(im.size)
    return im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)

def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def fit(draw, text, fname, size, max_w):
    while size > 10:
        f = font(fname, size)
        if draw.textlength(text, font=f) <= max_w:
            return f
        size -= 2
    return font(fname, size)

def render(t):
    bg = hex2rgb(t["color"])
    accent = hex2rgb(t["accent"])
    ink = (33, 37, 41)
    muted = (110, 115, 122)

    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)

    # Yuqori yozuv
    d.text((70, 72), f"РУССКИЙ ЯЗЫК  •  MAVZU {t['id']}", font=font("Inter-SemiBold.otf", 30), fill=accent)
    # Sarlavha
    title = t["ru"].upper()
    d.text((66, 112), title, font=fit(d, title, "InterDisplay-Black.otf", 104, W - 140), fill=ink)
    d.text((70, 238), t["uz"], font=font("Inter-Medium.otf", 44), fill=muted)

    # So'zlar katakchalari (2 ustun)
    words = t["words"]
    cols = 2
    rows = (len(words) + 1) // 2
    top, bottom = 330, H - 110
    gap = 18
    card_w = (W - 140 - gap) // cols
    card_h = min(140, (bottom - top - gap * (rows - 1)) // rows)
    for i, (em, ru, uz) in enumerate(words):
        r, c = divmod(i, cols)
        x = 70 + c * (card_w + gap)
        y = top + r * (card_h + gap)
        d.rounded_rectangle((x, y, x + card_w, y + card_h), radius=26, fill=(255, 255, 255))
        if em.isascii():
            # Emoji o'rniga raqam (masalan, "Sonlar" mavzusi)
            box = int(card_h * 0.58)
            d.rounded_rectangle((x + 22, y + (card_h - box) // 2, x + 22 + box, y + (card_h + box) // 2), radius=18, fill=accent)
            d.text((x + 22 + box // 2, y + card_h // 2), em, font=fit(d, em, "InterDisplay-Black.otf", 44, box - 10), fill=(255, 255, 255), anchor="mm")
        else:
            e = emoji_img(em, int(card_h * 0.58))
            img.paste(e, (x + 22, y + (card_h - e.height) // 2), e)
        tx = x + 22 + int(card_h * 0.58) + 22
        maxw = card_w - (tx - x) - 18
        d.text((tx, y + card_h * 0.30), ru, font=fit(d, ru, "Inter-Bold.otf", 40, maxw), fill=ink, anchor="lm")
        d.text((tx, y + card_h * 0.70), uz, font=fit(d, uz, "Inter-Regular.otf", 32, maxw), fill=muted, anchor="lm")

    # Pastki qism
    d.rounded_rectangle((0, H - 70, W, H), radius=0, fill=accent)
    foot = HANDLE or "Har kuni yangi mavzu"
    d.text((W // 2, H - 35), foot, font=font("Inter-SemiBold.otf", 30), fill=(255, 255, 255), anchor="mm")

    out = os.path.join(ROOT, "images", f"{t['id']}.png")
    img.save(out, optimize=True)
    return out

if __name__ == "__main__":
    topics = json.load(open(os.path.join(ROOT, "content", "topics.json"), encoding="utf-8"))
    for t in topics:
        print(render(t))
