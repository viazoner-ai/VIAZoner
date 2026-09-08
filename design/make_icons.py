#!/usr/bin/env python3
"""Генерация PNG-иконок volonter.by — градиентная плитка с белым сердцем.

Pillow + supersampling (S=8). Сердце — классическая форма (Material favorite),
контур задан кубическими кривыми Безье и семплируется в полигон,
затем масштабируется/центрируется по bbox. Никаких внешних растеризаторов.
"""
import os
from PIL import Image, ImageDraw

OUT = 'public/icons'
S = 8
GRAD_TOP = (249, 115, 22)
GRAD_BOT = (154, 52, 18)
WHITE = (255, 255, 255, 255)


def cubic(p0, p1, p2, p3, n=24):
    out = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        x = mt ** 3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t ** 3 * p3[0]
        y = mt ** 3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t ** 3 * p3[1]
        out.append((x, y))
    return out


def heart_raw_points():
    """Контур сердца в условных единицах (y вниз). Аппроксимация иконки
    Material 'favorite' (viewBox 0..24)."""
    pts = []
    p0 = (12.0, 21.35)
    # собираем сегменты правой половины (контур идёт снизу вверх по левой стороне)
    segments = [
        ('L', (10.55, 20.03)),
        ('C', (5.4, 15.36), (2.0, 12.28), (2.0, 8.5)),
        ('C', (2.0, 5.42), (4.42, 3.0), (7.5, 3.0)),
        ('C', (9.24, 3.0), (10.91, 3.81), (12.0, 5.09)),      # rel из (7.5,3)
        ('C', (13.09, 3.81), (14.76, 3.0), (16.5, 3.0)),
        ('C', (19.58, 3.0), (22.0, 5.42), (22.0, 8.5)),
        ('C', (22.0, 12.28), (18.6, 15.36), (13.45, 20.04)),  # rel
        ('L', (12.0, 21.35)),
    ]
    cur = p0
    pts.append(cur)
    for seg in segments:
        if seg[0] == 'L':
            cur = seg[1]
            pts.append(cur)
        else:
            _, c1, c2, end = seg
            step = cubic(cur, c1, c2, end)
            pts.extend(step[1:])
            cur = end
    return pts


def heart_polygon(cx, cy, target_w, target_h):
    """Вписать сердце в прямоугольник target_w x target_h с центром (cx,cy)."""
    pts = heart_raw_points()
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    w0 = max(xs) - min(xs)
    h0 = max(ys) - min(ys)
    s = min(target_w / w0, target_h / h0)
    midx = (max(xs) + min(xs)) / 2
    midy = (max(ys) + min(ys)) / 2
    return [(cx + (x - midx) * s, cy + (y - midy) * s) for x, y in pts]


def render(size, filename, rounded, radius_ratio, cw, ch, cy_ratio):
    W = size * S
    img = Image.new('RGBA', (W, W), (0, 0, 0, 0))

    grad = Image.new('RGBA', (1, W))
    for y in range(W):
        t = y / W
        c = tuple(int(GRAD_TOP[i] * (1 - t) + GRAD_BOT[i] * t) for i in range(3))
        grad.putpixel((0, y), (*c, 255))
    grad = grad.resize((W, W))

    mask = Image.new('L', (W, W), 0)
    md = ImageDraw.Draw(mask)
    if rounded:
        md.rounded_rectangle([0, 0, W - 1, W - 1], radius=int(W * radius_ratio), fill=255)
    else:
        md.rectangle([0, 0, W - 1, W - 1], fill=255)
    img.paste(grad, (0, 0), mask)

    heart = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    hd = ImageDraw.Draw(heart)
    hd.polygon(heart_polygon(W / 2, W * cy_ratio, W * cw, W * ch), fill=WHITE)
    img = Image.alpha_composite(img, heart)

    img = img.resize((size, size), Image.LANCZOS)
    img.save(f'{OUT}/{filename}')

    a = img.getchannel('A')
    bbox = a.point(lambda v: 255 if v > 120 else 0).getbbox()
    # проверяем, что прозрачные скруглённые углы на месте и сердце не вылезло
    assert bbox is not None
    print(f'OK {filename:24s} непрозрачная область: {bbox}')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    render(512, 'icon-512.png', rounded=True, radius_ratio=0.219, cw=0.60, ch=0.52, cy_ratio=0.545)
    render(192, 'icon-192.png', rounded=True, radius_ratio=0.219, cw=0.60, ch=0.52, cy_ratio=0.545)
    # apple-touch-icon: iOS сам скругляет, поэтому плитка должна быть полной и непрозрачной
    render(180, 'apple-touch-icon.png', rounded=False, radius_ratio=0.0, cw=0.60, ch=0.52, cy_ratio=0.545)
    render(512, 'maskable-512.png', rounded=False, radius_ratio=0.0, cw=0.55, ch=0.47, cy_ratio=0.535)
