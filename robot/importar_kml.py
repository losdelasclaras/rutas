# -*- coding: utf-8 -*-
"""Importa a un colaborador desde archivos KML de My Maps que solo traen tracks (líneas), sin puntos.
Uso: python robot/importar_kml.py <id> "<nombre>" <carpeta_con_kml>   ->  app/colab/<id>.json  (clave "r": rutas)
Cada ruta: [nombre, zona, actividad, distancia, desnivel, dificultad, wikiloc, blog, [[lat,lon],...]] (track simplificado)
Zonas: toda la Cordillera, Pirineos y, de «Fuera de España», solo Alpes y Dolomitas (decidido por él, 1 nov 2026)."""
import sys, os, re, glob, json, math, xml.etree.ElementTree as ET
K = '{http://www.opengis.net/kml/2.2}'
FUERA = {'Otras zonas de España'}

def dp(pts, eps):
    # Douglas-Peucker en grados (eps ~ 0.00012 ≈ 12 m)
    if len(pts) < 3: return pts
    def d(p, a, b):
        ax, ay, bx, by, px, py = a[1], a[0], b[1], b[0], p[1], p[0]
        dx, dy = bx - ax, by - ay
        if dx == dy == 0: return math.hypot(px - ax, py - ay)
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - ax - t * dx, py - ay - t * dy)
    keep = [False] * len(pts); keep[0] = keep[-1] = True; st = [(0, len(pts) - 1)]
    while st:
        i, j = st.pop(); mx, k = 0, -1
        for x in range(i + 1, j):
            v = d(pts[x], pts[i], pts[j])
            if v > mx: mx, k = v, x
        if mx > eps: keep[k] = True; st += [(i, k), (k, j)]
    return [p for p, k in zip(pts, keep) if k]

def main(cid, nombre, carpeta):
    rutas, vistos = [], set()
    for f in sorted(glob.glob(os.path.join(carpeta, '*.kml'))):
        if re.search(r'\(\d\)\.kml$', f) and not re.search(r'de \d\)\.kml$', f): pass
        zona = re.sub(r'^\d+\s*RV - | \(\d de \d\)( \(\d\))?\.kml$|( \(\d\))?\.kml$', '', os.path.basename(f))
        if zona in FUERA: continue
        for pm in ET.parse(f).getroot().iter(K + 'Placemark'):
            n = (pm.findtext(K + 'name') or '').strip()
            c = pm.find('.//' + K + 'LineString/' + K + 'coordinates')
            if c is None or not n: continue
            pts = [[float(v.split(',')[1]), float(v.split(',')[0])] for v in c.text.split() if v.count(',') >= 1]
            if len(pts) < 2: continue
            la, lo = pts[0]
            z = zona
            if zona == 'Fuera de España':
                if not (44 < la < 48.5 and 5 < lo < 14): continue   # solo Alpes y Dolomitas
                z = 'Dolomitas' if lo > 10.5 else 'Alpes'
            if zona == 'Pirineos': z = 'Pirineos'
            key = (n, round(la, 4), round(lo, 4))
            if key in vistos: continue
            vistos.add(key)
            dd = {x.get('name'): (x.findtext(K + 'value') or '').strip() for x in pm.iter(K + 'Data')}
            s = dp(pts, 0.00012)
            if len(s) > 400: s = s[::math.ceil(len(s) / 400)] + [s[-1]]
            s = [[round(a, 5), round(b, 5)] for a, b in s]
            rutas.append([n, z, dd.get('Actividad', ''), dd.get('Distancia', ''), dd.get('Desnivel +', ''), dd.get('Dificultad', ''),
                          dd.get('Track en Wikiloc', ''), dd.get('Ruta en el blog', ''), s])
    out = f'app/colab/{cid}.json'
    json.dump({'t': nombre, 'p': [], 'l': [], 'r': rutas}, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(rutas), 'rutas ->', out, os.path.getsize(out) // 1024, 'KB', sum(len(r[8]) for r in rutas), 'puntos de track')

if __name__ == '__main__':
    main(*sys.argv[1:4])
