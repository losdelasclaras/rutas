import json,base64,sys
# uso: grab.py fichero_resultado salida  (concatena si salida ya tiene .part)
f,out=sys.argv[1],sys.argv[2]
a=json.load(open(f)); t=a[0]['text']
t=t[:t.rfind('"')+1]; s=json.loads(t)
open(out,'a').write(s)
print(out,len(s))
