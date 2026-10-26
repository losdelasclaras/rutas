import json,math,re,sys
sys.path.insert(0,'.')
from norm import core,gen,toks
cand=json.load(open('candidatos.json')); osm=json.load(open('osm.json'))
T=json.load(open('targets.json')); blog=json.load(open('blog.json')); d=json.load(open('data.json'))
pl=json.load(open('places.json'))
def km(a,b): return 6371*2*math.asin(math.sqrt(math.sin(math.radians(b[0]-a[0])/2)**2+math.cos(math.radians(a[0]))*math.cos(math.radians(b[0]))*math.sin(math.radians(b[1]-a[1])/2)**2))
IDX={}
for n,la,lo,ty,ele in osm:
    if ty in ('village','town','city'): continue
    IDX.setdefault(core(n),[]).append(dict(n=n,lat=la,lon=lo,ty=ty,ele=ele,src='osm'))
for p in d['pts']:
    IDX.setdefault(core(p['n']),[]).append(dict(n=p['c'],lat=p['lat'],lon=p['lon'],ty='mapa',ele=p['a'] or '',src='mapa'))
TOWN={}
for p in pl: TOWN.setdefault(core(p['n'].split(' / ')[0]),[]).append((p['lat'],p['lon']))
GROUP={'pico':'cima','picos':'cima','picu':'cima','peña':'cima','pena':'cima','peñas':'cima','penas':'cima','torre':'cima','torres':'cima','cueto':'cima','cuetu':'cima','cabeza':'cima','porru':'cima','porro':'cima','cantu':'cima','canto':'cima','alto':'cima','monte':'cima','cumbre':'cima','techo':'cima',
 'majada':'majada','majadas':'majada','mayada':'majada','maya':'majada','mayau':'majada','braña':'majada','brañas':'majada','brana':'majada','branas':'majada','invernales':'majada','cabaña':'refugio','cabana':'refugio','refugio':'refugio',
 'collado':'paso','collada':'paso','collau':'paso','colla':'paso','horcada':'paso','horcados':'paso','pasa':'paso','puerto':'paso','puertos':'paso',
 'lago':'agua','lagos':'agua','laguna':'agua','lagunas':'agua','llaguna':'agua','llagu':'agua','pozo':'agua','pozu':'agua','fuente':'agua','cascada':'agua','tabayon':'agua',
 'foz':'foz','foces':'foz','canal':'foz','sedo':'foz','hoyo':'foz','hoyos':'foz','jou':'foz','cueva':'cueva'}
TYG={'peak':'cima','saddle':'paso','pass':'paso','cave_entrance':'cueva','spring':'agua','water':'agua','waterfall':'agua','alpine_hut':'refugio','wilderness_hut':'refugio','shelter':'refugio','locality':None,'isolated_dwelling':'majada','farm':'majada','hamlet':None}
def grp_of_name(n):
    g=gen(n); return GROUP.get(g)
def grp_of_osm(c):
    if c['src']=='mapa':
        g=gen(c['n']); return GROUP.get(g)
    g=gen(c['n'])
    return GROUP.get(g) or TYG.get(c['ty'])
def ele(c):
    try: return int(float(str(c['ele']).replace(',','.')))
    except: return None
res={}
for i,u,title in T:
    names=cand.get(u,{})
    opts={}
    for n,v in names.items():
        c=core(n)
        if len(c)<3 or c not in IDX: continue
        g=grp_of_name(n)
        L=[]
        for o in IDX[c]:
            go=grp_of_osm(o)
            if g and go and g!=go: continue
            if g=='cima' and go!='cima' and o['src']!='mapa': continue
            # nombre sin palabra genérica: solo cumbres (con altitud en el texto) o puntos del mapa
            if not g and o['src']!='mapa' and not (go=='cima' and ((v['a'] and v['a']>=900) or v['k']>=3)): continue
            L.append(o)
        if L: opts[n]=(v,L)
    # ancla: pueblo de salida del título
    anchor=None
    m=re.search(r'\bdesde\s+(?:el |la |los |las |)(.+?)(?:\s*\(|$|\s+por\s|\s+y\s)',title,re.I)
    if m:
        tc=core(m.group(1))
        if len(tc)>=3 and tc in TOWN and len(TOWN[tc])==1: anchor=TOWN[tc][0]
    pts=[]
    for n,(v,L) in opts.items():
        w=v['k']/len(L)
        for o in L: pts.append((o['lat'],o['lon'],w))
    if not pts: res[u]={'title':title,'pts':[],'anchor':anchor}; continue
    def wmed(P):
        def med(vals):
            vals=sorted(vals); tot=sum(w for _,w in vals); acc=0
            for x,w in vals:
                acc+=w
                if acc>=tot/2: return x
        return (med([(a,w) for a,_,w in P]),med([(b,w) for _,b,w in P]))
    A=anchor or wmed(pts)
    for it in range(3):
        chosen={}
        for n,(v,L) in opts.items():
            best=None;bs=1e9
            for o in L:
                dd=km(A,(o['lat'],o['lon']))
                e=ele(o); 
                if v['a'] and e and abs(e-v['a'])>120: dd+=8
                if o['src']=='mapa': dd-=1.5
                if dd<bs: bs=dd;best=o
            chosen[n]=(best,km(A,(best['lat'],best['lon'])))
        P=[(o['lat'],o['lon'],names[n]['k']) for n,(o,dd) in chosen.items() if dd<15]
        if not P: break
        A2=wmed(P)
        if anchor: A2=((A2[0]+anchor[0])/2,(A2[1]+anchor[1])/2)
        A=A2
    out=[];seen={}
    for n,(o,dd) in chosen.items():
        k=names[n]['k']
        if dd>10: continue
        # menciones sueltas (vistas desde la cima) sin altitud ni punto del mapa: solo si están cerca
        if k<=1 and not names[n]['a'] and o['src']!='mapa' and dd>2.5: continue
        key=(round(o['lat'],4),round(o['lon'],4))
        alt=names[n]['a'] or ele(o)
        rec=dict(n=n,on=o['n'],lat=o['lat'],lon=o['lon'],alt=alt,src=o['src'],ty=grp_of_name(n) or grp_of_osm(o) or 'lugar',d=round(dd,1),k=names[n]['k'],nc=len(opts[n][1]))
        if key in seen:
            if rec['k']>seen[key]['k']: seen[key].update(rec)
            continue
        seen[key]=rec; out.append(rec)
    res[u]={'title':title,'pts':sorted(out,key=lambda r:-(r['alt'] or 0)),'anchor':A}
json.dump(res,open('resueltos.json','w'),ensure_ascii=False)
tot=sum(len(r['pts']) for r in res.values()); print('puntos',tot,'entradas con puntos',sum(1 for r in res.values() if r['pts']),'/',len(res))
for u in ['2020/03/torre-blanca-desde-el-cable.html','2013/08/integral-del-macizo-de-mampodre.html','2015/03/la-cabra-blanca-desde-vegabano.html','2026/10/pico-mustallar-techo-de-lugo-desde.html']:
    r=res[u]; print('\n#',r['title']); [print('  ',p['n'],'|',p['on'],p['alt'],p['src'],p['ty'],p['d'],'km nc',p['nc']) for p in r['pts']]
print([r['title'] for r in res.values() if not r['pts']])
