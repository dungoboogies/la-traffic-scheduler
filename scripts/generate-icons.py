#!/usr/bin/env python3
"""Generate traffic light PWA icons for LA Traffic Scheduler."""

from PIL import Image, ImageDraw
import struct
import io


def draw_traffic_light(size: int) -> Image.Image:
    """Draw a flat-design traffic light icon at the given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Proportions relative to size
    s = size

    # Background: rounded rectangle (blue, matching theme #2563eb)
    bg_margin = int(s * 0.06)
    bg_radius = int(s * 0.18)
    draw.rounded_rectangle(
        [bg_margin, bg_margin, s - bg_margin, s - bg_margin],
        radius=bg_radius,
        fill=(37, 99, 235),  # #2563eb
    )

    # Traffic light body: dark rounded rect
    body_w = s * 0.42
    body_h = s * 0.72
    body_x = (s - body_w) / 2
    body_y = (s - body_h) / 2
    body_radius = int(body_w * 0.28)
    draw.rounded_rectangle(
        [body_x, body_y, body_x + body_w, body_y + body_h],
        radius=body_radius,
        fill=(30, 41, 59),  # slate-800
    )

    # Three lights
    light_radius = body_w * 0.30
    center_x = s / 2
    light_spacing = body_h / 4

    lights = [
        (center_x, body_y + light_spacing * 1, (239, 68, 68)),      # red    #ef4444
        (center_x, body_y + light_spacing * 2, (250, 204, 21)),     # yellow #facc15
        (center_x, body_y + light_spacing * 3, (34, 197, 94)),      # green  #22c55e
    ]

    for cx, cy, color in lights:
        # Outer glow ring
        glow_r = light_radius * 1.25
        glow_color = tuple(min(255, c + 40) for c in color) + (80,)
        draw.ellipse(
            [cx - glow_r, cy - glow_r, cx + glow_r, cy + glow_r],
            fill=glow_color,
        )
        # Main light circle
        draw.ellipse(
            [cx - light_radius, cy - light_radius, cx + light_radius, cy + light_radius],
            fill=color,
        )
        # Highlight / shine dot (top-left)
        shine_r = light_radius * 0.3
        shine_offset = light_radius * 0.25
        shine_color = tuple(min(255, c + 80) for c in color)
        draw.ellipse(
            [
                cx - shine_offset - shine_r,
                cy - shine_offset - shine_r,
                cx - shine_offset + shine_r,
                cy - shine_offset + shine_r,
            ],
            fill=shine_color,
        )

    # Pole below the body
    pole_w = s * 0.06
    pole_x = (s - pole_w) / 2
    pole_top = body_y + body_h
    pole_bottom = s - bg_margin - int(s * 0.04)
    if pole_bottom > pole_top:
        draw.rounded_rectangle(
            [pole_x, pole_top, pole_x + pole_w, pole_bottom],
            radius=int(pole_w * 0.3),
            fill=(30, 41, 59),
        )

    return img


def create_ico(img: Image.Image, path: str):
    """Create a .ico file with 32x32 and 16x16 sizes."""
    img_32 = img.resize((32, 32), Image.LANCZOS)
    img_16 = img.resize((16, 16), Image.LANCZOS)
    img_32.save(path, format="ICO", sizes=[(16, 16), (32, 32)])


def main():
    base = "/Users/josh/la-traffic-scheduler/public"

    # Generate 512x512
    icon_512 = draw_traffic_light(512)
    icon_512.save(f"{base}/icon-512.png", "PNG")
    print("Created icon-512.png")

    # Generate 192x192
    icon_192 = icon_512.resize((192, 192), Image.LANCZOS)
    icon_192.save(f"{base}/icon-192.png", "PNG")
    print("Created icon-192.png")

    # Generate favicon.ico (32x32 + 16x16)
    create_ico(icon_512, "/Users/josh/la-traffic-scheduler/src/app/favicon.ico")
    print("Created favicon.ico")

    # Also put a copy in public for good measure
    create_ico(icon_512, f"{base}/favicon.ico")
    print("Created public/favicon.ico")

    # Generate apple-touch-icon (180x180)
    icon_180 = icon_512.resize((180, 180), Image.LANCZOS)
    icon_180.save(f"{base}/apple-touch-icon.png", "PNG")
    print("Created apple-touch-icon.png")


if __name__ == "__main__":
    main()
