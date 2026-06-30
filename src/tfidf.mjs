import { STOP, stem } from './text.mjs'
import { extractNgrams } from './ngrams.mjs'

/** Build IDF stats across a corpus (array of token arrays). */
export function buildIdf(docTokenArrays) {
  const df = new Map()
  for (const toks of docTokenArrays) {
    for (const t of new Set(toks)) df.set(t, (df.get(t) || 0) + 1)
  }
  return { N: docTokenArrays.length, df }
}

/**
 * Top-n distinctive terms for a text given corpus IDF.
 *
 * - Tokens are stemmed before scoring so surface variants unify.
 * - N-gram compound terms are prepended with priority over their parts.
 * - Position-weighted TF: tokens in the first ~300 words get up to 1.5× boost.
 */
export function extractKeywords(text, idf, n = 6) {
  const raw = String(text)

  // 1. Compound phrases — injected at front with implicit high priority.
  const ngrams = extractNgrams(raw)

  // 2. Stemmed unigram scoring with position decay.
  const words = raw.toLowerCase().split(/[^a-z0-9]+/)
  const tf = new Map()
  words.forEach((w, i) => {
    if (w.length <= 2 || STOP.has(w)) return
    const s = stem(w)
    if (s.length < 3) return
    const posBoost = 1 + 0.5 * Math.max(0, 1 - i / 300)
    tf.set(s, (tf.get(s) || 0) + posBoost)
  })

  const N = idf?.N ?? 1
  const scored = [...tf].map(([t, f]) => {
    const dfreq = idf?.df?.get(t) ?? 1
    const inv = Math.log(N + 1) / Math.log(dfreq + 1)
    return [t, f * inv]
  })
  scored.sort((a, b) => b[1] - a[1])

  const seen = new Set(ngrams)
  const unigrams = scored.map(([t]) => t).filter(t => !seen.has(t))
  return [...ngrams, ...unigrams].slice(0, n)
}
