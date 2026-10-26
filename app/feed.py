import glob, xml.etree.ElementTree as ET, re, json
A='{http://www.w3.org/2005/Atom}'; M='{http://search.yahoo.com/mrss/}'; O='{http://a9.com/-/spec/opensearchrss/1.0/}'
posts={}
for f in sorted(glob.glob('feed/*.txt')):
    t=ET.parse(f).getroot()
    si=t.findtext(O+'startIndex'); ipp=t.findtext(O+'itemsPerPage')
    es=t.findall(A+'entry')
    ds=[e.findtext(A+'published')[:10] for e in es]
    print(f, 'start',si,'per',ipp,len(es), ds[0], '->', ds[-1])
    for e in es:
        url=[l.get('href') for l in e.findall(A+'link') if l.get('rel')=='alternate'][0]
        th=e.find(M+'thumbnail')
        posts[url]=dict(title=e.findtext(A+'title'),date=e.findtext(A+'published')[:10],
          labels=[c.get('term') for c in e.findall(A+'category')],
          img=th.get('url') if th is not None else None,
          sum=(e.findtext(A+'summary') or '')[:400])
print(len(posts))
json.dump(posts,open('posts.json','w'),ensure_ascii=False)
