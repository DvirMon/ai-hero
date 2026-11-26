#!/usr/bin/env python3
"""build-report.py <report.json> <out.html>
Builds the /verify-visual Artifact page: one self-contained HTML file, images embedded.
report.json (paths relative to the json file), per sdlc contracts/visual-comparer.md:
 {title, subtitle, meta:[[k,v]], note, source, fixes:[[title,text]],
  sections:[{id, name, verdict, note, dir, res, diffAreaPct, sizeMismatch,
             copy:[{figma,app}],
             clusters:[{x,y,w,h,property,figmaValue,appValue,fromComponent,component,variant}],
             items:[[title,text]]}]}
 verdict is one of VERDICTS below. section.dir holds figma.png, local.png, diff.png
 (figma-pixel-diff --out dir); section.res is the JSON figma-pixel-diff printed
 (clusters, comparedSize, sizeMismatch). A `not run` section needs neither."""
import base64, json, os, sys

VERDICTS = {
    'matching': ('Matching', 'matching'),
    'fixed': ('Fixed', 'fixed'),
    'accepted': ('Accepted', 'accepted'),
    'needs approval': ('Needs approval', 'needs-approval'),
    'older difference': ('Older difference', 'older'),
    'not run': ('Not run', 'not-run'),
}

rp, out = sys.argv[1], sys.argv[2]
base = os.path.dirname(os.path.abspath(rp))
R = json.load(open(rp))
b64 = lambda p: 'data:image/png;base64,' + base64.b64encode(open(os.path.join(base, p), 'rb').read()).decode()


def cluster_item(k):
    where = k.get('fromComponent')
    src = {None: 'page code', 'unverified': 'source unverified'}.get(where, where)
    if where not in (None, 'unverified') and k.get('variant'):
        src += f" ({k['variant']})"
    title = k.get('property') or 'measured from diff'
    return [title, f"Figma {k.get('figmaValue', 'unverified')} · App "
                   f"{k.get('appValue', 'unverified')} · from {src}"]


for s in R['sections']:
    v = s.get('verdict')
    if v not in VERDICTS:
        sys.exit(f"section {s.get('id')}: verdict {v!r} is not one of {', '.join(VERDICTS)}")
    s['label'], s['cls'] = VERDICTS[v]
    s['pct'] = s.get('diffAreaPct')
    s.setdefault('note', '')
    items = s.setdefault('items', [])
    if v == 'not run':
        s['clusters'] = []
        continue
    r = json.load(open(os.path.join(base, s['res'])))
    s.setdefault('clusters', r['clusters'])
    s['w'], s['h'] = r['comparedSize']['w'], r['comparedSize']['h']
    s['size'] = s.get('sizeMismatch', r.get('sizeMismatch', False))
    if s['pct'] is None:
        s['pct'] = r.get('diffAreaPct')
    items[:0] = [cluster_item(k) for k in s['clusters']] + [
        ['copy', f"Figma “{c['figma']}” · App “{c['app']}”"] for c in s.get('copy', [])]
    for k, f in (('figma', 'figma.png'), ('local', 'local.png'), ('diff', 'diff.png')):
        s[k] = b64(os.path.join(s['dir'], f))
R['summary'] = [{'name': s['name'], 'pct': s['pct'], 'cls': s['cls'], 'label': s['label']}
                for s in R['sections']]
tpl = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'references', 'report-template.html')).read()
html = tpl.replace('__TITLE__', R['title'].replace('<', '')).replace('__REPORT__', json.dumps(R).replace('</', '<\\/'))
open(out, 'w').write(html)
print(f'{out} {len(html)//1024}KB')
