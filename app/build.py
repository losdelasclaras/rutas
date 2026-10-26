import json, re
pts=json.load(open('points.json')); geo=json.load(open('geo.json'))
ET=json.load(open('etiquetas.json'))
def fixlab(u):
    if u and '/search/label/' in u:
        l=u.split('/search/label/')[1]
        if l in ET: return 'https://losdelasclaras.blogspot.com/'+ET[l]
    return u
for p in pts:
    p['us']=list(dict.fromkeys(fixlab(u) for u in (p.get('us') or ([p['u']] if p['u'] else []))))
    p['u']=p['us'][0] if p['us'] else None
    if p['u']:
        m=re.search(r'blogspot\.com/(\d{4})/',p['u']); p['y']=int(m.group(1)) if m else p['y']
def pip(x,y,ring):
    c=False; n=len(ring)
    for i in range(n):
        x1,y1=ring[i]; x2,y2=ring[i-1]
        if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1: c=not c
    return c
def region(p):
    for pr in geo['p']:
        for r in pr['r']:
            if pip(p['lon'],p['lat'],r): return pr['n']
    return 'Asturias' if p['lat']>43.2 else '?'
def clean(n):
    n=re.sub(r'\(\s*Alt\.?[^)]*\)','',n)
    n=re.sub(r'\(\d{4}\)','',n); n=re.sub(r'\s+(Asturias|Somiedo|Belmonte)\s*$','',n.strip())
    n=re.sub(r'\s*\(?\s*\d[\d\.]*\s*m\.?\s*\)?',' ',n)
    n=re.sub(r'\s*[,\-]?\s*Techo de .*$','',n,flags=re.I)
    n=re.sub(r'\s+',' ',n).strip(' .,(')
    return n[:1].upper()+n[1:] if n.isupper()==False else n.title()
for p in pts:
    p['r']=region(p); p['c']=clean(p['n'])
    p['t']= 'cumbre' if p['a'] else 'lugar'
    m=re.search(r'Techo de ([^\(\)]+?)(?:\s*\(|$)',p['n'],re.I)
    if m: p['techo']=m.group(1).strip()
from collections import Counter
print(Counter(p['r'] for p in pts))
routes={}
for i,p in enumerate(pts):
    for k in (p['us'] or [f'sin-{i}']):
        routes.setdefault(k,[]).append(i)
R=[]
for u,ix in routes.items():
    ps=[pts[i] for i in ix]
    y=ps[0]['y']; mo=None
    m0=re.search(r'blogspot\.com/(\d{4})/',u)
    if m0: y=int(m0.group(1))
    if p['u'] if False else u.startswith('http'):
        m=re.search(r'/(\d{4})/(\d{2})/',u)
        if m: mo=int(m.group(2))
    ps_sorted=sorted(ps,key=lambda q:-(q['a'] or 0))
    R.append(dict(u=u if u.startswith('http') else None,y=y,m=mo,p=ix,
      t=' · '.join(list(dict.fromkeys(q['c'] for q in ps_sorted))[:3]),
      a=max([q['a'] or 0 for q in ps]) or None,
      r=Counter(q['r'] for q in ps).most_common(1)[0][0],
      lat=sum(q['lat'] for q in ps)/len(ps),lon=sum(q['lon'] for q in ps)/len(ps)))
R.sort(key=lambda r:(-(r['y'] or 0),-(r['m'] or 0)))
print(len(R), Counter(r['r'] for r in R))
json.dump({'pts':[{k:p[k] for k in ('c','n','lat','lon','a','r','t') }|({'techo':p['techo']} if 'techo' in p else {}) for p in pts],'routes':R},open('data.json','w'),ensure_ascii=False,separators=(',',':'))

# ---- enriquecer con datos del blog ----
import os
blog=json.load(open('blog.json')); idx={p['u']:(i,p) for i,p in enumerate(blog)}
D=json.load(open('data.json'))
def num(s):
    if not s: return None
    try: return float(s.replace('.','').replace(',','.'))
    except: return None
for r in D['routes']:
    if not r['u']: continue
    k=r['u'].replace('https://losdelasclaras.blogspot.com/','')
    if k not in idx: continue
    i,p=idx[k]
    r['ti']=p['t'].strip(); r['d']=p['d']
    if os.path.exists(f'fotos/{i}.jpg'): r['f']=i
    for a,b in (('desc','ds'),('tm','tm'),('sal','sal'),('zona','zo'),('wk','wk')):
        if p.get(a): r[b]=p[a]
    km=num(p.get('km')); de=num(p.get('des'))
    if km and 0.5<km<60: r['km']=km
    if de and 50<de<4000: r['de']=int(de)
    dif=p.get('dif')
    if dif and len(dif)<14: r['dif']=dif.capitalize()
    if p.get('nv'): r['nv']=1
json.dump(D,open('data.json','w'),ensure_ascii=False,separators=(',',':'))
rs=[r for r in D['routes'] if r.get('ti')]
print('con titulo',len(rs),'foto',sum('f' in r for r in rs),'km',sum('km' in r for r in rs),'des',sum('de' in r for r in rs),'desc',sum('ds' in r for r in rs),'renov',sum('nv' in r for r in rs))
