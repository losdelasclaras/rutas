import re,json,math,xml.etree.ElementTree as ET
U='/root/.claude/uploads/49146fe9-2de8-5cf2-a590-379afbdf5483/'
NS='{http://www.opengis.net/kml/2.2}'
FILES=[('8a9d5889-Ecrins','Alpes','Écrins'),('bd10d797-Alpes_suizos','Alpes','Alpes suizos'),('9cdc4a75-Pirineo_Aragones','Pirineos','Pirineo aragonés y francés'),('4c20278f-VAll_de_Aran_y_zona_Benasque','Pirineos','Arán y Benasque')]
def hav(a,b):
    R=6371;la1,lo1,la2,lo2=map(math.radians,(a[1],a[0],b[1],b[0]))
    h=math.sin((la2-la1)/2)**2+math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2*R*math.asin(math.sqrt(h))
def dp(pts,eps):
    if len(pts)<3: return pts
    a,b=pts[0],pts[-1]; dmax=0; idx=0
    ax,ay=a[0],a[1]; bx,by=b[0],b[1]
    for i in range(1,len(pts)-1):
        px,py=pts[i][0],pts[i][1]
        dx,dy=bx-ax,by-ay
        if dx==dy==0: d=math.hypot(px-ax,py-ay)
        else:
            t=max(0,min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))); d=math.hypot(px-ax-t*dx,py-ay-t*dy)
        if d>dmax: dmax=d; idx=i
    if dmax>eps: return dp(pts[:idx+1],eps)[:-1]+dp(pts[idx:],eps)
    return [a,b]
out=[]
for f,zone,grp in FILES:
    t=ET.parse(U+f+'.kml')
    for fo in t.iter(NS+'Folder'):
        url=None; line=None
        for pm in fo.iter(NS+'Placemark'):
            d=pm.findtext(NS+'description') or ''
            m=re.search(r'losdelasclaras\.blogspot\.com/([^\s"<#?]+\.html)',d)
            if m and not url: url=m.group(1)
            ls=pm.find('.//'+NS+'LineString')
            if ls is not None:
                c=[tuple(map(float,x.split(',')[:3])) for x in ls.find(NS+'coordinates').text.split()]
                if not line or len(c)>len(line): line=c
        if not line: continue
        L=sum(hav(line[i],line[i+1]) for i in range(len(line)-1))
        simp=dp([(x,y) for x,y,z in line],0.00012)
        zs=[z for *_,z in line]
        # desnivel positivo suavizado
        out.append(dict(folder=fo.findtext(NS+'name').strip(),zone=zone,grp=grp,u=url,start=line[0][:2],tk=[[round(x,5),round(y,5)] for x,y in simp],
                        lenkm=round(L,1),zmax=round(max(zs)),zmin=round(min(zs)),npts=len(line)))
for o in out: print(o['zone'],o['folder'][:50],'|',o['u'],o['lenkm'],'km',o['zmax'],'m',len(o['tk']),'/',o['npts'])
json.dump(out,open('ext/ext.json','w'),ensure_ascii=False)
for z in ['Pirineos','Alpes']:
    xs=[p[0] for o in out if o['zone']==z for p in o['tk']]; ys=[p[1] for o in out if o['zone']==z for p in o['tk']]
    print(z,min(xs),max(xs),min(ys),max(ys))
