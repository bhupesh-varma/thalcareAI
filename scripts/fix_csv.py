from pathlib import Path

src = Path("data/processed_hospitals.csv")
dst = Path("data/processed_hospitals_clean.csv")

with open(src, "rb") as f:
    raw = f.read()

# Decode using Windows-1252, ignoring bad chars, then re-encode UTF-8
text = raw.decode("cp1252", errors="ignore")

with open(dst, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("Clean CSV written to:", dst)
