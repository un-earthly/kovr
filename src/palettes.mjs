export const W = 1200
export const H = 630

export const PALETTES = {
  cyan:   ['#22d3ee', '#0e7490'],
  amber:  ['#f59e0b', '#b45309'],
  green:  ['#34d399', '#0f766e'],
  violet: ['#a78bfa', '#6d28d9'],
  rose:   ['#fb7185', '#9f1239'],
  blue:   ['#60a5fa', '#1d4ed8'],
  orange: ['#fb923c', '#c2410c'],
}
export const PAL_KEYS = Object.keys(PALETTES)

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const rand = (seed) => {
  let h = 2166136261
  for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  return () => {
    h += 0x6d2b79f5
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const hash = (s) => {
  let h = 0
  for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0
  return Math.abs(h)
}
