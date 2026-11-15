"""Mix: music/score.wav + procedural foley from events.json -> out/mix.wav
Foley by material: engraving hiss, light shimmer, brass relay ticks, door chunk + spring, cork, filament hum, whir, bronze clang."""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core/audio'))
import sfx
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add

rng = np.random.default_rng(11)
ev = json.load(open(os.path.join(HERE, 'events.json')))
N = int((ev['dur'] + 1) * SR)

def engrave(d=.6): tt = t_(d); return norm(bp(noise(d), 4000, 11000) * (.4 + .6 * np.sin(np.pi * tt / d)) * (1 + .3 * np.sin(2 * np.pi * 37 * tt)))
def shimmer(d=1.0):
    tt = t_(d); x = np.zeros_like(tt)
    for f in (2637, 3520, 4186, 5274, 6272): x += np.sin(2 * np.pi * f * tt + rng.random() * 6) * env_exp(d, .35) * (rng.random() * .5 + .5)
    return norm(x * np.minimum(1, tt / .04) + bp(noise(d), 6000, 12000) * env_exp(d, .2) * .3)
def relay(): d = .05; tt = t_(d); return norm(hp(noise(d), 2000) * env_exp(d, .003) + np.sin(2 * np.pi * 2400 * tt) * env_exp(d, .006) * .5)
def chunk(): d = .35; tt = t_(d); return norm(np.sin(2 * np.pi * 70 * tt) * env_exp(d, .06) + lp(noise(d), 700) * env_exp(d, .025) * .9 + bp(noise(d), 1500, 4000) * env_exp(d, .006) * .5)
def spring(): d = .5; tt = t_(d); return norm(np.sin(2 * np.pi * (420 + 60 * np.sin(2 * np.pi * 18 * tt)) * tt) * env_exp(d, .12))
def click(): d = .04; tt = t_(d); return norm(np.sin(2 * np.pi * 3200 * tt) * env_exp(d, .004) + hp(noise(d), 4000) * env_exp(d, .0015))
def needle(): d = .6; tt = t_(d); return norm(hp(noise(d), 1500) * env_exp(d, .3) * .4 + (rng.random(len(tt)) > .997) * 1.0)
def thud(): d = .2; tt = t_(d); return norm(np.sin(2 * np.pi * 110 * tt) * env_exp(d, .04) + lp(noise(d), 600) * env_exp(d, .015) * .6)
def match(): d = .5; tt = t_(d); return norm(bp(noise(d), 1500, 6000) * env_exp(d, .12) * (tt < .15) + lp(noise(d), 800) * env_exp(d, .25) * .4)
def flutter(): d = .6; tt = t_(d); return norm(bp(noise(d), 600, 3500) * (np.sin(2 * np.pi * 22 * tt) > .2) * env_exp(d, .25))
def cork(): d = .3; tt = t_(d); return norm(np.sin(2 * np.pi * (900 - 1400 * tt) * tt) * env_exp(d, .03) + hp(noise(d), 2000) * env_exp(d, .004))
def hum(d): tt = t_(d); return norm((np.sin(2 * np.pi * 120 * tt) + .4 * np.sin(2 * np.pi * 240 * tt)) * np.minimum(1, tt / .5) * np.minimum(1, (d - tt) / .5))
def whir(d): tt = t_(d); f = 300 * (1 - .6 * tt / d); return norm(bp(noise(d), 300, 2500) * (.6 + .4 * np.sin(2 * np.pi * np.cumsum(f * 3) / SR)) * np.minimum(1, (d - tt) / .2) * np.minimum(1, tt / .2))
def clang():
    d = 2.5; tt = t_(d); x = np.zeros_like(tt)
    for f, a, tau in [(220, 1, .9), (220 * 2.76, .6, .5), (220 * 5.4, .35, .3), (330, .4, .7)]: x += a * np.sin(2 * np.pi * f * tt) * env_exp(d, tau)
    return norm(x + hp(noise(d), 3000) * env_exp(d, .01) * .4)

F = {'engrave': (lambda e: engrave(e.get('d', .6)), .10), 'shimmer': (lambda e: shimmer(), .16), 'relay': (lambda e: relay(), .10),
     'chunk': (lambda e: chunk(), .42), 'spring': (lambda e: spring(), .05), 'click': (lambda e: click(), .12), 'needle': (lambda e: needle(), .10),
     'thud': (lambda e: thud(), .25), 'match': (lambda e: match(), .18), 'flutter': (lambda e: flutter(), .14), 'cork': (lambda e: cork(), .30),
     'hum': (lambda e: hum(e['d']), .025), 'whir': (lambda e: whir(e['d']), .07), 'clang': (lambda e: clang(), .38)}
fol = np.zeros((N, 2))
for e in ev['ev']:
    fn, gain = F[e['type']]; add(fol, fn(e).astype(np.float64), e['t'], gain * e.get('g', 1), pan=float(rng.uniform(-.3, .3)))
room = lp(noise(N / SR), 300) * .003
mus, msr = sf.read(os.path.join(HERE, 'music', 'score.wav')); assert msr == SR
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
mix = mus * 1.0 + fol * 1.6 + room[:, None]
for c in range(2): mix[:, c] = sfx.limit(mix[:, c], .95)
assert np.isfinite(mix).all()
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
for a, b in [(0, 5), (5, 15), (15, 22.5), (22.5, 27.5), (27.5, 32.5)]:
    s, e = int(a * SR), int(b * SR); print(f'{a:>4}-{b:<4} music {db(mus[s:e]):6.1f}  foley {db(fol[s:e]):6.1f}')
