# kovr

Generate branded SVG blog cover images from markdown frontmatter — no AI, no dependencies, just Node.

```
markdown ──▶ TF-IDF keywords ──▶ Iconify icon ──▶ SVG cover
```

Each post gets a unique accent colour and illustration derived deterministically from its slug, so covers are stable across re-runs and look great as Open Graph images.

---

## Quickstart

```bash
npx kovr src/content/blogs/
```

That's it. SVGs land in `public/blog-covers/<slug>.svg` by default.

---

## CLI

```
kovr <blogs-dir> [options]
```

| Option | Default | Description |
|---|---|---|
| `-o`, `--out <dir>` | `../../public/blog-covers` relative to blogs-dir | Output directory |
| `-c`, `--cache-dir <dir>` | `~/.cache/kovr` | Icon cache (Iconify responses) |
| `-q`, `--quiet` | off | Show progress bar instead of per-file lines |
| `-v`, `--version` | — | Print version |
| `-h`, `--help` | — | Show help |

**Examples**

```bash
# Custom output directory
kovr src/content/blogs/ --out public/covers/

# Shared icon cache across projects
kovr src/content/blogs/ --cache-dir /tmp/kovr-cache

# Quiet mode (progress bar only)
kovr src/content/blogs/ --quiet

# Via environment variable
KOVR_CACHE_DIR=/tmp/kovr kovr src/content/blogs/
```

---

## Library API

```js
import {
  composeCover,
  resolveIcon,
  fetchIcon,
  extractKeywords,
  buildIdf,
  tokenize,
  stripMarkdown,
  readFrontmatter,
} from 'kovr'
```

### `composeCover(blog, options?) → Promise<string>`

Compose a full SVG cover. Returns the SVG markup string.

```js
import { writeFileSync } from 'node:fs'
import { composeCover } from 'kovr'

const svg = await composeCover({
  slug: 'my-post',
  title: 'Building a Bloom Filter in Rust',
  tags: ['rust', 'data-structures'],
  excerpt: 'A practical guide to probabilistic membership testing.',
  type: 'technical',        // 'technical' | 'hot-take'
})

writeFileSync('public/blog-covers/my-post.svg', svg)
```

**`blog` fields**

| Field | Type | Description |
|---|---|---|
| `slug` | `string` | Unique post slug — seeds the palette and random texture |
| `title` | `string` | Post title |
| `tags` | `string[]` | Tag array (optional) |
| `excerpt` | `string` | Short description shown under the headline (optional) |
| `type` | `string` | Post type label (optional) |
| `keywords` | `string[]` | Pre-computed keywords — skips TF-IDF if provided (optional) |

**`options` fields**

| Field | Type | Description |
|---|---|---|
| `cacheDir` | `string` | Override icon cache directory |

---

### `readFrontmatter(filePath) → object`

Parse a markdown file's frontmatter into the fields `composeCover` needs.

```js
import { readFrontmatter } from 'kovr'

const { title, excerpt, type, tags, body } = readFrontmatter('./posts/my-post.md')
```

---

### `extractKeywords(text, idf, n?) → string[]`

Return the top-n distinctive terms from `text` using TF-IDF scoring against a corpus IDF.

```js
import { buildIdf, extractKeywords, tokenize } from 'kovr'

const corpus = [tokenize(post1), tokenize(post2), tokenize(post3)]
const idf = buildIdf(corpus)

const keywords = extractKeywords(post1, idf, 6)
// ['rust', 'ownership', 'lifetime', ...]
```

---

### `buildIdf(docTokenArrays) → { N, df }`

Build inverse-document-frequency stats across a corpus. Pass the result to `extractKeywords`.

---

### `tokenize(text) → string[]`

Lowercase, split on non-alphanumeric, strip stopwords. Used internally but exported for custom pipelines.

---

### `stripMarkdown(md) → string`

Remove frontmatter, fenced/inline code, links, HTML tags, and markdown symbols so TF-IDF scores prose rather than syntax.

---

### `resolveIcon(keywords, options?) → Promise<string>`

Resolve the best Iconify icon id for a list of keywords. Tries the curated dictionary first (fuzzy Sørensen–Dice match), then live Iconify search, then a deterministic fallback.

```js
import { resolveIcon } from 'kovr'

const id = await resolveIcon(['rust', 'ownership', 'lifetime'])
// 'simple-icons:rust'
```

---

### `fetchIcon(id, color, size?, options?) → Promise<string|null>`

Fetch an Iconify SVG recolored to `color`, disk-cached under `cacheDir`.

```js
import { fetchIcon } from 'kovr'

const svg = await fetchIcon('tabler:rocket', '#22d3ee', 340)
```

---

## How it works

1. **TF-IDF keyword extraction** — scores each post's terms against the whole corpus so brand/jargon terms (`tokio`, `hyperloglog`) rise above common words.
2. **Sørensen–Dice fuzzy matching** — maps keywords to a curated `keyword → Iconify id` dictionary with a 0.62 similarity threshold, so near-misses (`borrowed` → `borrow`) still match.
3. **Iconify search fallback** — unmatched keywords hit the Iconify API and results are disk-cached to avoid repeat fetches.
4. **FNV-1a hash → deterministic style** — the slug seeds the accent palette and a mulberry32 PRNG for the glyph-field texture, so each post has a stable, unique look.
5. **Greedy word-wrap + font auto-fit** — headlines try 64 → 40 px, picking the largest size whose wrapped result fits in ≤ 3 lines.

---

## Markdown frontmatter expected

```yaml
---
title: "My Post Title"
tags: [rust, async, tokio]
excerpt: "A short description of the post."
type: technical
---
```

`excerpt` falls back to `metaDescription` if absent. `type` defaults to `technical`.

---

## License

MIT © [un-earthly](https://github.com/un-earthly)
