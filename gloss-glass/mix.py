"""Mix: music/score.wav + procedural glass foley from events.json -> out/mix.wav
Sweep shimmer (band-passed noise + inharmonic partials, panned with the strip), frost breath, glass-on-glass slide,
reverse whoosh inside the silence, the snap (a cluster of magnetic clicks + an inharmonic glass chord), the last ding."""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core/audio'))
import sfx
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add

rng = np.random.default_rng(16)
ev = json.load(open(os.path.join(HERE, 'events.json')))
N = int((ev['dur'] + 1) * SR)
def sweep(d):
    tt = t_(d); x = bp(noise(d), 3000, 9000) * .5
    for f in (2793, 3951, 5588, 7040): x += np.sin(2 * np.pi * f * tt + rng.random() * 6) * .25
    return norm(x * np.sin(np.pi * tt / d) ** 2)
def frost(d): tt = t_(d); return norm(bp(noise(d), 2000, 8000) * (1 - tt / d) ** 1.5 * np.minimum(1, tt / .3))
def slide(d): tt = t_(d); return norm(bp(noise(d), 1200, 6000) * (.6 + .4 * np.sin(2 * np.pi * 6 * tt)) * np.sin(np.pi * tt / d) * np.exp(-tt / (d * .6)))
def reverse(d): x = norm(hp(noise(d), 400) * (t_(d) / d) ** 3); return x
def snap():
    d = 2.5; tt = t_(d); x = np.zeros_like(tt)
    for o in (0, .004, .009, .013):
        k = int(o * SR); n = int(.002 * SR); x[k:k + n] += hp(noise(.002), 3000)[:n] * 1.0
        x[k:] += (np.sin(2 * np.pi * 3800 * tt[:len(tt) - k]) + np.sin(2 * np.pi * 4700 * tt[:len(tt) - k])) * np.exp(-tt[:len(tt) - k] / .006) * .3
    x += np.sin(2 * np.pi * 70 * tt) * np.exp(-tt / .12) * .8
    for r, a, dec in [(1, 1, .9), (2.76, .5, .5), (5.4, .3, .3)]: x += np.sin(2 * np.pi * 523 * r * tt) * np.exp(-tt / dec) * a * .25
    return norm(x)
def ding(): d = 4; tt = t_(d); return norm(sum(a * np.sin(2 * np.pi * 1175 * r * tt) * np.exp(-tt / dec) for r, a, dec in [(1, 1, 1.4), (2.76, .4, .6), (5.4, .2, .3)]))
F = {'sweep': (lambda e: sweep(e['d']), .10), 'frost': (lambda e: frost(e['d']), .08), 'slide': (lambda e: slide(e['d']), .10),
     'reverse': (lambda e: reverse(e['d']), .16), 'snap': (lambda e: snap(), .5), 'ding': (lambda e: ding(), .12)}
fol = np.zeros((N, 2))
for e in ev['ev']:
    fn, gain = F[e['type']]; add(fol, fn(e).astype(np.float64), e['t'], gain * e.get('g', 1), pan=.3 * e.get('pan', 0))
mus, msr = sf.read(os.path.join(HERE, 'music', 'score.wav')); assert msr == SR
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
mix = mus + fol * 3.0
for c in range(2): mix[:, c] = sfx.limit(mix[:, c], .95)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
for a, c in [(0, 5.33), (5.33, 13.33), (13.33, 20), (20.05, 21.3), (21.33, 26.67), (26.67, 32)]:
    s, e = int(a * SR), int(c * SR); print(f'{a:>5}-{c:<5} music {db(mus[s:e]):6.1f}  foley {db(fol[s:e]):6.1f}')
