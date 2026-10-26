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
import json, os, re, sys, io, html, math, subprocess, datetime, urllib.request, urllib.parse, xml.etree.ElementTree as ET

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

def drive():
    reg_f = APP + 'gpx/drive.json'
    reg = json.load(open(reg_f)) if os.path.exists(reg_f) else {}
    h = get(f'https://drive.google.com/embeddedfolderview?id={CFG["drive_carpeta"]}')
    ent = re.findall(r'id="entry-([\w-]+)".*?class="flip-entry-title">(.*?)</div>', h, re.S)
    if not ent and 'flip-entry' not in h:
        log('⚠ No he podido leer la carpeta de Drive (¿sigue compartida con «Cualquier persona con el enlace»?).'); return
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
    for paso in (blog, mapa, drive):
        try: paso()
        except Exception as e:
            log(f'⚠ Error en {paso.__name__}: {e}'); err = e
    if CAMBIOS:
        try: regenerar()
        except Exception as e:
            log(f'❌ Error al regenerar la app (no se publica nada): {e}'); err = e; CAMBIOS.clear()
    os.makedirs('/home/claude/robot', exist_ok=True)
    open(os.path.join(os.path.dirname(__file__), 'informe.md'), 'w').write(f'# Informe del robot · {hoy}\n\n' + ('**Cambios:** ' + '; '.join(CAMBIOS) if CAMBIOS else 'Sin cambios.') + '\n\n' + '\n'.join('- ' + l for l in INF) + '\n')
    open('/home/claude/robot/hay-cambios', 'w').write('1' if CAMBIOS else '0')
