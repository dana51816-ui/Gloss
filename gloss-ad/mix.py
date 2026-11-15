"""Mix: music/score.wav + procedural print foley from events.json -> out/mix.wav
Foley is dry and close: letterpress clack, knife, paper, block snap, felt thump, rubber stamp."""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core/audio'))
import sfx
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add

rng = np.random.default_rng(7)
ev = json.load(open(os.path.join(HERE, 'events.json')))
N = int((ev['dur'] + .5) * SR)

def clack(v=1.0, big=False):
    d = .12 if big else .07; tt = t_(d); p = .92 + rng.random() * .16
    x = hp(noise(d), 2500) * env_exp(d, .0012) * .9
    x += sum(a * np.sin(2 * np.pi * f * p * tt + rng.random() * 6) * env_exp(d, tau) for f, a, tau in [(3300, .45, .010), (5100, .25, .006), (1250, .35, .016)])
    x += np.sin(2 * np.pi * (140 if big else 420) * p * tt) * env_exp(d, .03 if big else .012) * (.9 if big else .35)
    return norm(x) * v
def knife(d=.2):
    n = noise(d); tt = t_(d); out = np.zeros_like(n); hop = 240
    for i in range(0, len(n), hop):
        f = 1500 + 4500 * (i / len(n)) ** 1.5
        s = bp(n[max(0, i - 1200):i + hop], f * .8, min(f * 1.25, 20000))[-hop:]; out[i:i + len(s)] = s
    out *= np.minimum(1, tt / (d * .7)) ** 1.5
    sn = t_(.08); snick = np.sin(2 * np.pi * 4200 * sn) * env_exp(.08, .012) + hp(noise(.08), 4000) * env_exp(.08, .003)
    return norm(np.concatenate([out * .7, snick * .8]))
def paper(): d = .25; tt = t_(d); return norm(lp(noise(d), 900) * env_exp(d, .03) + np.sin(2 * np.pi * 110 * tt) * env_exp(d, .04) * .6 + hp(noise(d), 3000) * env_exp(d, .006) * .4)
def slap(): d = .12; tt = t_(d); return norm(hp(noise(d), 800) * env_exp(d, .01) + np.sin(2 * np.pi * 180 * tt) * env_exp(d, .02) * .5)
def thunk(): d = .12; tt = t_(d); return norm(np.sin(2 * np.pi * 95 * tt) * env_exp(d, .025) + bp(noise(d), 300, 1500) * env_exp(d, .006) * .6)
def slide(d=.2): tt = t_(d); return norm(bp(noise(d), 700, 5000) * np.sin(np.pi * tt / d) ** 1.5)
def snap(): d = .05; tt = t_(d); return norm(hp(noise(d), 1500) * env_exp(d, .002) + np.sin(2 * np.pi * 1900 * tt) * env_exp(d, .007) * .6 + np.sin(2 * np.pi * 620 * tt) * env_exp(d, .01) * .4)
def thump(): d = .45; tt = t_(d); return norm(np.sin(2 * np.pi * 58 * tt * (1 - .25 * tt)) * env_exp(d, .09) + lp(noise(d), 250) * env_exp(d, .02) * .4)
def stamp():
    d = .3; tt = t_(d)
    return norm(np.sin(2 * np.pi * 75 * tt) * env_exp(d, .05) + lp(noise(d), 1200) * env_exp(d, .015) * .8 + hp(noise(d), 2500) * env_exp(d, .004) * .3)
def rule(): d = .05; return norm(bp(noise(d), 3000, 9000) * np.sin(np.pi * t_(d) / d) ** 2)

F = {'clack': (lambda e: clack(), .16), 'clackBig': (lambda e: clack(big=True), .30), 'knife': (lambda e: knife(), .24),
     'paper': (lambda e: paper(), .30), 'slap': (lambda e: slap(), .22), 'thunk': (lambda e: thunk(), .22),
     'slide': (lambda e: slide(), .10), 'snap': (lambda e: snap(), .16), 'thump': (lambda e: thump(), .5),
     'stamp': (lambda e: stamp(), .42), 'rule': (lambda e: rule(), .07), 'swish': (lambda e: sfx.whoosh(e.get('d', .5)), .12)}
fol = np.zeros((N, 2))
for e in ev['ev']:
    fn, gain = F[e['type']]; x = fn(e).astype(np.float64); at = e['t']
    if e['type'] == 'knife': at -= len(x) / SR - .05            # the snick lands on the cut
    if e['type'] == 'swish': at -= len(x) * .6 / SR
    add(fol, x, max(0, at), gain * e.get('g', 1), pan=float(rng.uniform(-.25, .25)))
# soft room tone, absent in the silence and on the end card wipe
room = lp(noise(N / SR), 500) * .004; room[int(6.0 * SR):int(6.5 * SR)] = 0
mus, msr = sf.read(os.path.join(HERE, 'music', 'score.wav')); assert msr == SR
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
mix = mus * .85 + fol * 2.2 + room[:, None]
mix[int(6.0 * SR):int(6.47 * SR)] = 0                           # total silence before the square lands
for c in range(2): mix[:, c] = sfx.limit(mix[:, c], .95)
assert np.isfinite(mix).all()
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
for a, b in [(0, 6), (6, 10), (10, 18), (18, 24), (24, 32)]:
    s, e = int(a * SR), int(b * SR); print(f'{a:>2}-{b:<2} music {db(mus[s:e]):6.1f}  foley {db(fol[s:e]):6.1f}')
