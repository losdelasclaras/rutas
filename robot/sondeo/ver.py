import re,sys,html,urllib.request,json,io
out=[]
for u in open(sys.argv[1]).read().split():
    h=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=60).read().decode('utf-8','replace')
    cu=h[h.find('post-body'):] if 'post-body' in h else h
    ims=re.findall(r'<img[^>]+src=["\']([^"\']+)',cu)[:12]
    alts=re.findall(r'<img[^>]+>',cu)[:12]
    out.append({'u':u,'og':(re.search(r'og:image["\'][^>]+content=["\']([^"\']+)',h) or [None,None])[1],'ims':ims,'tags':alts})
json.dump(out,open('/tmp/out/res.json','w'),indent=1)
