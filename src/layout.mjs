import { W, H, esc, rand } from './palettes.mjs'

export function placeIcon(svg, x, y, size, opacity) {
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 24 24'
  const [, , vw, vh] = vb.split(/\s+/).map(Number)
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const scale = size / Math.max(vw, vh)
  const tx = x - (vw * scale) / 2, ty = y - (vh * scale) / 2
  return `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${scale.toFixed(3)})" opacity="${opacity}">${inner}</g>`
}

const GLYPHS = '01<>/{}[]()=+*#$%&;:アイウエオカキクケコ⟶◇△○∑λ→'.split('')

export function glyphField(seed, color) {
  const r = rand(seed + '::glyphs')
  let s = ''
  for (let i = 0; i < 120; i++) {
    const g = GLYPHS[Math.floor(r() * GLYPHS.length)]
    const x = (r() * W).toFixed(0), y = (r() * H).toFixed(0)
    const sz = (10 + r() * 18).toFixed(0), op = (0.03 + r() * 0.09).toFixed(3)
    s += `<text x="${x}" y="${y}" font-size="${sz}" fill="${color}" opacity="${op}" font-family="ui-monospace, monospace">${esc(g)}</text>`
  }
  return s
}

export function wrap(str, max) {
  const words = String(str).split(/\s+/).filter(Boolean)
  const lines = []
  let cur = ''
  for (let w of words) {
    while (w.length > max) {
      if (cur) { lines.push(cur); cur = '' }
      lines.push(w.slice(0, max - 1) + '-')
      w = w.slice(max - 1)
    }
    if (!cur) cur = w
    else if ((cur + ' ' + w).length <= max) cur += ' ' + w
    else { lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  return lines
}

export function layoutHeadline(text, { maxWidthPx = 600, maxLines = 3 } = {}) {
  for (const fs of [64, 58, 52, 46, 40]) {
    const cpl = Math.max(6, Math.floor(maxWidthPx / (fs * 0.62)))
    const lines = wrap(text, cpl)
    if (lines.length <= maxLines) return { fs, lines }
  }
  const fs = 40
  const cpl = Math.max(6, Math.floor(maxWidthPx / (fs * 0.62)))
  const all = wrap(text, cpl)
  const lines = all.slice(0, maxLines)
  lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'
  return { fs, lines }
}
