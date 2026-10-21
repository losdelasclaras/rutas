# Procesa los GPX de Wikiloc: empareja con la ruta, quita trozos en coche, calcula datos y perfil.
import re,math,json,glob,datetime,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
_FD=json.load(open('../final_data.json'));D=_FD['routes'];PT=_FD['pts']
def dist(p,q):
    la1,la2=math.radians(p[0]),math.radians(q[0]);dl=math.radians(q[1]-p[1])
    x=math.sin((la2-la1)/2)**2+math.cos(la1)*math.cos(la2)*math.sin(dl/2)**2;return 2*6371000*math.asin(math.sqrt(min(1,x)))
T=lambda s:datetime.datetime.fromisoformat(s.replace('Z','+00:00')) if s else None
def parse(t):
    out=[]
    for m in re.finditer(r'<trkpt\s+lat="([\d.-]+)"\s+lon="([\d.-]+)"\s*/?>(.*?)(?:</trkpt>|(?=<trkpt)|$)',t,re.S):
        body=m.group(3) or '';e=re.search(r'<ele>([\d.-]+)</ele>',body);tm=re.search(r'<time>([^<]+)</time>',body)
        out.append([float(m.group(1)),float(m.group(2)),float(e.group(1)) if e else None,tm.group(1) if tm else None])
    return out
def trim(P):  # quita al principio y al final los tramos en coche (>12 km/h), aunque haya paradas cortas
    def sp(i):
        p,q=P[i-1],P[i]
        if not(p[3] and q[3]):return 0
        dt=(T(q[3])-T(p[3])).total_seconds();return dist(p,q)/dt*3.6 if dt>0 else 0
    def scan(rng):
        last=None;acc=0
        for i in rng:
            if sp(i)>12:last=i;acc=0
            else:
                acc+=dist(P[i-1],P[i])
                if acc>300:break
        return last
    b=len(P);l=scan(range(len(P)-1,0,-1))
    if l is not None:b=l
    a=0;f=scan(range(1,b))
    if f is not None:a=f
    return P[a:b],len(P)-(b-a)
def dp(P,eps):
    if len(P)<3:return P
    # Douglas-Peucker en metros (aprox. plana)
    lat0=math.radians(P[0][0]);xy=[(p[1]*111320*math.cos(lat0),p[0]*110540) for p in P]
    keep=[False]*len(P);keep[0]=keep[-1]=True;st=[(0,len(P)-1)]
    while st:
        i,j=st.pop();(x1,y1),(x2,y2)=xy[i],xy[j];L=math.hypot(x2-x1,y2-y1) or 1e-9;best,k=0,None
        for n in range(i+1,j):
            x,y=xy[n];dd=abs((x2-x1)*(y1-y)-(x1-x)*(y2-y1))/L
            if dd>best:best,k=dd,n
        if k is not None and best>eps:keep[k]=True;st+= [(i,k),(k,j)]
    return [p for p,kk in zip(P,keep) if kk]
res={};log=[]
for f in sorted(glob.glob('raw/*.gpx')):
    t=open(f,encoding='utf-8').read();P=parse(t);P,cut=trim(P)
    link=re.search(r'<link href="([^"]+)"',t);link=link.group(1) if link else ''
    wid=re.search(r'-(\d+)$',link);r=None;how=''
    if wid:
        r=next((x for x in D if x.get('wk') and re.search(r'-'+wid.group(1)+r'(\D|$)',x['wk'])),None);how='enlace Wikiloc' if r else ''
    if not r:
        # por geometría: los puntos de la ruta deben quedar cerca del track; desempate por nombre y fecha
        S=P[::max(1,len(P)//400)]
        fn=re.sub(r'[^a-z0-9]+',' ',os.path.basename(f).lower().replace('.gpx',''))
        tw={w for w in fn.split() if len(w)>3}
        tdate=next((p[3][:7] for p in P if p[3]),None)
        cands=[]
        for x in D:
            if not x.get('u'):continue
            ds=[min(dist((PT[i]['lat'],PT[i]['lon']),q) for q in S) for i in x['p']]
            if min(ds)>400:continue
            near=sum(1 for d in ds if d<400)/len(ds)
            slug=re.sub(r'[^a-z0-9]+',' ',x['u'].lower()+' '+(x.get('ti') or '').lower())
            nm=len([w for w in tw if w in slug])
            dt=1 if tdate and x.get('d','')[:7]==tdate else 0
            cands.append((near*2+nm*0.6+dt*1.5,x,round(min(ds)),near,nm,dt))
        cands.sort(key=lambda c:-c[0])
        if cands:
            best=cands[0];r=best[1];how=f"geometría (puntos cerca {best[3]:.0%}, palabras {best[4]}, fecha {'sí' if best[5] else 'no'})"
            if len(cands)>1 and cands[1][0]>=best[0]-0.5: how+=' · DUDA con: '+(cands[1][1].get('ti') or cands[1][1]['u'])
    if not r:log.append(f'SIN EMPAREJAR {os.path.basename(f)}');continue
    if r['u'] in res: log.append(f"REPETIDO {os.path.basename(f)} -> {r.get('ti')} (ya tenía otro GPX; me quedo con el primero)");continue
    cum=[0]
    for i in range(1,len(P)):cum.append(cum[-1]+dist(P[i-1],P[i]))
    E=[p[2] for p in P];has=all(e is not None for e in E)
    up=dn=0
    if has:
        sm=[sum(E[max(0,i-2):i+3])/len(E[max(0,i-2):i+3]) for i in range(len(E))];ref=sm[0]
        for e in sm:
            if e-ref>=4:up+=e-ref;ref=e
            elif ref-e>=4:dn+=ref-e;ref=e
    prof=[];N=100
    if has:
        for k in range(N+1):
            target=cum[-1]*k/N;i=min(range(len(cum)),key=lambda j:abs(cum[j]-target));prof.append([round(cum[i]/1000,2),round(E[i])])
    line=[[round(p[0],5),round(p[1],5)]+([round(p[2])] if p[2] is not None else []) for p in dp(P,6)]
    res[r['u']]={'km':round(cum[-1]/1000,1),'up':round(up/10)*10,'dn':round(dn/10)*10,'mx':round(max(E)) if has else None,'mn':round(min(E)) if has else None,
      'st':[round(P[0][0],5),round(P[0][1],5)],'pf':prof,'ln':line,'nm':(r.get('ti') or r.get('t'))}
    log.append(f"{os.path.basename(f)} -> {r.get('ti') or r.get('t')} | {how} | {res[r['u']]['km']} km +{res[r['u']]['up']} m (blog {r.get('km')} km +{r.get('de')}) | coche {cut} pts | {len(line)} pts")
json.dump(res,open('tracks.json','w'),ensure_ascii=False,separators=(',',':'))
print('\n'.join(log))
