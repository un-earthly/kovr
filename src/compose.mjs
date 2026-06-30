import { readFileSync } from 'node:fs'
import { PALETTES, PAL_KEYS, W, H, esc, hash } from './palettes.mjs'
import { tokenize, stripMarkdown } from './text.mjs'
import { resolveIcon, fetchIcon } from './icons.mjs'
import { layoutHeadline, wrap, glyphField, placeIcon } from './layout.mjs'

const firstSentence = (s) => {
  const m = String(s).match(/^[^.!?]*[.!?]/)
  return (m ? m[0] : String(s)).trim()
}

const headlineFrom = (title) =>
  String(title).split(/[:.?]/)[0].replace(/,?\s*Part\s*\d+.*$/i, '').trim().toUpperCase()

export const TYPE_LABEL = {
  technical:  'TECHNICAL DEEP DIVE',
  'hot-take': 'ENGINEERING HOT TAKE',
}

const banner = (k1, k2) => `<g font-family="Arial, Helvetica, sans-serif">
  <text x="${W - 60}" y="54"  text-anchor="end" font-size="20" font-weight="700" letter-spacing="2" fill="#94a3b8">${esc(k1)}</text>
  <text x="${W - 60}" y="80"  text-anchor="end" font-size="20" font-weight="700" letter-spacing="2" fill="#64748b">${esc(k2)}</text>
  <text x="${W - 60}" y="142" text-anchor="end" font-size="54" font-weight="900" letter-spacing="-1" fill="#f8fafc">MD<tspan fill="#22d3ee">.</tspan></text>
</g>`

/**
 * Compose a branded SVG cover for a blog post.
 *
 * @param {object} blog
 * @param {string}   blog.slug       - Unique post slug (seeds palette + PRNG)
 * @param {string}   blog.title      - Post title
 * @param {string[]} [blog.tags]     - Array of tag strings
 * @param {string}   [blog.excerpt]  - Short description shown under the headline
 * @param {string}   [blog.type]     - "technical" | "hot-take"
 * @param {string[]} [blog.keywords] - Pre-computed keywords (skips TF-IDF)
 * @param {object}   [options]
 * @param {string}   [options.cacheDir]    - Override icon cache directory
 * @param {number}   [options.glowOpacity] - Radial glow opacity 0–1 (default 0.28)
 * @param {number}   [options.glowRadius]  - Radial glow radius fraction 0–1 (default 0.6)
 * @returns {Promise<string>} SVG markup string
 */
export async function composeCover(blog, {
  cacheDir,
  glowOpacity = 0.28,
  glowRadius  = 0.6,
} = {}) {
  const accent = PALETTES[PAL_KEYS[hash(blog.slug) % PAL_KEYS.length]]
  const keywords = (blog.keywords && blog.keywords.length)
    ? blog.keywords
    : tokenize([blog.title, ...(blog.tags || [])].join(' '))

  const iconId  = await resolveIcon(keywords, { cacheDir })
  const iconSvg = await fetchIcon(iconId, accent[0], 340, { cacheDir })

  const headline   = layoutHeadline(headlineFrom(blog.title))
  const descriptor = wrap(firstSentence(blog.excerpt || blog.title), 52).slice(0, 2)
  const k1   = (blog.tags?.[0] || 'ENGINEERING').toUpperCase()
  const k2   = TYPE_LABEL[blog.type] || 'ENGINEERING'
  const chip = (blog.tags?.[1] || blog.tags?.[0] || blog.type || 'ENGINEERING').toUpperCase()

  const illustration = iconSvg
    ? `<g>${placeIcon(iconSvg, 950, 320, 360, 0.9)}</g>`
    : `<circle cx="950" cy="320" r="150" fill="none" stroke="${accent[0]}" stroke-width="3" opacity="0.5"/>`

  const headTop   = 280
  const lineH     = Math.round(headline.fs * 1.04)
  const headLines = headline.lines
    .map((l, i) => `<text x="80" y="${headTop + i * lineH}" font-family="Arial, Helvetica, sans-serif" font-size="${headline.fs}" font-weight="900" letter-spacing="-1" fill="#f8fafc">${esc(l)}</text>`)
    .join('')
  const underlineY = headTop + (headline.lines.length - 1) * lineH + 26
  const descStart  = underlineY + 40
  const descLines  = descriptor
    .map((l, i) => `<text x="82" y="${descStart + i * 32}" font-size="24" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif">${esc(l)}</text>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(headline.lines.join(' '))}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1120"/><stop offset="1" stop-color="#020617"/></linearGradient>
  <radialGradient id="glow" cx="0.78" cy="0.5" r="${glowRadius}"><stop offset="0" stop-color="${accent[0]}" stop-opacity="${glowOpacity}"/><stop offset="1" stop-color="${accent[0]}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<g>${glyphField(blog.slug, accent[0])}</g>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
${illustration}
<rect width="${W}" height="${H}" fill="#020617" opacity="0.18"/>
${banner(k1, k2)}
<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace">
  <rect x="80" y="190" width="10" height="34" rx="3" fill="${accent[0]}"/>
  <text x="106" y="216" font-size="22" font-weight="700" letter-spacing="4" fill="${accent[0]}">${esc(chip)}</text>
</g>
${headLines}
<rect x="82" y="${underlineY}" width="120" height="5" rx="2.5" fill="${accent[0]}"/>
${descLines}
</svg>`
}

/**
 * Parse frontmatter fields from a markdown file.
 *
 * @param {string} filePath
 * @returns {{ title, excerpt, type, tags, body }}
 */
export function readFrontmatter(filePath) {
  const raw = readFileSync(filePath, 'utf8')
  const fm  = (raw.match(/^---\n([\s\S]*?)\n---/) || [])[1] || ''
  const get = (k) => {
    const m = fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm'))
    return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : ''
  }
  const tagsRaw = get('tags')
  const tags = tagsRaw
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(t => t.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
  return {
    title:   get('title'),
    excerpt: get('excerpt') || get('metaDescription'),
    type:    get('type') || 'technical',
    tags,
    body:    stripMarkdown(raw),
  }
}
