"""Vergelijkingsplaten: per scherm de huidige stand en de richtingen naast elkaar, met een naam erboven.
    python3 tools/ontwerp/naastelkaar.py
Leest docs/ontwerp/{huidig,a,b,c}/<scherm>_telefoon_<thema>.png en schrijft docs/ontwerp/vergelijk/."""
import pathlib
from PIL import Image, ImageDraw, ImageFont

BASIS = pathlib.Path('docs/ontwerp')
KOLOMMEN = [('huidig', 'Nu: Korrel'), ('a', 'A  Stil'), ('b', 'B  Startnummer'), ('c', 'C  Veldboek')]
SCHERMEN = [('leeg', 'licht'), ('plankaart', 'licht'), ('resultaat-half', 'licht'), ('details', 'licht'), ('resultaat-half', 'donker'),
            ('meer', 'licht'), ('popup', 'licht'), ('voorkeuren', 'licht'), ('plankaart', 'donker')]
uit = BASIS / 'vergelijk'
uit.mkdir(exist_ok=True)
try:
    letter = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
except OSError:
    letter = ImageFont.load_default()
for scherm, thema in SCHERMEN:
    beelden = []
    for map_, naam in KOLOMMEN:
        p = BASIS / map_ / f'{scherm}_telefoon_{thema}.png'
        if p.exists():
            beelden.append((naam, Image.open(p).convert('RGB')))
    if len(beelden) < 2:
        continue
    b, h = beelden[0][1].size
    rand, kop = 16, 48
    plaat = Image.new('RGB', (len(beelden) * (b + rand) + rand, h + kop + rand), '#FFFFFF')
    d = ImageDraw.Draw(plaat)
    for i, (naam, im) in enumerate(beelden):
        x = rand + i * (b + rand)
        d.text((x, 12), naam, fill='#1B1E1C', font=letter)
        plaat.paste(im.resize((b, h)), (x, kop))
    plaat.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(uit / f'{scherm}_{thema}.png', optimize=True)
    print(uit / f'{scherm}_{thema}.png')
