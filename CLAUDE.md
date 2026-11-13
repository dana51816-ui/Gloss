# Studio GLOSS: working notes

## Video standard (owner request: "always keep this level")
The bar is `video_v2/` (GLOSS v2). Every new video must meet it:
- Concept first: one sharp idea that drives every scene; no slideshows or templates.
- Magazine pages are the hero and stay authentic (crop, frame, animate, lift; never alter faces, photos or text; never invent content).
- Real dimensional motion: 3D magazine object (thickness, edges, floor shadow), curling page turns, lifted photos, camera choreography, a different technique per beat.
- Kinetic Hebrew typography, RTL, safe zones for Reels (key text between y=250 and y=1500 on 1080x1920).
- Adaptive motion blur (render.js + accum.py, linear-light sub-frame accumulation), 30fps, H.264, -14 LUFS.
- Original synthesized score locked to the edit's BPM grid; a sound for every visual event; silence used for pauses.
- Review real rendered frames (contact sheets + full-res crops), fix, re-render. Never claim to have heard audio.
- Brand look (owner, Nov 2026): BOHO CHIC. Palette: sand #E8DBC7, cream #F7F0E4, terracotta #C47A55 / #A9542F, dusty rose #D9A797, sage #9BA585, cocoa text #4A3426. Motifs: layered rainbow arches, arch windows, hand-drawn line sun, paper grain. Reference: video_boho/. (Older burgundy look: video/, video_v2/, video_q/.)
- Fonts: Bellefair (headlines), Playpen Sans Hebrew (handwriting), Karantina (photo-filled words), Heebo (UI), Bodoni Moda (Latin accents; avoid thin italic digits, a 4 reads as 1).
- Official logo gloss-logo.png stays unmodified (no recolor) unless the owner supplies a new file. No emoji, no em dashes.
- Keep previous versions intact; each video in its own folder with source + final MP4.
