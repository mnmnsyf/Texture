#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
PREVIEWS = (
    "input_images/cross_pein_hammer.png",
    "input_images/multi_cleaner_5_litre.png",
    "input_images/carved_wooden_plate.png",
    "input_images/alarm_clock_01.png",
    "input_images/green_chair_01.png",
)


def trim_preview(path: Path, canvas_size: int = 1024, max_occupancy: float = 0.78) -> None:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        return

    cropped = image.crop(bbox)
    max_side = int(canvas_size * max_occupancy)
    scale = min(max_side / cropped.width, max_side / cropped.height)
    new_size = (
        max(1, round(cropped.width * scale)),
        max(1, round(cropped.height * scale)),
    )

    resized = cropped.resize(new_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    offset = (
        (canvas_size - resized.width) // 2,
        (canvas_size - resized.height) // 2,
    )
    canvas.alpha_composite(resized, dest=offset)
    canvas.save(path)
    print(f"Trimmed {path.relative_to(ROOT)} -> {new_size[0]}x{new_size[1]}")


def main() -> None:
    for rel_path in PREVIEWS:
        trim_preview(ROOT / rel_path)


if __name__ == "__main__":
    main()
