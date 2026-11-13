# Reads frames from stdin: [u32 n] then n x ([u32 len][jpeg]); writes averaged rgb24 to stdout.
import sys, struct, io
import numpy as np
from PIL import Image
inp=sys.stdin.buffer; out=sys.stdout.buffer
def rd(k):
    b=inp.read(k)
    if len(b)<k: return None
    return b
while True:
    h=rd(4)
    if h is None: break
    n=struct.unpack('<I',h)[0]; acc=None
    for _ in range(n):
        L=struct.unpack('<I',rd(4))[0]; im=np.asarray(Image.open(io.BytesIO(rd(L))).convert('RGB'),dtype=np.float32)
        # average in linear light for natural blur
        lin=(im/255.0)**2.2
        acc=lin if acc is None else acc+lin
    o=((acc/n)**(1/2.2)*255.0+0.5).clip(0,255).astype(np.uint8)
    out.write(o.tobytes())
out.flush()
