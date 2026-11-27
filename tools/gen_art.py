#!/usr/bin/env python3
"""Batch-generate base art with the Higgsfield CLI from a JSON job list.

Each job: {"name": str, "prompt": str, "aspect": "1:1", "refs": [paths]}.
Skips jobs whose output PNG already exists, so reruns only fill gaps.
Example: tools/gen_art.py art-src/jobs/base.json art-src/base
"""
import json
import subprocess
import time
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

STYLE = (
    "16-bit SNES / PS1 era gothic castle-exploration game pixel art, crisp hard-edged pixels, "
    "rich dark moody palette, strong dark outline, detailed shading. No text, no watermark, no border. "
)
SPRITE = (
    "Single game sprite, side view facing RIGHT, full body, centered with margin, "
    "on a perfectly flat solid magenta #FF00FF background, no shadow, no floor, no other objects. "
)


def build_prompt(job: dict) -> str:
    """Prefix the shared style (and sprite framing unless the job is a scene)."""
    framing = "" if job.get("scene") else SPRITE
    return STYLE + framing + job["prompt"]


def job_command(job: dict) -> list:
    """Higgsfield CLI call for one job."""
    cmd = ["higgsfield", "generate", "create", "nano_banana_pro", "--resolution", "2k",
           "--aspect_ratio", job.get("aspect", "1:1"), "--prompt", build_prompt(job),
           "--wait", "--wait-timeout", "15m", "--json"]
    for ref in job.get("refs", []):
        cmd += ["--image-references", ref]
    return cmd


def run_job(job: dict, out_dir: Path) -> str:
    """Generate one image and download it; returns a status line."""
    target = out_dir / f"{job['name']}.png"
    if target.exists():
        return f"skip {job['name']}"
    cmd = job_command(job)
    for _ in range(40):  # plan allows 4 concurrent jobs; wait for a free slot
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if "rate_limit_reached" not in proc.stdout + proc.stderr:
            break
        time.sleep(20)
    try:
        url = json.loads(proc.stdout[proc.stdout.index("["):])[0]["result_url"]
    except (ValueError, KeyError, IndexError):
        url = None
    if not url:
        return f"FAIL {job['name']}: {proc.stdout[-300:]} {proc.stderr[-300:]}"
    urllib.request.urlretrieve(url, target)
    return f"ok   {job['name']}"


def main() -> None:
    jobs = json.loads(Path(sys.argv[1]).read_text())
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=3) as pool:
        for line in pool.map(lambda j: run_job(j, out_dir), jobs):
            print(line, flush=True)


if __name__ == "__main__":
    main()
