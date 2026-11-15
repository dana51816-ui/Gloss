#!/bin/sh
# One command: frames (resumable, software or GPU WebGL), score, foley, mix, master -> gloss-glass.mp4 (1080x1920, 24 fps, -14 LUFS)
# On a machine with a GPU, drop LEMO_ANGLE=swiftshader and raise WORKERS.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}; export LIB
WORKERS=${WORKERS:-2}
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920 --q ssaa=1
"$LIB/.venv/bin/python" "$HERE/music/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
per=$(( (768 + WORKERS - 1) / WORKERS )); i=0
while [ $i -lt $WORKERS ]; do a=$((i * per)); b=$((a + per)); [ $b -gt 768 ] && b=768; node "$HERE/render_frames.mjs" $a $b & i=$((i + 1)); done
wait
ffmpeg -y -loglevel error -framerate 24 -i "$HERE/out/frames/f_%05d.jpg" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/gloss-glass.mp4" 24 0
cp "$HERE/out/frames/f_00744.jpg" "$HERE/poster.jpg"
