#!/bin/sh
# One command: picture, score, foley, mix, master -> gloss-deco.mp4 (1080x1920, 24 fps, -14 LUFS)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
cd "$LIB"
"$LIB/.venv/bin/python" core/audio/sampler.py --need upright jazz_bass clarinet trumpet_mute harp vibraphone tubular_bells snare drum_kit
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/readcheck.mjs "$HERE" --size 1080x1920 > /dev/null
"$LIB/.venv/bin/python" "$HERE/music/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 24 --size 1080x1920 --workers 4 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/gloss-deco.mp4" 24 1
node core/render/still.mjs "$HERE" 31.9 --size 1080x1920 --out "$HERE/out" --prefix poster_
cp "$HERE/out/poster_31.9.jpg" "$HERE/poster.jpg"
