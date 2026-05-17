"""Rebuild all HeyGen PPTX files. Run: python normalize_tts.py && python build_all_segments.py"""
import subprocess
import sys
from pathlib import Path

BUILDERS = [
    "build_segment01_pptx.py",
    "build_segment02_pptx.py",
    "build_segment03_intro_pptx.py",
    "build_segment04_pptx.py",
    "build_segment05_pptx.py",
    "build_segment06_pptx.py",
]


def main():
    root = Path(__file__).parent
    for name in BUILDERS:
        print(f"--- {name} ---")
        r = subprocess.run([sys.executable, str(root / name)], cwd=root)
        if r.returncode != 0:
            raise SystemExit(r.returncode)
    print("All segments built.")


if __name__ == "__main__":
    main()
