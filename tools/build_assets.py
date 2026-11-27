#!/usr/bin/env python3
"""Turn the Higgsfield source art (art-src/) into game assets (assets/).

Sprites: magenta background keyed out (flood fill from the border), pose sheets
sliced on their 4x2 grid, scaled to in-game height, packed into atlases with
anchor metadata in assets/sprites.json. Backgrounds: far/mid parallax layers
and a terrain texture per zone.
Example: tools/build_assets.py   (run from the repo root)
"""
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from asset_specs import SPRITES, PROPS, ZONES

SRC = Path("art-src")
OUT = Path("assets")
WORK = 768  # keying resolution


def key_background(img: Image.Image, tol: float = 70.0) -> Image.Image:
    """Make the border-connected background transparent; returns RGBA."""
    rgb = img.convert("RGB")
    rgb.thumbnail((WORK, WORK), Image.LANCZOS)
    arr = np.asarray(rgb).astype(np.int32)
    border = np.concatenate([arr[0], arr[-1], arr[:, 0], arr[:, -1]])
    bg = np.median(border, axis=0)
    near = np.sqrt(((arr - bg) ** 2).sum(axis=2)) < tol
    mask = Image.fromarray((near * 255).astype(np.uint8), "L")
    for x, y in border_points(mask.size):
        if mask.getpixel((x, y)) == 255:
            ImageDraw.floodfill(mask, (x, y), 128)
    alpha = np.where(np.asarray(mask) == 128, 0, 255).astype(np.uint8)
    return despill(Image.fromarray(np.dstack([arr.astype(np.uint8), alpha]), "RGBA"), bg)


def key_global(img: Image.Image, tol: float = 110.0) -> Image.Image:
    """Key every background-coloured pixel (silhouette layers with enclosed holes)."""
    rgb = img.convert("RGB")
    rgb.thumbnail((WORK * 2, WORK * 2), Image.LANCZOS)
    arr = np.asarray(rgb).astype(np.int32)
    bg = np.array([255, 0, 255])
    dist = np.sqrt(((arr - bg) ** 2).sum(axis=2))
    magentaish = (arr[..., 0] > 150) & (arr[..., 2] > 150) & (arr[..., 1] < 110)
    alpha = np.where((dist < tol) | magentaish, 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([arr.astype(np.uint8), alpha]), "RGBA")


def border_points(size):
    w, h = size
    step = 16
    for x in range(0, w, step):
        yield x, 0
        yield x, h - 1
    for y in range(0, h, step):
        yield 0, y
        yield w - 1, y


def despill(img: Image.Image, bg) -> Image.Image:
    """Drop the 1px magenta fringe left by antialiasing around opaque pixels."""
    arr = np.asarray(img).copy()
    rgb = arr[..., :3].astype(np.int32)
    fringe = (np.sqrt(((rgb - bg) ** 2).sum(axis=2)) < 140) & (arr[..., 3] > 0)
    arr[fringe, 3] = 0
    return Image.fromarray(arr, "RGBA")


def grid_frames(img: Image.Image, cols: int, rows: int) -> list:
    w, h = img.size
    cw, ch = w // cols, h // rows
    cells = [img.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)) for r in range(rows) for c in range(cols)]
    return [cell for cell in cells if cell.getbbox()]


def dilate(mask: np.ndarray, radius: int) -> np.ndarray:
    out = mask.copy()
    for _ in range(radius):
        grown = out.copy()
        grown[1:] |= out[:-1]
        grown[:-1] |= out[1:]
        grown[:, 1:] |= out[:, :-1]
        grown[:, :-1] |= out[:, 1:]
        out = grown
    return out


def components(img: Image.Image, min_area: int = 200, radius: int = 10, rows: int = 0) -> list:
    """Split a sheet into its separate objects (row-major order); nearby fragments merge."""
    alpha = dilate(np.asarray(img)[..., 3] > 0, radius)
    seen = np.zeros_like(alpha)
    boxes = []
    for y, x in zip(*np.nonzero(alpha)):
        if seen[y, x]:
            continue
        boxes.append(flood_box(alpha, seen, x, y))
    boxes = [b for b in boxes if (b[2] - b[0]) * (b[3] - b[1]) >= min_area]
    if rows:  # pose sheet: drop text/specks, order row by row
        biggest = max((b[2] - b[0]) * (b[3] - b[1]) for b in boxes)
        boxes = [b for b in boxes if (b[2] - b[0]) * (b[3] - b[1]) >= 0.2 * biggest]
        band = img.size[1] / rows
        boxes.sort(key=lambda b: (int(((b[1] + b[3]) / 2) // band), b[0]))
    else:
        boxes.sort(key=lambda b: (round(b[3] / 150), b[0]))
    crops = [img.crop((b[0], b[1], b[2] + 1, b[3] + 1)) for b in boxes]
    return [c.crop(c.getbbox()) for c in crops]


def flood_box(alpha, seen, x, y):
    h, w = alpha.shape
    queue = deque([(x, y)])
    seen[y, x] = True
    x0, y0, x1, y1 = x, y, x, y
    while queue:
        cx, cy = queue.popleft()
        x0, y0, x1, y1 = min(x0, cx), min(y0, cy), max(x1, cx), max(y1, cy)
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h and alpha[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                queue.append((nx, ny))
    return x0, y0, x1, y1


def body_center(frame: Image.Image) -> float:
    """Horizontal centre of the torso band, so extended weapons don't shift the anchor."""
    alpha = np.asarray(frame)[..., 3] > 0
    h = alpha.shape[0]
    band = alpha[int(h * 0.35):int(h * 0.75)]
    xs = np.nonzero(band)[1]
    return float(np.median(xs)) if len(xs) else frame.size[0] / 2


def scale_frames(frames: list, height: int) -> list:
    """Scale all frames by the factor that makes the first one `height` px tall."""
    first = frames[0].crop(frames[0].getbbox())
    factor = height / first.size[1]
    out = []
    for frame in frames:
        frame = frame.crop(frame.getbbox())
        size = (max(1, round(frame.size[0] * factor)), max(1, round(frame.size[1] * factor)))
        scaled = frame.resize(size, Image.LANCZOS)
        arr = np.asarray(scaled).copy()
        arr[..., 3] = np.where(arr[..., 3] > 110, 255, 0)  # hard pixel edges
        out.append(Image.fromarray(arr, "RGBA"))
    return out


class Packer:
    """Shelf packer: fills rows left-to-right inside a fixed-width atlas."""

    def __init__(self, width: int = 1024):
        self.width, self.x, self.y, self.row_h = width, 0, 0, 0
        self.items = []

    def add(self, img: Image.Image) -> list:
        if self.x + img.size[0] + 1 > self.width:
            self.x, self.y, self.row_h = 0, self.y + self.row_h + 1, 0
        rect = [self.x, self.y, img.size[0], img.size[1]]
        self.items.append((img, rect))
        self.x += img.size[0] + 1
        self.row_h = max(self.row_h, img.size[1])
        return rect

    def save(self, path: Path) -> None:
        atlas = Image.new("RGBA", (self.width, self.y + self.row_h + 1), (0, 0, 0, 0))
        for img, rect in self.items:
            atlas.paste(img, (rect[0], rect[1]))
        atlas.save(path, optimize=True)


def load_frames(spec: dict) -> list:
    img = key_background(Image.open(SRC / spec["src"]))
    if spec.get("grid") and spec.get("slice") == "grid":
        return grid_frames(img, *spec["grid"])
    if spec.get("grid"):
        return components(img, radius=spec.get("radius", 4), rows=spec["grid"][1])
    if spec.get("component") is not None:
        return [components(img)[spec["component"]]]
    return [img.crop(img.getbbox())]


def pack_sprite(name: str, spec: dict, packer: Packer, atlas: str, cache: dict) -> dict:
    if spec.get("component") is not None:
        if spec["src"] not in cache:
            keyed = key_background(Image.open(SRC / spec["src"]))
            cache[spec["src"]] = components(keyed, radius=spec.get("radius", 10))
        frames = [cache[spec["src"]][spec["component"]]]
    else:
        frames = load_frames(spec)
    frames = scale_frames(frames, spec["h"])
    rects, anchors = [], []
    for frame in frames:
        rects.append(packer.add(frame))
        anchors.append([round(body_center(frame)), frame.size[1]])
    return {"atlas": atlas, "frames": rects, "anchors": anchors, "anims": spec.get("anims", {"idle": [0]})}


def build_sprites() -> dict:
    meta, cache = {}, {}
    for atlas, table in (("chars", SPRITES), ("props", PROPS)):
        packer = Packer()
        for name, spec in table.items():
            if not (SRC / spec["src"]).exists() and spec.get("fallback"):
                spec = {"src": spec["fallback"], "h": spec["h"],
                        "anims": {k: [0] for k in spec.get("anims", {"idle": [0]})}}
            if not (SRC / spec["src"]).exists():
                print(f"missing {spec['src']} for {name}")
                continue
            meta[name] = pack_sprite(name, spec, packer, f"assets/{atlas}.png", cache)
        packer.save(OUT / f"{atlas}.png")
    return meta


def build_zone(zone: str) -> None:
    far = SRC / f"base/{zone}_far.png"
    if far.exists():
        img = Image.open(far).convert("RGB").resize((640, 360), Image.LANCZOS).crop((0, 44, 640, 316))
        img.quantize(96).convert("RGB").save(OUT / f"{zone}_far.png", optimize=True)
    mid = SRC / f"base/{zone}_mid.png"
    if mid.exists():
        keyed = key_global(Image.open(mid)).resize((640, 360), Image.LANCZOS).crop((0, 88, 640, 360))
        keyed.save(OUT / f"{zone}_mid.png", optimize=True)
    tiles = SRC / f"base/{zone}_tiles.png"
    if tiles.exists():
        Image.open(tiles).convert("RGB").resize((128, 128), Image.LANCZOS).save(OUT / f"{zone}_tiles.png")


def main() -> None:
    OUT.mkdir(exist_ok=True)
    meta = build_sprites()
    (OUT / "sprites.json").write_text(json.dumps(meta, separators=(",", ":")))
    for zone in ZONES:
        build_zone(zone)
    title = SRC / "base/title.png"
    if title.exists():
        Image.open(title).convert("RGB").resize((480, 270), Image.LANCZOS).save(OUT / "title.png")
    print(f"{len(meta)} sprites")


if __name__ == "__main__":
    main()
