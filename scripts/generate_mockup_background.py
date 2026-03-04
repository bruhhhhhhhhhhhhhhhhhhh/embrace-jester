from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageOps


def parse_hex(color: str) -> tuple[int, int, int]:
    value = color.strip().lstrip("#")
    if len(value) != 6:
        raise ValueError(f"Expected #RRGGBB, got: {color!r}")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def build_background(
    width: int,
    height: int,
    center_hex: str,
    edge_hex: str,
    spotlight_y: float,
    vignette_strength: float,
    grain_strength: float,
) -> Image.Image:
    center_rgb = parse_hex(center_hex)
    edge_rgb = parse_hex(edge_hex)

    # Base spotlight (radial, bright in the center, dark at edges).
    grad = ImageOps.invert(Image.radial_gradient("L")).resize(
        (width, height), resample=Image.Resampling.LANCZOS
    )

    # Move the hotspot slightly upward so product placement feels more "lit from above".
    shift_y = int((spotlight_y - 0.5) * height)
    if shift_y != 0:
        shifted = Image.new("L", (width, height), color=0)
        shifted.paste(grad, (0, shift_y))
        grad = shifted

    # Tighten contrast a touch so whites read cleanly but still feel matte.
    grad = ImageEnhance.Contrast(grad).enhance(1.18)
    grad = ImageEnhance.Brightness(grad).enhance(1.04)

    bg = ImageOps.colorize(grad, black=edge_rgb, white=center_rgb).convert("RGB")

    # Additional vignette (kept radial/symmetric so it looks acceptable even if
    # a UI rotates the mockup plane).
    if vignette_strength > 0:
        vignette = Image.radial_gradient("L").resize(
            (width, height), resample=Image.Resampling.LANCZOS
        )
        vignette = ImageEnhance.Contrast(vignette).enhance(1.35)
        vignette = vignette.point(lambda p: int(p * 255 * vignette_strength / 255))
        edge = Image.new("RGB", (width, height), color=edge_rgb)
        bg = Image.composite(edge, bg, vignette)

    # Subtle grain using a light/dark composite. (Avoids banding and keeps the file
    # looking "studio" instead of synthetic.)
    if grain_strength > 0:
        noise = Image.effect_noise((width, height), 12).convert("L")
        # Make noise gentler and closer to mid-gray.
        noise = ImageEnhance.Contrast(noise).enhance(0.55)
        dark = ImageEnhance.Brightness(bg).enhance(1.0 - (grain_strength * 0.02))
        light = ImageEnhance.Brightness(bg).enhance(1.0 + (grain_strength * 0.02))
        bg = Image.composite(light, dark, noise)

        # Tiny extra micro-contrast so the grain reads without looking like JPEG artifacts.
        bg = ImageEnhance.Contrast(bg).enhance(1.02)

    return bg


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate a universal studio sweep mockup background PNG (no watermark)."
    )
    parser.add_argument(
        "--out",
        default="public/mockups/studio-sweep.png",
        help="Output path (PNG). Default: public/mockups/studio-sweep.png",
    )
    parser.add_argument("--size", type=int, default=3000, help="Square image size in px. Default: 3000")
    parser.add_argument("--center", default="#4B515A", help="Center color as #RRGGBB. Default: #4B515A")
    parser.add_argument("--edge", default="#0B0D10", help="Edge color as #RRGGBB. Default: #0B0D10")
    parser.add_argument(
        "--spotlight-y",
        type=float,
        default=0.45,
        help="Spotlight vertical center as fraction of height (0..1). Default: 0.45",
    )
    parser.add_argument(
        "--vignette",
        type=float,
        default=0.45,
        help="Vignette strength (0..1). Default: 0.45",
    )
    parser.add_argument(
        "--grain",
        type=float,
        default=1.0,
        help="Grain strength (0..1). Default: 1.0",
    )
    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    img = build_background(
        width=args.size,
        height=args.size,
        center_hex=args.center,
        edge_hex=args.edge,
        spotlight_y=args.spotlight_y,
        vignette_strength=max(0.0, min(1.0, args.vignette)),
        grain_strength=max(0.0, min(1.0, args.grain)),
    )

    tmp_path = out_path.with_suffix(".tmp.png")
    img.save(tmp_path, format="PNG", optimize=True)
    tmp_path.replace(out_path)
    print(f"Wrote {out_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

