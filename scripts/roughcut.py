#!/usr/bin/env python3
"""Cut the best moments from raw footage into one vertical 1080x1920 clip.

The cut list has one segment per line: <source file> <start> <end>
Times are seconds or mm:ss(.ms). Lines starting with # are ignored.

  python3 scripts/roughcut.py cuts.txt public/footage/tenable.mp4 --crop-x 0.5
"""
import argparse
import shlex
import subprocess
import sys


def seconds(s):
    parts = [float(p) for p in s.split(":")]
    total = 0.0
    for p in parts:
        total = total * 60 + p
    return total


def probe_size(path):
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height", "-of", "csv=p=0", path,
    ], text=True)
    w, h = out.strip().split(",")[:2]
    return int(w), int(h)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cuts")
    ap.add_argument("out")
    ap.add_argument("--crop-x", type=float, default=0.5, help="horizontal crop position for landscape footage, 0 = left, 1 = right")
    ap.add_argument("--no-grade", action="store_true", help="skip the gentle warm grade")
    args = ap.parse_args()

    segs = []
    for line in open(args.cuts):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        src, start, end = shlex.split(line)
        segs.append((src, seconds(start), seconds(end)))
    if not segs:
        sys.exit("No segments in the cut list")

    sources = sorted({s for s, _, _ in segs})
    index = {s: i for i, s in enumerate(sources)}
    inputs = sum((["-i", s] for s in sources), [])

    grade = "" if args.no_grade else ",eq=contrast=1.04:saturation=1.08,colorbalance=rm=0.03:bm=-0.03"
    parts, labels = [], []
    for n, (src, a, b) in enumerate(segs):
        i = index[src]
        w, h = probe_size(src)
        if w / h > 9 / 16:  # wider than vertical: crop the sides
            cw = int(h * 9 / 16) // 2 * 2
            crop = f"crop={cw}:{h}:{int((w - cw) * args.crop_x)}:0,"
        else:
            ch = int(w * 16 / 9) // 2 * 2
            crop = f"crop={w}:{ch}:0:{(h - ch) // 2}," if ch < h else ""
        parts.append(f"[{i}:v]trim={a}:{b},setpts=PTS-STARTPTS,{crop}scale=1080:1920,fps=30,setsar=1{grade}[v{n}]")
        parts.append(f"[{i}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,aresample=48000[a{n}]")
        labels.append(f"[v{n}][a{n}]")
    parts.append(f"{''.join(labels)}concat=n={len(segs)}:v=1:a=1[v][acat]")
    parts.append("[acat]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]")

    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs,
           "-filter_complex", ";".join(parts), "-map", "[v]", "-map", "[a]",
           "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", args.out]
    subprocess.run(cmd, check=True)
    total = sum(b - a for _, a, b in segs)
    print(f"{args.out}: {len(segs)} segments, {total:.1f}s")


if __name__ == "__main__":
    main()
