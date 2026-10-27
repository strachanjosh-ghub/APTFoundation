"""Recolour OneTomorrow-green artwork to APT Foundation navy (repeatable).
Usage: python3 scripts/brand-images.py   (reads/writes public/media)
Greens (G channel dominant) are mapped to APT Navy #1b1f52, preserving the original
alpha and relative lightness, so the artwork stays familiar but on-brand."""
from PIL import Image
import colorsys, os
NAVY = (27, 31, 82)
FILES = {
    'ot-108-world-map-of-causes-2025-png-3527a1.png': 'world-map-of-causes-apt.png',
    'infographic-separate-2-white-3-logos-01-png-c0b036.png': 'step-01-you-donate-apt.png',
    'infographic-separate-2-white-3-logos-02-png-fb4c52.png': 'step-02-we-double-apt.png',
    'infographic-separate-2-white-3-logos-03-png-ce48c9.png': 'step-03-make-a-difference-apt.png',
}
def recolour(src, dst):
    im = Image.open(src).convert('RGBA'); px = im.load()
    nh, nl, ns = colorsys.rgb_to_hls(*[c / 255 for c in NAVY])
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0: continue
            if g > r + 25 and g > b + 15:  # green-dominant pixel
                h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
                # keep anti-aliasing: blend lightness between navy and white
                t = max(0.0, min(1.0, (l - 0.30) / 0.70))
                nr, ng, nb = [int(c * (1 - t) + 255 * t) for c in NAVY]
                px[x, y] = (nr, ng, nb, a)
    im.save(dst, optimize=True)
for s, d in FILES.items():
    recolour(os.path.join('public/media', s), os.path.join('public/media', d)); print('wrote', d)
