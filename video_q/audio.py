"""GLOSS | Written About One - original score, synthesized from scratch.
Locked to the same 110 BPM grid as index.html (B = 60/110)."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import wave, sys

SR = 48000
BPM = 120
B = 60 / BPM
DUR = 29 * B + 0.4
N = int(DUR * SR)
rng = np.random.default_rng(3)
L = np.zeros(N); R = np.zeros(N)          # dry bus
RV_L = np.zeros(N); RV_R = np.zeros(N)    # reverb send

def T(b): return b * B
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
NOTE = {'C':0,'Db':1,'D':2,'Eb':3,'E':4,'F':5,'Gb':6,'G':7,'Ab':8,'A':9,'Bb':10,'B':11}
def n(s):  # 'D3' -> midi
    name, octv = s[:-1], int(s[-1]); return 12 * (octv + 1) + NOTE[name]

def filt(x, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output='sos'); return sosfilt(sos, x)

def add(sig, t, gain=1.0, pan=0.0, rev=0.0):
    i = int(t * SR)
    if i >= N: return
    sig = sig[:N - i]
    gl = np.cos((pan + 1) * np.pi / 4); gr = np.sin((pan + 1) * np.pi / 4)
    L[i:i+len(sig)] += sig * gain * gl * 1.414
    R[i:i+len(sig)] += sig * gain * gr * 1.414
    if rev:
        RV_L[i:i+len(sig)] += sig * gain * rev * gl
        RV_R[i:i+len(sig)] += sig * gain * rev * gr

def env_t(d): return np.arange(int(d * SR)) / SR

# ---------- instruments ----------
def piano(m, dur=3.0, vel=1.0):
    t = env_t(dur); f0 = mtof(m); out = np.zeros_like(t)
    Binh = 0.00035
    for k in range(1, 10):
        fk = k * f0 * np.sqrt(1 + Binh * k * k)
        if fk > 16000: break
        a = (1 / k ** 1.25) * (1 if k == 1 else 0.8)
        dec = 1.1 + 0.55 * k + f0 / 600
        out += a * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6)) * (0.75*np.exp(-t * dec) + 0.25*np.exp(-t * dec*0.18))
    att = np.minimum(1, t / 0.004)
    hammer = filt(rng.normal(0, 1, len(t)), 'bandpass', [min(f0*2, 4000), min(f0*8, 12000)]) * np.exp(-t * 60) * 0.08
    rel = np.minimum(1, (dur - t) / 0.25)
    return (out * att + hammer) * rel * vel * 0.32

def pad(ms, dur, vel=1.0, cutoff=1400):
    t = env_t(dur); out = np.zeros_like(t)
    for m in ms:
        f = mtof(m)
        for det in (-0.07, 0.0, 0.08):
            ff = f * 2 ** (det / 12)
            ph = rng.uniform(0, 1)
            saw = 2 * ((ff * t + ph) % 1) - 1
            out += saw
    out = filt(out, 'lowpass', cutoff, 2)
    a = np.minimum(1, t / 0.9); r = np.minimum(1, (dur - t) / 1.2)
    return out * a * np.clip(r, 0, 1) * vel * 0.045 / max(1, len(ms) / 3)

def kick(vel=1.0, low=44):
    t = env_t(0.6)
    f = low + 95 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 6.5)
    click = filt(rng.normal(0, 1, len(t)), 'highpass', 2500) * np.exp(-t * 300) * 0.25
    return np.tanh((body + click) * 1.4) * vel * 0.8

def sub_boom(vel=1.0):
    t = env_t(3.5)
    f = 34 + 40 * np.exp(-t * 8)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(np.sin(ph) * np.exp(-t * 1.3) * 1.6) * vel * 0.9

def snap(vel=1.0):
    t = env_t(0.35)
    x = filt(rng.normal(0, 1, len(t)), 'bandpass', [1100, 5200]) * (np.exp(-t * 38) + 0.4*np.exp(-np.maximum(0,t-0.012)*38)*(t>0.012))
    return x * vel * 0.55

def hat(vel=1.0, open_=False):
    t = env_t(0.25 if open_ else 0.06)
    x = filt(rng.normal(0, 1, len(t)), 'highpass', 7500) * np.exp(-t * (14 if open_ else 90))
    return x * vel * 0.22

def tick(vel=1.0):
    t = env_t(0.03)
    x = filt(rng.normal(0, 1, len(t)), 'bandpass', [2500, 9000]) * np.exp(-t * 400)
    x += np.sin(2*np.pi*1800*t) * np.exp(-t * 250) * 0.4
    return x * vel * 0.5

def stamp(vel=1.0):  # letterpress clack
    t = env_t(0.8)
    body = np.sin(2*np.pi*(60 + 60*np.exp(-t*40))*t) * np.exp(-t * 9)
    wood = filt(rng.normal(0,1,len(t)), 'bandpass', [300, 2200]) * np.exp(-t * 45)
    click = filt(rng.normal(0,1,len(t)), 'highpass', 3000) * np.exp(-t * 500)
    return np.tanh((body*1.2 + wood*0.6 + click*0.5)) * vel

def paper(dur=0.35, vel=1.0, bright=1.0):  # page turn / slap
    t = env_t(dur)
    nse = rng.normal(0, 1, len(t))
    # crinkle: amplitude-modulated noise grains
    grains = (rng.random(len(t)) < 0.004).astype(float)
    grains = np.convolve(grains, np.exp(-np.arange(200) / 25), 'same')
    x = filt(nse, 'bandpass', [900 * bright, 7000]) * (0.55 + 0.9 * grains)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    return x * e * vel * 0.35

def whoosh(dur=1.0, vel=1.0, rise=True):
    t = env_t(dur); x = rng.normal(0, 1, len(t)); out = np.zeros_like(t)
    # sweep bandpass by blocks
    nb = 40; bl = len(t) // nb + 1
    for j in range(nb):
        p = j / nb if rise else 1 - j / nb
        fc = 300 * (20 ** p)
        seg = x[j*bl:(j+1)*bl+400]
        if len(seg) < 10: continue
        y = filt(seg, 'bandpass', [fc * 0.7, min(fc * 1.6, 20000)])
        w = np.hanning(len(y)); out[j*bl:j*bl+len(y)] += (y * w)[:len(out) - j*bl]
    e = (t / dur) ** 2.2 if rise else np.exp(-t * 4)
    return out * e * vel * 0.5

def bass(m, dur, vel=1.0):
    t = env_t(dur); f = mtof(m)
    x = np.sin(2*np.pi*f*t) + 0.25*np.sin(4*np.pi*f*t) + 0.08*np.sin(6*np.pi*f*t)
    e = np.minimum(1, t/0.01) * np.exp(-t * 1.2) * np.clip((dur - t)/0.05, 0, 1)
    return np.tanh(x * e * 1.3) * vel * 0.45


# ---------- extra instruments (v2) ----------
def shimmer(dur=1.6, vel=1.0):
    t=env_t(dur); out=np.zeros_like(t)
    for f in [2349, 2960, 3520, 4699, 5920, 7040]:
        out+=np.sin(2*np.pi*f*t*(1+0.002*np.sin(2*np.pi*5*t)))*rng.uniform(.5,1)
    nse=filt(rng.normal(0,1,len(t)),'bandpass',[5000,14000])*0.6
    e=np.sin(np.pi*np.clip(t/dur,0,1))**2
    return (out*0.08+nse*0.25)*e*vel
def clink(vel=1.0):
    t=env_t(2.2); out=np.zeros_like(t)
    for f,a,d in [(1830,1,3.5),(2615,.7,4.5),(4110,.5,6),(5480,.35,8),(7230,.2,10)]:
        out+=a*np.sin(2*np.pi*f*t)*np.exp(-t*d)
    click=filt(rng.normal(0,1,len(t)),'highpass',4000)*np.exp(-t*400)*0.4
    return (out*0.35+click)*vel
def pop(m, vel=1.0):  # lift: soft air thump + pitched pluck
    t=env_t(0.5)
    th=np.sin(2*np.pi*(90+120*np.exp(-t*30))*t)*np.exp(-t*14)
    air=filt(rng.normal(0,1,len(t)),'bandpass',[600,3000])*np.exp(-t*25)*0.3
    return (th*0.7+air)*vel*0.7 + piano(m,0.5,0.5*vel)[:len(t)]
def flick(vel=1.0):
    return paper(0.12, vel, 1.6)
def landing(vel=1.0):
    t=env_t(0.6)
    body=np.sin(2*np.pi*(70+50*np.exp(-t*25))*t)*np.exp(-t*12)
    slap=filt(rng.normal(0,1,len(t)),'bandpass',[400,4000])*np.exp(-t*35)
    return np.tanh(body*1.1+slap*0.7)*vel*0.8
def whip(dur=0.5, vel=1.0):
    return whoosh(dur, vel, False)


def pen(dur, vel=1.0):
    t=env_t(dur); x=filt(rng.normal(0,1,len(t)),'bandpass',[1800,7000])
    strokes=np.abs(np.sin(2*np.pi*np.cumsum(9+5*rng.random(len(t)))/SR))**3
    e=np.minimum(1,t/0.03)*np.minimum(1,(dur-t)/0.05)
    return x*strokes*e*vel*0.32
CH=[('F1',['F3','A3','C4','E4']),('D2',['D3','F3','A3','C4','E4']),('Bb1',['D3','F3','A3','C4']),('C2',['E3','G3','A3','D4'])]
def chord_at(bar): return CH[bar%4]
def groove(b0,b1,e=1.0):
    for b in range(b0,b1):
        add(kick(0.85*e), T(b), 0.8)
        if b%2: add(snap(0.8*e), T(b), 0.5, rev=0.25)
        add(hat(0.6), T(b+0.5), 0.5, pan=0.35); add(hat(0.3), T(b+0.25), 0.3, pan=-0.3); add(hat(0.3), T(b+0.75), 0.3, pan=-0.3)
def harmony(b0,b1,arp=True,v=0.8):
    for b in range(b0,b1,4):
        bs,vo=chord_at(b//4)
        add(pad([n(x) for x in vo], T(4)+0.8, v, 1700), T(b), 1.0, rev=0.5)
        add(bass(n(bs)+12, T(4)-0.02, 0.85), T(b), 0.85)
        for k,x in enumerate(vo): add(piano(n(x),2.5,0.35), T(b)+0.012*k, 0.7, pan=-0.3+0.15*k, rev=0.5)
    if arp:
        for b in range(b0,b1):
            bs,vo=chord_at(b//4); seq=[n(x)+12 for x in vo]+[n(vo[1])+24]
            for h in range(2): add(piano(seq[(b*2+h)%len(seq)],0.8,0.45), T(b+h*0.5), 0.4, pan=0.4*np.sin(b+h), rev=0.35)

# hook
harmony(0,16); groove(2,13); groove(14,19,1.1); harmony(16,20)
add(pen(T(3.1)-0.12), 0.12, 0.9, pan=-0.1, rev=0.1)
add(shimmer(1.4,0.8), T(1.6), 0.45, pan=0.3, rev=0.6)
add(whoosh(0.5,0.7,False), T(3.6), 0.5, rev=0.3)
add(shimmer(1.6,1.0), T(3.6), 0.5, pan=-0.2, rev=0.6)
add(whoosh(T(1.3),0.8,True), T(3.7), 0.6, rev=0.4); add(sub_boom(0.8), T(5.0), 0.7); add(landing(0.6), T(5.0), 0.4)
add(piano(n('C6'),2.5,0.4), T(4.9), 0.55, rev=0.8); add(shimmer(1.2,0.8), T(5.4), 0.45, pan=0.3, rev=0.6)
# Q2 horse word
add(whoosh(0.6,0.8,False), T(6.4), 0.55, pan=0.5, rev=0.3); add(pen(T(0.8)), T(6.9), 0.9, rev=0.1)
add(stamp(0.9), T(7.9), 0.8, rev=0.4); add(sub_boom(0.7), T(7.9), 0.6)
add(whoosh(T(0.9),0.9,True), T(8.5), 0.6, rev=0.4); add(kick(1.0,40), T(9.0), 0.8); add(shimmer(1.0,0.6), T(9.0), 0.3, rev=0.6)
# Q3 card flips to the page
add(whoosh(0.4,0.7,False), T(9.5), 0.5, rev=0.3); add(landing(0.8), T(10.2)-0.05, 0.55, rev=0.3)
add(pen(T(0.8)), T(10.1), 0.9, rev=0.1); add(paper(0.6,1.0,1.0), T(11.0), 0.8, pan=0.3, rev=0.3); add(landing(0.5), T(12.0), 0.4)
# Q4 ink bloom
add(whoosh(0.6,0.8,False), T(12.4), 0.55, pan=-0.5, rev=0.3); add(pen(T(0.7)), T(12.9), 0.9, rev=0.1)
add(sub_boom(0.8), T(13.8), 0.7); add(whoosh(T(1),0.7,True), T(13.3), 0.45, rev=0.6)
for k,x in enumerate(['F4','A4','C5','E5']): add(piano(n(x),3,0.45), T(13.8)+0.05*k, 0.6, rev=0.8)
# assembly
for i in range(13): add(flick(0.85), T(16.0)+(13-(i+1))*0.085+0.3, 0.6, pan=(1 if i%2 else -1)*0.55, rev=0.25)
add(shimmer(2.0,1.0), T(16.0), 0.45, rev=0.6); add(whoosh(T(2),0.9,True), T(18.2), 0.6, rev=0.4)
# end
add(sub_boom(0.9), T(20.2), 0.8); add(landing(0.7), T(20.2), 0.5)
end=['F3','C4','E4','G4','A4','D5']
for k,x in enumerate(end): add(piano(n(x),6,0.55), T(20.2)+0.03*k, 0.85, pan=-0.35+0.14*k, rev=0.8)
add(pad([n(x) for x in end[:5]], 5.0, 1.0, 1500), T(20.2), 1.0, rev=0.6); add(bass(n('F2'),4,0.7), T(20.2), 0.8)
add(shimmer(1.6,0.8), T(22.6), 0.45, pan=0.3, rev=0.6)
add(piano(n('F6'),3,0.35), T(23.2), 0.6, rev=0.85); add(piano(n('C6'),3,0.3), T(23.2)+0.09, 0.5, rev=0.85)
for b in range(22,28,2): add(kick(0.3,50), T(b), 0.35)

# ---------- reverb ----------
def ir(seconds=2.6, seed=0):
    r = np.random.default_rng(seed); t = env_t(seconds)
    x = r.normal(0, 1, len(t)) * np.exp(-t * 3.0 / seconds * 2.2)
    x = filt(x, 'lowpass', 6000); x[:int(0.02*SR)] *= np.linspace(0, 1, int(0.02*SR))
    return x / np.sqrt(np.sum(x ** 2))
wl = fftconvolve(RV_L, ir(2.6, 1))[:N]; wr = fftconvolve(RV_R, ir(2.6, 2))[:N]
mixL = L + wl * 0.9; mixR = R + wr * 0.9

# master: gentle glue + limiter + fades
mix = np.stack([mixL, mixR])
mix = filt(mix, 'highpass', 28)
peak = np.max(np.abs(mix)); mix = mix / peak * 1.25
mix = np.tanh(mix) * 0.93
fade_out = int(1.0 * SR)
mix[:, -fade_out:] *= np.linspace(1, 0, fade_out) ** 2
mix[:, :int(0.01*SR)] *= np.linspace(0, 1, int(0.01*SR))
out = sys.argv[1] if len(sys.argv) > 1 else 'score.wav'
pcm = (mix.T * 32767).astype(np.int16)
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', out, f'{DUR:.2f}s')
