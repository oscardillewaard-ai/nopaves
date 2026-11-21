"""Verklein schermafbeeldingen voor docs/: 256 kleuren (zonder zichtbaar verlies bij UI en kaart).
    python3 tools/ontwerp/verklein.py docs/ontwerp/huidig [meer mappen]"""
import sys, pathlib
from PIL import Image
for map_ in sys.argv[1:]:
    for p in pathlib.Path(map_).glob('*.png'):
        im = Image.open(p)
        if im.mode == 'P':
            continue
        im.convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(p, optimize=True)
