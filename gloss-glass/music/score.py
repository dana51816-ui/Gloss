"""Studio GLOSS · "16 עמודים של אור" — original score, synthesised. 90 BPM (beat 2/3 s), D minor / F major colour, 48 beats.
Bowed-glass pad, crystal grains, FM glass plucks, soft kick + clap, 808 that follows the light pulses, a silence, a snap.
Run: LIB=<library> $LIB/.venv/bin/python music/score.py → music/score.wav
"""
import sys, os
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core/audio'))
from sfx import SR, add, limit, lp, hp, bp, noise

rng = np.random.default_rng(90)
BEAT = 2 / 3
def b(n): return n * BEAT
DUR = 33.0; N = int(DUR * SR)
st = {k: np.zeros((N, 2)) for k in ['pad', 'grain', 'pluck', 'drums', 'bass', 'lead', 'fx']}
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
t_ = lambda d: np.arange(int(d * SR)) / SR

# chords (midi) per bar of 4 beats
Dm9, Bbmaj7, F, C, Dm = [50, 57, 64, 65, 72], [46, 53, 57, 62, 69], [53, 60, 65, 69, 72], [48, 55, 64, 67, 72], [50, 57, 62, 65, 69]
PROG = {0: Dm9, 1: Dm9, 2: Bbmaj7, 3: F, 4: Bbmaj7, 5: F, 6: C, 7: Dm, 8: Bbmaj7, 9: F, 10: C, 11: Dm}
chord = lambda beat: PROG[min(11, int(beat // 4))]

def bowed(m, d, a=.2):
    tt = t_(d); f = hz(m); vib = 1 + .003 * np.sin(2 * np.pi * 4.8 * tt + rng.random() * 6)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR
    x = sum(amp * np.sin(k * ph + rng.random() * 6) for k, amp in [(1, 1), (2, .35), (3, .18), (5, .07), (2.76, .05)])
    env = np.minimum(1, tt / (d * .35)) * np.minimum(1, (d - tt) / (d * .3))
    return lp(x * env, 4000) * a
def fm_pluck(m, d=.9, a=.3, idx=3.0):
    tt = t_(d); f = hz(m); mod = idx * np.exp(-tt / .12) * np.sin(2 * np.pi * f * 3.5 * tt)
    return np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt / (d * .35)) * np.minimum(1, tt / .002) * a
def bell(m, d=3.0, a=.3):
    tt = t_(d); f = hz(m)
    return sum(amp * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / (d * dec)) for r, amp, dec in [(1, 1, .4), (2.76, .5, .18), (5.4, .3, .1), (8.93, .12, .05)]) * a * np.minimum(1, tt / .002)
def kick(a=1.0):
    d = .45; tt = t_(d); f = 45 + 90 * np.exp(-tt / .04)
    return np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .16)) * a
def clap(a=.5):
    d = .3; tt = t_(d); env = np.zeros_like(tt)
    for o in (0, .011, .022): env += np.exp(-np.maximum(0, tt - o) / .008) * (tt >= o)
    env += .5 * np.exp(-tt / .08)
    return bp(noise(d), 900, 3500) * env * a
def tick(a=.15): d = .04; tt = t_(d); return hp(noise(d), 7000) * np.exp(-tt / .006) * a
def b808(m, d=.6, a=.6):
    tt = t_(d); f = hz(m) * (1 + .8 * np.exp(-tt / .03)); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + .25 * np.sin(2 * ph) + .1 * np.sin(3 * ph)
    return np.tanh(1.4 * x * np.exp(-tt / (d * .7)) * np.minimum(1, (d - tt) / .03)) * a

# ---------- pad: bowed glass, whole film except the silence ----------
for bar in range(12):
    if bar == 7: continue          # beats 28–32 hold through the hush only as a tail
    t0 = b(bar * 4); ch = PROG[bar]
    for i, m in enumerate(ch): add(st['pad'], bowed(m, b(4) + 1.2, .07), t0, 1, -.4 + .2 * i)
# sub drone
d = b(30); tt = t_(d); add(st['pad'], np.sin(2 * np.pi * hz(26) * tt) * np.minimum(1, tt / 2) * np.minimum(1, (d - tt) / .3) * .12, 0, 1, 0)
# ---------- crystal grains ----------
for i in range(260):
    x = rng.uniform(0, b(46));
    if b(30) <= x < b(32): continue
    m = rng.choice([86, 88, 89, 91, 93, 96, 98]); g = .012 * (1.6 if x < b(8) else 1)
    dd = .25; tt2 = t_(dd); add(st['grain'], np.sin(2 * np.pi * hz(m) * tt2) * np.sin(np.pi * tt2 / dd) ** 2 * g, x, 1, rng.uniform(-.8, .8))
# ---------- FM glass plucks ----------
def arp(b0, b1, step=.5, a=.16):
    k = 0; x = b0
    while x < b1 - 1e-6:
        ch = chord(x); m = ch[[1, 3, 4, 2][k % 4]] + 12
        add(st['pluck'], fm_pluck(m, .9, a), b(x), 1, -.3 if k % 2 else .3); k += 1; x += step
arp(8, 30); arp(32, 46, .5, .13)
# ---------- drums + 808 (the light's pulse pattern) ----------
for n in range(16, 30):
    for s in range(4): add(st['drums'], tick(.10 if s % 2 else .16), b(n + s / 4), 1, .3)
hits = []
for k in range(20, 30): hits.append(k);
for k in range(20, 30):
    if k % 4 == 2: hits.append(k + .5)
for k in range(32, 40): hits.append(k)
for h in sorted(hits):
    big = h in (20, 24, 28, 32, 36)
    add(st['drums'], kick(1.0 if big else .8), b(h), .9, 0)
    add(st['bass'], b808(chord(h)[0] - 24, .55 if not big else .9, .55), b(h), 1, 0)
for n in list(range(21, 30, 2)) + list(range(33, 40, 2)): add(st['drums'], clap(.45), b(n), 1, .1)
# lead motif after the snap
for k, m in [(32, 81), (33.5, 77), (34, 79), (36, 81), (37, 84), (38, 81), (39, 77)]: add(st['lead'], bell(m, 1.6, .12), b(k), 1, .15)
# snap: glass chord + low hit
for m in (62, 69, 74, 77, 81): add(st['lead'], bell(m, 3.0, .10), b(32), 1, rng.uniform(-.5, .5))
add(st['bass'], b808(26, 1.6, .8), b(32), 1, 0)
# final ding
add(st['lead'], bell(86, 4.0, .22), b(46), 1, 0); add(st['lead'], bell(74, 4.0, .12), b(46), 1, 0)
# risers into the explosion and into the snap
for t1, d2, a in [(b(20), 1.3, .05), (b(32), 1.0, 0)]:
    if a: tt3 = t_(d2); add(st['fx'], hp(noise(d2), 1500) * (tt3 / d2) ** 2.4 * a, t1 - d2, 1, 0)

mix = st['pad'] * 1.3 + st['grain'] * 1.3 + st['pluck'] * 1.0 + st['drums'] * .5 + st['bass'] * .55 + st['lead'] * .8 + st['fx']
# the hush: total silence (tails cut) from b(30) to b(32); foley carries a reverse whoosh inside it
s0, s1 = int(b(30) * SR), int(b(32) * SR)
fade = np.linspace(1, 0, int(.04 * SR))[:, None]; mix[s0 - len(fade):s0] *= fade; mix[s0:s1] = 0
for c in range(2): mix[:, c] = limit(mix[:, c], .9)
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
print('score.wav', round(mix.shape[0] / SR, 2), 's  peak %.2f' % np.abs(mix).max())
