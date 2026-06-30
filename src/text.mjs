export const STOP = new Set([
  // English function words
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'is', 'are', 'was', 'were', 'be', 'been',
  'you', 'your', 'it', 'its', 'for', 'with', 'how', 'why', 'what', 'who', 'when', 'not',
  'in', 'on', 'at', 'by', 'as', 'i', 'we', 'they', 'this', 'that', 'these', 'those',
  'then', 'than', 'but', 'so', 'if', 'can', 'will', 'just', 'from', 'all', 'one', 'out',
  'get', 'got', 'has', 'have', 'had', 'do', 'does', 'did', 'about', 'into', 'over', 'more',
  'also', 'very', 'like', 'use', 'used', 'using', 'new', 'way', 'make', 'made', 'let',
  'see', 'look', 'need', 'want', 'know', 'work', 'works', 'call', 'run', 'runs', 'set',
  'take', 'give', 'show', 'keep', 'end', 'two', 'our', 'my', 'any', 'each', 'few', 'own',
  'same', 'such', 'too', 'up', 'down', 'should', 'could', 'would', 'may', 'might', 'must',
  // markdown / inline-SVG leakage
  'amp', 'lt', 'gt', 'quot', 'font', 'svg', 'rect', 'span', 'fill', 'stroke', 'href',
  'https', 'http', 'www', 'com', 'width', 'height', 'text', 'div', 'class', 'style',
  'color', 'size', 'sans', 'serif', 'true', 'false', 'null', 'void',
])

// longest suffixes first so we don't strip too little
const STEM_RULES = [
  [/ization$/, 'ize'],  [/isation$/, 'ise'],   [/ational$/, 'ate'],
  [/tional$/,  'tion'], [/nesses$/,  'ness'],   [/fulness$/, 'ful'],
  [/ousness$/, 'ous'],  [/iveness$/, 'ive'],    [/ations$/,  'ate'],
  [/ements$/,  ''],     [/ities$/,   'ity'],    [/iers$/,    'ier'],
  [/ings$/,    'ing'],  [/ments$/,   'ment'],   [/ness$/,    ''],
  [/ment$/,    ''],     [/tion$/,    ''],       [/ated$/,    'ate'],
  [/izes$/,    'ize'],  [/ises$/,    'ise'],    [/ives$/,    'ive'],
  [/ying$/,    'y'],    [/ning$/,    'n'],      [/ring$/,    'r'],
  [/ting$/,    't'],    [/ping$/,    'p'],      [/ding$/,    'd'],
  [/ing$/,     ''],     [/ied$/,     'y'],      [/eed$/,     'ee'],
  [/ed$/,      ''],     [/ers$/,     'er'],     [/ies$/,     'y'],
  [/ves$/,     've'],   [/ses$/,     's'],      [/oes$/,     'o'],
  [/ss$/,      'ss'],   [/s$/,       ''],
]

/**
 * Stem a single lowercase token using suffix stripping.
 * Short tokens (≤4 chars) are returned as-is.
 */
export function stem(token) {
  if (token.length <= 4) return token
  for (const [re, rep] of STEM_RULES) {
    if (re.test(token)) {
      const stemmed = token.replace(re, rep)
      if (stemmed.length >= 3) return stemmed
    }
  }
  return token
}

/** Split text into lowercase tokens, removing stopwords. */
export const tokenize = (s) =>
  String(s).toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2 && !STOP.has(t))

/** Like tokenize but returns stemmed forms. */
export const stemmedTokens = (s) => tokenize(s).map(stem)

/** Remove frontmatter, code blocks, links, and markdown symbols. */
export function stripMarkdown(md) {
  return String(md)
    .replace(/^---\n[\s\S]*?\n---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~|=-]+/g, ' ')
}
