import json,re,math,hashlib
d=json.load(open('data.json')); geo=json.load(open('geo.json')); res=json.load(open('resueltos.json'))
blog=json.load(open('blog.json')); bidx={p['u']:(i,p) for i,p in enumerate(blog)}
con=json.load(open('concejos.json'))
def pip(x,y,ring):
    c=False
    for i in range(len(ring)):
        x1,y1=ring[i]; x2,y2=ring[i-1]
        if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1: c=not c
    return c
def region(lat,lon):
    for pr in geo['p']:
        for r in pr['r']:
            if pip(lon,lat,r): return pr['n']
    return 'Asturias'
def km(a,b): return 6371*2*math.asin(math.sqrt(math.sin(math.radians(b[0]-a[0])/2)**2+math.cos(math.radians(a[0]))*math.cos(math.radians(b[0]))*math.sin(math.radians(b[1]-a[1])/2)**2))
def nice(n):
    n=n.strip()
    if n.isupper(): n=n.title().replace(' De ',' de ').replace(' Del ',' del ').replace(' La ',' la ').replace(' Los ',' los ').replace(' Las ',' las ')
    return n
def num(s):
    if not s: return None
    try: return float(s.replace('.','').replace(',','.'))
    except: return None
P=d['pts']; R=d['routes']; base=len(P)
for u,v in res.items():
    if not v['pts']: continue
    i,p=bidx[u]
    ids=[]
    for q in v['pts']:
        # concejo del punto existente más cercano
        best=None;bd=9
        for j in range(base):
            dd=km((q['lat'],q['lon']),(P[j]['lat'],P[j]['lon']))
            if dd<bd: bd=dd;best=j
        P.append(dict(c=nice(q['n']),n=nice(q['n']),lat=q['lat'],lon=q['lon'],a=q['alt'] if q['ty']=='cima' else q['alt'],r=region(q['lat'],q['lon']),
            t='cumbre' if (q['ty']=='cima' and q['alt']) else 'lugar',rv=1,id='r'+hashlib.md5((u+'|'+q['n']).encode()).hexdigest()[:10],on=q['on'],src=q['src'],co=con[best] if best is not None else []))
        ids.append(len(P)-1)
    m=re.match(r'(\d{4})/(\d{2})/',u)
    r=dict(u='https://losdelasclaras.blogspot.com/'+u,y=int(m.group(1)),m=int(m.group(2)),p=ids,ti=p['t'].strip(),t=p['t'].strip(),d=p['d'],nw=1)
    r['a']=max([P[k]['a'] or 0 for k in ids]) or None
    from collections import Counter
    r['r']=Counter(P[k]['r'] for k in ids).most_common(1)[0][0]
    hi=sorted(ids,key=lambda k:-(P[k]['a'] or 0))
    r['lat']=sum(P[k]['lat'] for k in ids)/len(ids); r['lon']=sum(P[k]['lon'] for k in ids)/len(ids)
    for a,b in (('desc','ds'),('tm','tm'),('sal','sal'),('zona','zo'),('wk','wk')):
        if p.get(a): r[b]=p[a]
    k_=num(p.get('km')); de=num(p.get('des'))
    if k_ and 0.5<k_<60: r['km']=k_
    if de and 50<de<4000: r['de']=int(de)
    if p.get('nv'): r['nv']=1
    cs=[]
    for k in ids:
        for c in P[k]['co']:
            if c not in cs: cs.append(c)
    r['co']=cs
    R.append(r)
for p in P: p.pop('co',None) if 'rv' in p else None
R.sort(key=lambda r:(-(r['y'] or 0),-(r['m'] or 0)))
json.dump(d,open('data2.json','w'),ensure_ascii=False,separators=(',',':'))
print('rutas',len(R),'nuevas',sum(1 for r in R if r.get('nw')),'puntos',len(P),'por revisar',sum(1 for p in P if p.get('rv')))
