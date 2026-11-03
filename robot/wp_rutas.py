# -*- coding: utf-8 -*-
"""Rutas de un colaborador con web en WordPress y el complemento «CM Maps Routes Manager» (p. ej. Gata con botas).
Cada entrada de ruta trae: botón GPX/KML (cmmrm-export-route), «Datos técnicos» (Longitud, Desnivel de subida, Tipo de recorrido,
MIDE, Fecha de realización) y su provincia (categoría). El robot recorre sus categorías (solo las zonas que queremos),
y de cada entrada NUEVA baja la página y el track. Las que ya tenemos no se vuelven a pedir (no carga su servidor).
Cada ruta: [nombre, zona, tipo, km, desnivel, dificultad(MIDE), '', entrada, track, foto, 'AAAA-MM'] (como las de importar_kml)."""
import re, html, json, math, time, io, zipfile, unicodedata, xml.etree.ElementTree as ET
import importar_kml as IK

def _txt(h):
    h = re.sub(r'(?is)<(script|style)\b.*?</\1>', ' ', h)
    h = re.sub(r'(?i)<br\s*/?>|</(li|p|h\d|div)>', '\n', h)
    return re.sub(r'[ \t\r\f\v]+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h)))

def _sin(t):
    t = unicodedata.normalize('NFD', t.lower())
    return ''.join(c for c in t if unicodedata.category(c) != 'Mn')

# ---------------------------------------------------------------- lista de entradas de una categoría
def _entradas(get, web, cat, tope=40):
    """URLs de las entradas de una categoría: primero su feed RSS (limpio); si no, las páginas del listado."""
    urls, ok = [], False
    for n in range(1, tope + 1):
        try: x = get(f'{web}/{cat}/feed/' + (f'?paged={n}' if n > 1 else ''), tries=2)
        except Exception: break
        if '<rss' not in x[:500] and '<channel' not in x: break
        ok = True
        nuevas = [html.unescape(u).strip() for u in re.findall(r'<item>.*?<link>\s*([^<]+?)\s*</link>', x, re.S)]
        if not nuevas: break
        nuevas = [u for u in nuevas if u not in urls]
        if not nuevas: break
        urls += nuevas
        if len(nuevas) < 5: break
    if ok: return urls, True
    malas = re.compile(r'/(rutas|mapas|articulos|sobre-mi|contacto|tag|author|page|category|feed|wp-[a-z]+|comments)/?$')
    for n in range(1, tope + 1):
        try: h = get(f'{web}/{cat}/' + (f'page/{n}/' if n > 1 else ''), tries=2)
        except Exception: break
        h = re.sub(r'(?is)<(header|nav|footer|aside)\b.*?</\1>', ' ', h)
        nuevas = []
        for u in re.findall(r'href=["\'](' + re.escape(web) + r'/[a-z0-9%-]+/)["\']', h):
            if not malas.search(u) and u not in urls and u not in nuevas: nuevas.append(u)
        if not nuevas: break
        urls += nuevas; ok = True
    return urls, ok

# ---------------------------------------------------------------- track (GPX, KML o KMZ)
def _track(b):
    if b[:2] == b'PK':
        z = zipfile.ZipFile(io.BytesIO(b)); k = next((n for n in z.namelist() if n.lower().endswith('.kml')), None)
        if not k: return []
        b = z.read(k)
    t = b.decode('utf-8', 'replace')
    pts = []
    if '<gpx' in t[:3000]:
        for tag in ('trkpt', 'rtept'):
            for m in re.finditer(r'<(?:\w+:)?' + tag + r'\b([^>]*)>(.*?)</(?:\w+:)?' + tag + r'>|<(?:\w+:)?' + tag + r'\b([^>]*)/>', t, re.S):
                at = m.group(1) or m.group(3) or ''; inn = m.group(2) or ''
                la = re.search(r'lat=["\']([-\d.]+)', at); lo = re.search(r'lon=["\']([-\d.]+)', at)
                if not la or not lo: continue
                e = re.search(r'<(?:\w+:)?ele>\s*([-\d.]+)', inn)
                pts.append([float(la.group(1)), float(lo.group(1)), float(e.group(1)) if e else None])
            if pts: break
        return pts
    for c in re.findall(r'<(?:\w+:)?LineString\b.*?<(?:\w+:)?coordinates>(.*?)</', t, re.S):
        for v in c.split():
            a = v.split(',')
            if len(a) >= 2:
                try: pts.append([float(a[1]), float(a[0]), float(a[2]) if len(a) > 2 and a[2] else None])
                except ValueError: pass
    if not pts:
        for m in re.finditer(r'<gx:coord>\s*([-\d.]+)\s+([-\d.]+)\s*([-\d.]*)', t):
            pts.append([float(m.group(2)), float(m.group(1)), float(m.group(3)) if m.group(3) else None])
    return pts

def _km(a, b): return math.hypot((a[0] - b[0]) * 111.2, (a[1] - b[1]) * 111.2 * math.cos(math.radians(a[0])))

def _simplifica(pts):
    s = IK.dp(pts, 0.00012)
    if len(s) > 400: s = s[::math.ceil(len(s) / 400)] + [s[-1]]
    return [[round(q[0], 5), round(q[1], 5)] + ([round(q[2])] if q[2] is not None else []) for q in s]

# ---------------------------------------------------------------- una entrada
def _ficha(h):
    t = _txt(h)
    i = t.lower().rfind('datos técnicos'); dt = t[i:i + 2000] if i >= 0 else t
    def campo(rx):
        m = re.search(rx + r'\s*:?\s*([^\n]+)', dt, re.I)
        return m.group(1).strip() if m else ''
    titulo = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)', h) or re.search(r'<title>([^<]+)', h)
    titulo = html.unescape(titulo.group(1)).split(' – ')[0].split(' | ')[0].strip() if titulo else ''
    lon = campo(r'Longitud'); sub = campo(r'Desnivel de subida'); tipo = campo(r'Tipo de recorrido'); fe = campo(r'Fecha de realizaci[oó]n')
    mide = [campo(r'MIDE\s*/\s*' + x) for x in ('Severidad', 'Orientaci[oó]n', 'Dificultad', 'Cantidad')]
    mide = [(re.search(r'(\d)\s*$', m) or [None, ''])[1] for m in mide]
    km = (re.search(r'(\d+(?:[.,]\d+)?)\s*km', lon, re.I) or [None, ''])[1]
    if not km and re.search(r'(\d[\d.]*)\s*m\b', lon): km = str(round(int(re.search(r'(\d[\d.]*)', lon).group(1).replace('.', '')) / 1000, 1)).replace('.', ',')
    de = (re.search(r'(\d[\d.]*)\s*m', sub) or [None, ''])[1].replace('.', '')
    f = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', fe)
    fecha = f'{f.group(3)}-{int(f.group(2)):02d}' if f else ''
    if not fecha:
        m = re.search(r'article:published_time["\'][^>]*content=["\'](\d{4})-(\d{2})', h)
        if m: fecha = f'{m.group(1)}-{m.group(2)}'
    gpx = [html.unescape(u) for u in re.findall(r'href=["\']([^"\']*cmmrm_action=cmmrm-export-route[^"\']*)["\']', h)]
    gpx.sort(key=lambda u: 0 if 'format=original' in u else 1 if 'format=gpx' in u else 2)
    cats = [html.unescape(u) for u in re.findall(r'<a[^>]+href=["\']([^"\']+/rutas/[^"\']+)["\'][^>]*rel=["\'][^"\']*category', h)] + \
           [html.unescape(u) for u in re.findall(r'<a[^>]+rel=["\'][^"\']*category[^"\']*["\'][^>]*href=["\']([^"\']+/rutas/[^"\']+)["\']', h)]
    return dict(n=titulo, km=(km + ' km') if km else '', de=(de + ' m') if de else '', tipo=tipo.capitalize(),
                dif=('MIDE ' + '-'.join(mide)) if all(mide) else '', fecha=fecha, gpx=gpx, cats=cats)

def _cimas(n, pts, idx):
    """Cumbre de la ruta si el título nombra UNA cima clara (como en importar_kml), en el punto más alto del track."""
    ds = []
    for x in IK.destinos(n):
        x = re.sub(r'^(?:subida|ascensi[oó]n)\s+(?:a|al)\s+', '', x, flags=re.I).strip()
        if IK.es_cima(x, ''): ds.append(x)
    ele = [q for q in pts if q[2] is not None]
    if len(ds) != 1 or not ele: return None
    hi = max(ele, key=lambda q: q[2])
    if hi[2] - min(q[2] for q in ele) < 150: return None
    return (ds[0], hi[0], hi[1], round(hi[2]), None, idx)

class _Corte(Exception): pass

def _getter(get, log, nom):
    import urllib.request
    UA = {'User-Agent': 'Mozilla/5.0 (robot app Los de las Claras)'}
    st = {'mal': 0, 'n': 0, 't0': time.time()}
    def g(url, binary=False, tries=2):
        if st['mal'] >= 6: raise _Corte('su web no responde')
        if time.time() - st['t0'] > 15 * 60: raise _Corte('más de 15 minutos')
        st['n'] += 1
        for i in range(tries):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                    b = r.read(); st['mal'] = 0
                    return b if binary else b.decode('utf-8', 'replace')
            except urllib.error.HTTPError as e:
                if e.code == 404: raise
                last = e
            except Exception as e:
                last = e
        st['mal'] += 1; raise last
    g.st = st
    return g

def leer(co, old, get, log):
    """Devuelve (rutas, cumbres, saltadas) o None si no se ha podido leer bien su web (entonces no se toca nada)."""
    cf = co['wp_rutas']; web = cf['web'].rstrip('/'); nom = co.get('nombre') or co['id']
    get = _getter(get, log, nom)
    zonas = cf['zonas']   # categoría (ruta en su web) -> [zona en la app, lat_min, lat_max]
    previas = {r[7]: r for r in old.get('r', [])}
    saltar = set(old.get('x', []))   # entradas fuera de la parte que queremos (no se vuelven a pedir)
    vistas, fallo = {}, []
    for cat, z in zonas.items():
        try: us, ok = _entradas(get, web, cat)
        except _Corte: us, ok = [], False
        if not ok: fallo.append(cat); continue
        for u in us: vistas.setdefault(u.rstrip('/') + '/', cat)
        time.sleep(0.5)
    if fallo and len(fallo) == len(zonas):
        log(f'⚠ No he podido leer la web de {nom} ({web}): se queda como estaba.'); return None
    if fallo: log(f'⚠ {nom}: no he podido leer {len(fallo)} zona(s) de su web ({", ".join(fallo)}); esas rutas se quedan como estaban.')
    rutas, pedidas, nuevas, sin_track, fuera = [], 0, 0, [], 0
    tope = cf.get('tope', 120)
    for u, cat in vistas.items():
        if u in previas: rutas.append(previas[u]); continue
        if u in saltar: continue
        if pedidas >= tope: continue
        pedidas += 1
        try:
            h = get(u, tries=2); f = _ficha(h)
            pts = []
            for g in f['gpx']:
                try:
                    pts = _track(get(g if g.startswith('http') else web + g, True, tries=2))
                    if len(pts) >= 2: break
                except Exception: pass
            if len(pts) < 2: sin_track.append(f['n'] or u); continue
            # su zona: la provincia de la entrada (si es de las que queremos) y que el track caiga en la parte que queremos
            zc = next((c for c in zonas if any(c.rstrip('/') in x for x in f['cats'])), cat)
            zn, la0, la1 = zonas[zc]
            if not (la0 <= pts[0][0] <= la1): fuera += 1; saltar.add(u); continue
            km = f['km'] or (str(round(sum(_km(a, b) for a, b in zip(pts, pts[1:])), 1)).replace('.', ',') + ' km')
            de = f['de']
            if not de and any(q[2] is not None for q in pts):
                e = [q[2] for q in pts if q[2] is not None]; de = str(round(sum(max(0, b - a) for a, b in zip(e, e[1:])))) + ' m'
            rutas.append([f['n'] or u, zn, f['tipo'], km, de, f['dif'], '', u, _simplifica(pts), '', f['fecha']]); nuevas += 1
        except _Corte as e:
            log(f'⚠ {nom}: paro de leer su web ({e}); sigo otra noche.'); pedidas = tope
        except Exception as e:
            sin_track.append(f'{u} ({e})')
        time.sleep(1)
    # las que ya no están en su web (o han cambiado de zona) se quitan, salvo las de zonas que no se han podido leer
    for u, r in previas.items():
        if u not in vistas and any(r[1] == zonas[c][0] for c in fallo): rutas.append(r)
    log(f'   ({get.st["n"]} peticiones a su web en {round((time.time() - get.st["t0"]) / 60, 1)} min)')
    log(f'🐾 {nom}: {len(vistas)} entradas en sus zonas, {len(rutas)} rutas en la app ({nuevas} nuevas'
        + (f', {fuera} fuera de la zona' if fuera else '') + (f', {len(sin_track)} sin track' if sin_track else '')
        + (f'; quedan {sum(1 for u in vistas if u not in previas and u not in saltar) - pedidas} por leer otra noche' if pedidas >= tope else '') + ').')
    if sin_track: log('   sin track: ' + '; '.join(sin_track[:10]) + (' …' if len(sin_track) > 10 else ''))
    if len(rutas) < 0.9 * len(old.get('r', [])):
        log(f'⚠ {nom}: solo {len(rutas)} rutas (había {len(old["r"])}): no lo toco.'); return None
    rutas.sort(key=lambda r: r[10] or '', reverse=True)
    cimas = [c for c in (_cimas(r[0], [q + [None] * (3 - len(q)) for q in r[8]], i) for i, r in enumerate(rutas)) if c]
    return rutas, IK._cumbres(cimas), sorted(saltar & set(vistas))
