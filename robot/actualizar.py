# -*- coding: utf-8 -*-
"""
ROBOT DE LA APP DE LOS DE LAS CLARAS
Cada noche (GitHub Actions) mira:
  1. el blog (entradas nuevas o renovadas)            -> app/blog.json + app/fotos/<n>.jpg
  2. el mapa de Google My Maps (puntos)               -> app/mapa.kml + app/points.json + app/concejos.json
  3. la carpeta de Google Drive con los tracks (GPX)  -> app/gpx/raw/drive__*.gpx
Si algo ha cambiado, regenera la app (build.py, assemble.py, gpx/proc.py, pwa/build_pwa.py).
Escribe un informe en robot/informe.md. Sale con código 0 si no hay cambios, 0 si los hay (lo indica en robot/hay-cambios).
"""
import json, os, re, sys, io, html, math, subprocess, datetime, time, unicodedata, urllib.request, urllib.parse, xml.etree.ElementTree as ET

APP = '/home/claude/app/'
CFG = {
    'blog': 'https://losdelasclaras.blogspot.com',
    'mapa_mid': '16tn38IuLguuXpWxoOJtVp_7g-7iWa7s',
    'drive_carpeta': '1qcbMEK4PSPmcYC9HCKH9qofQ15gobXyV',
}
INF = []          # líneas del informe
CAMBIOS = []      # qué ha cambiado
def log(s): print(s); INF.append(s)
UA = {'User-Agent': 'Mozilla/5.0 (robot app Los de las Claras)'}
def get(url, binary=False, tries=3):
    last = None
    for _ in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                b = r.read()
                return b if binary else b.decode('utf-8', 'replace')
        except Exception as e:
            last = e
    raise last

# ------------------------------------------------------------------ 1. BLOG
def txt(h):
    h = re.sub(r'<(script|style)\b.*?</\1>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<br\s*/?>', ' ', h, flags=re.I)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()

def ficha(c):
    """Saca de la entrada (formatos «ruta-datos», «ca-ficha» o texto libre) km, desnivel, dificultad, tiempo, salida, zona y Wikiloc."""
    pares = []
    for v, l in re.findall(r'class="val">(.*?)</span>\s*<span class="lab">(.*?)</span>', c, re.S):  # ruta-dato
        pares.append((txt(v), txt(l)))
    for v, l in re.findall(r'class="ca-stat"><b>(.*?)</b><i>(.*?)</i>', c, re.S):                   # ca-stat
        pares.append((txt(v), txt(l)))
    for l, v in re.findall(r'<dt>(.*?)</dt>\s*<dd>(.*?)</dd>', c, re.S):                            # ca-dl
        pares.append((txt(v), txt(l)))
    o = {}
    for v, l in pares:
        L = l.lower()
        if 'distancia' in L and 'km' not in o:
            m = re.search(r'(\d+(?:[.,]\d+)?)\s*km', v, re.I)
            if m: o['km'] = m.group(1).replace('.', ',')
        elif 'desnivel' in L and 'des' not in o:
            m = re.search(r'(\d[\d.]*)\s*m', v)
            if m: o['des'] = m.group(1)
        elif 'dificultad' in L and 'dif' not in o:
            o['dif'] = v.split('·')[0].strip()
        elif any(k in L for k in ('paradas', 'tiempo', 'duración', 'duracion')) and 'tm' not in o:
            o['tm'] = v
        elif any(k in L for k in ('inicio', 'salida')) and 'sal' not in o:
            o['sal'] = v
        elif L.startswith('zona') and 'zona' not in o:
            o['zona'] = v
    for ch in re.findall(r'class="ruta-chip"[^>]*>(.*?)</(?:a|span)>', c, re.S):
        t = txt(ch)
        if t.startswith('📍') and 'sal' not in o: o['sal'] = t[1:].strip()
        if t.startswith('🗺') and 'zona' not in o: o['zona'] = t.lstrip('🗺️').strip()
    T = txt(c)
    if 'km' not in o:
        m = re.search(r'Distancia[^0-9]{0,25}(\d+(?:[.,]\d+)?)\s*km', T, re.I)
        if m: o['km'] = m.group(1)
    if 'des' not in o:
        m = re.search(r'Desnivel[^0-9]{0,30}(\d[\d.]*)\s*m', T, re.I)
        if m: o['des'] = m.group(1)
    if 'dif' not in o:
        m = re.search(r'Dificultad[:\s]+([A-Za-záéíóúÁÉÍÓÚ\- ]{3,20}?)(?:[.,;·(]|\s{2}|$)', T)
        if m: o['dif'] = m.group(1).strip()
    m = re.search(r'href="(https?://[^"]*wikiloc\.com/[^"]+)"', c)
    if m: o['wk'] = html.unescape(m.group(1))
    # primera frase de presentación (primer párrafo con texto)
    for p in re.findall(r'<p\b[^>]*>(.*?)</p>', c, re.S):
        t = txt(p)
        if len(t) > 60 and not re.match(r'(Ficha|Distancia|Desnivel)', t):
            o['desc'] = t[:400]; break
    m = re.search(r'<img\b[^>]*\bsrc="(https://[^"]+)"', c)
    if m: o['img'] = html.unescape(m.group(1))
    o['ficha'] = bool(re.search(r'ruta-datos|ca-ficha', c))
    return o

def foto(url, n):
    """Descarga la foto principal y la deja en 400x248 (como las demás)."""
    try:
        from PIL import Image
        u = re.sub(r'/(s\d+|w\d+-h\d+[^/]*)/', '/w900/', url)
        im = Image.open(io.BytesIO(get(u, True))).convert('RGB')
        W, H = 400, 248; r = max(W / im.width, H / im.height)
        im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
        x, y = (im.width - W) // 2, (im.height - H) // 2
        im.crop((x, y, x + W, y + H)).save(APP + f'fotos/{n}.jpg', quality=82)
        return True
    except Exception as e:
        log(f'   ⚠ no he podido bajar la foto: {e}'); return False

def blog():
    B = json.load(open(APP + 'blog.json')); idx = {p['u']: i for i, p in enumerate(B)}
    ns = {'a': 'http://www.w3.org/2005/Atom'}
    root = ET.fromstring(get(CFG['blog'] + '/feeds/posts/default?orderby=updated&max-results=40').encode('utf-8'))
    nuevas = renov = 0
    for e in root.findall('a:entry', ns):
        url = next((l.get('href') for l in e.findall('a:link', ns) if l.get('rel') == 'alternate'), None)
        if not url or '.blogspot.com/' not in url: continue
        k = url.split('.blogspot.com/')[1].split('?')[0]
        c = e.findtext('a:content', '', ns) or ''
        F = ficha(c)
        pub = (e.findtext('a:published', '', ns) or '')[:10]; upd = (e.findtext('a:updated', '', ns) or '')[:10]
        if k not in idx:
            n = len(B)
            rec = dict(u=k, t=(e.findtext('a:title', '', ns) or '').strip(), d=pub, l=[x.get('term') for x in e.findall('a:category', ns)],
                       i=None, km=F.get('km'), des=F.get('des'), dif=F.get('dif'), tm=F.get('tm'), nv=False, up=upd)
            for a in ('wk', 'img', 'sal', 'zona', 'desc'):
                if F.get(a): rec[a] = F[a]
            B.append(rec); idx[k] = n; nuevas += 1
            log(f'🆕 Entrada nueva: «{rec["t"]}» ({pub}) · {rec.get("km") or "?"} km · +{rec.get("des") or "?"} m · {rec.get("dif") or "sin dificultad"}' + (' · foto ✓' if rec.get('img') and foto(rec['img'], n) else ' · sin foto'))
        else:
            rec = B[idx[k]]
            # entrada renovada: tiene ficha nueva y se ha tocado después de publicarla
            if F['ficha'] and rec.get('up') and rec.get('up') != upd:
                old = dict(rec)
                for a in ('km', 'des', 'dif', 'tm', 'wk', 'sal', 'zona', 'desc'):
                    if F.get(a): rec[a] = F[a]
                rec['t'] = (e.findtext('a:title', '', ns) or rec['t']).strip()
                if pub[:4] < upd[:4] or (datetime.date.fromisoformat(upd) - datetime.date.fromisoformat(pub)).days > 60: rec['nv'] = True
                if F.get('img') and F['img'] != old.get('img'):
                    rec['img'] = F['img']; foto(F['img'], idx[k])
                rec['up'] = upd
                if {a: old.get(a) for a in rec} != {a: rec.get(a) for a in rec}:
                    renov += 1; log(f'♻️ Entrada actualizada: «{rec["t"]}»')
            elif not rec.get('up'):
                rec['up'] = upd  # primera vez que el robot la ve: solo se apunta la fecha
    if nuevas or renov:
        json.dump(B, open(APP + 'blog.json', 'w'), ensure_ascii=False)
        CAMBIOS.append(f'blog: {nuevas} nuevas, {renov} actualizadas')
    else:
        json.dump(B, open(APP + 'blog.json', 'w'), ensure_ascii=False)
        log('Blog: sin entradas nuevas.')

# ------------------------------------------------------------------ 2. MAPA (My Maps)
def km(a, b):
    return 6371 * 2 * math.asin(math.sqrt(math.sin(math.radians(b[0] - a[0]) / 2) ** 2 + math.cos(math.radians(a[0])) * math.cos(math.radians(b[0])) * math.sin(math.radians(b[1] - a[1]) / 2) ** 2))

def mapa():
    k = get(f'https://www.google.com/maps/d/kml?mid={CFG["mapa_mid"]}&forcekml=1')
    n = k.count('<Placemark')
    old = json.load(open(APP + 'points.json'))
    if n < 0.9 * len(old):
        log(f'⚠ El mapa de My Maps ha devuelto solo {n} puntos (había {len(old)}): no lo toco por si es un fallo de Google.'); return
    prev = open(APP + 'mapa.kml').read() if os.path.exists(APP + 'mapa.kml') else None
    if prev == k:
        log('Mapa: sin cambios.'); return
    open(APP + 'mapa.kml', 'w').write(k)
    oldc = json.load(open(APP + 'concejos.json'))
    subprocess.run([sys.executable, APP + 'parse.py', APP + 'mapa.kml'], cwd=APP, check=True, capture_output=True)
    new = json.load(open(APP + 'points.json'))
    # concejo de cada punto: el del mismo punto de antes (mismo nombre a menos de 300 m) o el del punto antiguo más cercano
    con = []
    for p in new:
        best = None; bd = 9e9; same = None
        for j, q in enumerate(old):
            d = km((p['lat'], p['lon']), (q['lat'], q['lon']))
            if d < bd: bd = d; best = j
            if d < 0.3 and q['n'] == p['n']: same = j
        j = same if same is not None else best
        con.append(oldc[j] if j is not None and j < len(oldc) and bd < 25 else [])
    json.dump(con, open(APP + 'concejos.json', 'w'), ensure_ascii=False)
    on = {(q['n'], round(q['lat'], 4), round(q['lon'], 4)) for q in old}
    nn = [p for p in new if (p['n'], round(p['lat'], 4), round(p['lon'], 4)) not in on]
    gone = len(old) + len(nn) - len(new)
    log(f'🗺️ Mapa: {len(new)} puntos ({len(nn)} nuevos o movidos, {max(0, gone)} quitados).')
    for p in nn[:30]: log(f'   + {p["n"]}' + ('' if p.get('u') else '  ⚠ sin enlace a una entrada del blog'))
    CAMBIOS.append(f'mapa: {len(nn)} puntos nuevos o cambiados')

# ------------------------------------------------------------------ 3. TRACKS en Google Drive
def kml2gpx(t, nombre):
    pts = []
    for c in re.findall(r'<coordinates>(.*?)</coordinates>', t, re.S):
        for s in c.split():
            v = s.split(',')
            if len(v) >= 2: pts.append((float(v[1]), float(v[0]), float(v[2]) if len(v) > 2 and v[2] not in ('', '0') else None))
    if len(pts) < 2: return None
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="robot"><trk><name>' + html.escape(nombre) + '</name><trkseg>\n' +
            '\n'.join(f'<trkpt lat="{a}" lon="{b}">' + (f'<ele>{e}</ele>' if e is not None else '') + '</trkpt>' for a, b, e in pts) + '\n</trkseg></trk></gpx>\n')

def quitar(reg, hay):
    # los tracks que has borrado de Drive se quitan también de la app (vuelve el que hubiera antes)
    for fid in [f for f in reg if f not in hay]:
        fn = reg[fid].get('archivo')
        if fn and os.path.exists(APP + 'gpx/raw/' + fn):
            os.remove(APP + 'gpx/raw/' + fn); log(f'🗑 Track quitado de Drive: «{reg[fid]["n"]}» (lo quito de la app)')
            CAMBIOS.append('drive: track quitado')
        del reg[fid]

def drive():
    reg_f = APP + 'gpx/drive.json'
    reg = json.load(open(reg_f)) if os.path.exists(reg_f) else {}
    h = get(f'https://drive.google.com/embeddedfolderview?id={CFG["drive_carpeta"]}')
    ent = re.findall(r'id="entry-([\w-]+)".*?class="flip-entry-title">(.*?)</div>', h, re.S)
    if not ent:
        tit = re.search(r'<title>(.*?)</title>', h, re.S)
        if 'flip-list' in h or 'flip-entries' in h or (tit and 'drive' not in tit.group(1).lower() and 'sign' not in tit.group(1).lower()):
            log(f'Drive: la carpeta «{html.unescape(tit.group(1)).strip() if tit else ""}» está vacía.')
            quitar(reg, set()); json.dump(reg, open(reg_f, 'w'), ensure_ascii=False, indent=1)
        else:
            log('⚠ No he podido leer la carpeta de Drive (¿sigue compartida con «Cualquier persona con el enlace»?). ' + (html.unescape(tit.group(1)).strip()[:80] if tit else h[:200].replace(chr(10), ' ')))
        return
    quitar(reg, {fid for fid, _ in ent})
    nuevos = 0
    for fid, nombre in ent:
        nombre = html.unescape(nombre).strip()
        if fid in reg: continue
        if not re.search(r'\.(gpx|kml)$', nombre, re.I):
            reg[fid] = {'n': nombre, 'estado': 'ignorado (no es GPX ni KML)'}; continue
        try:
            b = get(f'https://drive.google.com/uc?export=download&id={fid}', True).decode('utf-8', 'replace')
        except Exception as e:
            log(f'⚠ No he podido bajar «{nombre}» de Drive: {e}'); continue
        base = re.sub(r'[^\w\-]+', '_', re.sub(r'\.(gpx|kml)$', '', nombre, flags=re.I))[:80]
        if nombre.lower().endswith('.kml'): b = kml2gpx(b, nombre[:-4])
        if not b or ('<trkpt' not in b and '<rtept' not in b):
            reg[fid] = {'n': nombre, 'estado': 'sin recorrido dentro'}; log(f'⚠ «{nombre}» no tiene ningún recorrido dentro.'); continue
        fn = f'drive__{base}.gpx'
        open(APP + 'gpx/raw/' + fn, 'w').write(b)
        reg[fid] = {'n': nombre, 'archivo': fn, 'fecha': datetime.date.today().isoformat()}
        nuevos += 1; log(f'🧵 Track nuevo en Drive: «{nombre}»')
    json.dump(reg, open(reg_f, 'w'), ensure_ascii=False, indent=1)
    if nuevos: CAMBIOS.append(f'drive: {nuevos} tracks nuevos')
    else: log('Drive: sin tracks nuevos.')

# ------------------------------------------------------------------ 3b. COLABORADORES (su My Maps y, si lo hay, su carpeta de Drive)
# app/colaboradores.json: [{"id","nombre" (vacío = el título de su mapa),"color","mapa_mid","drive_carpeta"}]  ->  app/colab/<id>.json
KNS = '{http://www.opengis.net/kml/2.2}'
def _kml_colab(k):
    r = ET.fromstring(k.encode('utf-8'))
    doc = r.find(KNS + 'Document')
    tit = (doc.findtext(KNS + 'name') if doc is not None else '') or ''
    pts, lin = [], []
    pms = []
    for f in r.iter(KNS + 'Folder'):
        fn = (f.findtext(KNS + 'name') or '').strip()
        pms += [(pm, fn) for pm in f.findall(KNS + 'Placemark')]
    if not pms: pms = [(pm, '') for pm in r.iter(KNS + 'Placemark')]
    for pm, fol in pms:
        n = re.sub(r'\s+', ' ', (pm.findtext(KNS + 'name') or '')).strip()
        dh = pm.findtext(KNS + 'description') or ''
        fotos = []
        for d in pm.iter(KNS + 'Data'):
            if d.get('name') == 'gx_media_links': fotos += (d.findtext(KNS + 'value') or '').split()
        fotos += re.findall(r'<img[^>]+src="([^"]+)"', dh)
        us = [u.rstrip('.,;)') for u in re.findall(r'https?://[^\s<>"]+', dh) if u not in fotos and 'googleusercontent' not in u]
        d = re.sub(r'<br\s*/?>|</p>|</div>', '\n', dh, flags=re.I)
        d = html.unescape(re.sub(r'<[^>]+>', ' ', d))
        for u in us: d = d.replace(u, '')
        d = re.sub(r'[•·]{3,}', '', d)
        d = '\n'.join(l for l in (re.sub(r'[ \t\xa0]+', ' ', x).strip() for x in d.split('\n')) if l)[:700]
        pt = pm.find('.//' + KNS + 'Point/' + KNS + 'coordinates')
        if pt is not None:
            c = pt.text.strip().split(',')
            mi = re.search(r'icon-(\d+)', pm.findtext(KNS + 'styleUrl') or '')
            pts.append([n, round(float(c[1]), 5), round(float(c[0]), 5), d, us[0] if us else '', fotos[0] if fotos else '', mi.group(1) if mi else '', fol])
            continue
        for ls in pm.iter(KNS + 'LineString'):
            cc = [s.split(',') for s in (ls.findtext(KNS + 'coordinates') or '').split()]
            ll = [[round(float(v[1]), 5), round(float(v[0]), 5)] for v in cc if len(v) >= 2]
            if len(ll) >= 2: lin.append([n, ll])
    return tit.strip(), pts, lin

def _gpx_linea(b):
    ll = [[round(float(a), 5), round(float(o), 5)] for a, o in re.findall(r'<(?:trkpt|rtept)[^>]*?lat="([-\d.]+)"[^>]*?lon="([-\d.]+)"', b)]
    ll += [[round(float(a), 5), round(float(o), 5)] for o, a in re.findall(r'<(?:trkpt|rtept)[^>]*?lon="([-\d.]+)"[^>]*?lat="([-\d.]+)"', b)]
    if len(ll) > 1500: ll = ll[::len(ll) // 1500 + 1]
    return ll

def alturas_colab(new, old):
    # altura de cada punto según el modelo del terreno (Open-Meteo), para ordenar sus cumbres por altura como las del grupo
    cache = {(q[1], q[2]): q[8] for q in old.get('p', []) if len(q) > 8 and q[8] is not None}
    pts = new.get('p', [])
    for q in pts:
        while len(q) < 9: q.append(None)
        if q[8] is None and (q[1], q[2]) in cache: q[8] = cache[(q[1], q[2])]
    falta = [q for q in pts if q[8] is None]
    for i in range(0, len(falta), 100):
        lote = falta[i:i + 100]
        try:
            j = json.loads(get('https://api.open-meteo.com/v1/elevation?latitude=' + ','.join(str(q[1]) for q in lote) + '&longitude=' + ','.join(str(q[2]) for q in lote)))
            for q, e in zip(lote, j.get('elevation', [])):
                if e is not None: q[8] = round(e)
        except Exception as e:
            log(f'⚠ No he podido sacar la altura de los puntos del colaborador: {e}'); break

def fotos_colab(cid, new):
    # las fotos de su My Maps se bajan, se reducen y se sirven desde la propia app (las de Google no se dejan ver desde fuera)
    import hashlib
    from PIL import Image
    d = APP + 'colab/fotos/'; os.makedirs(d, exist_ok=True)
    new.pop('ff', None)
    ok = nuevas = mal = 0; err = None
    for pt in new.get('p', []):
        u = pt[5]
        if not u: continue
        if u.startswith('colab/'): ok += 1; continue
        # el nombre sale del punto (nombre y sitio), no de la dirección de Google, que cambia cada vez que se lee el mapa
        fn = f'{cid}-{hashlib.md5(f"{pt[0]}|{pt[1]}|{pt[2]}".encode()).hexdigest()[:12]}.jpg'
        if not os.path.exists(d + fn):
            if (mal >= 8 and not nuevas): continue
            try:
                b = None
                for v in (u, u.replace('/*/', '/%2A/'), u + ('&' if '?' in u else '?') + 'fife=s1024'):
                    try: b = get(v, True, tries=2); Image.open(io.BytesIO(b)).verify(); break
                    except Exception as e: err = e; b = None
                if b is None: raise err
                im = Image.open(io.BytesIO(b)).convert('RGB'); im.thumbnail((800, 800), Image.LANCZOS)
                im.save(d + fn, 'JPEG', quality=72, optimize=True, progressive=True); nuevas += 1
            except Exception as e:
                mal += 1; err = e; continue
        pt[5] = 'colab/' + fn; ok += 1
    if nuevas or mal: log(f'📷 Fotos del colaborador {cid}: {nuevas} nuevas, {ok} en total' + (f', {mal} no se han podido bajar ({err})' if mal else ''))
    usadas = {pt[5][6:] for pt in new.get('p', []) if pt[5].startswith('colab/')}
    for f in os.listdir(d):
        if f.startswith(cid + '-') and f not in usadas: os.remove(d + f)

def quedar_colab(co, q):
    # nada de publicidad: capas enteras fuera, capas de las que solo se queda lo que case (p. ej. refugios) y nombres de negocios
    capa = (q[7] or '').upper()
    if capa in [x.upper() for x in co.get('quitar_capas', [])]: return False
    for c, salvo in co.get('quitar_capas_salvo', {}).items():
        if capa == c.upper() and not re.search(salvo, q[0], re.I): return False
    if co.get('quitar_nombres') and re.search(co['quitar_nombres'], q[0], re.I): return False
    return True

def blog_colab(co, new):
    # rutas del colaborador sin enlace a su blog: se busca su entrada en el índice (sitemap) del blog y se empareja por el nombre
    web = co.get('blog_web'); rs = new.get('r')
    if not web or not rs: return
    rs = new['r'] = json.loads(json.dumps(rs))   # copia: así se nota el cambio y se guarda
    urls = set()
    for sm in ('/wp-sitemap.xml', '/sitemap_index.xml', '/sitemap.xml', '/post-sitemap.xml'):
        try: x = get(web.rstrip('/') + sm)
        except Exception: continue
        locs = re.findall(r'<loc>\s*([^<\s]+)\s*</loc>', x)
        for u in locs:
            if re.search(r'sitemap.*\.xml', u):
                if re.search(r'(post|entrad|article)', u, re.I) or 'wp-sitemap-posts-post' in u:
                    try: urls |= set(re.findall(r'<loc>\s*([^<\s]+)\s*</loc>', get(u)))
                    except Exception: pass
            else: urls.add(u)
        if urls: break
    urls = {u for u in urls if not re.search(r'/(category|tag|categoria|etiqueta|page|author|wp-content)/|\.(jpg|png|webp)$', u)}
    if not urls: log(f'⚠ No he podido leer el índice del blog de {co.get("nombre") or co["id"]} ({web}).'); return
    STOP = {'de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'desde', 'por', 'a', 'al', 'en', 'con', 'circular', 'ruta', 'invernal', 'invierno', 'nieve', 'subida', 'o', 'u', 'the',
            'ascension', 'raquetada', 'raquetas', 'vuelta', 'ida', 'hasta', 'entre', 'sobre', 'camino'}
    def sin(t):
        t = unicodedata.normalize('NFD', t.lower()); t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
        return [w for w in re.sub(r'[^a-z0-9 ]+', ' ', t).split() if w not in STOP and len(w) > 1]
    try: open(os.path.join(os.path.dirname(os.path.abspath(__file__)), f'blog_{co["id"]}.txt'), 'w').write('\n'.join(sorted(urls)) + '\n')
    except Exception: pass
    slugs = [(u, set(sin(u.rstrip('/').rsplit('/', 1)[-1].replace('-', ' ')))) for u in urls]
    n = 0
    for r in rs:
        if r[7]: continue
        tt = re.sub(r'\(.*?\)', '', r[0].split('|')[-1]); t = set(sin(tt))
        dl = sin(re.split(r'\s+(?:desde|por)\s+', tt, maxsplit=1, flags=re.I)[0]); de = set(dl)
        if len(t) < 2 or not dl: continue
        sc = sorted(((2 * len(t & s) / (len(t) + len(s)), len(t & s), u, s) for u, s in slugs if s), key=lambda x: (x[0], x[1]), reverse=True)
        if not sc: continue
        f, ov, u, s = sc[0]
        # parecido de nombre, el destino principal (lo primero antes de «desde») en la entrada y sin empate
        if ov >= 2 and f >= 0.6 and (len(sc) < 2 or sc[1][0] < f) and dl[0] in s and len(de & s) >= math.ceil(.6 * len(de)):
            r[7] = u; n += 1
    con = sum(1 for r in rs if r[7])
    if n: log(f'📝 Blog de {co.get("nombre") or co["id"]}: {n} rutas emparejadas con su entrada ({con} de {len(rs)} con enlace al blog; índice con {len(urls)} entradas).')

def fotos_rutas(co, new):
    # rutas que solo traen track: la foto principal de su entrada del blog (og:image), reducida y servida desde la app;
    # las cumbres sacadas de esas rutas llevan la foto de su ruta
    import hashlib
    from PIL import Image
    rs = new.get('r')
    if not rs: return
    d = APP + 'colab/fotos/'; os.makedirs(d, exist_ok=True)
    nuevas = mal = 0
    for r in rs:
        while len(r) < 10: r.append('')
        if not r[7] or r[9]: continue
        fn = f'{co["id"]}r-{hashlib.md5(r[7].encode()).hexdigest()[:12]}.jpg'
        if not os.path.exists(d + fn):
            if mal >= 8 and not nuevas: continue
            try:
                h = get(r[7])
                m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', h) or re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', h) \
                    or re.search(r'<img[^>]+src=["\']([^"\']+wp-content/uploads[^"\']+\.(?:jpe?g|png|webp))', h, re.I)
                if not m: mal += 1; continue
                im = Image.open(io.BytesIO(get(html.unescape(m.group(1)), True))).convert('RGB'); im.thumbnail((800, 800), Image.LANCZOS)
                im.save(d + fn, 'JPEG', quality=72, optimize=True, progressive=True); nuevas += 1
            except Exception as e:
                mal += 1; continue
        r[9] = 'colab/' + fn
    for p in new.get('p', []):
        if len(p) > 9 and p[9] and not p[5]:
            f = next((rs[i][9] for i in p[9] if i < len(rs) and rs[i][9]), '')
            if f: p[5] = f
    if nuevas or mal: log(f'📷 Fotos de rutas de {co.get("nombre") or co["id"]} (de su blog): {nuevas} nuevas, {sum(1 for r in rs if r[9])} en total' + (f', {mal} sin foto' if mal else ''))

MESES_ES = {m: i + 1 for i, m in enumerate(['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'])}
MESES_ES.update({'setiembre': 9})
MESES_EN = {m: i + 1 for i, m in enumerate(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'])}

def _fecha_wikiloc(h):
    # «Fecha de realización» (o «Recorded») de la ruta en Wikiloc -> 'AAAA-MM'
    m = re.search(r'"(?:dateRecorded|recordedDate|recordDate|startDate)"\s*:\s*"?(\d{4})-(\d{2})', h)
    if m: return f'{m.group(1)}-{m.group(2)}'
    t = html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', h)))
    t = re.sub(r'\s+', ' ', t)
    for lab in (r'fecha de realizaci[oó]n', r'realizad[ao] (?:el|en)', r'recorded', r'date recorded'):
        for m in re.finditer(lab, t, re.I):
            z = t[m.end(): m.end() + 80].lower()
            n = re.search(r'(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})', z)
            if n and 1 <= int(n.group(2)) <= 12: return f'{n.group(3)}-{int(n.group(2)):02d}'
            n = re.search(r'(\d{4})-(\d{2})', z)
            if n: return f'{n.group(1)}-{n.group(2)}'
            n = re.search(r'([a-zñ]+)\.?\s+(?:de\s+)?(\d{4})', z)
            if n:
                mm = MESES_ES.get(n.group(1)) or MESES_EN.get(n.group(1)) or next((v for k, v in {**MESES_ES, **MESES_EN}.items() if len(n.group(1)) >= 3 and k.startswith(n.group(1))), None)
                if mm: return f'{n.group(2)}-{mm:02d}'
    return ''

def _fecha_blog(h):
    # fecha de publicación de la entrada del blog -> 'AAAA-MM'
    m = re.search(r'(?:article:published_time["\'][^>]*content=["\']|"datePublished"\s*:\s*")(\d{4})-(\d{2})', h) \
        or re.search(r'content=["\'](\d{4})-(\d{2})[^"\']*["\'][^>]*article:published_time', h) \
        or re.search(r'<time[^>]+datetime=["\'](\d{4})-(\d{2})', h)
    return f'{m.group(1)}-{m.group(2)}' if m else ''

def fechas_rutas(co, new):
    # fecha de cada ruta (las de los colaboradores no la traen): «Fecha de realización» de Wikiloc y, si no, la de su entrada del blog.
    # Se guarda en una caché por enlace (app/colab/fechas_<id>.json) y se pone cada noche en el campo 10 de cada ruta.
    rs = new.get('r')
    if not rs: return
    fc = APP + f'colab/fechas_{co["id"]}.json'
    cache = json.load(open(fc)) if os.path.exists(fc) else {}
    pedidas = nuevas = 0; mal = {'w': 0, 'b': 0}; ok = {'w': 0, 'b': 0}
    for r in rs:
        for src, u, fx in (('w', r[6], _fecha_wikiloc), ('b', r[7], _fecha_blog)):
            if not u or u in cache or pedidas >= 150: continue
            if mal[src] >= 8 and not ok[src]: continue      # esa web no nos deja: se reintenta otra noche
            pedidas += 1
            try:
                f = fx(get(u, tries=2)); cache[u] = f; ok[src] += 1; nuevas += bool(f)
            except Exception:
                mal[src] += 1
            time.sleep(0.7)
    if pedidas: json.dump(cache, open(fc, 'w'), ensure_ascii=False, indent=0, sort_keys=True)
    con = 0
    for r in rs:
        while len(r) < 11: r.append('')
        f = cache.get(r[6]) or cache.get(r[7]) or ''
        r[10] = f; con += bool(f)
    if pedidas: log(f'📅 Fechas de rutas de {co.get("nombre") or co["id"]}: {nuevas} nuevas ({con} de {len(rs)} con fecha)'
                    + (f'; Wikiloc no responde ({mal["w"]} fallos)' if mal['w'] and not ok['w'] else '') + (f'; su blog no responde ({mal["b"]} fallos)' if mal['b'] and not ok['b'] else '') + '.')

def enlazar_cumbres(co, new, lim=0.25):
    """9 nov 2026: cada cumbre del colaborador queda enlazada a TODAS sus rutas cuyo track pasa a menos de 250 m de ella,
    aunque él no las haya enlazado (p. ej. Monte Pindo: 3 rutas suben a su cima, A Moa, y solo 1 estaba enlazada)."""
    rs = new.get('r', []); ps = [p for p in new.get('p', []) if len(p) > 7 and (p[7] == 'CUMBRES' or (len(p) > 6 and p[6] == '1634'))]
    if not rs or not ps: return
    def dseg(p, a, b):   # distancia en km de p al tramo a-b (plano local)
        k = math.cos(math.radians(p[0])); ax, ay = (a[1] - p[1]) * 111.2 * k, (a[0] - p[0]) * 111.2; bx, by = (b[1] - p[1]) * 111.2 * k, (b[0] - p[0]) * 111.2
        dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy; t = 0 if L2 == 0 else max(0, min(1, -(ax * dx + ay * dy) / L2))
        return math.hypot(ax + t * dx, ay + t * dy)
    nuevos = 0
    for p in ps:
        while len(p) < 10: p.append(None)
        ya = set(p[9] or [])
        for i, r in enumerate(rs):
            if i in ya: continue
            t = r[8] if len(r) > 8 and isinstance(r[8], list) else []
            if len(t) < 2 or not isinstance(t[0], (list, tuple)): continue
            pp = (p[1], p[2])
            if min(abs(q[0] - pp[0]) for q in t) > 0.05: continue   # lejos: ni se mira
            if min(dseg(pp, t[j], t[j + 1]) for j in range(len(t) - 1)) <= lim: ya.add(i); nuevos += 1
        if ya: p[9] = sorted(ya)
    if nuevos: log(f'⛰ {co.get("nombre") or co["id"]}: {nuevos} enlaces nuevos entre cumbres y rutas que pasan por ellas (a menos de {int(lim*1000)} m).')

def cumbres_osm(co, new):
    """Cumbres sacadas de sus tracks: se buscan en OpenStreetMap (picos con el mismo nombre por donde pasa su track)
    y, si están, se ponen en el sitio exacto del pico. Si no, se quedan en el punto más alto del track.
    Lo encontrado se guarda en app/colab/osm_<id>.json, por si otra noche OpenStreetMap no responde."""
    ps = [p for p in new.get('p', []) if len(p) > 9 and p[9] and p[7] == 'CUMBRES']
    if not ps: return
    cf = APP + f'colab/osm_{co["id"]}.json'
    cache = json.load(open(cf)) if os.path.exists(cf) else {}
    GW = {'pico', 'picu', 'picos', 'pena', 'penha', 'pena', 'alto', 'monte', 'cerro', 'cueto', 'cuetu', 'teso', 'tesu', 'torre', 'el', 'la', 'los', 'las',
          'de', 'del', 'do', 'da', 'dos', 'das', 'o', 'a', 'os', 'as', 'y', 'e', 'l', 'pic', 'tuca', 'tuc', 'punta', 'mount', 'monte', 'cima', 'cabeza'}
    def tk(t):
        t = unicodedata.normalize('NFD', t.lower()); t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
        return frozenset(w for w in re.sub(r'[^a-z0-9 ]+', ' ', t).split() if w not in GW and not w.isdigit())
    def igual(a, b): return bool(a) and bool(b) and (a == b or a <= b or b <= a)
    def dist(a, b): return math.hypot((a[0] - b[0]) * 111.2, (a[1] - b[1]) * 111.2 * math.cos(math.radians(a[0])))
    rs = new.get('r', [])
    # una sola caja que abarca todas sus cumbres por zona (más ligero para Overpass que 96 círculos)
    import time
    osm, err = [], ''
    grupos = {}
    for p in ps: grupos.setdefault((round(p[1]), round(p[2])), []).append(p)
    hdr = {'User-Agent': 'LosDeLasClaras-Rutas/1.0 (losdelasclaras.github.io/rutas)', 'Content-Type': 'application/x-www-form-urlencoded'}
    for g in grupos.values():
        la0, la1 = min(p[1] for p in g) - .03, max(p[1] for p in g) + .03; lo0, lo1 = min(p[2] for p in g) - .04, max(p[2] for p in g) + .04
        q = f'[out:json][timeout:60];node({la0:.4f},{lo0:.4f},{la1:.4f},{lo1:.4f})[natural~"^(peak|volcano|hill)$"];out;'
        ok = False
        for srv in ('https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'):
            try:
                req = urllib.request.Request(srv, data=urllib.parse.urlencode({'data': q}).encode(), headers=hdr)
                with urllib.request.urlopen(req, timeout=90) as r: osm += json.loads(r.read().decode())['elements']; ok = True; break
            except Exception as e:
                m = f'{srv.split("/")[2]}: {e}'
                try: m += ' ' + e.read().decode()[:120].replace('\n', ' ')
                except Exception: pass
                err += ('; ' if err else '') + m; time.sleep(3)
        if not ok: osm = None; break
        time.sleep(1)
    if osm is None: log(f'⚠ OpenStreetMap no ha respondido ({err}): cumbres de {co.get("nombre") or co["id"]} con lo guardado de otras noches.')
    bien, fuera = 0, []
    for p in ps:
        k = p[0] + '|' + str(round(p[1], 2)) + '|' + str(round(p[2], 2))
        if osm is not None:
            t = tk(p[0]); trk = [q for i in p[9] if i < len(rs) for q in rs[i][8]]
            mejor = None
            for e in osm:
                g = e.get('tags', {}); ns = {g.get(x) for x in ('name', 'name:es', 'alt_name', 'name:ast', 'name:gl', 'loc_name', 'official_name') if g.get(x)}
                if not any(igual(t, tk(n)) for n in ns): continue
                d = min((dist((e['lat'], e['lon']), q) for q in trk), default=99)
                if d <= 0.5 and (mejor is None or d < mejor[0]): mejor = (d, round(e['lat'], 5), round(e['lon'], 5), g.get('name', ''))
            cache[k] = list(mejor[1:]) if mejor else None
        c = cache.get(k)
        if c: p[1], p[2] = c[0], c[1]; bien += 1
        else: fuera.append(p[0])
    try: json.dump(cache, open(cf, 'w'), ensure_ascii=False, indent=0)
    except Exception: pass
    try: open(os.path.join(os.path.dirname(os.path.abspath(__file__)), f'cumbres_{co["id"]}.txt'), 'w').write(
        f'# Cumbres de {co.get("nombre") or co["id"]} NO encontradas en OpenStreetMap (siguen en el punto más alto de su track): {len(fuera)} de {len(ps)}\n' + '\n'.join(sorted(fuera)) + '\n')
    except Exception: pass
    log(f'⛰ Cumbres de {co.get("nombre") or co["id"]}: {bien} de {len(ps)} colocadas en el pico de OpenStreetMap; {len(fuera)} siguen en el punto más alto de su track (lista en robot/cumbres_{co["id"]}.txt).')

def _es_mapa(im):
    # dibujo de un mapa (topográfico, con el track): casi sin zonas oscuras y con poco contraste de luces y sombras;
    # una foto de monte casi siempre tiene sombras, roca o bosque oscuro (probado con 52 mapas y 484 fotos de la app: acierta 46 y confunde 18)
    import statistics
    L = list(im.convert('L').resize((128, 128)).getdata())
    return sum(1 for v in L if v < 70) / len(L) < 0.01 and statistics.pstdev(L) < 35

def fotos_puntos_blog(co, new):
    # puntos sin foto que enlazan a una entrada de su blog: una foto de la entrada, reducida y servida desde la app.
    # Con «foto_sin_mapas»: la primera foto de la entrada que no sea el dibujo de un mapa (Camudando'l camín abre con el mapa de la ruta)
    import hashlib, time
    from PIL import Image
    d = APP + 'colab/fotos/'; os.makedirs(d, exist_ok=True)
    new['p'] = json.loads(json.dumps(new.get('p', [])))
    nuevas = mal = 0; sin = co.get('foto_sin_mapas')
    for p in new['p']:
        if p[5] or not p[4] or not re.search(r'blogspot\.|/20\d\d/', p[4]): continue
        fn = f'{co["id"]}p{"f" + str(co.get("foto_desde") or "") if sin else ""}-{hashlib.md5(p[4].encode()).hexdigest()[:12]}.jpg'
        if not os.path.exists(d + fn):
            if mal >= 8 and not nuevas: continue
            try:
                time.sleep(1.5)   # Blogger corta si se le piden muchas páginas seguidas
                h = get(p[4])
                m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', h) or re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', h)
                im = None
                if sin:
                    # solo las fotos de la entrada (no la cabecera del blog), en orden y sin repetir
                    vis = []
                    for t in re.findall(r'<img[^>]+>', h):
                        if 'headerimg' in t or 'Header1' in t: continue
                        u = re.search(r'src=["\']([^"\']+(?:blogger\.googleusercontent\.com|bp\.blogspot\.com)[^"\']+)', t)
                        if not u: continue
                        u = html.unescape(u.group(1)); k = re.sub(r'/[swh]\d+[^/]*/', '/', re.sub(r'=[swh]\d+[^/]*$', '', u))
                        if k not in [x[0] for x in vis]: vis.append((k, u))
                    desde = (co.get('foto_desde') or 1) - 1   # Camudando'l camín: 1.ª el mapa, 2.ª la vista de Google Earth; las fotos, desde la 3.ª
                    for k, u in (vis[desde:desde + 8] or vis[:8]):
                        big = re.sub(r'/s\d+(-[a-z0-9-]+)?/', '/s1000/', re.sub(r'=s\d+(-[a-z0-9-]+)?$', '=s1000', u))
                        try: x = Image.open(io.BytesIO(get(big, True))).convert('RGB')
                        except Exception: continue
                        if x.width < 300 or x.height < 200 or _es_mapa(x): continue
                        im = x; break
                if im is None:
                    if not m: mal += 1; continue
                    im = Image.open(io.BytesIO(get(html.unescape(m.group(1)), True))).convert('RGB')
                im.thumbnail((800, 800), Image.LANCZOS)
                im.save(d + fn, 'JPEG', quality=72, optimize=True, progressive=True); nuevas += 1
            except Exception:
                mal += 1; continue
        p[5] = 'colab/' + fn
    if nuevas or mal: log(f'📷 Fotos de {co.get("nombre") or co["id"]} (de su blog): {nuevas} nuevas' + (f', {mal} sin foto' if mal else ''))

def titulos_blog(co, new):
    # 9 nov 2026: título de las entradas del blog que enlazan sus puntos sin ruta con track (p. ej. Camudando'l camín):
    # en la app salen como rutas con su nombre. Se guardan en una caché (app/colab/titulos_<id>.json) y van en new['bt'] = {enlace: título}.
    import time
    us = sorted({p[4] for p in new.get('p', []) if p[4] and re.match(r'https?://', p[4]) and not (len(p) > 9 and p[9]) and not re.search(r'instagram\.com', p[4])})
    if not us: new.pop('bt', None); return
    cf = APP + f'colab/titulos_{co["id"]}.json'
    T = json.load(open(cf)) if os.path.exists(cf) else {}
    falta = [u for u in us if u not in T]
    web = re.match(r'https?://[^/]+', falta[0]).group(0) if falta else ''
    if falta and 'blogspot.' in web:
        # Blogger: el índice de entradas (título y enlace) de 150 en 150
        try:
            for ini in range(1, 3001, 150):
                j = json.loads(get(f'{web}/feeds/posts/summary?alt=json&max-results=150&start-index={ini}'))
                es = j.get('feed', {}).get('entry', [])
                for e in es:
                    li = next((l['href'] for l in e.get('link', []) if l.get('rel') == 'alternate'), None)
                    if li: T[li.replace('http://', 'https://')] = html.unescape(e.get('title', {}).get('$t', '')).strip()
                if len(es) < 150: break
        except Exception as e:
            log(f'⚠ Títulos del blog de {co.get("nombre") or co["id"]}: {e}')
    mal = 0
    for u in [u for u in us if not T.get(u)][:40]:   # el resto, entrada a entrada (poco a poco: Blogger corta si se le piden muchas)
        try:
            time.sleep(1.5); h = get(u)
            m = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)', h) or re.search(r'<title>([^<]+)</title>', h)
            if m: T[u] = html.unescape(m.group(1)).split(' | ')[0].strip()
        except Exception: mal += 1
    json.dump(T, open(cf, 'w'), ensure_ascii=False, indent=0)
    new['bt'] = {u: T[u] for u in us if T.get(u)}
    n = len(new['bt'])
    if n < len(us): log(f'📝 Títulos de entradas de {co.get("nombre") or co["id"]}: {n} de {len(us)}' + (f' ({mal} no han respondido)' if mal else ''))

def colaboradores():
    cf = APP + 'colaboradores.json'
    if not os.path.exists(cf): return
    os.makedirs(APP + 'colab', exist_ok=True)
    for co in json.load(open(cf)):
        if co.get('activo') is False: continue   # apartado (no sale en la app): no se lee su mapa
        fo = APP + f'colab/{co["id"]}.json'
        old = json.load(open(fo)) if os.path.exists(fo) else {}
        new = dict(old)
        if co.get('mapa_mid'):
            try:
                tit, pts, lin = _kml_colab(get(f'https://www.google.com/maps/d/kml?mid={co["mapa_mid"]}&forcekml=1'))
                if len([q for q in pts if quedar_colab(co, q)]) < 0.9 * len(old.get('p', [])):
                    log(f'⚠ El mapa del colaborador «{old.get("t", co["id"])}» ha devuelto solo {len(pts)} puntos (había {len(old["p"])}): no lo toco.')
                else:
                    # capas de su My Maps que no queremos en la app (p. ej. publicidad de empresas)
                    n0 = len(pts); pts = [q for q in pts if quedar_colab(co, q)]
                    if n0 != len(pts): log(f'   (quitados {n0 - len(pts)} puntos de publicidad: capas o nombres que no queremos)')
                    new.update(t=tit, p=pts, l=[] if co.get('sin_lineas') else lin)   # sin_lineas: p. ej. líneas de límites, no rutas
            except Exception as e:
                log(f'⚠ No he podido leer el mapa del colaborador {co["id"]}: {e}')
        if co.get('mapas_rutas'):
            # colaborador con sus rutas (tracks) en varios My Maps: uno por zona con el track entero y, al final, «Todas las rutas (simplificado)»
            try:
                sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
                import importar_kml as IK, xml.etree.ElementTree as ET
                mids = co['mapas_rutas']; raices = []
                for m in mids: raices.append(ET.fromstring(get(f'https://www.google.com/maps/d/kml?mid={m}&forcekml=1').encode('utf-8')))
                rutas, cps = IK.construir(raices)
                simpl = len(raices) - 1 if co.get('mapa_todas_al_final', True) and len(raices) > 1 else -1
                ob = {r[0]: r for r in old.get('r', [])}
                for r, o in zip(rutas, IK.construir.origen):   # solo en el simplificado: se conserva el track entero que ya teníamos
                    if o == simpl and r[0] in ob and len(ob[r[0]][8]) > len(r[8]): r[8] = ob[r[0]][8]
                if len(rutas) < 0.9 * len(old.get('r', [])):
                    log(f'⚠ Los mapas de {co.get("nombre") or co["id"]} han devuelto solo {len(rutas)} rutas (había {len(old["r"])}): no lo toco.')
                else:
                    # rutas fijas que no están en sus mapas de zona (robot/extra_<id>.json, p. ej. Anboto)
                    xf = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'extra_{co["id"]}.json')
                    if os.path.exists(xf):
                        ya = {r[0] for r in rutas}
                        for r in json.load(open(xf)).get('r', []):
                            if r[0] not in ya: rutas.append(r)
                    new.update(t=co.get('nombre') or old.get('t') or co['id'], p=cps, r=rutas, l=[])
                    enlazar_cumbres(co, new)
                    cumbres_osm(co, new)
            except Exception as e:
                log(f'⚠ No he podido leer los mapas de rutas del colaborador {co["id"]}: {e} (se queda como estaba)')
        if co.get('wp_rutas'):
            # colaborador con web en WordPress (complemento CM Maps Routes Manager): rutas nuevas de su web, con su GPX
            try:
                sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
                import wp_rutas as WP
                res = WP.leer(co, old, get, log)
                if res:
                    rutas, cps, salt = res
                    new.update(t=co.get('nombre') or co['id'], p=cps, r=rutas, l=[], x=salt)
                    enlazar_cumbres(co, new)
                    cumbres_osm(co, new)
            except Exception as e:
                log(f'⚠ No he podido leer la web del colaborador {co["id"]}: {e} (se queda como estaba)')
        if co.get('drive_carpeta'):
            try:
                h = get(f'https://drive.google.com/embeddedfolderview?id={co["drive_carpeta"]}')
                ent = re.findall(r'id="entry-([\w-]+)".*?class="flip-entry-title">(.*?)</div>', h, re.S)
                prev = {x[0]: x for x in old.get('d', [])}
                dd = []
                for fid, nombre in ent:
                    nombre = html.unescape(nombre).strip()
                    if not re.search(r'\.(gpx|kml)$', nombre, re.I): continue
                    if fid in prev: dd.append(prev[fid]); continue
                    b = get(f'https://drive.google.com/uc?export=download&id={fid}', True).decode('utf-8', 'replace')
                    if nombre.lower().endswith('.kml'): b = kml2gpx(b, nombre[:-4]) or ''
                    ll = _gpx_linea(b)
                    if len(ll) >= 2: dd.append([fid, re.sub(r'\.(gpx|kml)$', '', nombre, flags=re.I), ll])
                if ent or 'flip-list' in h or 'flip-entries' in h: new['d'] = dd
                else: log(f'⚠ No he podido leer la carpeta de Drive del colaborador {co["id"]} (¿compartida con «Cualquier persona con el enlace»?).')
            except Exception as e:
                log(f'⚠ Drive del colaborador {co["id"]}: {e}')
        fotos_colab(co['id'], new)
        blog_colab(co, new)
        if new.get('r'): new['r'] = json.loads(json.dumps(new['r'])); new['p'] = json.loads(json.dumps(new.get('p', [])))
        fotos_rutas(co, new)
        if co.get('fotos_blog'): fotos_puntos_blog(co, new)
        try: titulos_blog(co, new)
        except Exception as e: log(f'⚠ Títulos del blog de {co["id"]}: {e}')
        if not co.get('wp_rutas'): fechas_rutas(co, new)   # las de WordPress ya traen su «Fecha de realización»
        nom = co.get('nombre') or new.get('t') or co['id']
        if new != old:
            json.dump(new, open(fo, 'w'), ensure_ascii=False, separators=(',', ':'))
            log(f'🤝 Colaborador «{nom}»: {len(new.get("p", []))} puntos, {len(new.get("l", [])) + len(new.get("d", []))} tracks.')
            CAMBIOS.append(f'colaborador {nom}')
        else:
            log(f'Colaborador «{nom}»: sin cambios.')

# ------------------------------------------------------------------ 4. REGENERAR
def regenerar():
    def run(*a, cwd=APP):
        r = subprocess.run([sys.executable, *a], cwd=cwd, capture_output=True, text=True)
        if r.returncode: raise RuntimeError(f'{a[0]} falló:\n{r.stdout[-2000:]}\n{r.stderr[-3000:]}')
        return r.stdout
    old = {r['u']: r for r in json.load(open(APP + 'final_data.json'))['routes'] if r.get('u')}
    run('build.py'); run('assemble.py')
    out = run('gpx/proc.py')
    run('assemble.py')
    run('/home/claude/pwa/build_pwa.py', cwd='/home/claude/pwa')
    D = json.load(open(APP + 'final_data.json'))['routes']
    for r in D:
        if r.get('u') and r['u'] not in old:
            log(f'✅ Ruta nueva en la app: «{r.get("ti") or r.get("t")}»' + (' · con track' if r.get('gx') else ' · sin track todavía') + ('' if r.get('f') is not None else ' · sin foto'))
        elif r.get('u') and r.get('gx') and not old[r['u']].get('gx'):
            log(f'🧵 Track añadido a «{r.get("ti") or r.get("t")}» ({r["gx"]["km"]} km, +{r["gx"]["up"]} m)')
    for l in out.splitlines():
        if l.startswith('SIN EMPAREJAR drive__'): log('⚠ ' + l.replace('SIN EMPAREJAR', 'Track de Drive sin ruta:'))
    log(f'App regenerada: {len(D)} rutas, {sum(1 for r in D if r.get("gx"))} con track.')

if __name__ == '__main__':
    hoy = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).strftime('%d/%m/%Y %H:%M')
    err = None
    for paso in (blog, mapa, drive, colaboradores):
        try: paso()
        except Exception as e:
            log(f'⚠ Error en {paso.__name__}: {e}'); err = e
    fz = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'forzar')
    if os.path.exists(fz):   # robot/forzar: regenerar la app aunque no haya nada nuevo (tras cambiar los programas)
        os.remove(fz); CAMBIOS.append('regeneración forzada')
    if CAMBIOS:
        try: regenerar()
        except Exception as e:
            log(f'❌ Error al regenerar la app (no se publica nada): {e}'); err = e; CAMBIOS.clear()
    os.makedirs('/home/claude/robot', exist_ok=True)
    open(os.path.join(os.path.dirname(__file__), 'informe.md'), 'w').write(f'# Informe del robot · {hoy}\n\n' + ('**Cambios:** ' + '; '.join(CAMBIOS) if CAMBIOS else 'Sin cambios.') + '\n\n' + '\n'.join('- ' + l for l in INF) + '\n')
    open('/home/claude/robot/hay-cambios', 'w').write('1' if CAMBIOS else '0')
