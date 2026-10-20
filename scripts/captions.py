#!/usr/bin/env python3
"""Copy word timings from a Whisper JSON transcript into a reel's props file.

  whisper public/footage/tenable.mp4 --model small --language en \
      --word_timestamps True --output_format json --output_dir out
  python3 scripts/captions.py out/tenable.json projects/2026-10-21/tenable.json

Fix misheard words (names, Bible books) in the props file afterwards.
"""
import argparse
import json


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("whisper_json")
    ap.add_argument("props")
    ap.add_argument("--offset", type=float, default=0.0, help="seconds to add to every word")
    args = ap.parse_args()

    transcript = json.load(open(args.whisper_json))
    words = [
        {"text": w["word"].strip(), "start": round(w["start"] + args.offset, 2), "end": round(w["end"] + args.offset, 2)}
        for seg in transcript["segments"] for w in seg.get("words", []) if w["word"].strip()
    ]
    props = json.load(open(args.props))
    props["captions"] = words
    with open(args.props, "w") as f:
        json.dump(props, f, indent=2, ensure_ascii=False)
    print(f"{len(words)} words written to {args.props}")


if __name__ == "__main__":
    main()
