---
name: figma-pixel-diff
description: Pixel-level parity check of a built UI against its Figma design. Use after implementing a Figma-backed UI change, before reporting it done, or when asked to compare a screen/component to Figma, check pixel parity, or find visual differences.
---

# Figma pixel diff

Perceptual diff of a Figma node render against a local screenshot, using the OSS
[looks-same](https://github.com/gemini-testing/looks-same) library (CIEDE2000 colour distance, antialiasing tolerant).
macOS only (uses `sips` to crop and read sizes).

## Setup (once)

```bash
cd <this skill>/scripts && npm install
```

## Parity pass

1. **Measure, don't eyeball.** Read the Figma node's sizes (heights, padding, gaps) via the Figma MCP `get_metadata` and compare with the live DOM (`getBoundingClientRect`).
2. **Render every variant** of each enum the UI maps (every icon, role, status), plus a test that the map covers the source enum.
3. **Export the Figma node as PNG at 1x** (`get_screenshot`) and take a local screenshot of the same region at 1x (device scale factor 1).
4. **Diff:**
   ```bash
   node scripts/figma-pixel-diff.mjs --figma figma.png --local local.png --out out-dir \
     [--crop-figma x,y,w,h] [--crop-local x,y,w,h] [--tolerance 4]
   ```
   Prints JSON: `equal`, sizes, `diffAreaPct`, and `clusters` (x, y, w, h of each differing region). `out-dir/diff.png` highlights differences in magenta.
   Several sections of one page: `python3 scripts/run-sections.py <dir> '[["header",0,0,1200,64],["card",0,80,400,300]]'`
   with `<dir>/figma-<name>.png` per section and one `<dir>/local-full.png`.
5. **Fix every cluster**, rerun until clean, and look at the Figma / local / diff images.
6. Report the measured numbers (`diffAreaPct`, remaining clusters). Never say "matches" without them.

A `sizeMismatch: true` result means the two images differ in size; fix the layout first, since the diff only compares the overlapping top-left area.
