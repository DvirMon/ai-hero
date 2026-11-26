#!/usr/bin/env python3
"""build-report.py <report.json> <out.html>
Builds the visual-verify Artifact page: one self-contained HTML file, images embedded.
report.json (paths relative to the json file):
 {title, subtitle, meta:[[k,v]], note, source,
  summary:[{name,pct,verdict:'branch'|'older'|'na',label}],
  sections:[{id,name,pct,verdict,note,dir,res,size?,items:[[title,text]]}],
  fixes:[[title,text]]}
 section.dir holds figma.png, local.png, diff.png (figma-pixel-diff --out dir);
 section.res is the JSON that figma-pixel-diff printed (clusters, comparedSize)."""
import base64, json, os, sys
rp, out = sys.argv[1], sys.argv[2]
base = os.path.dirname(os.path.abspath(rp))
R = json.load(open(rp))
b64 = lambda p: 'data:image/png;base64,' + base64.b64encode(open(os.path.join(base, p), 'rb').read()).decode()
for s in R['sections']:
    r = json.load(open(os.path.join(base, s['res'])))
    s['clusters'] = r['clusters']
    s['w'], s['h'] = r['comparedSize']['w'], r['comparedSize']['h']
    s['size'] = s.get('size', r.get('sizeMismatch', False))
    s.setdefault('items', [])
    for k, f in (('figma', 'figma.png'), ('local', 'local.png'), ('diff', 'diff.png')):
        s[k] = b64(os.path.join(s['dir'], f))
tpl = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'references', 'report-template.html')).read()
html = tpl.replace('__TITLE__', R['title'].replace('<', '')).replace('__REPORT__', json.dumps(R).replace('</', '<\\/'))
open(out, 'w').write(html)
print(f'{out} {len(html)//1024}KB')
