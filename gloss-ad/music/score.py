"""Studio GLOSS · "מגיע שער" — original score, 120 BPM, D major, 16 bars (32 s).
Marimba ostinato, motorik kit, glockenspiel on every cover line, a sine that sings for the red square.
Run: $LIB/.venv/bin/python music/score.py  → music/score.wav
"""
import sys, os
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ['LIB']
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, lp, hp, noise

S.seed(2026); rng = np.random.default_rng(2026)
E8, E16, BAR = .25, .125, 2.0
DUR = 32.5; N = int(DUR * SR)
st = {k: np.zeros((N, 2), np.float32) for k in ['drums', 'mar', 'bass', 'glk', 'pad', 'fx']}

CH = [[50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52]]     # D, Bm, G, A (midi)
def chord(t): return CH[int(t // BAR) % 4]

# ---------- drums ----------
def kit(v, t, vel, gain=1.0, pan=0.0): add(st['drums'], S.hit('drum_kit', v, vel), t, gain, pan)
def kick(t, vel=.85, g=1.0): kit('kick_drum_left', t, vel, g)
def snare(t, vel=.65, g=.7): kit('snare_1', t, vel, g, .05)
def hat(t, vel=.4, g=.3): kit('hi_hat_closed', t, vel, g, .25)
def crash(t, vel=.8, g=.5, pan=-.2): kit('crash_left', t, vel, g, pan)
def motorik(t0, sn=True, hats=True):
    for b in (0, 1.0, 1.25): kick(t0 + b, .9 if b != 1.25 else .7)
    if sn: snare(t0 + .5); snare(t0 + 1.5)
    if hats:
        for i in range(8): hat(t0 + i * E8, .5 if i % 2 else .34, .32 if i % 2 else .24)

for i in range(48): hat(i * E16, .26 if i % 4 else .38, .22)          # 0–6: tick grid
for b in np.arange(0, 6, 1.0): kick(b, .8, 1.0)                        # kick on 1 and 3
crash(10.0, .9, .55)
for t0 in (10.0, 12.0): motorik(t0, sn=False)                         # build: no snare yet
for t0 in (14.0, 16.0): motorik(t0)
crash(14.0, .85, .5, .2)
for b in (18.0, 18.5): kick(b, .6, .7)                                # the pull-out breathes
kick(19.0, .9); kick(19.5, .7); snare(19.5, .6)
for t0 in (20.0, 22.0): motorik(t0)
crash(19.0, .8, .45)
for i in range(4): snare(23.0 + i * E8, .35 + i * .1, .5)            # roll into the push
kick(24.0, 1.0, 1.1); crash(24.0, 1.0, .6); crash(24.0, .8, .35, .3)
for b in np.arange(24.5, 30.0, 1.0): kick(b, .7, .75)
for x in np.arange(24.5, 30.0, .25): hat(x, .3, .15)
kick(30.0, 1.0, 1.1); crash(30.0, .7, .45)

# ---------- marimba ostinato ----------
PAT = [0, 2, 1, 2, 0, 2, 1, 2]
def mar_bar(t0, vel=.6, g=.55, up=12):
    c = chord(t0)
    for i, k in enumerate(PAT):
        m = c[k] + up + (12 if i == 3 else 0)
        add(st['mar'], S.note('marimba', m, .3, vel * (1 if i % 2 == 0 else .8)), t0 + i * E8, g, -.2 if i % 2 else .2)
for t0 in (0.0, 2.0, 4.0): mar_bar(t0, .7, 1.0)
for t0 in np.arange(10.0, 18.0, BAR): mar_bar(t0, .62)
for t0 in np.arange(20.0, 24.0, BAR): mar_bar(t0, .62)
for t0 in (26.0, 28.0): mar_bar(t0, .5, .45)
# final rolled chord
for i, m in enumerate([62, 66, 69, 74, 78]): add(st['mar'], S.note('marimba', m, 2.0, .7), 30.0 + i * .03, .6, -.3 + i * .15)

# ---------- glockenspiel: one note per cover line, ripple, CTA ----------
def gl(t, m, vel=.6, g=.35, pan=.15): add(st['glk'], S.note('glockenspiel', m, 1.5, vel), t, g, pan)
for t, m in zip([11.0, 11.5, 12.0, 12.5, 13.0, 13.5], [81, 83, 86, 88, 90, 93]): gl(t, m)
gl(14.0, 86, .75, .4)
gl(19.25, 86); gl(19.5, 90); gl(19.5, 93, .5, .25, -.2)
for t0 in (20.0, 22.0):
    for k, m in [(0, 90), (.75, 88), (1.5, 86)]: gl(t0 + k, m, .45, .25)
gl(27.5, 86, .6, .35); gl(30.0, 86, .7, .4); gl(30.0, 93, .5, .25, -.2)

# ---------- vibraphone for the claim ----------
add(st['pad'], S.note('vibraphone', 74, 1.4, .5), 7.0, .3, -.1)
add(st['pad'], S.note('vibraphone', 78, 2.2, .55), 7.25, .3, .1)
for m in (62, 66, 69): add(st['pad'], S.note('vibraphone', m, 2.0, .45), 30.0, .45, 0)

# ---------- bass (synth: sine + 2nd/3rd harmonics, short pitch drop) ----------
def bass(t, m, d=.22, v=.8):
    n = int(d * SR) + int(.05 * SR); tt = np.arange(n) / SR; f = 440 * 2 ** ((m - 69) / 12)
    ph = 2 * np.pi * f * tt
    x = np.sin(ph) + .35 * np.sin(2 * ph) + .15 * np.sin(3 * ph)
    e = np.minimum(1, tt / .004) * np.exp(-tt / (d * .9)); e[int(d * SR):] *= np.linspace(1, 0, n - int(d * SR))
    add(st['bass'], np.tanh(1.3 * x * e) * v, t, .5, 0)
for t0 in np.arange(14.0, 18.0, BAR):
    for i in range(8): bass(t0 + i * E8, chord(t0)[0] - 12, v=.85 if i % 2 == 0 else .7)
for t0 in np.arange(20.0, 24.0, BAR):
    for i in range(8): bass(t0 + i * E8, chord(t0)[0] - 12, v=.85 if i % 2 == 0 else .7)
for t0 in (24.0, 25.0, 26.0, 27.0, 28.0, 29.0): bass(t0, chord(t0)[0] - 12, .8, .7)
bass(30.0, 38, 2.0, .9)

# ---------- the exception sings: sine glide following the square ----------
a, b = 6.5, 9.5; n = int((b - a + .5) * SR); tt = np.arange(n) / SR
pitch = 69 + 5 * np.clip(tt / (b - a), 0, 1) + .12 * np.sin(2 * np.pi * 5.2 * tt) * np.clip(tt - .4, 0, 1)
ph = 2 * np.pi * np.cumsum(440 * 2 ** ((pitch - 69) / 12)) / SR
env = np.minimum(1, tt / .08) * np.clip((b - a + .5 - tt) / .5, 0, 1)
add(st['fx'], (np.sin(ph) + .08 * np.sin(2 * ph)) * env * .06, a, 1.0, 0)
# warm pad under it (G maj7), additive, soft attack
n = int(3.6 * SR); tt = np.arange(n) / SR; pad = np.zeros(n)
for m in (55, 59, 62, 66):
    f = 440 * 2 ** ((m - 69) / 12)
    for h, amp in [(1, 1), (2, .3), (3, .12)]: pad += amp * np.sin(2 * np.pi * f * h * tt * (1 + .0015 * (m % 3)))
pad *= np.minimum(1, tt / .9) * np.clip((3.6 - tt) / .5, 0, 1) * .018
add(st['pad'], lp(pad, 2500), 6.5, 1.0, 0)

# ---------- risers ----------
def riser(t1, d, g):
    n = int(d * SR); tt = np.arange(n) / SR
    x = hp(noise(d), 400) * (tt / d) ** 2.2
    add(st['fx'], x * g, t1 - d, 1.0, 0)
riser(10.0, .5, .25); riser(24.0, 1.0, .35)

# ---------- hard stop at 6.0 (tails cut), mix ----------
mix = st['drums'] * .9 + st['mar'] * .9 + st['bass'] * .8 + st['glk'] * .7 + st['pad'] + st['fx']
s0, s1 = int(6.0 * SR), int(6.5 * SR)
mix[s0:s1] = 0
fade = np.linspace(1, 0, int(.006 * SR))[:, None]; mix[s0 - len(fade):s0] *= fade
for c in range(2): mix[:, c] = limit(mix[:, c], .9)
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
print('score.wav', mix.shape[0] / SR, 's  peak %.2f' % np.abs(mix).max())
