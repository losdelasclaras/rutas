import json,re,os
d=json.load(open('data.json'))
if os.path.exists('concejos.json'):
    con=json.load(open('concejos.json'))
    for r in d['routes']:
        cs=[]
        for i in r['p']:
            for c in (con[i] or []):
                if c not in cs: cs.append(c)
        if cs: r['co']=cs
dif=json.load(open('dificultad2.json'))
dif.update(json.load(open('dificultad_manual.json')))
for r in d['routes']:
    if r['u']:
        k=r['u'].replace('https://losdelasclaras.blogspot.com/','')
        if k in dif: r['dl']=dif[k]
        elif r.get('dif'):
            x=r['dif'].lower()
            v='muy-alta' if 'muy' in x else 'alta' if 'alta' in x or 'dif' in x else 'moderada' if 'moder' in x or 'media' in x else 'baja' if 'baja' in x or 'fácil' in x or 'facil' in x else None
            if v: r['dl']=v
kb=json.load(open('km_blog.json'))
for r in d['routes']:
    if r['u']:
        v=kb.get(r['u'].replace('https://losdelasclaras.blogspot.com/',''))
        if v:
            if v[0] and not r.get('km'): r['km']=v[0]
            if v[1] and not r.get('de'): r['de']=v[1]
# INVERNAL: icono de raquetas (1873) en tu mapa, o la palabra en el título de la entrada
_pts=json.load(open('points.json'))
import re as _r2
for r in d['routes']:
    if any((_pts[i].get('ic')=='1873') for i in r['p'] if i<len(_pts)) or _r2.search(r'invernal|raquetas|\(invierno\)',r.get('ti') or '',_r2.I): r['iv']=1
for _i,_p in enumerate(d['pts']):
    if _i<len(_pts) and _pts[_i].get('ic')=='1873': _p['ic']=1
print('invernales',sum(1 for r in d['routes'] if r.get('iv')))
# regiones corregidas a mano por la persona (cumbres de frontera)
REG=json.load(open('regiones.json')) if os.path.exists('regiones.json') else {}
for p in d['pts']:
    if p['n'] in REG: p['r']=REG[p['n']]
for r in d['routes']:
    rs=[]
    for i in r['p']:
        for x in d['pts'][i]['r'].split(' / '):
            if x not in rs: rs.append(x)
    if len(rs)>1 or (rs and rs[0]!=r['r']): r['rs']=rs
    regs=[d['pts'][i]['r'] for i in r['p']]
    if all(x in REG.values() for x in regs) and len(set(regs))==1 and ' / ' not in regs[0]: r['r']=regs[0]
import re as _re
for p in d['pts']:
    if p['t']!='cumbre' and _re.match(r'^(Pico|Picu|Peña|Pena|Peñas|Cueto|Cuetu|Canto|Cantu|Torre|Alto|Cabeza|Porru|Porro|Pica)\b',p['c']): p['t']='cumbre'
if os.path.exists('ext/ext_routes.json'):
    E=json.load(open('ext/ext_routes.json'))
    off=len(d['pts']); d['pts'].extend(E['pts'])
    for r in E['routes']:
        r['p']=[i+off for i in r['p']]; d['routes'].append(r)
    d['routes'].sort(key=lambda r:(-(r['y'] or 0),-(r.get('m') or 0)))
# dificultad de los listados nuevos del blog (data-dif): mandan sobre todo lo demás
DL25=json.load(open('dif_listados_2025.json')) if os.path.exists('dif_listados_2025.json') else {}
for r in d['routes']:
    k=(r.get('u') or '').replace('https://losdelasclaras.blogspot.com/','')
    if k in DL25: r['dl']=DL25[k]
DM2=json.load(open('dif_manual2.json')) if os.path.exists('dif_manual2.json') else {}
for r in d['routes']:
    k=(r.get('u') or '').replace('https://losdelasclaras.blogspot.com/','')
    if k in DM2: r['dl']=DM2[k]
GX=json.load(open('gpx/tracks.json')) if os.path.exists('gpx/tracks.json') else {}
for r in d['routes']:
    r.pop('gx',None)
    if r.get('u') in GX: r['gx']=GX[r['u']]
print('rutas con GPX',sum(1 for r in d['routes'] if r.get('gx')))
json.dump(d,open('final_data.json','w'),ensure_ascii=False,separators=(',',':'))
t=open('template.html').read()
pl=json.load(open('places.json'))
PL=[[p['n'].split(' / ')[0],p['t'],p['lat'],p['lon']] for p in pl]; o={'c':0,'t':1,'v':2}; PL.sort(key=lambda p:o[p[1]])
t=t.replace('__DATA__',json.dumps(d,ensure_ascii=False,separators=(',',':'))).replace('__GEO__',open('geo.json').read()).replace('__TOWNS__',open('towns.json').read()).replace('__PLACES__',json.dumps(PL,ensure_ascii=False,separators=(',',':')))
open('rutas.html','w').write(t)
s=re.findall(r'<script>(.*?)</script>',t,re.S)[-1];open('/tmp/claude-0/x.js','w').write(s)
print('rutas con concejo',sum(1 for r in d['routes'] if r.get('co')))
