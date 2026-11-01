# -*- coding: utf-8 -*-
"""Importa a un colaborador desde archivos KML de My Maps que solo traen tracks (líneas), sin puntos.
Uso: python robot/importar_kml.py <id> "<nombre>" <carpeta_con_kml>   ->  app/colab/<id>.json  (clave "r": rutas)
Cada ruta: [nombre, zona, actividad, distancia, desnivel, dificultad, wikiloc, blog, [[lat,lon],...]] (track simplificado)
Zonas: toda la Cordillera, Pirineos y, de «Fuera de España», solo Alpes y Dolomitas (decidido por él, 1 nov 2026)."""
import sys, os, re, glob, json, math, unicodedata, xml.etree.ElementTree as ET
K = '{http://www.opengis.net/kml/2.2}'
FUERA = {'Otras zonas de España'}

# ---- cumbres sacadas de sus rutas: el nombre del título (solo si nombra UNA cima clara) y el sitio y la altura del punto más alto de su track
PRE=r'(?:Pico|Picu|Picos|Picón|Picacho|Peña|Peñas|Penha|Pena|Peñón|Cueto|Cuetu|Cuetos|Teso|Tesu|Torre|Torres|Alto|Monte|Cerro|Cabeza|Morro|Mota|Muela|Tambarón|Catoute|Cornón|Cuiña|Ubiña|Espiguete|Curavacas|Mampodre|Mustallar|Miravalles|Tesón|Moncalvo|Polinosa|Mocares|Cornión|Coriscao|Cervunal|Fontán|Pizarro|Cancelada|Silla|Mesa|Cueña|Valdorria|Bodón|Lázaro|Huevo|Rasa|Gistreo|Pierros|Bocalada)'
GEN=re.compile(r'\b(sierra|canal|cañón|canon|travesía|integral|subida|ascensión|la cueta|lago|lagos|laguna|lagunas|braña|brañas|cascada|cascadas|hayedo|faedo|bosque|valle|foz|hoces|ruta|circular|refugio|pueblo|camino|senda|minas|puente|ermita|castro|majada|vega|fuente|pozo|río|arroyo|embalse|chorro|tejedal|teixedal|acebal|sabinar|calzada|cueva|puerto|collado|collada|paso|mirador|ibón|estany|lac|see|valley|fall|desfiladero|garganta)\b',re.I)
def destinos(t):
    t=t.split('|')[-1] if '|' in t else t
    t=re.sub(r'\(.*?\)','',t)
    t=re.split(r'\s+(?:desde|por|con|en invierno|invernal)\b',t,maxsplit=1,flags=re.I)[0]
    t=re.sub(r'^(subida|ascensi[oó]n)\s+(a|al)\s+','',t.strip(),flags=re.I)
    return [x.strip(' .-') for x in re.split(r'\s+y\s+|,|\s*-\s*|\s+\+\s+|\s*/\s*',t) if x.strip(' .-')]
def es_cima(x,act):
    if GEN.search(x) or not x[:1].isupper(): return False
    return bool(re.match(PRE+r'\b',x))


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
    rutas, vistos, cimas = [], set(), []
    for f in sorted(glob.glob(os.path.join(carpeta, '*.kml'))):
        if re.search(r'\(\d\)\.kml$', f) and not re.search(r'de \d\)\.kml$', f): pass
        zona = re.sub(r'^\d+\s*RV - | \(\d de \d\)( \(\d\))?\.kml$|( \(\d\))?\.kml$', '', os.path.basename(f))
        if zona in FUERA: continue
        for pm in ET.parse(f).getroot().iter(K + 'Placemark'):
            n = (pm.findtext(K + 'name') or '').strip()
            c = pm.find('.//' + K + 'LineString/' + K + 'coordinates')
            if c is None or not n: continue
            raw = [v.split(',') for v in c.text.split() if v.count(',') >= 1]
            pts = [[float(a[1]), float(a[0])] for a in raw]
            ele = [(float(a[1]), float(a[0]), float(a[2])) for a in raw if len(a) > 2 and a[2]]
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
            dst = destinos(n); ds = [x for x in dst if es_cima(x, dd.get('Actividad'))]
            if not ds and dd.get('Actividad') == 'Alpinismo' and len(dst) == 1 and not GEN.search(dst[0]) and len(dst[0].split()) <= 3 and dst[0][:1].isupper(): ds = dst
            if len(ds) == 1 and ele:
                hi = max(ele, key=lambda q: q[2])
                if hi[2] - min(q[2] for q in ele) >= 150 and hi[2] >= 700:
                    ta = re.search(r'\((\d[\d.]{2,5})\s*m', n); ta = int(ta.group(1).replace('.', '')) if ta else None
                    cimas.append((ds[0], hi[0], hi[1], round(hi[2]), ta if ta and abs(ta - hi[2]) < 200 else None, len(rutas)))
            rutas.append([n, z, dd.get('Actividad', ''), dd.get('Distancia', ''), dd.get('Desnivel +', ''), dd.get('Dificultad', ''),
                          dd.get('Track en Wikiloc', ''), dd.get('Ruta en el blog', ''), s])
    # agrupar: mismo nombre (sin tildes) y a menos de 1,5 km = la misma cumbre; se queda la del punto más alto
    sin = lambda x: unicodedata.normalize('NFD', x.lower()).encode('ascii', 'ignore').decode()
    grupos = []
    for c in sorted(cimas, key=lambda c: -c[3]):
        for g in grupos:
            if sin(g[0][0]) == sin(c[0]) and math.hypot(g[0][1] - c[1], (g[0][2] - c[2]) * 0.73) * 111 < 1.5: g.append(c); break
        else: grupos.append([c])
    p = []
    for g in grupos:
        n, la, lo, al, ta, _ = g[0]; ta = next((x[4] for x in g if x[4]), None)
        mil = lambda v: f"{v:,}".replace(',', '.')
        alt = f"Altitud: {mil(ta)} m" if ta else f"Altitud: {mil(al)} m (aprox., según su track)"
        p.append([n, round(la, 5), round(lo, 5), alt, '', '', '1634', 'CUMBRES', None, sorted({x[5] for x in g})])
    print(len(p), 'cumbres sacadas de', len(cimas), 'rutas')
    out = f'app/colab/{cid}.json'
    json.dump({'t': nombre, 'p': p, 'l': [], 'r': rutas}, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(rutas), 'rutas ->', out, os.path.getsize(out) // 1024, 'KB', sum(len(r[8]) for r in rutas), 'puntos de track')

if __name__ == '__main__':
    main(*sys.argv[1:4])
