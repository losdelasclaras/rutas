import re, json, sys, xml.etree.ElementTree as ET
ns={'k':'http://www.opengis.net/kml/2.2'}
t=ET.parse(sys.argv[1])
pts=[]
for pm in t.iter('{http://www.opengis.net/kml/2.2}Placemark'):
    name=(pm.findtext('k:name',default='',namespaces=ns) or '').strip()
    desc=(pm.findtext('k:description',default='',namespaces=ns) or '').strip()
    c=pm.find('.//k:coordinates',ns).text.strip().split(',')
    us=[]
    for x in re.findall(r'https?://[^\s<>"]+',desc):
        x=x.split('#')[0].rstrip('.,;)')
        if x not in us: us.append(x)
    url=us[0] if us else None
    alt=None
    m2=re.search(r'\(?\s*(\d[\d\.]{2,5})\s*m',name)
    if m2:
        try: alt=int(m2.group(1).replace('.',''))
        except: pass
    year=None
    if url:
        y=re.search(r'blogspot\.com/(\d{4})/',url)
        if y: year=int(y.group(1))
    st=(pm.findtext('k:styleUrl',default='',namespaces=ns) or '')
    mi=re.search(r'icon-(\d+)',st)
    pts.append(dict(ic=mi.group(1) if mi else None,n=re.sub(r'\s+',' ',name),lat=round(float(c[1]),6),lon=round(float(c[0]),6),u=url,us=us,a=alt,y=year))
json.dump(pts,open('points.json','w'),ensure_ascii=False)
urls={p['u'] for p in pts if p['u']}
print(len(pts),'puntos',len(urls),'entradas', sum(1 for p in pts if not p['u']),'sin enlace', sum(1 for u in urls if '/search/label/' in u),'etiquetas')
print(sorted({p['y'] for p in pts if p['y']}))
