import json, os, subprocess, sys
# usage: run-sections.py <dir> '<json [[name,x,y,w,h],...]>'
# expects <dir>/figma-<name>.png (Figma node render at 1x) and <dir>/local-full.png (full local screenshot)
here = os.path.dirname(os.path.abspath(__file__))
d, rects = sys.argv[1], json.loads(sys.argv[2])
for name, x, y, w, h in rects:
    out = subprocess.run(["node", os.path.join(here, "figma-pixel-diff.mjs"), "--figma", f"{d}/figma-{name}.png", "--local", f"{d}/local-full.png", "--crop-local", f"{x},{y},{w},{h}", "--out", f"{d}/diff-{name}"], capture_output=True, text=True, cwd=here)
    r = json.loads(out.stdout)
    print(name, "| equal", r["equal"], "| local", r["localSize"], "figma", r["figmaSize"], "| diffArea%", r["diffAreaPct"], "| clusters", [(c["x"], c["y"], c["w"], c["h"]) for c in r["clusters"][:6]])
