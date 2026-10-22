#!/usr/bin/env python3
"""Cut the best moments from raw footage into one vertical 1080x1920 clip.

The cut list has one segment per line: <source file> <start> <end>
Times are seconds or mm:ss(.ms). Lines starting with # are ignored.

  python3 scripts/roughcut.py cuts.txt public/footage/tenable.mp4 --crop-x 0.5
"""
import argparse
import json
import os
import shlex
import subprocess
import sys
import tempfile


def seconds(s):
    parts = [float(p) for p in s.split(":")]
    total = 0.0
    for p in parts:
        total = total * 60 + p
    return total


def probe_size(path):
    """Display size: phones store portrait video sideways with a rotation flag, which ffmpeg applies."""
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height:stream_side_data=rotation", "-of", "json", path,
    ], text=True)
    s = json.loads(out)["streams"][0]
    w, h = s["width"], s["height"]
    rotation = next((d["rotation"] for d in s.get("side_data_list", []) if "rotation" in d), 0)
    return (h, w) if abs(int(rotation)) % 180 == 90 else (w, h)


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

    grade = "" if args.no_grade else ",eq=contrast=1.04:saturation=1.08,colorbalance=rm=0.03:bm=-0.03"
    ff = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]

    # Render each segment to 1080p on its own, so only one 4K source is decoded at a time.
    with tempfile.TemporaryDirectory() as tmp:
        pieces = []
        for n, (src, a, b) in enumerate(segs):
            w, h = probe_size(src)
            if w / h > 9 / 16:  # wider than vertical: crop the sides
                cw = int(h * 9 / 16) // 2 * 2
                crop = f"crop={cw}:{h}:{int((w - cw) * args.crop_x)}:0,"
            else:
                ch = int(w * 16 / 9) // 2 * 2
                crop = f"crop={w}:{ch}:0:{(h - ch) // 2}," if ch < h else ""
            d = b - a
            fade = min(0.03, d / 4)  # avoids clicks at hard cuts
            piece = os.path.join(tmp, f"{n:03d}.mkv")
            subprocess.run([*ff, "-ss", f"{a}", "-t", f"{d}", "-i", src,
                            "-vf", f"{crop}scale=1080:1920,fps=30,setsar=1{grade}",
                            "-af", f"aresample=48000,afade=t=in:d={fade},afade=t=out:st={d - fade:.3f}:d={fade}",
                            "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-pix_fmt", "yuv420p",
                            "-c:a", "pcm_s16le", piece], check=True)
            pieces.append(piece)

        inputs = sum((["-i", p] for p in pieces), [])
        labels = "".join(f"[{n}:v][{n}:a]" for n in range(len(pieces)))
        graph = f"{labels}concat=n={len(pieces)}:v=1:a=1[v][acat];[acat]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]"
        subprocess.run([*ff, *inputs, "-filter_complex", graph, "-map", "[v]", "-map", "[a]",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", args.out], check=True)
    total = sum(b - a for _, a, b in segs)
    print(f"{args.out}: {len(segs)} segments, {total:.1f}s")


if __name__ == "__main__":
    main()
