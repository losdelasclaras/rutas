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
import json, os, re, sys, io, html, math, hashlib, subprocess, datetime, time, unicodedata, urllib.request, urllib.parse, xml.etree.ElementTree as ET

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
    # 10 nov 2026: formato nuevo del cuadro de datos: «📏 12,4 km Circular» (la etiqueta es el tipo de ruta, no «Distancia»)
    # y «⚡ Alta Terreno expuesto…» (la dificultad va junto al rayo, sin la palabra «Dificultad»)
    if 'km' not in o:
        for v, l in pares:
            m = re.fullmatch(r'\s*(\d+(?:[.,]\d+)?)\s*km\s*', v, re.I)
            if m: o['km'] = m.group(1).replace('.', ','); break
    if 'km' not in o:
        m = re.search(r'📏\s*(\d+(?:[.,]\d+)?)\s*km', T)
        if m: o['km'] = m.group(1).replace('.', ',')
    if 'dif' not in o:
        m = re.search(r'⚡\uFE0F?\s*(muy\s+alta|media[- ]alta|media[- ]baja|muy\s+f[aá]cil|alta|media|baja|f[aá]cil|dif[ií]cil|moderada|exigente)\b', T, re.I)
        if m: o['dif'] = m.group(1)[0].upper() + m.group(1)[1:].lower()
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
        # 10 nov 2026: si a una entrada le falta distancia o dificultad, se apunta en el informe qué etiquetas trae su cuadro
        # de datos (para enseñar al robot a leerlas) y, si ya estaba en la lista sin esos datos, se completan cuando aparezcan
        if (not F.get('km') or not F.get('dif')) and F.get('des'):
            T = txt(c); i = T.lower().find('desnivel')
            log(f'🔎 «{(e.findtext("a:title", "", ns) or "").strip()}»: sin {"distancia" if not F.get("km") else ""}{" ni " if not F.get("km") and not F.get("dif") else ""}{"dificultad" if not F.get("dif") else ""}. Texto del cuadro: «{T[max(0, i - 250):i + 350]}»')
        if k in idx:
            q = B[idx[k]]
            # 10 nov 2026: si su foto no llegó a publicarse (p. ej. se cortó aquella pasada), se vuelve a bajar
            if F.get('img') and not os.path.exists(APP + f'fotos/{idx[k]}.jpg') and foto(F['img'], idx[k]):
                log(f'📷 «{q.get("t")}»: foto recuperada'); CAMBIOS.append('foto recuperada')
            for a in ('km', 'dif'):
                if F.get(a) and not q.get(a): q[a] = F[a]; log(f'✏️ «{q.get("t")}»: completado {a} = {F[a]}')
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

FB_KEY = 'AIzaSyBzYlxsZhJVPJpCk0_EgxaplD7zWMOOg1I'   # clave pública de Firebase de la app (la misma que lleva la web)

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

# ------------------------------------------------------------------ 2a. FOTOS PROPIAS de los puntos de tu My Maps
def fotos_mapa():
    """11 nov 2026: si un punto de tu My Maps tiene una foto puesta (editar el punto › cámara), su ficha (cumbre o lugar)
    sale con esa foto en vez de la de la entrada del blog. Se bajan cada noche (Google cambia la dirección de la foto en cada
    lectura, así que se compara la propia foto), se reducen a 800 px y se publican en la app (fp/). Si una no se puede bajar,
    se queda la que ya había. Quitas la foto del punto -> vuelve la de la entrada del blog."""
    import hashlib
    from PIL import Image
    d = APP + 'fotos_mapa/'; os.makedirs(d, exist_ok=True)
    rf = APP + 'fotos_mapa.json'
    reg = json.load(open(rf)) if os.path.exists(rf) else {}   # «nombre|lat|lon» -> [archivo, huella de la foto original]
    pts = json.load(open(APP + 'points.json'))
    nuevo = {}; nuevas = cambiadas = mal = 0; err = None
    for p in pts:
        u = p.get('fo')
        if not u: continue
        k = f"{p['n']}|{round(p['lat'], 5)}|{round(p['lon'], 5)}"
        b = None
        for v in (u, u.replace('/*/', '/%2A/'), u + ('&' if '?' in u else '?') + 'fife=s1024'):
            try: b = get(v, True, tries=2); Image.open(io.BytesIO(b)).verify(); break
            except Exception as e: err = e; b = None
        if b is None:
            mal += 1
            if k in reg and os.path.exists(d + reg[k][0]): nuevo[k] = reg[k]
            continue
        h = hashlib.md5(b).hexdigest()
        if k in reg and reg[k][1] == h and os.path.exists(d + reg[k][0]): nuevo[k] = reg[k]; continue
        im = Image.open(io.BytesIO(b)).convert('RGB'); im.thumbnail((800, 800), Image.LANCZOS)
        fn = f'g-{h[:12]}.jpg'
        im.save(d + fn, 'JPEG', quality=72, optimize=True, progressive=True)
        if k in reg: cambiadas += 1; log(f'📷 Foto cambiada en tu mapa: «{p["n"]}»')
        else: nuevas += 1; log(f'📷 Foto nueva en tu mapa: «{p["n"]}»')
        nuevo[k] = [fn, h]
    quitadas = [k for k in reg if k not in nuevo]
    for k in quitadas: log(f'🗑 Foto quitada de tu mapa: «{k.split("|")[0]}» (vuelve la de la entrada del blog)')
    usadas = {v[0] for v in nuevo.values()}
    for f in os.listdir(d):
        if f not in usadas: os.remove(d + f)
    json.dump(nuevo, open(rf, 'w'), ensure_ascii=False, indent=0)
    if mal: log(f'⚠ {mal} fotos de tu mapa no se han podido bajar ({err}); se quedan las de antes')
    if nuevas or cambiadas or quitadas: CAMBIOS.append(f'fotos del mapa: {nuevas} nuevas, {cambiadas} cambiadas, {len(quitadas)} quitadas')
    elif nuevo: log(f'Fotos de tu mapa: {len(nuevo)}, sin cambios.')

# ------------------------------------------------------------------ 2b. TRACKS enlazados desde My Maps con un enlace de la app
def enlaces_app():
    """10 nov 2026: si en la descripción de un punto de tu My Maps, además del enlace a la entrada del blog, pones el enlace
    de un track compartido desde la app (…/rutas/#c=XXXX), el robot baja ese track de la nube (con sus alturas y sus puntos)
    y lo deja como track de esa entrada (gpx/raw/enlace__XXXX.gpx; manda sobre el de Drive). Si quitas el enlace, se quita."""
    pf = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'probar_enlace')   # prueba puntual: ¿se lee la nube sin cuenta?
    if os.path.exists(pf):
        c = open(pf).read().strip(); os.remove(pf)
        try:
            j = json.loads(get(f'https://firestore.googleapis.com/v1/projects/losdelasclaras-rutas/databases/(default)/documents/enlaces/{c}?key={FB_KEY}'))
            f = j.get('fields', {}); log(f'🧪 Enlace #c={c}: se lee bien sin cuenta · «{f.get("n", {}).get("stringValue")}» · {len(json.loads(f["d"]["stringValue"]))} puntos de recorrido · {"con" if "w" in f else "sin"} puntos marcados')
        except Exception as e: log(f'🧪 Enlace #c={c}: NO se puede leer sin cuenta ({e})')
    if not os.path.exists(APP + 'mapa.kml'): return
    k = open(APP + 'mapa.kml').read()
    pares = {}
    for pm in re.findall(r'<Placemark>(.*?)</Placemark>', k, re.S):
        d = html.unescape(pm)
        cs = re.findall(r'/rutas/?(?:index\.html)?#c=([A-Za-z0-9]{4,20})', d)
        bl = re.findall(r'https?://losdelasclaras\.blogspot\.com/\d{4}/\d{2}/[^\s"<>\']+?\.html', d)
        if cs and bl: pares[cs[0]] = bl[0].replace('http://', 'https://')
    reg_f = APP + 'gpx/enlaces.json'
    reg = json.load(open(reg_f)) if os.path.exists(reg_f) else {}
    for fn in [f for f in reg if f[len('enlace__'):-4] not in pares]:   # enlaces quitados de My Maps
        if os.path.exists(APP + 'gpx/raw/' + fn): os.remove(APP + 'gpx/raw/' + fn)
        log(f'🗑 Track por enlace quitado de My Maps: {fn}'); del reg[fn]; CAMBIOS.append('enlace de track quitado')
    nuevos = 0
    for c, u in pares.items():
        fn = f'enlace__{c}.gpx'
        if fn in reg and os.path.exists(APP + 'gpx/raw/' + fn):
            if reg[fn] != u: reg[fn] = u; CAMBIOS.append('enlace de track movido')
            continue
        try:
            j = json.loads(get(f'https://firestore.googleapis.com/v1/projects/losdelasclaras-rutas/databases/(default)/documents/enlaces/{c}?key={FB_KEY}'))
            f = j.get('fields', {}); pts = json.loads(f['d']['stringValue']); ws = json.loads(f['w']['stringValue']) if 'w' in f else []
            n = f.get('n', {}).get('stringValue', c)
        except Exception as e:
            log(f'⚠ No he podido leer el track del enlace #c={c} (para {u.split("/")[-1]}): {e}'); continue
        if len(pts) < 2: log(f'⚠ El enlace #c={c} no tiene recorrido.'); continue
        g = ('<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Los de las Claras (enlace de la app)">\n' +
             ''.join(f'<wpt lat="{w[1]}" lon="{w[2]}">' + (f'<ele>{w[3]}</ele>' if len(w) > 3 and w[3] is not None else '') + f'<name>{html.escape(str(w[0]))}</name></wpt>\n' for w in ws) +
             f'<trk><name>{html.escape(n)}</name><trkseg>\n' + '\n'.join(f'<trkpt lat="{p[0]}" lon="{p[1]}">' + (f'<ele>{p[2]}</ele>' if len(p) > 2 and p[2] is not None else '') + '</trkpt>' for p in pts) + '\n</trkseg></trk></gpx>\n')
        open(APP + 'gpx/raw/' + fn, 'w').write(g); reg[fn] = u; nuevos += 1
        log(f'🔗 Track por enlace de la app: «{n}» ({len(pts)} puntos de recorrido, {len(ws)} puntos marcados) → {u.split("/")[-1]}')
    json.dump(reg, open(reg_f, 'w'), ensure_ascii=False, indent=1)
    if nuevos: CAMBIOS.append(f'enlaces: {nuevos} tracks nuevos')

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

def _geojson_colab(co, g):
    """23 nov 2026: puntos de un GeoJSON (Al filo de lo improbable) al formato de _kml_colab:
    [nombre, lat, lon, descripción, enlace, foto, icono, capa]. La capa sale del tipo: Cima -> «Montaña» (cumbre),
    Ruta -> «Senderismo», Ferrata -> «Vías ferratas». Zonas fuera: «fuera_cajas» = [[lat0, lat1, lon0, lon1], …].
    Devuelve también {enlace: título} («Cimas desde Lugar») y {enlace: año}."""
    def campo(p, *ks):
        for k in ks:
            for kk in p:
                if kk.lower() == k.lower() and p[kk] not in (None, ''): return p[kk]
        return ''
    cajas = co.get('fuera_cajas', [])
    CAPA = {'cima': 'Montaña', 'ruta': 'Senderismo', 'ferrata': 'Vías ferratas'}
    pts, ti, fy = [], {}, {}
    for f in g.get('features', []):
        geo = f.get('geometry') or {}
        if geo.get('type') != 'Point': continue
        lon, lat = [float(x) for x in geo['coordinates'][:2]]
        if any(a <= lat <= b and c <= lon <= d for a, b, c, d in cajas): continue
        p = f.get('properties') or {}
        st = str(campo(p, 'style')).strip().lower()
        nom = re.sub(r'\s+', ' ', str(campo(p, 'Nombre') or campo(p, 'Cimas') or campo(p, 'Lugar'))).strip()
        if not nom: continue
        lug, cim, u = str(campo(p, 'Lugar')).strip(), str(campo(p, 'Cimas')).strip(), str(campo(p, 'Enlace')).strip()
        an = str(campo(p, 'Año', 'Ano', 'Anio')).strip()
        d = '\n'.join(x for x in [f'Salida: {lug}' if lug else '', f'Cimas de la ruta: {cim}' if cim and cim != nom else '',
                                  'Vía ferrata' if st == 'ferrata' else '', f'Año: {an}' if an else ''] if x)
        pts.append([nom, round(lat, 5), round(lon, 5), d, u, str(campo(p, 'Imagen')).strip(), '', CAPA.get(st, 'Montaña')])
        if u:
            if re.fullmatch(r'(19|20)\d\d', an): fy[u] = an
            if u not in ti: ti[u] = (cim or nom) + (f' desde {lug}' if lug and st != 'ferrata' else '')
    return pts, ti, fy

def tracks_geojson(co, new):
    """23 nov 2026: Al filo de lo improbable sube sus GPX a su carpeta de Drive, con el nombre de la entrada del blog
    (…/mendiak-udalatx/ -> mendiak-udalatx.gpx). Cada uno se pega a SU ruta (la de esa entrada): track, km y desnivel.
    Vale también el título de la ruta. Los que no casan se quedan en su capa de Tracks y se avisa en el informe.
    La clave de la ruta (r[12] = su entrada) no cambia, así las correcciones a mano siguen valiendo."""
    def sl(x):
        x = unicodedata.normalize('NFD', str(x)); x = ''.join(ch for ch in x if unicodedata.category(ch) != 'Mn').lower()
        return re.sub(r'[^a-z0-9]+', '-', x).strip('-')
    rs = new.get('r') or []
    por = {}
    for i, r in enumerate(rs):
        while len(r) < 13: r.append('')
        if not r[12]: r[12] = r[7] or r[0]
        u = re.sub(r'\.html?$', '', (r[7] or '').split('?')[0].split('#')[0].rstrip('/'))
        for k in (sl(u.rsplit('/', 1)[-1]) if u else '', sl(r[0])):
            if k: por.setdefault(k, i)
    puestos, sin = 0, []
    for x in new.get('d', []):
        fid, nom, ll = x[0], x[1], x[2]
        i = por.get(sl(nom))
        if i is None or len(ll) < 2: sin.append(nom); continue
        r = rs[i]; g = _gx_de(_sin_saltos(ll))
        r[8] = [q[:3] for q in g['ln']]; r[3] = f"{g['km']:.1f}".replace('.', ',') + ' km'; r[4] = f"{g['up']} m" if g['up'] else ''
        r[11] = 'drive:' + fid; puestos += 1
    if puestos or sin:
        log(f'🧵 Tracks de {co.get("nombre") or co["id"]}: {puestos} puestos en su ruta' + (f'; sin ruta (¿nombre del archivo?): {", ".join(sin[:10])}' if sin else ''))

def _gpx_linea(b):
    ll = [[round(float(a), 5), round(float(o), 5)] for a, o in re.findall(r'<(?:trkpt|rtept)[^>]*?lat="([-\d.]+)"[^>]*?lon="([-\d.]+)"', b)]
    ll += [[round(float(a), 5), round(float(o), 5)] for o, a in re.findall(r'<(?:trkpt|rtept)[^>]*?lon="([-\d.]+)"[^>]*?lat="([-\d.]+)"', b)]
    if len(ll) > 1500: ll = ll[::len(ll) // 1500 + 1]
    return ll

def _gpx_linea3(b):
    # 16 nov 2026: como _gpx_linea, pero con la altura (si el GPX la trae): [lat, lon, ele]
    ll = []
    for m in re.finditer(r'<(?:trkpt|rtept)\b([^>]*?)(?:/>|>(.*?)</(?:trkpt|rtept)>)', b, re.S):
        a = m.group(1); la = re.search(r'lat\s*=\s*["\']([-\d.]+)', a); lo = re.search(r'lon\s*=\s*["\']([-\d.]+)', a)
        if not (la and lo): continue
        e = re.search(r'<ele>\s*([-\d.]+)\s*</ele>', m.group(2) or '')
        ll.append([round(float(la.group(1)), 5), round(float(lo.group(1)), 5)] + ([round(float(e.group(1)))] if e else []))
    if len(ll) > 1500: ll = ll[::len(ll) // 1500 + 1]
    return ll

def _sin_saltos(ll, lim=0.8):
    """16 nov 2026: quita puntos sueltos de un track que saltan lejos (>800 m del anterior y del siguiente, o al principio/final),
    p. ej. un punto que grabó el GPS en otro sitio al acabar: en la app salía como una línea recta larga."""
    def d(a, b): return math.dist((a[0], a[1] * math.cos(math.radians(a[0]))), (b[0], b[1] * math.cos(math.radians(b[0])))) * 111.2
    for _ in range(5):
        if len(ll) < 3: break
        out = []
        for i, p in enumerate(ll):
            a = d(ll[i - 1], p) > lim if i > 0 else None
            b = d(p, ll[i + 1]) > lim if i < len(ll) - 1 else None
            if (a is None and b) or (b is None and a) or (a and b): continue
            out.append(p)
        if len(out) == len(ll): break
        ll = out
    return ll

def rutas_drive(co, new):
    """16 nov 2026: colaborador sin mapas de rutas (p. ej. Camudando'l camín): cada track de su carpeta de Drive pasa a ser
    una RUTA suya (como las de Rutinas Varias): sale en Explorar › Rutas y como 🆕 NUEVA, con Seguir, GPX y perfil, y queda
    enlazada a sus cumbres. Si el nombre del archivo es la dirección de una entrada de su blog (vale cortada por Blogger),
    la ruta lleva el título, la fecha, la foto y el enlace de esa entrada; si no, el nombre del archivo."""
    dd = new.get('d') or []
    if not dd: new.pop('r', None); return
    cf = APP + f'colab/titulos_{co["id"]}.json'
    T = json.load(open(cf)) if os.path.exists(cf) else {}
    T.update(new.get('bt') or {})
    urls = set(T) | {p[4] for p in new.get('p', []) if len(p) > 4 and p[4] and re.match(r'https?://', p[4])}
    def sl(x): x = unicodedata.normalize('NFD', x); x = ''.join(ch for ch in x if unicodedata.category(ch) != 'Mn').lower(); return re.sub(r'[^a-z0-9]+', '-', x).strip('-')
    def us(u): return sl(re.sub(r'\.html?$', '', u.split('?')[0].split('#')[0].rstrip('/').split('/')[-1]))
    # 18 nov 2026: se comparan sin guiones («L.lena» = «llena» como lo deja Blogger) y, si no sale, por parecido (≥ 0,8 y claro
    # ganador) con la dirección o con el título de la entrada. Si alguno no se encuentra, se vuelve a leer el índice entero del blog
    # (las entradas nuevas o que no enlaza ninguna cumbre no estaban en la caché).
    import difflib
    def cp(s): return s.replace('-', '')
    def busca(nom, fz=True):
        fs = cp(sl(nom))
        if len(fs) < 6: return ''
        # 1.º igual; 2.º la dirección es el principio del nombre (Blogger corta), la más larga; 3.º el nombre es el principio de la dirección, la más corta
        cand = [v for v in urls if us(v) and cp(us(v)) == fs]
        if cand: return cand[0]
        cand = [v for v in urls if us(v) and len(cp(us(v))) >= 14 and fs.startswith(cp(us(v)))]
        if cand: return max(cand, key=lambda v: len(us(v)))
        cand = [v for v in urls if us(v) and len(fs) >= 14 and cp(us(v)).startswith(fs)]
        if cand: return min(cand, key=lambda v: len(us(v)))
        if not fz: return ''
        sc = sorted(((max(difflib.SequenceMatcher(None, fs[:len(cp(us(v))) + 3], cp(us(v))).ratio(),
                          difflib.SequenceMatcher(None, fs, cp(sl(re.sub(r'^[^:]{3,40}:\s*', '', T.get(v) or '')))).ratio() if T.get(v) else 0), v) for v in urls if us(v)), reverse=True)
        if sc and sc[0][0] >= 0.85 and (len(sc) < 2 or sc[0][0] - sc[1][0] >= 0.08): return sc[0][1]
        return ''
    if co.get('blog_web') and 'blogspot.' in co['blog_web'] and any(not busca(x[1], False) for x in dd):
        try:
            n0 = len(T)
            ini = 1   # 18 nov: Blogger da menos de 150 por página aunque haya más: se sigue hasta que no venga ninguna
            while ini < 3001:
                j = json.loads(get(f"{co['blog_web'].rstrip('/')}/feeds/posts/summary?alt=json&max-results=150&start-index={ini}"))
                es = j.get('feed', {}).get('entry', [])
                if not es: break
                ini += len(es)
                for e in es:
                    li = next((l['href'] for l in e.get('link', []) if l.get('rel') == 'alternate'), None)
                    if li: T[li.replace('http://', 'https://')] = html.unescape(e.get('title', {}).get('$t', '')).strip()
            json.dump(T, open(cf, 'w'), ensure_ascii=False, indent=0); urls |= set(T)
            if len(T) > n0: log(f'📝 Índice del blog de {co.get("nombre") or co["id"]}: {len(T) - n0} entradas nuevas')
        except Exception as e: log(f'⚠ Índice del blog de {co.get("nombre") or co["id"]}: {e}')
    rs = []; sin = []
    for x in dd:
        fid, nom = x[0], x[1]; ll = x[2] = _sin_saltos(x[2])
        u = busca(nom)
        if not u: sin.append(nom)
        if u and not T.get(u):   # 18 nov: entrada encontrada pero sin título en la caché → se lee de la propia entrada
            try:
                h = get(u); m = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)', h) or re.search(r'<title>([^<]+)</title>', h)
                if m: T[u] = html.unescape(m.group(1)).split(' | ')[0].strip(); json.dump(T, open(cf, 'w'), ensure_ascii=False, indent=0)
            except Exception: pass
        ti = T.get(u) or re.sub(r'[-_]+', ' ', nom).strip().capitalize()
        km = sum(math.dist((a[0], a[1] * math.cos(math.radians(a[0]))), (b[0], b[1] * math.cos(math.radians(b[0])))) * 111.2 for a, b in zip(ll, ll[1:]))
        up = 0; E = [q[2] for q in ll if len(q) > 2]
        if len(E) >= 0.8 * len(ll) and len(E) > 1:
            sm = [sum(E[max(0, i - 2):i + 3]) / len(E[max(0, i - 2):i + 3]) for i in range(len(E))]; ref = sm[0]
            for e in sm:
                if e - ref >= 4: up += e - ref; ref = e
                elif ref - e >= 4: ref = e
        fo = next((p[5] for p in new.get('p', []) if len(p) > 5 and u and p[4] == u and p[5]), '')
        fe = re.search(r'/(20\d\d)/(\d\d)/', u); fe = f'{fe.group(1)}-{fe.group(2)}' if fe else ''
        tr = ll[::len(ll) // 600 + 1] if len(ll) > 600 else ll
        if tr[-1] != ll[-1]: tr = tr + [ll[-1]]
        rs.append([ti, co.get('zona', ''), '', f'{km:.1f}'.replace('.', ',') + ' km', f'{round(up / 10) * 10} m' if up else '', '', '', u, tr, fo, fe, 'drive:' + fid])
    new['r'] = rs
    if sin: log(f'🔗 Tracks de Drive de {co.get("nombre") or co["id"]} sin entrada de blog ({len(sin)}): ' + ' · '.join(sin[:30]))

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
    # 22 nov 2026: puntos sin enlace a su blog fuera (no aportan nada); si les pone enlace en su My Maps, aparecen solos (Caleyando con Cienfuegos)
    if co.get('solo_con_enlace') and not (q[4] or '').strip(): return False
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
                if re.search(r'(post|entrad|article)', u, re.I) or 'wp-sitemap-posts-post' in u or re.search(r'sitemap\.xml\?page=\d', u):   # 18 nov: Blogger (sitemap.xml?page=1, 2…)
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
    # 23 nov 2026: si sus cimas ya traen foto (Al filo de lo improbable: la portada de la entrada), esa misma para la ruta
    for p in new.get('p', []):
        if len(p) > 9 and p[9] and str(p[5]).startswith('colab/'):
            for i in p[9]:
                if i < len(rs):
                    while len(rs[i]) < 10: rs[i].append('')
                    if not rs[i][9]: rs[i][9] = p[5]
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
        if not f and len(r) > 11 and str(r[11]).startswith('drive:'): f = r[10]   # 16 nov: las de Drive traen la fecha de la dirección de su entrada
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

def cumbres_mapa(co, new, old):
    """15 nov 2026: cumbres de un colaborador sacadas de su propio My Maps de cumbres («mapa_cumbres», p. ej. «RV · Cumbres (IGN)» de Rutinas Varias),
    en vez de sacarlas de los títulos de sus rutas. Nombre y sitio de su mapa; altitud si la pone en el nombre o en la descripción.
    Devuelve True si las ha puesto (entonces no se recolocan con OpenStreetMap). Si falla o llegan <90 % de las de la última vez, False (se quedan las de los títulos)."""
    try:
        _, pts, _ = _kml_colab(get(f'https://www.google.com/maps/d/kml?mid={co["mapa_cumbres"]}&forcekml=1'))
    except Exception as e:
        log(f'⚠ No he podido leer el mapa de cumbres de {co.get("nombre") or co["id"]}: {e} (salen las de sus rutas)'); return False
    pts = [q for q in pts if quedar_colab(co, q)]
    cs, vistos = [], set()
    for n, la, lo, d, u, _f, _ic, _fol in pts:
        n = re.sub(r'\s+', ' ', n).strip()
        alt = ''
        m = re.search(r'[\s(,·-]+(\d{3,4}(?:[.,]\d)?)\s*(?:m\b|msnm|m\.)?\s*\)?\s*$', n, re.I)   # «Peña Ubiña (2417 m)», «Peña Ubiña 2417»
        if m and 300 <= float(m.group(1).replace(',', '.')) <= 4900:
            alt = str(round(float(m.group(1).replace(',', '.')))); n = n[:m.start()].strip(' -·,(')
        if not alt:
            m = re.search(r'(?:altitud|altura|cota|alt\.?)\D{0,12}(\d[\d.]{2,5})', d or '', re.I)
            if m:
                v = int(re.sub(r'\D', '', m.group(1)))
                if 300 <= v <= 4900: alt = str(v)
        if not n: continue
        n = n[:1].upper() + n[1:] if n.isupper() is False else n.title()
        k = (n.lower(), round(la, 3), round(lo, 3))
        if k in vistos: continue
        vistos.add(k)
        cs.append([n, la, lo, f'Altitud: {int(alt):,} m'.replace(',', '.') if alt else '', u or '', '', '1634', 'CUMBRES', None, []])
    antes = old.get('cm') or 0
    if not cs or len(cs) < 0.9 * antes:
        log(f'⚠ El mapa de cumbres de {co.get("nombre") or co["id"]} ha devuelto {len(cs)} cumbres (la última vez {antes}): salen las de sus rutas.'); return False
    new['p'] = cs; new['cm'] = len(cs)
    log(f'⛰ {co.get("nombre") or co["id"]}: {len(cs)} cumbres de su mapa de cumbres ({sum(1 for c in cs if c[3])} con altitud).')
    return True

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
            ini = 1   # 18 nov: Blogger da menos de 150 por página aunque haya más: se sigue hasta que no venga ninguna
            while ini < 3001:
                j = json.loads(get(f'{web}/feeds/posts/summary?alt=json&max-results=150&start-index={ini}'))
                es = j.get('feed', {}).get('entry', [])
                if not es: break
                ini += len(es)
                for e in es:
                    li = next((l['href'] for l in e.get('link', []) if l.get('rel') == 'alternate'), None)
                    if li: T[li.replace('http://', 'https://')] = html.unescape(e.get('title', {}).get('$t', '')).strip()
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

def _enlace_blogger(u):
    # http://www.blog.blogspot.com.es/2016/07/x.html -> https://blog.blogspot.com/2016/07/x.html (Blogger ya no sirve bien las de país)
    if not isinstance(u, str): return u
    return re.sub(r'^\s*https?://(?:www\.)?([\w-]+)\.blogspot\.[a-z]{2,3}(?:\.[a-z]{2})?/', r'https://\1.blogspot.com/', u)

def _clave_blog(u):
    # la misma entrada con http/https y .com/.com.es: una sola clave
    u = re.sub(r'^https?://', '', (u or '').strip()).split('?')[0].split('#')[0]
    return re.sub(r'\.blogspot\.[a-z.]+/', '.blogspot.com/', u)

def _datos_entrada(h):
    """22 nov 2026: bloque «DATOS DE LA RUTA» de una entrada (Caleyando con Cienfuegos):
    Distancia: 20,5 Km · Desnivel acumulado positivo (o positivo acumulado): 1.600 m · Tiempos: 9 y 1/2 horas · Dificultad: Moderada. <nota>
    Devuelve {km, de, tm, dif} con lo que haya ({} si no tiene bloque). Su dificultad tal cual (solo la palabra, sin la nota): no se calcula."""
    t = _txt(h)
    m = re.search(r'DATOS\s+DE\s+LA\s+RUTA', t, re.I)
    if not m: return {}
    t = t[m.end():m.end() + 2500]
    def campo(et):
        x = re.search(r'(?im)^\W*(?:' + et + r')\s*:\s*(.*)$', t)
        if not x: return ''
        v = x.group(1).strip()
        if not v:   # el valor en la línea siguiente
            sig = t[x.end():].lstrip('\n').split('\n', 1)[0].strip()
            v = '' if re.match(r'^\W*[\wáéíóúñ ]{2,30}:', sig) else sig
        return v
    D = {}
    v = campo(r'distancia')
    x = re.search(r'(\d+(?:[.,]\d+)?)\s*km', v, re.I)
    if x: D['km'] = x.group(1).replace('.', ',') + ' km'
    for et in (r'desnivel\s+(?:acumulado\s+positivo|positivo\s+acumulado|positivo|de\s+subida)', r'desnivel\s+acumulado', r'desnivel'):
        x = re.search(r'(\d[\d.]*)\s*m\b', campo(et))
        if x: D['de'] = x.group(1) + ' m'; break
    v = re.sub(r'\s*\(.*?\)', '', campo(r'tiempos?|duraci[oó]n|horario')).strip(' .,;')
    if v and re.search(r'\d', v) and len(v) <= 40: D['tm'] = v
    v = campo(r'dificultad')
    v = re.split(r'[.,;:(]|\s+-\s+|\s+por\s+', v, 1)[0].strip()
    if v and len(v) <= 30:
        v = v[:1].upper() + v[1:].lower()
        v = re.sub(r'\bdificil\b', 'difícil', re.sub(r'^Dificil', 'Difícil', v)); v = re.sub(r'^Facil', 'Fácil', v)
        D['dif'] = v
    return D

def datos_blog(co, new):
    """22 nov 2026: colaborador con los datos de cada ruta en su entrada del blog y no en su My Maps (Caleyando con Cienfuegos):
    se leen de la entrada que enlaza cada punto y se añaden a la descripción del punto («Distancia: …», «Desnivel: …», «Duración: …», «Dificultad: …»),
    que la app ya sabe leer (ficha, lista de Rutas y filtro de dificultad). Caché en app/colab/datos_<id>.json: solo se leen las entradas nuevas.
    Los puntos que enlazan a una etiqueta (/search/label/…) no tienen bloque: se quedan sin datos."""
    import time
    ps = [p for p in new.get('p', []) if len(p) > 4 and re.search(r'blogspot\.[a-z.]+/20\d\d/\d\d/', p[4] or '')]
    if not ps: return
    cf = APP + f'colab/datos_{co["id"]}.json'
    C = json.load(open(cf)) if os.path.exists(cf) else {}
    falta = {_clave_blog(p[4]) for p in ps} - set(C)
    leidas = 0
    if falta and co.get('blog_web') and 'blogspot.' in co['blog_web']:
        # Blogger: el índice con el texto entero de las entradas, de 150 en 150 (pocas peticiones para todas)
        try:
            ini = 1
            while ini < 3001 and falta:
                j = json.loads(get(f"{co['blog_web'].rstrip('/')}/feeds/posts/default?alt=json&max-results=150&start-index={ini}"))
                es = j.get('feed', {}).get('entry', [])
                if not es: break
                ini += len(es)
                for e in es:
                    li = next((l['href'] for l in e.get('link', []) if l.get('rel') == 'alternate'), None)
                    k = _clave_blog(li)
                    if li and k in falta:
                        C[k] = _datos_entrada(e.get('content', {}).get('$t', '')); falta.discard(k); leidas += 1
        except Exception as e:
            log(f'⚠ Índice del blog de {co.get("nombre") or co["id"]} (datos de las rutas): {e}')
    mal = 0
    for k in sorted(falta)[:40]:   # las que no estén en el índice, entrada a entrada (poco a poco: Blogger corta)
        try:
            time.sleep(1.5); C[k] = _datos_entrada(get('https://' + k)); leidas += 1
        except Exception: mal += 1
    if leidas: json.dump(C, open(cf, 'w'), ensure_ascii=False, indent=0)
    n = 0
    for p in ps:
        D = C.get(_clave_blog(p[4])) or {}
        if not D: continue
        d = p[3] or ''
        ya = lambda et: re.search(r'(?im)^\W*(?:' + et + r')\s*:', d)
        add = [f'{l}: {D[k]}' for k, l, et in (('km', 'Distancia', 'distancia'), ('de', 'Desnivel', 'desnivel'), ('tm', 'Duración', 'duraci[oó]n|tiempo'), ('dif', 'Dificultad', 'dificultad'))
               if D.get(k) and not ya(et)]
        if add: p[3] = (d.rstrip() + '\n' if d.strip() else '') + '\n'.join(add); n += 1
    con = sum(1 for p in ps if C.get(_clave_blog(p[4])))
    log(f'📊 Datos de las rutas de {co.get("nombre") or co["id"]}: {con} de {len(ps)} puntos con datos de su entrada'
        + (f' ({leidas} entradas leídas hoy)' if leidas else '') + (f', {mal} no han respondido' if mal else ''))

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
                # 22 nov 2026: se compara con los puntos de antes que siguen valiendo (si se quitan capas a propósito, no se atasca)
                if len([q for q in pts if quedar_colab(co, q)]) < 0.9 * len([q for q in old.get('p', []) if quedar_colab(co, q)]):
                    log(f'⚠ El mapa del colaborador «{old.get("t", co["id"])}» ha devuelto solo {len(pts)} puntos (había {len(old["p"])}): no lo toco.')
                else:
                    # capas de su My Maps que no queremos en la app (p. ej. publicidad de empresas)
                    n0 = len(pts); pts = [q for q in pts if quedar_colab(co, q)]
                    if n0 != len(pts): log(f'   (quitados {n0 - len(pts)} puntos de publicidad: capas o nombres que no queremos)')
                    # 22 nov 2026: enlaces de Blogger con la dirección vieja (http://…blogspot.com.es/, www.) no cargan en el móvil: a https://…blogspot.com/
                    pts = [list(q[:4]) + [_enlace_blogger(q[4])] + list(q[5:]) for q in pts]
                    if co.get('quitar_numero'):   # 16 nov 2026: «1- La Torre Cerredu» -> «La Torre Cerredu» (Camudando'l camín, Montes Cimeros)
                        pts = [[re.sub(r'^\s*\d+\s*[-–.)ºª]\s*', '', q[0]) or q[0]] + list(q[1:]) for q in pts]
                    new.update(t=tit, p=pts, l=[] if co.get('sin_lineas') else lin)   # sin_lineas: p. ej. líneas de límites, no rutas
            except Exception as e:
                log(f'⚠ No he podido leer el mapa del colaborador {co["id"]}: {e}')
        if co.get('geojson_drive'):
            # 23 nov 2026: colaborador con sus puntos en un archivo GeoJSON de su Drive (Al filo de lo improbable, Alex):
            # un punto por cima (style Cima: en la cima; Ruta y Ferrata: en el inicio), con Lugar, Cimas, Enlace, Imagen y Año.
            try:
                g = json.loads(get(f'https://drive.google.com/uc?export=download&id={co["geojson_drive"]}'))
                pts, ti, fy = _geojson_colab(co, g)
                if len(pts) < 0.9 * len(old.get('p', [])):
                    log(f'⚠ El archivo del colaborador «{co.get("nombre") or co["id"]}» ha devuelto solo {len(pts)} puntos (había {len(old["p"])}): no lo toco.')
                else:
                    n0 = len(pts); pts = [q for q in pts if quedar_colab(co, q)]
                    if n0 != len(pts): log(f'   (quitados {n0 - len(pts)} puntos que no queremos)')
                    # 23 nov 2026: cada entrada de su blog es una RUTA suya (sin track: solo la salida), con sus cimas enlazadas.
                    # Así sale en la pestaña Rutas y se puede corregir a mano (entrada, track, dificultad…) como las de los demás.
                    # [nombre, zona, actividad, km, desnivel, dificultad, wikiloc, blog, track, foto, fecha]
                    rutas, idx = [], {}
                    for q in pts:
                        while len(q) < 10: q.append(None)
                        u = q[4]
                        if not u: continue
                        if u not in idx:
                            idx[u] = len(rutas)
                            lug = re.search(r'^Salida: (.+)$', q[3], re.M)
                            rutas.append([ti.get(u) or q[0], lug.group(1) if lug else '', 'Vía ferrata' if q[7] == 'Vías ferratas' else '',
                                          '', '', '', '', u, [[q[1], q[2]]], '', fy.get(u, '')])
                        q[9] = [idx[u]]
                    new.update(t=co.get('nombre') or co['id'], p=pts, l=[], fy=fy, r=rutas)
                    # título de cada entrada (para la pestaña Rutas): «Cimas desde Lugar»; si luego se lee el título real del blog, manda ese
                    cf = APP + f'colab/titulos_{co["id"]}.json'
                    T = json.load(open(cf)) if os.path.exists(cf) else {}
                    for u, t in ti.items(): T.setdefault(u, t)
                    json.dump(T, open(cf, 'w'), ensure_ascii=False, indent=0)
            except Exception as e:
                log(f'⚠ No he podido leer el archivo GeoJSON del colaborador {co["id"]}: {e} (se queda como estaba)')
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
                    de_mapa = bool(co.get('mapa_cumbres')) and cumbres_mapa(co, new, old)   # 15 nov 2026: sus cumbres de su mapa de cumbres
                    enlazar_cumbres(co, new, 0.3 if de_mapa else 0.25)
                    if not de_mapa: cumbres_osm(co, new)
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
                # 24 nov 2026: los GPX también pueden ir en una subcarpeta «Tracks» (lo pidió Alex, Al filo de lo improbable)
                for sid, snom in list(ent):
                    if re.fullmatch(r'\s*tracks?\s*', html.unescape(snom), re.I):
                        try: ent += re.findall(r'id="entry-([\w-]+)".*?class="flip-entry-title">(.*?)</div>', get(f'https://drive.google.com/embeddedfolderview?id={sid}'), re.S)
                        except Exception as e: log(f'⚠ No he podido leer la carpeta «Tracks» del colaborador {co["id"]}: {e}')
                prev = {x[0]: x for x in old.get('d', [])}
                dd = []
                for fid, nombre in ent:
                    nombre = html.unescape(nombre).strip()
                    if not re.search(r'\.(gpx|kml)$', nombre, re.I): continue
                    nom = re.sub(r'\.(gpx|kml)$', '', nombre, flags=re.I)
                    if fid in prev and len(prev[fid]) > 3: dd.append([fid, nom] + prev[fid][2:]); continue   # 16 nov: [id, nombre, línea con altura, 1]
                    try:
                        b = get(f'https://drive.google.com/uc?export=download&id={fid}', True).decode('utf-8', 'replace')
                    except Exception:
                        if fid in prev: dd.append(prev[fid])
                        continue
                    if nombre.lower().endswith('.kml'): b = kml2gpx(b, nombre[:-4]) or ''
                    ll = _gpx_linea3(b)
                    if len(ll) >= 2: dd.append([fid, nom, ll, 1])
                if ent or 'flip-list' in h or 'flip-entries' in h: new['d'] = dd
                else: log(f'⚠ No he podido leer la carpeta de Drive del colaborador {co["id"]} (¿compartida con «Cualquier persona con el enlace»?).')
            except Exception as e:
                log(f'⚠ Drive del colaborador {co["id"]}: {e}')
        if co.get('geojson_drive') and co.get('drive_carpeta'):
            try: tracks_geojson(co, new)
            except Exception as e: log(f'⚠ Tracks de Drive de {co["id"]}: {e}')
        if co.get('drive_carpeta') and not co.get('mapas_rutas') and not co.get('wp_rutas') and not co.get('geojson_drive'):
            try:
                rutas_drive(co, new)
                for p in new.get('p', []):   # los enlaces cumbre → ruta se rehacen cada noche (el orden de Drive puede cambiar)
                    if len(p) > 9: p[9] = None
                enlazar_cumbres(co, new, 0.3)
            except Exception as e: log(f'⚠ Rutas de Drive de {co["id"]}: {e}')
        try: aplicar_correcciones(co, new)   # 18 nov: antes de las fotos, para que la de una entrada corregida se baje ya
        except Exception as e: log(f'⚠ Correcciones de {co["id"]}: {e}')
        try: correcciones_entradas(co, new, 1)   # 23 nov: entradas sin track con otra entrada del blog (antes de los títulos y fotos)
        except Exception as e: log(f'⚠ Correcciones de entradas de {co["id"]}: {e}')
        fotos_colab(co['id'], new)
        blog_colab(co, new)
        if new.get('r'): new['r'] = json.loads(json.dumps(new['r'])); new['p'] = json.loads(json.dumps(new.get('p', [])))
        fotos_rutas(co, new)
        if co.get('fotos_blog'): fotos_puntos_blog(co, new)
        try: titulos_blog(co, new)
        except Exception as e: log(f'⚠ Títulos del blog de {co["id"]}: {e}')
        if co.get('datos_blog'):
            try: datos_blog(co, new)
            except Exception as e: log(f'⚠ Datos de las rutas del blog de {co["id"]}: {e}')
        if not co.get('wp_rutas') and not co.get('geojson_drive'): fechas_rutas(co, new)   # las del GeoJSON traen su año   # las de WordPress ya traen su «Fecha de realización»
        # 17 nov 2026: sin el nombre del blog delante («Camudando'l camín: Vega Urriellu…» -> «Vega Urriellu…»), en títulos de entradas y de rutas
        _pre = lambda s: re.sub(r"^\s*" + re.escape(co.get('nombre') or '\x00') + r"\s*[:|·–-]\s*", '', s, flags=re.I) if isinstance(s, str) else s
        if co.get('nombre'):
            if new.get('bt'): new['bt'] = {u: (_pre(x) or x) for u, x in new['bt'].items()}
            for r in new.get('r') or []: r[0] = _pre(r[0]) or r[0]
        try: aplicar_correcciones(co, new, calla=True)   # y otra vez al final: lo corregido a mano manda sobre todo lo demás
        except Exception as e: log(f'⚠ Correcciones de {co["id"]}: {e}')
        try: correcciones_entradas(co, new, 2)
        except Exception as e: log(f'⚠ Correcciones de entradas de {co["id"]}: {e}')
        nom = co.get('nombre') or new.get('t') or co['id']
        if new != old:
            json.dump(new, open(fo, 'w'), ensure_ascii=False, separators=(',', ':'))
            log(f'🤝 Colaborador «{nom}»: {len(new.get("p", []))} puntos, {len(new.get("l", [])) + len(new.get("d", []))} tracks.')
            CAMBIOS.append(f'colaborador {nom}')
        else:
            log(f'Colaborador «{nom}»: sin cambios.')


# ------------------------------------------------------------------ 3c. CORRECCIONES A MANO (18 nov 2026)
# Desde la app, «✏️ Corregir esta ruta» (administradores, y cada colaborador en las suyas) guarda en Firestore › correcciones:
#   {k: 'g|<entrada>' (grupo) o '<colaborador>|<id estable de la ruta>', co, u (entrada del blog), sb (no tiene entrada), n (nombre),
#    f (fecha AAAA-MM), wk (Wikiloc; '-' = quitar), tr ('sin' = sin track; o el track subido, JSON [[lat,lon,ele],…]), oc (ocultar)}
# El robot las lee cada noche y MANDAN sobre lo que saca él solo. -> app/correcciones.json (+ app/correcciones_gx.json: tracks del grupo)
FS_PROY = 'losdelasclaras-rutas'
CORR = {}
def _fs_val(v):
    if 'stringValue' in v: return v['stringValue']
    if 'booleanValue' in v: return v['booleanValue']
    if 'integerValue' in v: return int(v['integerValue'])
    if 'doubleValue' in v: return v['doubleValue']
    if 'nullValue' in v: return None
    return None
def _gx_de(ll, nombre=''):
    # como gpx/proc.py: km, subida, bajada, máx/mín, salida, perfil (100 tramos) y línea
    def dm(a, b): return math.dist((a[0], a[1] * math.cos(math.radians(a[0]))), (b[0], b[1] * math.cos(math.radians(b[0])))) * 111200
    cum = [0]
    for a, b in zip(ll, ll[1:]): cum.append(cum[-1] + dm(a, b))
    E = [q[2] if len(q) > 2 else None for q in ll]; has = sum(e is not None for e in E) >= 0.8 * len(E) and len(E) > 1
    up = dn = 0; prof = []
    if has:
        last = next(e for e in E if e is not None)
        for i in range(len(E)):
            if E[i] is None: E[i] = last
            else: last = E[i]
        sm = [sum(E[max(0, i - 2):i + 3]) / len(E[max(0, i - 2):i + 3]) for i in range(len(E))]; ref = sm[0]
        for e in sm:
            if e - ref >= 4: up += e - ref; ref = e
            elif ref - e >= 4: dn += ref - e; ref = e
        for k in range(101):
            tg = cum[-1] * k / 100; i = min(range(len(cum)), key=lambda j: abs(cum[j] - tg)); prof.append([round(cum[i] / 1000, 2), round(E[i])])
    ln = ll[::len(ll) // 1200 + 1] if len(ll) > 1200 else ll
    if ln[-1] != ll[-1]: ln = ln + [ll[-1]]
    return {'km': round(cum[-1] / 1000, 1), 'up': round(up / 10) * 10, 'dn': round(dn / 10) * 10, 'mx': round(max(E)) if has else None, 'mn': round(min(E)) if has else None,
            'st': [round(ll[0][0], 5), round(ll[0][1], 5)], 'pf': prof, 'ln': [[round(q[0], 5), round(q[1], 5)] + ([round(q[2])] if len(q) > 2 and q[2] is not None else []) for q in ln], 'nm': nombre}
def correcciones():
    global CORR
    cf = APP + 'correcciones.json'
    if os.path.exists(cf): CORR = json.load(open(cf))   # si Firestore no responde, valen las de la última vez (nunca se pierden)
    docs, tok = [], ''
    for _ in range(20):
        j = json.loads(get(f'https://firestore.googleapis.com/v1/projects/{FS_PROY}/databases/(default)/documents/correcciones?pageSize=300' + (f'&pageToken={tok}' if tok else '')))
        docs += j.get('documents', []); tok = j.get('nextPageToken')
        if not tok: break
    C = {}
    for d in docs:
        f = {k: _fs_val(v) for k, v in d.get('fields', {}).items()}
        if not f.get('k'): continue
        tr = f.get('tr')
        if tr and tr != 'sin':
            try: f['tr'] = [[float(q[0]), float(q[1])] + ([float(q[2])] if len(q) > 2 and q[2] is not None else []) for q in json.loads(tr)]
            except Exception: f.pop('tr', None)
        C[f['k']] = {k: v for k, v in f.items() if k in ('k', 'co', 'u', 'sb', 'n', 'f', 'di', 'wk', 'tr', 'oc', 't') and v not in (None, '')}
    # 24 nov 2026: cumbres destacadas (⭐) desde la ficha de la cumbre: k = "<co>|dest:<nombre normalizado>", co = "g" o el colaborador.
    # Van aparte (app/destacadas.json), como mucho 50 por blog (las primeras que se marcaron), y no son correcciones de rutas.
    DS = {k: v for k, v in C.items() if '|dest:' in k}
    for k in DS: C.pop(k)
    for v in C.values(): v.pop('t', None)   # la hora solo hace falta para el orden de las destacadas
    try:
        quedan = {}
        cuenta = {}
        for k in sorted(DS, key=lambda k: DS[k].get('t') or 0):
            co = DS[k].get('co') or k.split('|')[0]
            if cuenta.get(co, 0) >= 50: continue
            cuenta[co] = cuenta.get(co, 0) + 1
            quedan[k] = {'co': co, 'n': DS[k].get('n') or ''}
        df = APP + 'destacadas.json'
        oldd = json.load(open(df)) if os.path.exists(df) else {}
        if quedan != oldd:
            json.dump(quedan, open(df, 'w'), ensure_ascii=False, separators=(',', ':'))
            log(f'⭐ Cumbres destacadas: {len(quedan)} (' + ', '.join(f'{c}: {n}' for c, n in sorted(cuenta.items())) + ')')
            CAMBIOS.append('cumbres destacadas')
    except Exception as e:
        log(f'⚠️ Cumbres destacadas: {e}')
    old = dict(CORR)
    CORR = C
    if C != old:
        json.dump(C, open(cf, 'w'), ensure_ascii=False, separators=(',', ':'))
        gxf = {k[2:]: _gx_de(v['tr'], v.get('n') or '') for k, v in C.items() if k.startswith('g|') and isinstance(v.get('tr'), list) and len(v['tr']) > 1}
        json.dump(gxf, open(APP + 'correcciones_gx.json', 'w'), ensure_ascii=False, separators=(',', ':'))
        nv = [k for k in C if C[k] != old.get(k)]; qt = [k for k in old if k not in C]
        log(f'✏️ Correcciones a mano: {len(C)} en total' + (f' · {len(nv)} nuevas o cambiadas' if nv else '') + (f' · {len(qt)} quitadas' if qt else ''))
        if any(k.startswith('g|') for k in nv + qt): CAMBIOS.append('correcciones a mano')
    else:
        log(f'Correcciones a mano: {len(C)} (sin cambios).')

def _clave_ruta(r):
    # id estable de una ruta de colaborador (no cambia aunque se corrija): su track de Drive, su Wikiloc, su entrada o su nombre
    return str(r[11]) if len(r) > 11 and r[11] else (r[6] or r[7] or r[0])

def aplicar_correcciones(co, new, T=None, calla=False):
    rs = new.get('r') or []
    if not rs: return
    for r in rs:
        while len(r) < 13: r.append('')
        if not r[12]: r[12] = _clave_ruta(r)
    if not CORR: return
    fuera = set(); n = 0
    for i, r in enumerate(rs):
        c = CORR.get(f'{co["id"]}|{r[12]}')
        if not c: continue
        n += 1
        if c.get('oc'): fuera.add(i); continue
        if c.get('sb'): r[7] = ''
        elif c.get('u') and c['u'] != r[7]:
            r[7] = c['u']; r[9] = ''   # foto: la de la entrada nueva (fotos_rutas)
            fe = re.search(r'/(20\d\d)/(\d\d)/', c['u']); r[10] = f'{fe.group(1)}-{fe.group(2)}' if fe else r[10]
            tt = (T or {}).get(c['u']) or (new.get('bt') or {}).get(c['u'])
            if not tt:
                try:
                    h = get(c['u']); m = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)', h) or re.search(r'<title>([^<]+)</title>', h)
                    tt = html.unescape(m.group(1)).split(' | ')[0].strip() if m else ''
                except Exception: tt = ''
            if tt: r[0] = re.sub(r'^\s*' + re.escape(co.get('nombre') or '\x00') + r'\s*[:|·–-]\s*', '', tt, flags=re.I) or tt
        if c.get('n'): r[0] = c['n']
        if c.get('f'): r[10] = c['f']
        if c.get('di'): r[5] = {'baja': 'Baja', 'moderada': 'Moderada', 'alta': 'Alta', 'muy-alta': 'Muy alta'}.get(c['di'], c['di'])
        if c.get('wk'): r[6] = '' if c['wk'] == '-' else c['wk']
        if c.get('tr') == 'sin': r[8] = r[8][:1]   # se queda solo la salida (para el icono del mapa)
        elif isinstance(c.get('tr'), list) and len(c['tr']) > 1:
            g = _gx_de(c['tr']); r[8] = [q[:3] for q in g['ln']]
            r[3] = f"{g['km']:.1f}".replace('.', ',') + ' km'; r[4] = f"{g['up']} m" if g['up'] else r[4]
    if fuera: new['r'] = [r for i, r in enumerate(rs) if i not in fuera]
    if n and not calla: log(f'✏️ {co.get("nombre") or co["id"]}: {n} rutas con corrección a mano' + (f' ({len(fuera)} ocultas)' if fuera else ''))

def correcciones_entradas(co, new, fase):
    # 23 nov 2026: «Corregir esta ruta» en las entradas de blog sin track de un colaborador (las que salen de un punto de su My Maps
    # enlazado a su blog). Clave en Firestore: '<colaborador>|b:<entrada original>'.
    #   fase 1: otra entrada (u) -> se cambia el enlace en sus puntos;
    #   fase 2: new['bo'] = {entrada: {n nombre, f AAAA-MM, di dificultad, oc oculta (también «no tiene entrada»), o entrada original}} -> la app
    pre = f'{co["id"]}|b:'
    cs = {k[len(pre):]: v for k, v in CORR.items() if k.startswith(pre)}
    if fase == 1:
        for u0, c in cs.items():
            if c.get('u') and c['u'] != u0 and not c.get('sb'):
                for p in new.get('p', []):
                    if len(p) > 4 and p[4] == u0: p[4] = c['u']
        # 23 nov 2026 (2): entrada con un track subido al corregirla -> pasa a ser una RUTA suya con ese track (como Al filo de lo improbable),
        # con id estable 'b:<entrada original>' (la misma clave de la corrección). Se rehacen cada noche: primero se quitan las de la otra vez
        # (van siempre al final de la lista, así no se mueven los números de las demás rutas).
        rs = new.get('r') or []
        k0 = len(rs)
        while k0 and len(rs[k0 - 1]) > 11 and str(rs[k0 - 1][11]).startswith('b:'): k0 -= 1
        rs = rs[:k0]
        for p in new.get('p', []):
            if len(p) > 9 and p[9]: p[9] = [i for i in p[9] if i < k0] or None
        propias = bool(rs)
        DIF = {'baja': 'Baja', 'moderada': 'Moderada', 'alta': 'Alta', 'muy-alta': 'Muy alta'}
        for u0, c in cs.items():
            tr = c.get('tr')
            if c.get('oc') or c.get('sb') or not isinstance(tr, list) or len(tr) < 2: continue
            u = c.get('u') or u0
            pts = [p for p in new.get('p', []) if len(p) > 4 and p[4] == u]
            g = _gx_de(tr)
            fe = c.get('f') or ''
            if not fe:
                m = re.search(r'/(20\d\d)/(\d\d)/', u); fe = f'{m.group(1)}-{m.group(2)}' if m else str((new.get('fy') or {}).get(u) or '')
            nom = c.get('n') or (new.get('bt') or {}).get(u) or (pts[0][0] if pts else '') or u
            i = len(rs)
            rs.append([nom, '', '', f"{g['km']:.1f}".replace('.', ',') + ' km', f"{g['up']} m" if g['up'] else '', DIF.get(c.get('di'), ''), '', u,
                       [q[:3] for q in g['ln']], '', fe, 'b:' + u0])
            for p in pts:
                while len(p) < 10: p.append(None)
                p[9] = (p[9] or []) + [i]
        if len(rs) != len(new.get('r') or []) or rs: new['r'] = rs
        if not rs: new.pop('r', None)
        # sin rutas propias (Caleyando): que sus otras entradas sin track sigan saliendo en Rutas aunque ya tenga alguna ruta
        if rs and not propias: new['kb'] = 1
        else: new.pop('kb', None)
        return
    bo = {}
    for u0, c in cs.items():
        u = c['u'] if c.get('u') and not c.get('sb') else u0
        o = {}
        if c.get('oc') or c.get('sb'): o['oc'] = 1
        if isinstance(c.get('tr'), list) and len(c['tr']) > 1 and not o.get('oc'): continue   # ya es una ruta con track (fase 1)
        if c.get('n'): o['n'] = c['n']
        if c.get('f'): o['f'] = c['f']
        if c.get('di'): o['di'] = {'baja': 'Baja', 'moderada': 'Moderada', 'alta': 'Alta', 'muy-alta': 'Muy alta'}.get(c['di'], c['di'])
        if u != u0: o['o'] = u0
        if o: bo[u] = o
    if bo:
        new['bo'] = bo
        log(f'✏️ {co.get("nombre") or co["id"]}: {len(bo)} entradas sin track con corrección a mano')
    else: new.pop('bo', None)

# ------------------------------------------------------------------ 3c. SALIDAS DE LA WEB DE LOS CLUBES
# 21 nov 2026: algunos clubes (dados de alta en Salidas como los demás) no quieren hacer trabajo doble: el robot lee cada
# noche la sección de salidas de su web (RSS de WordPress o Blogger, en app/clubes_web.json) y las pone en la app.
# Se empareja con su club de Firestore por el nombre (si aún no está dado de alta y aprobado, no salen en la app).
MESES = {m: i + 1 for i, m in enumerate('enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split())}
def _txt(h):
    h = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', h); h = re.sub(r'(?i)<br\s*/?>|</p>|</li>|</h\d>|</div>', '\n', h)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', h)); t = re.sub(r'[ \t\xa0]+', ' ', t)
    return re.sub(r'\n\s*\n+', '\n', t).strip()
def _num(x): return float(x.replace('.', '').replace(',', '.')) if re.match(r'^\d{1,3}(\.\d{3})+$', x) else float(x.replace(',', '.'))
def _fecha_salida(ti, t, cuerpo, pub):
    """Día de la salida: fecha en el nombre de un PDF/adjunto (2026-11-15), o «15 de noviembre», o 15/11; entre 2 días antes
    de publicarla y 6 meses después (las salidas se anuncian antes)."""
    cands = []
    for m in re.finditer(r'(20\d\d)-(\d\d)-(\d\d)', cuerpo): cands.append((int(m.group(1)), int(m.group(2)), int(m.group(3))))
    for m in re.finditer(r'(\d{1,2})\s+de\s+(' + '|'.join(MESES) + r')(?:\s+(?:de\s+|del\s+)?(20\d\d))?', (ti + '\n' + t).lower()):
        cands.append((int(m.group(3)) if m.group(3) else 0, MESES[m.group(2)], int(m.group(1))))
    for m in re.finditer(r'\b(\d{1,2})/(\d{1,2})(?:/(20\d\d|\d\d))?\b', ti + '\n' + t):
        y = m.group(3); cands.append(((int(y) + (2000 if len(y) == 2 else 0)) if y else 0, int(m.group(2)), int(m.group(1))))
    for y, mo, d in cands:
        for yy in ([y] if y else [pub.year, pub.year + 1]):
            try: f = datetime.date(yy, mo, d)
            except ValueError: continue
            if pub - datetime.timedelta(days=2) <= f <= pub + datetime.timedelta(days=183): return f
    return None
def salidas_web():
    cf = APP + 'clubes_web.json'
    if not os.path.exists(cf): return
    conf = json.load(open(cf)); out_f = APP + 'salidas_web.json'
    old = json.load(open(out_f)) if os.path.exists(out_f) else []
    try:   # clubes aprobados (lectura pública de Firestore)
        q = {"structuredQuery": {"from": [{"collectionId": "clubes"}], "where": {"fieldFilter": {"field": {"fieldPath": "estado"}, "op": "EQUAL", "value": {"stringValue": "ok"}}}}}
        rq = urllib.request.Request(f'https://firestore.googleapis.com/v1/projects/{FS_PROY}/databases/(default)/documents:runQuery', data=json.dumps(q).encode(), headers={'Content-Type': 'application/json'})
        clubs = [{'id': r['document']['name'].split('/')[-1], **{k: _fs_val(v) for k, v in r['document'].get('fields', {}).items()}} for r in json.loads(urllib.request.urlopen(rq, timeout=30).read()) if r.get('document')]
    except Exception as e:
        log(f'⚠ Salidas de webs de clubes: no se pudo leer la lista de clubes ({e}); se dejan las de la última vez'); return
    hoy = datetime.date.today(); res = []
    def nk(x): x = unicodedata.normalize('NFD', x or ''); return ''.join(c for c in x if unicodedata.category(c) != 'Mn').lower()
    for c in conf:
        club = next((k for k in clubs if c.get('club') and k['id'] == c['club']), None) or next((k for k in clubs if nk(c.get('nombre')) and nk(c['nombre']) in nk(k.get('n'))), None)
        try: xml = get(c['feed']); xml = xml.decode('utf-8', 'replace') if isinstance(xml, bytes) else xml
        except Exception as e:
            log(f'⚠ Salidas de {c.get("nombre")}: su web no responde ({e}); se dejan las de la última vez'); res += [x for x in old if x.get('feed') == c['feed']]; continue
        n_ok, sin_f, fuera, res_c = 0, [], [], []
        # 26 nov 2026 · opciones por club (FEMPA): «categorias» que se admiten, «excluir» (expresión sobre título y categorías),
        # «agenda» (página con la fecha de cada actividad), «unir» (si coincide con otra el mismo día, se queda la otra),
        # «apuntarse» (texto del botón) y «solo_admin» (de prueba: solo la ven los administradores, sin club dado de alta)
        ag_html = ''
        if c.get('agenda'):
            try: ag_html = get(c['agenda']); ag_html = ag_html.decode('utf-8', 'replace') if isinstance(ag_html, bytes) else ag_html
            except Exception as e: log(f'⚠ Salidas de {c.get("nombre")}: no se pudo leer su agenda ({e}); se usan las fechas del texto')
        def fecha_agenda(link):
            if not ag_html or not link: return None
            pos = [m.start() for m in re.finditer(re.escape(link.rstrip('/')), ag_html)]
            if not pos: return False if ag_ok else None     # no está en la agenda: ya pasó (si la agenda trae enlaces)
            mejor = None
            for m in re.finditer(r'\b(\d{1,2})/(\d{1,2})/(20\d\d|\d\d)\b', ag_html):
                d = min(abs(m.start() - q) for q in pos)
                if d < 1500 and (mejor is None or d < mejor[0]): mejor = (d, m)
            if not mejor: return None
            y = mejor[1].group(3); y = int(y) + (2000 if len(y) == 2 else 0)
            try: return datetime.date(y, int(mejor[1].group(2)), int(mejor[1].group(1)))
            except ValueError: return None
        cats_ok = [nk(x) for x in c.get('categorias', [])]
        its = re.findall(r'(?s)<item>(.*?)</item>', xml)[:20]
        if c.get('desde_agenda') and ag_html:
            # 26 nov 2026 · la FEMPA no saca todas sus actividades en el canal RSS: se leen las páginas que enlaza su agenda
            base = re.match(r'https?://[^/]+', c['agenda']).group(0); vistos = set(); its = []
            for u in re.findall(r'href=["\x27]((?:https?://[^/"\x27]+)?/actividad/[^"\x27?#]+)', ag_html):
                u = (u if u.startswith('http') else base + u).rstrip('/') + '/'
                if u in vistos: continue
                vistos.add(u)
                try: pg = get(u); pg = pg.decode('utf-8', 'replace') if isinstance(pg, bytes) else pg
                except Exception as e: log(f'   ⚠ {u}: no responde ({e})'); continue
                t1 = re.search(r'(?s)<h1[^>]*>(.*?)</h1>', pg) or re.search(r'(?s)<title>(.*?)</title>', pg)
                tit = _txt(t1.group(1)).split(' – ')[0].split(' | ')[0].strip() if t1 else u
                cu = pg[t1.end():] if t1 else pg
                cu = re.sub(r'(?is)<form\b.*?</form>|<(select|button|label)\b.*?</\1>|\[20\d\d/\d\d/\d\d\][^<\n]*', ' ', cu)   # sin el formulario de inscripción
                cu = re.split(r'(?i)horario de atenci|<footer|<aside|class=["\x27][^"\x27]*(?:sidebar|widget-area)', cu)[0]; cu = re.sub(r'<[^>]*$', '', cu)
                fp = re.search(r'\b(\d{1,2})/(\d{1,2})/(20\d\d|\d\d)\b', _txt(cu)); fpag = ''
                if fp:
                    try: fpag = datetime.date(int(fp.group(3)) + (2000 if len(fp.group(3)) == 2 else 0), int(fp.group(2)), int(fp.group(1))).isoformat()
                    except ValueError: pass
                its.append(f'<title>{html.escape(tit)}</title><link>{u}</link><fpag>{fpag}</fpag><content:encoded><![CDATA[{cu}]]></content:encoded>')
            ag_html = ag_html.replace(base + '/actividad/', '/actividad/').replace('/actividad/', base + '/actividad/')
        ag_ok = bool(ag_html) and sum(1 for it in its if re.sub(r'<!\[CDATA\[|\]\]>', '', (re.search(r'<link>(.*?)</link>', it) or [0, ''])[1]).strip().rstrip('/') in ag_html) > 0
        if c.get('agenda'): log(f'   {c.get("nombre")}: {len(its)} entradas en su canal; agenda {"con enlaces" if ag_ok else "sin enlaces (se usan las fechas del texto)"}')
        no_ag, pasadas = [], []
        for it in its:
            g = lambda tag: (re.search(r'(?s)<' + tag + r'[^>]*>(.*?)</' + tag + '>', it) or [None, ''])[1]
            ti = html.unescape(re.sub(r'<!\[CDATA\[|\]\]>', '', g('title'))).strip(); link = re.sub(r'<!\[CDATA\[|\]\]>', '', g('link')).strip()
            cuerpo = re.sub(r'<!\[CDATA\[|\]\]>', '', g('content:encoded') or g('description')); cuerpo = html.unescape(cuerpo) if '&lt;' in cuerpo else cuerpo
            try: pub = datetime.datetime.strptime(g('pubDate').strip()[:25].strip(), '%a, %d %b %Y %H:%M:%S').date()
            except Exception: pub = hoy
            cats = [html.unescape(re.sub(r'<!\[CDATA\[|\]\]>', '', x)).strip() for x in re.findall(r'(?s)<category[^>]*>(.*?)</category>', it)]
            if c.get('excluir') and re.search(c['excluir'], ti + ' | ' + ' | '.join(cats), re.I): fuera.append(ti); continue
            if cats_ok and cats and not any(nk(x) in cats_ok for x in cats): fuera.append(ti); continue
            t = _txt(cuerpo); fp = re.search(r'<fpag>(\d{4})-(\d\d)-(\d\d)</fpag>', it)
            fa = datetime.date(int(fp.group(1)), int(fp.group(2)), int(fp.group(3))) if fp else fecha_agenda(link)   # la fecha de la propia página manda
            if fa is False: no_ag.append(ti); continue
            fd = fa or _fecha_salida(ti, t, cuerpo, pub)
            if not fd: sin_f.append(ti); continue
            if fd < hoy: pasadas.append(ti); continue
            hm = re.search(r'(?i)salida\D{0,25}?(\d{1,2})[:.h](\d{2})', t) or re.search(r'\b(\d{1,2}):(\d{2})\b', t)
            hora = f'{int(hm.group(1)):02d}:{hm.group(2)}' if hm else '08:00'
            pa = re.split(r'(?i)ruta alternativa|alternativa\s*:', t, maxsplit=1); pr, alt = pa[0], (pa[1] if len(pa) > 1 else '')
            def datos(x):
                km = re.search(r'(\d+(?:[.,]\d+)?)\s*km\b', x, re.I); up = re.search(r'\+\s*(\d{1,2}(?:\.\d{3})|\d{2,4})\s*m\b', x) or re.search(r'(?i)desnivel[^\d+]{0,25}\+?\s*(\d{1,2}\.\d{3}|\d{2,4})\s*m', x)
                hr = re.search(r'(?i)(?<![\d:.,])(?<!las )(\d{1,2}(?:[.,]\d)?)\s*(?:horas|h de marcha)', x) or re.search(r'(?i)duraci[oó]n\D{0,15}(\d{1,2}(?:[.,]\d)?)\s*h', x)
                return {k: v for k, v in (('km', _num(km.group(1)) if km else None), ('up', _num(up.group(1)) if up else None), ('hr', (hr.group(1).replace('.', ',') + ' h') if hr else None)) if v}
            s = {'feed': c['feed'], 'k': 'w-' + hashlib.md5(link.encode()).hexdigest()[:10], 'ti': ti, 'fecha': fd.isoformat() + 'T' + hora, 'wu': link,
                 'txt': (pr.strip()[:1200] + ('…' if len(pr.strip()) > 1200 else '')), **datos(pr)}
            if alt.strip(): a = datos(alt); a['d'] = re.sub(r'^[\s:.\-–]+', '', alt.strip()).split('\n')[0][:400]; s['alt'] = a
            pdf = re.search(r'href=["\']([^"\']+\.pdf)["\']', cuerpo, re.I); s['pdfu'] = pdf.group(1) if pdf else ''
            im = re.search(r'<img[^>]+src=["\']([^"\'?]+)', cuerpo); s['foto'] = im.group(1) if im else ''
            enc = re.search(r'(?i)(?:punto de encuentro|lugar de encuentro|quedamos en)\s*[:\-]?\s*([^\n]{3,90})', t); s['enc'] = enc.group(1).strip() if enc else ''
            if club: s.update(club=club['id'], cn=club.get('n') or c.get('nombre'))
            if c.get('apuntarse'): s['apo'] = c['apuntarse']
            if c.get('solo_admin'): s['adm'] = 1; s.setdefault('cn', c.get('nombre')); s['cw'] = c.get('web', '')
            res_c.append(s)
        if c.get('unir'):     # p. ej. «Liga de Senderismo» el mismo día que el «Belén de Cumbres»: es la misma salida
            dias = {}
            for x in res_c: dias.setdefault(x['fecha'][:10], []).append(x)
            res_c = [x for x in res_c if not (re.search(c['unir'], x['ti'], re.I) and any(not re.search(c['unir'], y['ti'], re.I) for y in dias[x['fecha'][:10]]))]
        res += res_c; n_ok = len(res_c)
        log(f'📅 Salidas de la web de {c.get("nombre")}: {n_ok} próximas' + ('' if club or c.get('solo_admin') else ' (el club aún no está dado de alta y aprobado en Salidas: no salen en la app)') + (' (de prueba: solo las ven los administradores)' if c.get('solo_admin') else '') + (f' · dejadas fuera: {"; ".join(fuera[:4])}' if fuera else '') + (f' · sin fecha clara (no se ponen): {"; ".join(sin_f[:3])}' if sin_f else '') + (f' · ya pasadas: {len(pasadas)}' if pasadas else '') + (f' · no están en su agenda: {"; ".join(no_ag[:3])}' if no_ag else ''))
    res.sort(key=lambda x: x['fecha'])
    if res != old:
        json.dump(res, open(out_f, 'w'), ensure_ascii=False, indent=0); CAMBIOS.append('salidas de webs de clubes')
        for x in res: log(f'   · {x["fecha"].replace("T"," ")} «{x["ti"]}»' + (f' · {x["km"]:g} km' if x.get('km') else '') + (f' · +{x["up"]:g} m' if x.get('up') else '') + (' · con alternativa' if x.get('alt') else '') + (' · PDF' if x.get('pdfu') else ''))

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
    for paso in (blog, mapa, fotos_mapa, enlaces_app, drive, correcciones, colaboradores, salidas_web):
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
