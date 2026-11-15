"""Studio GLOSS · "הערב, על השער" — original score. Slow foxtrot, 96 BPM (beat .625 s, bar 2.5 s), D-flat major, 13 bars.
Upright piano, jazz pizz bass, clarinet theme, muted-trumpet answers, harp glissandi, a vibraphone note per bulb.
Run: LIB=<library> $LIB/.venv/bin/python music/score.py  → music/score.wav
"""
import sys, os
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.environ['LIB'])
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, lp, hp, noise

S.seed(1930); rng = np.random.default_rng(1930)
BEAT, BAR = .625, 2.5
SW = BEAT * 2 / 3                      # swung offbeat
DUR = 33.5; N = int(DUR * SR)
st = {k: np.zeros((N, 2), np.float32) for k in ['pno', 'bass', 'clar', 'tpt', 'harp', 'vib', 'drums', 'bell']}

Db, Bbm, Ebm, Ab7, Gb = [49, 53, 56, 60], [46, 49, 53, 56], [51, 54, 58, 61], [44, 48, 51, 54], [54, 58, 61, 65]
BARS = [Db, Ab7, Db, Bbm, Ebm, Ab7, Db, Bbm, Gb, Ebm, Ab7, Db, Db]
def bt(bar, beat): return bar * BAR + beat * BEAT

def pno(t, m, d=.5, v=.5, g=.55, pan=0): add(st['pno'], S.note('upright', m, d, v), t, g, pan)
def bass(t, m, d=.55, v=.75): add(st['bass'], S.note('jazz_bass', m, d, v), t, .9, -.05)
def clar(t, m, d, v=.6, g=.5): add(st['clar'], S.note('clarinet', m, d, v, attack=.03), t, g, .15)
def tpt(t, m, d, v=.55, g=.45): add(st['tpt'], S.note('trumpet_mute', m, d, v, attack=.02), t, g, -.2)
def harp(t, m, v=.55, g=.45, pan=.1): add(st['harp'], S.note('harp', m, 1.6, v), t, g, pan)
def vib(t, m, v=.5, g=.4, pan=0): add(st['vib'], S.note('vibraphone', m, 1.2, v), t, g, pan)
def kit(v, t, vel, g=1.0, pan=0): add(st['drums'], S.hit('drum_kit', v, vel), t, g, pan)

def gliss(t0, d, lo=49, hi=85, down=False, v=.5, g=.4):
    scale = [m for m in range(lo, hi + 1) if (m - 49) % 12 in (0, 2, 5, 7, 9)]   # D-flat pentatonic
    if down: scale = scale[::-1]
    for i, m in enumerate(scale): harp(t0 + d * i / len(scale), m, v, g, -.3 + .6 * i / len(scale))

def comp(bar, v=.45, g=.5, walk=False, two=True):
    ch = BARS[bar]; root = ch[0] - 24 if ch[0] - 24 >= 25 else ch[0] - 12
    if walk:
        line = [root, root + 4, root + 7, root + 9 if bar % 2 else root + 5]
        for k in range(4): bass(bt(bar, k), line[k], .55, .78 if k % 2 == 0 else .68)
    elif two:
        bass(bt(bar, 0), root, 1.1); bass(bt(bar, 2), root + 7, 1.1, .68)
    for k in (1, 3):
        for i, m in enumerate(ch[1:]): pno(bt(bar, k) + i * .006, m + 12, .4, v, g, .1 * (i - 1))

# ---------- bars 1–2: overture ----------
gliss(0, .6)
for i, m in enumerate([37, 49, 56, 60, 65]): pno(.625 + i * .012, m, 2.0, .7, .7)
vib(.625, 72, .55)
comp(1, .4, .45)
bass(bt(0, 2), 37, 1.1, .6)
for k in range(8): kit('ride_left', bt(0, 2) + k * BEAT, .25, .22, .3)
clar(bt(1, 3), 68, .3); clar(bt(1, 3) + SW, 70, .25)              # pickup into the rooms

# ---------- bars 3–6: the rooms (foxtrot) ----------
for b in range(2, 6):
    comp(b, .45, .5, walk=True)
    for k in range(4):
        kit('ride_left', bt(b, k), .32, .26, .3); kit('ride_left', bt(b, k) + SW, .22, .18, .3)
        if k in (1, 3): kit('hi_hat_closed', bt(b, k), .45, .3, .2)
    tpt(bt(b, 3), [65, 70, 66, 63][b - 2], .25, .5); tpt(bt(b, 3) + SW, [68, 73, 70, 67][b - 2], .35, .45)
FRAG = {2: [(0, 72, .9), (1.5, 68, .3), (2, 65, 1.0)], 3: [(0, 73, .9), (1.5, 70, .3), (2, 65, 1.0)],
        4: [(0, 75, .6), (1, 73, .6), (2, 70, .6), (3, 66, .5)], 5: [(0, 75, .9), (1.5, 72, .3), (2, 68, 1.0)]}
for b, ns in FRAG.items():
    for k, m, d in ns: clar(bt(b, k), m, d * BEAT * 1.6, .62)
# snare roll into the reveal, then one tick alone
roll = [x for x in np.arange(14.375, 14.98, 1 / 28)]
for i, x in enumerate(roll): add(st['drums'], S.hit('snare', 'roll', .25 + .5 * i / len(roll), dur=.06), x, .35 + .35 * i / len(roll), 0)
kit('ride_bell_left', 15.0, .35, .35)

# ---------- bars 7–9: the reveal ----------
bulbs = [61, 65, 68, 72, 73, 77, 80, 84, 70, 73, 77, 80, 82, 85, 89, 92]
for i, m in enumerate(bulbs): vib(15.0 + i * .3125, min(m, 88), .45 + .02 * i, .32, -.4 + .8 * (i % 2))
for b in (6, 7, 8): comp(b, .4, .42, two=True)
THEME = [(0, 68, 1), (1, 70, 1), (2, 72, 1), (3, 73, 1), (4, 77, 3), (7, 75, 1), (8, 73, 2), (10, 70, 1), (11, 73, 1), (12, 68, 3.5)]
for k, m, d in THEME: clar(15.0 + 1.25 + k * BEAT, m, d * BEAT, .66, .55)
add(st['bell'], S.note('tubular_bells', 61, 3.0, .6), 17.5, .5, 0)
gliss(20.0, .5, 61, 92, v=.45, g=.35)
for b in (7, 8):
    for k in range(4): kit('ride_left', bt(b, k), .28, .22, .3)

# ---------- bars 10–11: the kaleidoscope ----------
for i in range(20):                      # harp ostinato, accelerating into the lock
    x = 22.5 + 2.5 * (1 - (1 - i / 20) ** 1.5)
    harp(x, BARS[9 if x < 25 else 10][i % 4] + 24, .45, .35, -.4 + .8 * (i % 2))
for k in range(4): pno(bt(9, k), BARS[9][k % 4] + 24, .3, .4, .4)
add(st['bell'], S.note('tubular_bells', 61, 3.0, .75), 25.0, .6, 0); kit('crash_left', 25.0, .7, .45, -.2)
for i, m in enumerate([37, 49, 56, 60]): pno(25.0 + i * .01, m, 1.5, .65, .6)
comp(10, .45, .5, walk=True)
for k in range(4): kit('ride_left', bt(10, k), .3, .24, .3); kit('ride_left', bt(10, k) + SW, .2, .16, .3)

# ---------- bars 12–13: the end card ----------
comp(11, .42, .45, two=True)
END = [(0, 68, .9), (1, 70, .9), (2, 72, .9), (3, 73, 1.4)]
for k, m, d in END: tpt(27.5 + .3 + k * BEAT, m, d * BEAT, .55, .5)
tpt(30.0, 77, .6, .5, .45); tpt(30.6, 75, .5, .45, .4)
# final chord at 31.25
for i, m in enumerate([37, 49, 56, 60, 63, 65, 72]): pno(31.25 + i * .025, m, 2.2, .62, .6, -.3 + .1 * i)
bass(31.25, 37, 2.0, .8); vib(31.25, 77, .5); vib(31.25, 84, .4); clar(31.25, 77, 2.0, .45, .4)
gliss(31.25, .45, 61, 92, v=.4, g=.3)
kit('crash_left', 31.25, .45, .3, .2)

mix = st['pno'] * .9 + st['bass'] * 1.0 + st['clar'] * .9 + st['tpt'] * .8 + st['harp'] * .8 + st['vib'] * .75 + st['drums'] * .8 + st['bell'] * .7
# near silence before the reveal: everything but the tick and the roll fades out 14.9–15.0
s0, s1 = int(14.95 * SR), int(15.0 * SR)
keep = st['drums'][s0:s1] * .8
mix[s0:s1] = keep
fade = np.linspace(1, 0, int(.05 * SR))[:, None]; mix[s0 - len(fade):s0] = mix[s0 - len(fade):s0] * fade + st['drums'][s0 - len(fade):s0] * .8 * (1 - fade)
for c in range(2): mix[:, c] = limit(mix[:, c], .9)
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
print('score.wav', round(mix.shape[0] / SR, 2), 's  peak %.2f' % np.abs(mix).max())
