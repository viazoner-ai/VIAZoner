#!/usr/bin/env python3
"""Рендер SVG-иконок volonter.by в PNG через svglib + reportlab renderPM.

Использование: python3 svg2png.py in.svg [sizes...] [out-prefix]
"""
import re
import sys
import tempfile
import os
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

src = sys.argv[1]
prefix = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].isdigit() else src.rsplit('.', 1)[0]
sizes = [int(x) for x in sys.argv[2:] if x.isdigit()] or [512]

with open(src, 'r', encoding='utf-8') as f:
    svg = f.read()

# выставляем размеры корневого svg под целевой размер, чтобы svglib масштабировал верно
for size in sizes:
    sized = re.sub(r'<svg([^>]*)>', f'<svg width="{size}" height="{size}"\\1>', svg, count=1)
    tmp = os.path.join(tempfile.gettempdir(), f'vb-{size}.svg')
    with open(tmp, 'w', encoding='utf-8') as f:
        f.write(sized)
    drawing = svg2rlg(tmp)
    if drawing is None:
        sys.exit(f'не удалось прочитать SVG ({src})')
    out = f'{prefix}-{size}.png'
    renderPM.drawToFile(drawing, out, fmt='PNG', bg=None)
    print('OK', out)
