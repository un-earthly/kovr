// Public API — import from individual modules for tree-shaking.
export { W, H, PALETTES, PAL_KEYS, esc, rand, hash } from './palettes.mjs'
export { STOP, stem, tokenize, stemmedTokens, stripMarkdown } from './text.mjs'
export { COMPOUND_TERMS, extractNgrams } from './ngrams.mjs'
export { buildIdf, extractKeywords } from './tfidf.mjs'
export { ICON_DICT, dice, resolveIcon, fetchIcon, defaultCacheDir, ensureCache } from './icons.mjs'
export { placeIcon, glyphField, wrap, layoutHeadline } from './layout.mjs'
export { composeCover, readFrontmatter, TYPE_LABEL } from './compose.mjs'
