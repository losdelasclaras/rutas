import json,os,re,xml.etree.ElementTree as ET
U='/root/.claude/uploads/49146fe9-2de8-5cf2-a590-379afbdf5483/'
NS='{http://www.opengis.net/kml/2.2}'
ext=json.load(open('ext/ext.json')); b=json.load(open('blog.json')); idx={p['u']:i for i,p in enumerate(b)}
FIX={'2025/06/refugio-serradets-desde-bujaruelo.html':'2025/07/refugio-serradets-desde-bujaruelo.html',
     'search/label/Pombie':'2016/07/refugio-de-pombie-pirineos-2016-dia-2.html'}
RENAME={'Castillo de Acher':'Castillo de Acher (2.384 m.)'}  # pedido por la persona; altura de su entrada del blog
LINK={'Glaciar Blanc':'2023/09/refugio-y-glaciar-blanc-desde-pre-de.html'}
EXTRA=json.load(open('ext/extra.json')) if os.path.exists('ext/extra.json') else {}
DIF=json.load(open('ext/dif_ext.json')) if os.path.exists('ext/dif_ext.json') else {}
# mapas de puntos (cumbres y lugares), como el de la Cordillera
POINTMAPS=[(U+'8d6b8089-Pirineos.kml','Pirineos'),(U+'32204847-dolomitas.kml','Dolomitas')]
LUGAR=re.compile(r'(?:^|[\s(/-])(ib[oó]n|ibones|ibonet|estany|estanque|stany|lac|lacs|lago|laguna|embalse|refugio|refugi|refuge|rifugio|cabane|h[üu]tte|chalet|collado|coll|col|cuello|port|puerto|paso|passo|pass|forcella|furcela|portill[oó]n|brecha|hourquette|cascada|cascade|faja|fajas|clavijas|ca[ñn][oó]n|valle|circ|cirque|gradas|senda|sentiero|galleria|ermita|puente|forau)(?=$|[\s,.)/\'’-])',re.I)
def num(s):
    if not s: return None
    try: return float(str(s).replace('.','').replace(',','.'))
    except: return None
def clean(n):
    n=re.sub(r',\s*\d[\d\.]*\s*m\.?','',n)          # "(Tuc de Molières, 3.010 m)"
    n=re.sub(r'\s*[|(]?\s*\d[\d\.]*\s*m\.?\s*\)?',' ',n)
    n=re.sub(r'\s+',' ',n).strip(' .,(|')
    if n.count('(')>n.count(')'): n+=')'
    return n
def alt(n):
    m=re.search(r'(\d[\d\.]{2,5})\s*m',n)
    if not m: return None
    try:
        a=int(m.group(1).replace('.',''))
        return a if 300<a<5000 else None
    except: return None
def enrich(r,u):
    p=dict(b[idx[u]]) if u in idx else {}
    p.update(EXTRA.get(u,{}))
    i=idx.get(u)
    if p.get('t'): r['ti']=p['t'].strip(); r['t']=r['ti']
    if p.get('d'): r['d']=p['d']
    if i is not None and os.path.exists(f'fotos/{i}.jpg'): r['f']=i
    for a,bb in (('desc','ds'),('tm','tm'),('sal','sal'),('zona','zo'),('wk','wk')):
        if p.get(a) and p.get(a)!='None': r[bb]=p[a]
    km=num(p.get('km')); de=num(p.get('des'))
    if km and 0.5<km<60: r['km']=km
    if de and 50<de<4000: r['de']=int(de)
    if p.get('dif') and p['dif']!='None' and len(p['dif'])<14: r['dif']=p['dif'].capitalize()
    if p.get('nv') in (True,'True'): r['nv']=1
    if u in DIF: r['dl']=DIF[u]
pts=[];routes=[];byurl={}
# 1) puntos de los mapas de cumbres y lugares
for f,zone in POINTMAPS:
    for pm in ET.parse(f).iter(NS+'Placemark'):
        name=re.sub(r'\s+',' ',(pm.findtext(NS+'name') or '').strip())
        name=RENAME.get(name,name)
        d=pm.findtext(NS+'description') or ''
        m=re.search(r'losdelasclaras\.blogspot\.com/([^\s<"#?]+)',d)
        u=FIX.get(m.group(1),m.group(1)) if m else None
        c=pm.find('.//'+NS+'coordinates').text.strip().split(',')
        a=alt(name); cn=clean(name)
        t='cumbre' if a and not LUGAR.search(cn) else 'lugar'
        pts.append(dict(c=cn,n=name,lat=round(float(c[1]),6),lon=round(float(c[0]),6),a=a,r=zone,t=t))
        byurl.setdefault(u,[]).append(len(pts)-1)
track={}
for o in ext:
    u=o['u'] or LINK.get(o['folder']); u=FIX.get(u,u); track[u]=o
for u,ix in byurl.items():
    ps=[pts[i] for i in ix]
    y=m=None
    if u and re.match(r'\d{4}/\d{2}/',u): y,m=int(u[:4]),int(u[5:7])
    top=sorted(ps,key=lambda q:-(q['a'] or 0))
    r=dict(u='https://losdelasclaras.blogspot.com/'+u if u else None,y=y,m=m,p=ix,t=' · '.join(list(dict.fromkeys(q['c'] for q in top))[:3]),
           a=max([q['a'] or 0 for q in ps]) or None,r=ps[0]['r'],lat=sum(q['lat'] for q in ps)/len(ps),lon=sum(q['lon'] for q in ps)/len(ps))
    if u in track: r['grp']=track[u]['grp']
    if u: enrich(r,u)
    routes.append(r)
# 2) rutas de los mapas de tracks que no tienen puntos: un marcador en el inicio
for u,o in track.items():
    if u in byurl: continue
    y=m=None
    if u: y,m=int(u[:4]),int(u[5:7])
    pts.append(dict(c=o['folder'],n=o['folder'],lat=o['start'][1],lon=o['start'][0],a=None,r=o['zone'],t='inicio',x=1))
    r=dict(u='https://losdelasclaras.blogspot.com/'+u if u else None,y=y,m=m,p=[len(pts)-1],t=o['folder'],a=None,r=o['zone'],lat=o['start'][1],lon=o['start'][0],grp=o['grp'])
    if u: enrich(r,u)
    pts[-1]['c']=pts[-1]['n']=r['t']
    routes.append(r)
json.dump({'pts':pts,'routes':routes},open('ext/ext_routes.json','w'),ensure_ascii=False)
from collections import Counter
print(len(routes),'rutas',Counter(r['r'] for r in routes),'| puntos',len(pts),Counter((p['r'],p['t']) for p in pts))
print('sin foto',[(idx.get(r['u'].replace('https://losdelasclaras.blogspot.com/','')),r['t'][:30]) for r in routes if r.get('f') is None and r['u']])
print('cumbres',[p['c']+' '+str(p['a']) for p in pts if p['t']=='cumbre'])
print('lugares con altura',[p['c'] for p in pts if p['t']=='lugar' and p['a']])
