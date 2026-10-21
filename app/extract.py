import json,re,unicodedata
txt=json.load(open('textos.json'))
W=r"[A-ZÁÉÍÓÚÑÜ][a-záéíóúñüA-ZÁÉÍÓÚÑÜ'’\-]*"
CON=r"(?:\s+(?:de|del|de la|de las|de los|la|el|los|las|les|l'|l’|y)\s+|\s+)"
NAME=W+r"(?:"+CON+W+r"){0,4}"
KW=r"(?:Majada|Majadas|Mayada|Mayá|Mayáu|Braña|Brañas|Collado|Collada|Collau|Collá|Foz|Foces|Lago|Lagos|Laguna|Llaguna|Llagu|Refugio|Cueva|Canal|Canalón|Sedo|Ermita|Cascada|Tabayón|Pico|Picu|Picos|Peña|Peñas|Pena|Torre|Torres|Cueto|Cuetu|Cabeza|Puerto|Puertos|Vega|Fuente|Puente|Pasá|Horcada|Horcados|Hayedo|Fayedo|Bosque|Mirador|Faro|Playa|Castro|Porru|Porro|Cantu|Canto|Cantón|Pozo|Pozu|Jou|Hoyo|Hoyos|Sierra|Alto|Monte|Cabaña|Invernales|Tejeda|Teixedal)"
P1=re.compile(r"("+NAME+r")\s*\(?\s*(\d\.\d{3}|\d{4}|\d{3})\s*m\b")
P2=re.compile(r"\b("+KW+r"(?:\s+(?:de|del|de la|de las|de los|la|el|los|las|les|l'|l’)?\s*"+W+r"){1,3})")
STOP=set("Distancia Desnivel Cota Duración Dificultad Tipo Salida Niños Desde Con Sin Ida Circular Media Alta Baja Total El La Los Las Y De En Del A Al Por Tras Una Un Hora Horas Metros Km".split())
def clean(n):
    n=re.sub(r"\s+"," ",n).strip(" .,-'’"); n=re.sub(r"\d.*$","",n).strip()
    n=re.sub(r"^(?:Desde|Hasta|Hacia|Por|Subimos|Llegamos|Alcanzamos|Bajamos|Ya|En|El|Al|Del|A|La|Y)\s+(?=[A-ZÁÉÍÓÚÑ])","",n)
    return n
T={x[1]:x[2] for x in json.load(open('targets.json'))}
out={}
for u,t in txt.items():
    c={}
    tt=re.split(r"\s+desde\s+|\s+por\s+|\(|\)|:|,|\s+y\s+|\s+-\s+|\s+–\s+",T.get(u,''),flags=re.I)
    for part in tt:
        part=part.strip(" .")
        if len(part)>=4 and not re.match(r'^(circular|circuito|travesía|travesia|intento|subida|parte|ruta|integral|invernal|al |en torno)',part,re.I):
            part=re.sub(r'^(?:al|a la|a los|el|la|los|las)\s+','',part,flags=re.I)
            c.setdefault(part,{'a':None,'k':0}); c[part]['k']+=3
    for m in P1.finditer(t):
        n=clean(m.group(1)); a=int(m.group(2).replace('.',''))
        if a<200 or a>3000 or n.split()[0] in STOP or len(n)<4: continue
        n=" ".join(n.split()[-5:])
        c.setdefault(n,{'a':a,'k':0}); c[n]['k']+=1
    for m in P2.finditer(t):
        n=clean(m.group(1))
        if len(n)<5: continue
        c.setdefault(n,{'a':None,'k':0}); c[n]['k']+=1
    # fusionar mayúsculas/minúsculas
    m={}
    for n,v in c.items():
        k=n.lower()
        if k in m:
            m[k]['k']+=v['k']; m[k]['a']=m[k]['a'] or v['a']
        else: m[k]=dict(v,n=n)
    out[u]={v['n']:{'a':v['a'],'k':v['k']} for v in m.values()}
json.dump(out,open('candidatos.json','w'),ensure_ascii=False)
allk={}
for u,c in out.items():
    for n in c: allk[n]=allk.get(n,0)+1
print(len(allk), sum(len(c) for c in out.values()))
u='2020/03/torre-blanca-desde-el-cable.html'; print(out[u])
u='2013/08/integral-del-macizo-de-mampodre.html'; print(list(out[u].items())[:40])
