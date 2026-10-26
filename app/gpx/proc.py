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
    def grab(tag):
        for m in re.finditer(r'<'+tag+r'\b([^>]*?)(/?)>(.*?)(?=</'+tag+r'>|<'+tag+r'\b|</trkseg>|</rte>|$)',t,re.S):
            a=m.group(1);la=re.search(r'lat\s*=\s*["\']([\d.+-]+)',a);lo=re.search(r'lon\s*=\s*["\']([\d.+-]+)',a)
            if not(la and lo):continue
            body='' if m.group(2) else (m.group(3) or '')
            e=re.search(r'<ele>\s*([\d.+-]+)\s*</ele>',body);tm=re.search(r'<time>\s*([^<\s]+)\s*</time>',body)
            out.append([float(la.group(1)),float(lo.group(1)),float(e.group(1)) if e else None,tm.group(1) if tm else None])
    grab('trkpt')
    if len(out)<2:out.clear();grab('rtept')
    return out
def trim(P):  # quita al principio y al final los tramos en coche (>12 km/h), aunque haya paradas cortas
    if sum(1 for p in P if p[3])<0.9*len(P):return P,0  # sin horas fiables en casi todos los puntos: no se recorta
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
import datetime as _dt
def ym(s):
    try: y,m=int(s[:4]),int(s[5:7]);return y*12+m
    except: return None
MAN=json.load(open('asignar.json')) if os.path.exists('asignar.json') else {}   # archivo -> url de la entrada (o null para descartar)
FILES=[];CAND={}
for f in sorted(glob.glob('raw/*.gpx')):
    fb=os.path.basename(f)
    t=open(f,encoding='utf-8',errors='replace').read();P,cut=trim(parse(t))
    if len(P)<5:continue
    FILES.append((f,t,P,cut))
    if fb in MAN:
        mu=MAN[fb] if isinstance(MAN[fb],list) else ([MAN[fb]] if MAN[fb] else [])
        CAND[fb]=[(1000,mu[0],'asignado a mano')] if mu else [];continue
    cs=[]
    link=re.search(r'<link href="([^"]+)"',t);link=link.group(1) if link else ''
    wid=re.search(r'-(\d+)$',link)
    stem=re.sub(r'(\s*\(\d+\)|_\d+)$','',fb[:-4].lower()).strip()
    S=P[::max(1,len(P)//400)]
    fn=re.sub(r'[^a-z0-9]+',' ',stem);tw={w for w in fn.split() if len(w)>3}
    tdate=next((p[3] for p in P if p[3]),None);tm=ym(tdate) if tdate else None
    for x in D:
        if not x.get('u'):continue
        wk=(x.get('wk') or '').rstrip('/')
        if wid and re.search(r'-'+wid.group(1)+r'(\D|$)',wk):cs.append((100,x['u'],'enlace Wikiloc'));continue
        if fb.startswith('drive__'):
            ps=re.sub(r'\.html?$','',x['u'].rstrip('/').split('/')[-1]).lower()
            if ps and re.sub(r'[^a-z0-9]+','-',stem[7:]).strip('-')==ps:cs.append((500,x['u'],'nombre del archivo = dirección de la entrada'));continue
        wslug=re.sub(r'-\d+$','',wk.split('/')[-1]).lower() if wk else ''
        ds=[min(dist((PT[i]['lat'],PT[i]['lon']),q) for q in S) for i in x['p']]
        if min(ds)>400:continue
        near=sum(1 for d in ds if d<400)/len(ds)
        if wslug and (wslug==stem or wslug==stem.replace('(1)','').strip()):cs.append((60+near,x['u'],'nombre del track en Wikiloc'));continue
        slug=re.sub(r'[^a-z0-9]+',' ',x['u'].lower()+' '+(x.get('ti') or '').lower())
        nm=len([w for w in tw if w in slug])
        pm=ym(x.get('d','')) ;dd=(pm-tm) if (pm and tm) else None
        dsc=0 if dd is None else (1.5 if 0<=dd<=3 else 0.7 if -1<=dd<=8 else -0.8 if abs(dd)>24 else 0)
        sc=near*2+nm*0.6+dsc
        cs.append((sc,x['u'],f"recorrido (puntos cerca {near:.0%}, palabras {nm}, fecha {'cuadra' if dsc>=1 else 'parecida' if dsc>0 else 'lejana' if dsc<0 else 'no'})"))
    cs.sort(key=lambda c:-c[0]);CAND[fb]=cs
# reparto: primero las parejas más seguras; cada ruta y cada archivo una sola vez
pairs=sorted(((c[0],fb,c[1],c[2],k) for fb,cs in CAND.items() for k,c in enumerate(cs)),key=lambda p:-p[0])
ASG={};TAKEN=set();SKIP=set()
for sc,fb,u,how,k in pairs:
    if fb in ASG or fb in SKIP or u in TAKEN or sc<1.2:continue
    cs=CAND[fb];alt=[c for c in cs if c[1]!=u and c[1] not in TAKEN]
    if k>0:how+=' · (era su 2.ª opción: la 1.ª ya tenía otro track)'
    if fb.startswith('drive__') and sc<60 and alt and alt[0][0]>=sc-0.5:SKIP.add(fb);continue   # de Drive y con dudas: mejor no colocarlo
    if sc<60 and alt and alt[0][0]>=sc-0.5:how+=' · DUDA con: '+next((x.get('ti') for x in D if x['u']==alt[0][1]),alt[0][1])
    ASG[fb]=(u,how);TAKEN.add(u)
UBY={x['u']:x for x in D}
res={};log=[]
for f,t,P,cut in FILES:
    fb=os.path.basename(f)
    if fb not in ASG:
        log.append(f"SIN EMPAREJAR {fb}"+(" (descartado a mano)" if fb in MAN else (" · mejor opción: "+(UBY[CAND[fb][0][1]].get('ti') or '')+" (ya tenía track o poco segura)" if CAND.get(fb) else "")));continue
    u,how=ASG[fb];r=UBY[u]
    cum=[0]
    for i in range(1,len(P)):cum.append(cum[-1]+dist(P[i-1],P[i]))
    E=[p[2] for p in P];nE=sum(e is not None for e in E);has=nE>=0.8*len(E) and nE>1
    if has and nE<len(E):  # rellena las altitudes que falten con la más cercana conocida
        last=next(e for e in E if e is not None)
        for i in range(len(E)):
            if E[i] is None:E[i]=last
            else:last=E[i]
        for i in range(len(P)):P[i][2]=E[i]
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
for fb,v in MAN.items():  # un mismo track para varias entradas (p. ej. reportaje partido en dos)
    if isinstance(v,list) and v and v[0] in res:
        for u in v[1:]:
            if u in UBY:res[u]=dict(res[v[0]],nm=(UBY[u].get('ti') or UBY[u].get('t')));log.append(f"{fb} -> también {res[u]['nm']}")
json.dump(res,open('tracks.json','w'),ensure_ascii=False,separators=(',',':'))
print('\n'.join(log))
