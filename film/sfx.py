import numpy as np, wave
SR=44100; D=15.5; N=int(SR*D); out=np.zeros((N,2))
rng=np.random.default_rng(7)
def add(sig,t,g=1.0,pan=0.0):
    i=int(t*SR); n=min(len(sig),N-i)
    if n<=0: return
    out[i:i+n,0]+=sig[:n]*g*(1-max(0,pan)); out[i:i+n,1]+=sig[:n]*g*(1+min(0,pan))
def env(n,dec): return np.exp(-np.arange(n)/SR/dec)
def kick():
    n=int(.45*SR); tt=np.arange(n)/SR; f=45+110*np.exp(-tt/.035); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*env(n,.16)+ .3*np.tanh(3*np.sin(ph))*env(n,.05)
def hat(dec=.03):
    n=int(.12*SR); x=rng.standard_normal(n); x=np.diff(np.concatenate([[0],x])); return x*env(n,dec)*.5
def shutter():
    n=int(.12*SR); x=rng.standard_normal(n); hp=np.diff(np.concatenate([[0],x]))
    s=hp*env(n,.004); s2=np.zeros(n); k=int(.045*SR); s2[k:]=hp[:n-k]*env(n-k,.006)*.8
    thunk=np.sin(2*np.pi*180*np.arange(n)/SR)*env(n,.01)*.5
    return (s+s2+thunk)*.9
def boom():
    n=int(2.2*SR); tt=np.arange(n)/SR; f=32+60*np.exp(-tt/.15); return np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,.9)
def whoosh(d=.5):
    n=int(d*SR); x=rng.standard_normal(n); y=np.convolve(x,np.ones(30)/30,'same'); e=np.sin(np.pi*np.arange(n)/n)**2
    return y*e*1.2
def pad(t0,t1,freqs,g):
    n=int((t1-t0)*SR); tt=np.arange(n)/SR; s=sum(np.sin(2*np.pi*f*tt+i) for i,f in enumerate(freqs))/len(freqs)
    e=np.minimum(1,tt/.3)*np.minimum(1,(t1-t0-tt)/.6); add(s*e*(.85+.15*np.sin(2*np.pi*4*tt)),t0,g)
# shutters / flashes
for t in [0,.25,.5,.75,2.0,2.5,4.5,13.5]: add(shutter(),t,.9,pan=rng.uniform(-.4,.4))
for t in np.arange(5.5,9.5,.5): add(shutter(),t,.55)
# beat 120bpm
for t in np.arange(.75,11.75,.5): add(kick(),t,.95)
for t in np.arange(1.0,11.75,.5): add(hat(.05),t-.25,.35)
for t in np.arange(5.5,9.5,.125): add(hat(.018),t,.22)
for t in np.arange(12.25,15.0,1.0): add(kick(),t,.6)
add(boom(),3.0,.9); add(boom(),11.75,1.0); add(boom(),.75,.6)
add(whoosh(.5),2.5,.25); add(whoosh(.45),5.05,.25); add(whoosh(.5),9.0,.25); add(whoosh(.6),11.15,.3)
pad(.75,11.75,[110,130.8,164.8,220],.10); pad(11.75,15.5,[98,123.5,146.8,196],.12)
out/=np.max(np.abs(out))*1.12
w=wave.open('sfx.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((out*32767).astype('<i2').tobytes()); w.close(); print('ok')
