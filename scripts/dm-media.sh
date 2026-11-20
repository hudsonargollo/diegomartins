#!/usr/bin/env bash
# One-time media pipeline for the public booking page.
# - Re-encodes slideshow/gallery videos from the original WhatsApp clips at a
#   sane bitrate for a ~700px-wide slot (originals were 100-190kbps @ 480x270).
# - Re-renders every photo WebP from the full-resolution originals (originals
#   were downscaled to ~675px wide / ~30KB).
# - Renders the hero "hug" photo from shop-4's original with a tighter crop so
#   the faces survive the wide 320px object-cover frame.
set -euo pipefail

ROOT="/root/ClubeMkt/diegomartins"
SRC="$ROOT/imgs"
PUB="$ROOT/frontend/public/dm"
TMP="/root/.hermes/cache/scratch/dm-media"
mkdir -p "$TMP"

CUT="-c:v libx264 -preset slow -profile:v high -level 4.0 -pix_fmt yuv420p -movflags +faststart -an"

# slideshow name -> source clip
encode_video() {
  local out="$1" src="$2" secs="$3" w="$4" h="$5" bitrate="$6"
  ffmpeg -v error -y -i "$src" \
    -t "$secs" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},fps=24,format=yuv420p" \
    $CUT -b:v "${bitrate}k" -maxrate "$((bitrate * 2))k" -bufsize "$((bitrate * 3))k" -crf 23 \
    "$out"
}

encode_video "$TMP/work-1.mp4" "$SRC/WhatsApp Video 2026-11-16 at 10.51.54.mp4" 6.65 720 404 1100
encode_video "$TMP/work-2.mp4" "$SRC/WhatsApp Video 2026-11-16 at 10.59.16.mp4" 6.00 720 404 1200
encode_video "$TMP/work-4.mp4" "$SRC/WhatsApp Video 2026-11-17 at 12.41.53.mp4" 11.56 720 404 1400
encode_video "$TMP/work-5.mp4" "$SRC/WhatsApp Video 2026-11-17 at 12.41.57.mp4" 10.67 720 404 1400

# Long clips -> short 9:16 loops (first 8s), same treatment.
encode_video "$TMP/work-3.mp4" "$SRC/WhatsApp Video 2026-11-16 at 10.59.27.mp4" 8.0 720 404 900
encode_video "$TMP/work-6.mp4" "$SRC/WhatsApp Video 2026-11-17 at 12.42.10.mp4" 8.0 720 404 900

echo "--- videos ---"
for f in "$TMP"/work-*.mp4; do
  printf '%s  %s KB  %s\n' "$(basename "$f")" "$(( $(stat -c%s "$f") / 1024 ))" \
    "$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,bit_rate -of csv=p=0 "$f")"
done

# Photo mapping: public name -> source jpeg
declare -A PHOTO=(
  [shop-1]="WhatsApp Image 2026-11-16 at 10.59.14 (1).jpeg"
  [shop-2]="WhatsApp Image 2026-11-16 at 10.59.14 (2).jpeg"
  [shop-3]="WhatsApp Image 2026-11-16 at 10.59.14 (3).jpeg"
  [shop-4]="WhatsApp Image 2026-11-17 at 12.36.25 (2).jpeg"
  [work-corte]="WhatsApp Image 2026-11-17 at 12.41.50 (3).jpeg"
  [work-corte2]="WhatsApp Image 2026-11-17 at 12.41.49 (1).jpeg"
  [work-barba]="WhatsApp Image 2026-11-17 at 12.41.51.jpeg"
  [work-barba2]="WhatsApp Image 2026-11-17 at 12.41.54.jpeg"
  [work-combo]="WhatsApp Image 2026-11-17 at 12.41.58.jpeg"
  [work-combo2]="WhatsApp Image 2026-11-17 at 12.41.54 (1).jpeg"
  [work-kids]="WhatsApp Image 2026-11-17 at 12.41.50.jpeg"
  [work-kids2]="WhatsApp Image 2026-11-17 at 12.36.24.jpeg"
  [work-kids3]="WhatsApp Image 2026-11-17 at 12.41.50 (2).jpeg"
  [work-kids4]="WhatsApp Image 2026-11-17 at 12.36.25.jpeg"
)

echo "--- photos (3:4 cards) ---"
for name in "${!PHOTO[@]}"; do
  python3 - "$SRC/${PHOTO[$name]}" "$TMP/$name.webp" <<'PY'
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
# fit into 3:4 box, max 1080x1440, keep aspect by centre-crop
tw, th = 1080, 1440
im = im.resize((tw, th), Image.LANCZOS) if im.width / im.height == tw / th else im
w, h = im.size
target = tw / th
if w / h > target:
    nw = int(h * target); x = (w - nw) // 2
    im = im.crop((x, 0, x + nw, h))
else:
    nh = int(w / target); y = (h - nh) // 2
    im = im.crop((0, y, w, y + nh))
im = im.resize((tw, th), Image.LANCZOS)
im.save(dst, 'WEBP', quality=88, method=6, exact=True)
PY
  printf '%s  %s\n' "$name.webp" "$(identify -format '%wx%h' "$TMP/$name.webp")"
done

# Hero: the hug photo, tight crop so faces stay large in the wide frame.
python3 - "$SRC/WhatsApp Image 2026-11-17 at 12.36.25 (2).jpeg" "$TMP/hero-hug.webp" <<'PY'
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
w, h = im.size                       # 1066 x 1600
# Faces sit at x 52-62%, man's face y 38-47%, boy's face y 47-56% (of source).
# Centre the crop on the pair (x ~56%, y ~47%) and take the top ~78% of frame.
cx, cy = 0.56 * w, 0.47 * h
crop_w = int(w * 0.92)
crop_h = int(crop_w / (720 / 340))   # ~2.12:1 like the 720x340 slot
left = int(max(0, min(cx - crop_w / 2, w - crop_w)))
top  = int(max(0, min(cy - crop_h / 2, h - crop_h)))
im = im.crop((left, top, left + crop_w, top + crop_h))
im = im.resize((1440, 680), Image.LANCZOS)
im.save(dst, 'WEBP', quality=90, method=6, exact=True)
print('hero crop box', left, top, left + crop_w, top + crop_h)
PY

echo "--- hero ---"
identify -format '%wx%h\n' "$TMP/hero-hug.webp"
du -h "$TMP/hero-hug.webp"
