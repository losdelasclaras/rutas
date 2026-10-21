import re,unicodedata
GEN=set("pico picos picu peña peñas pena penas torre torres cueto cuetu cueto cabeza puerto puertos majada majadas mayada maya mayau braña brañas brana branas collado collada collau colla foz foces lago lagos laguna lagunas llaguna llagu refugio cueva canal canalon sedo ermita cascada tabayon vega fuente puente pasa horcada horcados hayedo fayedo bosque mirador faro playa castro porru porro cantu canto canton pozo pozu jou hoyo hoyos sierra alto monte cabaña cabana invernales tejeda teixedal cumbre techo".split())
ART=set("de del la el los las les l y d".split())
def strip(s): return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn')
def toks(s): return [t for t in re.split(r"[^a-z0-9ñ]+",strip(s).replace("’","'").replace("l'","l ")) if t]
def core(s):
    t=[x for x in toks(s) if x not in ART and x not in GEN]
    return ' '.join(t)
def gen(s):
    t=[x for x in toks(s) if x in GEN]; return t[0] if t else ''
