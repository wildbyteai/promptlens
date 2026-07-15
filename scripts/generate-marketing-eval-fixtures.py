#!/usr/bin/env python3
"""Generate deterministic synthetic marketing creatives for PromptLens quality evaluation."""

from __future__ import annotations

import argparse
import hashlib
import json
import random
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ModuleNotFoundError as error:
    raise SystemExit("Pillow is required for this optional evaluation fixture generator.") from error


WIDTH = 768
HEIGHT = 768


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def centered_text(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], text: str, font, fill) -> None:
    left, top, right, bottom = box
    bounds = draw.textbbox((0, 0), text, font=font)
    text_width = bounds[2] - bounds[0]
    text_height = bounds[3] - bounds[1]
    draw.text(
        (left + (right - left - text_width) / 2, top + (bottom - top - text_height) / 2),
        text,
        font=font,
        fill=fill,
    )


def save(image: Image.Image, output_dir: Path, filename: str) -> None:
    image.convert("RGB").save(output_dir / filename, format="PNG", optimize=True)


def sha256_file(filename: Path) -> str:
    digest = hashlib.sha256()
    with filename.open("rb") as source:
        for chunk in iter(lambda: source.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def luxury_serum(output_dir: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#f5efe5")
    draw = ImageDraw.Draw(image)
    draw.ellipse((430, 120, 760, 450), fill="#dfc4a5")
    draw.rounded_rectangle((470, 250, 640, 620), radius=38, fill="#fdfbf7", outline="#8b6b4a", width=4)
    draw.rounded_rectangle((510, 190, 600, 285), radius=20, fill="#c5a16f")
    draw.text((70, 90), "LUMINA", font=load_font(28, True), fill="#6c4f36")
    draw.text((70, 175), "Radiance\nSerum", font=load_font(72, True), fill="#2e241c", spacing=8)
    draw.text((74, 365), "Botanical hydration for a calm, luminous finish.", font=load_font(25), fill="#5e5146")
    draw.rounded_rectangle((70, 490, 300, 558), radius=34, fill="#2e241c")
    centered_text(draw, (70, 490, 300, 558), "SHOP THE RITUAL", load_font(22, True), "#ffffff")
    draw.text((522, 414), "30 ml", font=load_font(21), fill="#6c4f36")
    save(image, output_dir, "01_luxury_serum.png")


def coffee_promo(output_dir: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#20150f")
    draw = ImageDraw.Draw(image)
    draw.ellipse((390, 170, 720, 500), fill="#9b4f28")
    draw.ellipse((445, 270, 655, 480), fill="#f2e3c6")
    draw.rectangle((470, 330, 630, 520), fill="#f2e3c6")
    draw.ellipse((470, 470, 630, 550), fill="#f2e3c6")
    draw.ellipse((495, 300, 605, 345), fill="#4a2414")
    draw.text((55, 70), "ROASTED THIS WEEK", font=load_font(23, True), fill="#f0a85a")
    draw.text((55, 135), "Slow mornings,\nbolder coffee.", font=load_font(62, True), fill="#fff4df", spacing=10)
    draw.text((60, 350), "Single-origin beans · chocolate finish", font=load_font(26), fill="#e6c9a0")
    draw.rounded_rectangle((55, 465, 275, 535), radius=18, fill="#f0a85a")
    centered_text(draw, (55, 465, 275, 535), "ORDER A BAG", load_font(24, True), "#20150f")
    draw.rounded_rectangle((560, 85, 710, 155), radius=35, fill="#fff4df")
    centered_text(draw, (560, 85, 710, 155), "$18", load_font(30, True), "#20150f")
    save(image, output_dir, "02_coffee_promo.png")


def saas_launch(output_dir: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#edf4ff")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((70, 70, 698, 690), radius=44, fill="#ffffff", outline="#bfd5ff", width=3)
    draw.text((115, 105), "FOCUSFLOW", font=load_font(24, True), fill="#315ed1")
    draw.text((115, 170), "Turn busy work\ninto clear progress.", font=load_font(57, True), fill="#13213c", spacing=7)
    draw.text((118, 330), "One calm workspace for priorities, owners, and outcomes.", font=load_font(24), fill="#52647d")
    draw.rounded_rectangle((115, 410, 335, 478), radius=20, fill="#315ed1")
    centered_text(draw, (115, 410, 335, 478), "START FREE", load_font(24, True), "#ffffff")
    draw.rounded_rectangle((390, 390, 650, 610), radius=28, fill="#13213c")
    draw.rounded_rectangle((420, 430, 615, 466), radius=12, fill="#315ed1")
    draw.rounded_rectangle((420, 490, 570, 526), radius=12, fill="#a8c4ff")
    draw.rounded_rectangle((420, 550, 600, 586), radius=12, fill="#7ce0c3")
    save(image, output_dir, "03_saas_launch.png")


def balanced_sale(output_dir: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#f2eadb")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, WIDTH, 150), fill="#ba4438")
    centered_text(draw, (0, 0, WIDTH, 150), "WEEKEND HOME SALE", load_font(54, True), "#ffffff")
    draw.rounded_rectangle((90, 215, 400, 620), radius=22, fill="#d9bd91")
    draw.rectangle((160, 315, 330, 570), fill="#8d5e3c")
    draw.ellipse((125, 260, 365, 390), fill="#f7e8cb")
    draw.text((455, 245), "30% OFF", font=load_font(57, True), fill="#ba4438")
    draw.text((460, 340), "Selected furniture\nand decor", font=load_font(31, True), fill="#3f3027", spacing=8)
    draw.rounded_rectangle((455, 485, 670, 548), radius=12, fill="#3f3027")
    centered_text(draw, (455, 485, 670, 548), "VIEW THE SALE", load_font(20, True), "#ffffff")
    save(image, output_dir, "04_balanced_sale.png")


def busy_catalog(output_dir: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#fff6dd")
    draw = ImageDraw.Draw(image)
    draw.text((25, 18), "MEGA BEAUTY WEEK", font=load_font(54, True), fill="#c22162")
    colors = ["#ef8caf", "#7ec8e3", "#f2bc57", "#9fd58d", "#bd9bea", "#f08a6b"]
    for index in range(12):
        column = index % 4
        row = index // 4
        x = 20 + column * 185
        y = 105 + row * 190
        draw.rounded_rectangle((x, y, x + 165, y + 165), radius=14, fill=colors[index % len(colors)])
        draw.rectangle((x + 52, y + 35, x + 110, y + 125), fill="#fffdf8")
        draw.text((x + 8, y + 135), f"ITEM {index + 1} - {20 + index}%", font=load_font(14, True), fill="#392d35")
    draw.rounded_rectangle((220, 650, 548, 735), radius=14, fill="#c22162")
    centered_text(draw, (220, 650, 548, 735), "SHOP EVERYTHING NOW", load_font(25, True), "#ffffff")
    save(image, output_dir, "05_busy_catalog.png")


def low_contrast(output_dir: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#d9d9d9")
    draw = ImageDraw.Draw(image)
    draw.rectangle((80, 90, 688, 660), fill="#cecece")
    draw.text((125, 135), "A BETTER EVERYDAY", font=load_font(48, True), fill="#c3c3c3")
    draw.text((130, 245), "New essentials designed for you", font=load_font(28), fill="#c7c7c7")
    draw.ellipse((250, 330, 520, 600), fill="#c5c5c5")
    draw.rounded_rectangle((245, 610, 520, 660), radius=10, fill="#c2c2c2")
    centered_text(draw, (245, 610, 520, 660), "LEARN MORE", load_font(20, True), "#bdbdbd")
    image = image.filter(ImageFilter.GaussianBlur(radius=1.6))
    save(image, output_dir, "06_low_contrast.png")


def conflicting_hierarchy(output_dir: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#f8f3e8")
    draw = ImageDraw.Draw(image)
    draw.text((30, 30), "NEW! NEW! NEW!", font=load_font(62, True), fill="#ff3b30")
    draw.text((40, 120), "LIMITED OFFER", font=load_font(66, True), fill="#2b59c3")
    draw.text((55, 220), "THE BEST PRODUCT", font=load_font(55, True), fill="#7c2ae8")
    draw.ellipse((220, 270, 610, 650), fill="#f6b73c")
    draw.rectangle((300, 335, 535, 640), fill="#ffffff", outline="#111111", width=5)
    draw.rounded_rectangle((50, 515, 390, 610), radius=16, fill="#ff3b30")
    centered_text(draw, (50, 515, 390, 610), "BUY NOW", load_font(42, True), "#ffffff")
    draw.rounded_rectangle((350, 560, 710, 665), radius=16, fill="#2b59c3")
    centered_text(draw, (350, 560, 710, 665), "CLICK HERE TODAY", load_font(31, True), "#ffffff")
    draw.text((48, 690), "Everything is important so nothing is clear", font=load_font(24), fill="#111111")
    save(image, output_dir, "07_conflicting_hierarchy.png")


def poor_crop(output_dir: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#e9f0f3")
    draw = ImageDraw.Draw(image)
    draw.text((35, 40), "NEW PRODUCT", font=load_font(24, True), fill="#253746")
    draw.rectangle((600, 130, 850, 720), fill="#7c94a3")
    draw.rounded_rectangle((650, 220, 820, 650), radius=25, fill="#f7fafb")
    tiny = "Premium quality product with advanced features and exceptional value available now"
    draw.multiline_text((45, 610), tiny, font=load_font(13), fill="#6b7b86", spacing=2)
    draw.rounded_rectangle((50, 680, 180, 714), radius=6, fill="#8ea0ab")
    centered_text(draw, (50, 680, 180, 714), "MORE", load_font(12, True), "#eef3f5")
    save(image, output_dir, "08_poor_crop.png")


def noisy_flyer(output_dir: Path) -> None:
    random.seed(27)
    image = Image.new("RGB", (WIDTH, HEIGHT), "#14ffec")
    draw = ImageDraw.Draw(image)
    palette = ["#ff00a8", "#fff200", "#2514ff", "#ff4d00", "#22ff00", "#000000"]
    for _ in range(65):
        x1 = random.randint(-50, WIDTH - 20)
        y1 = random.randint(-50, HEIGHT - 20)
        x2 = x1 + random.randint(30, 260)
        y2 = y1 + random.randint(20, 180)
        draw.rectangle((x1, y1, x2, y2), fill=random.choice(palette))
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    layer_draw = ImageDraw.Draw(layer)
    layer_draw.text((75, 245), "SUPER DEAL MAYBE", font=load_font(68, True), fill="#ffffff", stroke_width=5, stroke_fill="#000000")
    layer = layer.rotate(17, resample=Image.Resampling.BICUBIC, center=(WIDTH / 2, HEIGHT / 2))
    image = Image.alpha_composite(image.convert("RGBA"), layer)
    draw = ImageDraw.Draw(image)
    draw.text((15, 675), "click buy save new wow limited offer!!!", font=load_font(27, True), fill="#ffffff")
    save(image, output_dir, "09_noisy_flyer.png")


def blank_placeholder(output_dir: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#f7f7f7")
    draw = ImageDraw.Draw(image)
    draw.rectangle((335, 330, 433, 428), fill="#dedede")
    draw.text((346, 443), "item", font=load_font(13), fill="#c5c5c5")
    save(image, output_dir, "10_blank_placeholder.png")


FIXTURES = [
    ("01_luxury_serum.png", "high", True, luxury_serum),
    ("02_coffee_promo.png", "high", True, coffee_promo),
    ("03_saas_launch.png", "high", True, saas_launch),
    ("04_balanced_sale.png", "medium-high", True, balanced_sale),
    ("05_busy_catalog.png", "medium", False, busy_catalog),
    ("06_low_contrast.png", "low", False, low_contrast),
    ("07_conflicting_hierarchy.png", "low", False, conflicting_hierarchy),
    ("08_poor_crop.png", "low", False, poor_crop),
    ("09_noisy_flyer.png", "very-low", False, noisy_flyer),
    ("10_blank_placeholder.png", "very-low", False, blank_placeholder),
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="dist/marketing-eval-fixtures")
    args = parser.parse_args()
    output_dir = Path(args.output).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    for filename, _quality_band, _expect_text_preserved, renderer in FIXTURES:
        renderer(output_dir)

    manifest = {
        "kind": "synthetic-marketing-quality-benchmark",
        "sampleCount": len(FIXTURES),
        "fixtures": [
            {
                "filename": filename,
                "designQualityBand": quality_band,
                "containsPerson": False,
                "expectTextPreserved": expect_text_preserved,
                "sha256": sha256_file(output_dir / filename),
            }
            for filename, quality_band, expect_text_preserved, _renderer in FIXTURES
        ],
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Generated {len(FIXTURES)} synthetic fixtures in {output_dir}")


if __name__ == "__main__":
    main()
