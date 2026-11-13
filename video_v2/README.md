# GLOSS | "נכתב על אחד" (Written About One) — vertical ad, 1080x1920, 32s

Final: `GLOSS_Written_About_One_1080x1920.mp4` (H.264 High, 30fps, AAC 320k, -14 LUFS)

Rebuild:
    python3 audio.py score.wav
    ffmpeg -i score.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 score_norm.wav
    node render.js video gloss_raw.mp4
    ffmpeg -i gloss_raw.mp4 -i score_norm.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest -movflags +faststart GLOSS_Written_About_One_1080x1920.mp4
Stills: `node render.js frames <dir> 1.5 12.0 ...`

- index.html: the whole film as a deterministic timeline, render(t). All copy and timing live here.
- audio.py: original score, synthesized and locked to the same 110 BPM grid.
- assets/pages: magazine pages rendered from the PDF at 300dpi. assets/gloss-logo.png: official logo, unmodified.

## v2 ("Extreme creative upgrade")
Final: `video_v2/GLOSS_v2_1080x1920.mp4` (33s). v1 untouched in `video/`.
Build: `python3 audio.py score.wav && ffmpeg -i score.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 score_norm.wav && node render.js video GLOSS_v2_1080x1920.mp4 score_norm.wav 3`
- 3D magazine object (thickness, edges, floor shadow), page turns that bend (22 nested 3D strips with per-strip shading)
- Gloss light sweep across the cover, photos lifting off the page, 3D barn doors, isometric floor plan, plate-shaped iris, exploded issue
- Adaptive motion blur: up to 12 sub-frames per frame, averaged in linear light (accum.py), rendered by 3 parallel workers
