import json, math
X0,X1,Y0,Y1=-7.9,-3.4,41.75,43.85
def inb(p,m=0): return X0-m<=p[0]<=X1+m and Y0-m<=p[1]<=Y1+m
def dp(pts,eps):
    if len(pts)<3: return pts
    a,b=pts[0],pts[-1]; dx,dy=b[0]-a[0],b[1]-a[1]; L=math.hypot(dx,dy) or 1e-12
    i,dm=0,0
    for k in range(1,len(pts)-1):
        d=abs(dy*pts[k][0]-dx*pts[k][1]+b[0]*a[1]-b[1]*a[0])/L
        if d>dm: i,dm=k,d
    if dm>eps: return dp(pts[:i+1],eps)[:-1]+dp(pts[i:],eps)
    return [a,b]
def r3(l): return [[round(x,3),round(y,3)] for x,y in l]
prov=json.load(open('ne/geojson/ne_10m_admin_1_states_provinces.geojson'))
provs=[]
for f in prov['features']:
    p=f['properties']
    if p.get('admin') not in ('Spain','Portugal'): continue
    g=f['geometry']; polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
    rs=[]
    for pg in polys:
        ring=pg[0]
        if not any(inb(q,0.3) for q in ring): continue
        m=max(range(len(ring)),key=lambda k:(ring[k][0]-ring[0][0])**2+(ring[k][1]-ring[0][1])**2)
        s=dp(ring[:m+1],0.003)[:-1]+dp(ring[m:],0.003)
        if len(s)>3: rs.append(r3(s))
    if rs: provs.append({'n':p.get('name'),'r':rs})
print([p['n'] for p in provs], sum(len(r) for p in provs for r in p['r']))
rv=[]
for fn in ['ne/geojson/ne_10m_rivers_europe.geojson','ne/geojson/ne_10m_rivers_lake_centerlines.geojson']:
    for f in json.load(open(fn))['features']:
        g=f['geometry']; ls=g['coordinates'] if g['type']=='MultiLineString' else [g['coordinates']]
        for l in ls:
            if not any(inb(q) for q in l): continue
            rv.append({'n':f['properties'].get('name'),'c':r3(dp(l,0.002))})
print(len(rv), sorted({r['n'] for r in rv if r['n']}))
json.dump({'p':provs,'r':rv},open('geo.json','w'),separators=(',',':'),ensure_ascii=False)
import os;print(os.path.getsize('geo.json'))
