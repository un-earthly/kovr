import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { hash } from './palettes.mjs'

// ── cache ─────────────────────────────────────────────────────────────────────

export function defaultCacheDir() {
  return process.env.KOVR_CACHE_DIR || join(homedir(), '.cache', 'kovr')
}

export function ensureCache(cacheDir) {
  const dir = cacheDir || defaultCacheDir()
  mkdirSync(join(dir, 'icons', 'search'), { recursive: true })
  return dir
}

// ── Sørensen–Dice fuzzy match on character bigrams ───────────────────────────

const charBigrams = (s) => {
  s = s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const o = new Set()
  for (let i = 0; i < s.length - 1; i++) o.add(s.slice(i, i + 2))
  return o
}

export const dice = (a, b) => {
  const A = charBigrams(a), B = charBigrams(b)
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const g of A) if (B.has(g)) inter++
  return (2 * inter) / (A.size + B.size)
}

// ── curated keyword → Iconify id map ─────────────────────────────────────────

export const ICON_DICT = [
  // languages & runtimes
  ['rust',           'simple-icons:rust'],
  ['python',         'tabler:brand-python'],
  ['golang',         'tabler:brand-golang'],
  ['java',           'tabler:brand-java'],
  ['kotlin',         'tabler:brand-kotlin'],
  ['swift',          'tabler:brand-swift'],
  ['cpp',            'tabler:brand-cpp'],
  ['csharp',         'tabler:brand-csharp'],
  ['php',            'tabler:brand-php'],
  ['ruby',           'tabler:brand-ruby'],
  ['scala',          'tabler:brand-scala'],
  ['elixir',         'simple-icons:elixir'],
  ['haskell',        'simple-icons:haskell'],
  ['typescript',     'tabler:brand-typescript'],
  ['javascript',     'tabler:brand-javascript'],
  ['nodejs',         'tabler:brand-nodejs'],
  ['deno',           'simple-icons:deno'],
  ['bun',            'simple-icons:bun'],
  ['wasm',           'simple-icons:webassembly'],
  ['webassembly',    'simple-icons:webassembly'],
  // frameworks & libraries
  ['react',          'tabler:brand-react'],
  ['vue',            'tabler:brand-vue'],
  ['svelte',         'tabler:brand-svelte'],
  ['angular',        'tabler:brand-angular'],
  ['nextjs',         'tabler:brand-nextjs'],
  ['nuxt',           'tabler:brand-nuxt'],
  ['remix',          'simple-icons:remix'],
  ['astro',          'simple-icons:astro'],
  ['tailwind',       'tabler:brand-tailwind'],
  ['graphql',        'tabler:brand-graphql'],
  ['prisma',         'simple-icons:prisma'],
  ['drizzle',        'simple-icons:drizzle'],
  ['tokio',          'tabler:bolt'],
  ['ratatui',        'tabler:terminal-2'],
  ['axum',           'tabler:server-bolt'],
  ['actix',          'tabler:server'],
  ['express',        'simple-icons:express'],
  ['fastapi',        'simple-icons:fastapi'],
  ['django',         'simple-icons:django'],
  ['rails',          'simple-icons:rubyonrails'],
  ['spring',         'simple-icons:spring'],
  // data structures & algorithms
  ['bloom',          'tabler:filter'],
  ['hash',           'tabler:hash'],
  ['cardinality',    'tabler:chart-histogram'],
  ['hyperloglog',    'tabler:chart-dots'],
  ['consistent',     'tabler:circle-dashed'],
  ['merkle',         'tabler:binary-tree'],
  ['trie',           'tabler:binary-tree-2'],
  ['heap',           'tabler:stack-2'],
  ['queue',          'tabler:list-numbers'],
  ['cache',          'tabler:database-search'],
  ['index',          'tabler:list-search'],
  ['sort',           'tabler:arrows-sort'],
  // system design & architecture
  ['distributed',    'tabler:topology-ring'],
  ['architecture',   'tabler:topology-star-3'],
  ['microservice',   'tabler:topology-complex'],
  ['monolith',       'tabler:building'],
  ['serverless',     'tabler:cloud-bolt'],
  ['kubernetes',     'simple-icons:kubernetes'],
  ['docker',         'tabler:brand-docker'],
  ['terraform',      'simple-icons:terraform'],
  ['load',           'tabler:scale'],
  ['proxy',          'tabler:arrows-exchange'],
  ['gateway',        'tabler:door-enter'],
  ['mesh',           'tabler:topology-full'],
  ['service',        'tabler:server'],
  ['pipeline',       'tabler:git-branch'],
  ['stream',         'tabler:antenna'],
  ['pubsub',         'tabler:broadcast'],
  ['webhook',        'tabler:webhook'],
  ['grpc',           'tabler:arrows-right-left'],
  ['rest',           'tabler:api'],
  ['api',            'tabler:api'],
  ['websocket',      'tabler:plug-connected'],
  // databases & storage
  ['database',       'tabler:database'],
  ['postgres',       'tabler:brand-postgresql'],
  ['mysql',          'simple-icons:mysql'],
  ['mongodb',        'tabler:brand-mongodb'],
  ['redis',          'tabler:brand-redis'],
  ['sqlite',         'simple-icons:sqlite'],
  ['supabase',       'simple-icons:supabase'],
  ['firebase',       'tabler:brand-firebase'],
  ['elasticsearch',  'simple-icons:elasticsearch'],
  ['migration',      'tabler:transfer-in'],
  ['schema',         'tabler:table'],
  ['query',          'tabler:zoom-question'],
  ['transaction',    'tabler:exchange'],
  // AI / ML
  ['ai',             'tabler:robot'],
  ['agent',          'tabler:robot-face'],
  ['llm',            'tabler:brain'],
  ['gpt',            'simple-icons:openai'],
  ['claude',         'simple-icons:anthropic'],
  ['embedding',      'tabler:vector'],
  ['vector',         'tabler:vector'],
  ['rag',            'tabler:books'],
  ['prompt',         'tabler:message-question'],
  ['automation',     'tabler:settings-automation'],
  ['copilot',        'tabler:robot'],
  ['model',          'tabler:chart-network'],
  // Rust-specific
  ['ownership',      'tabler:lock-square'],
  ['borrow',         'tabler:transfer'],
  ['lifetime',       'tabler:clock-bolt'],
  ['trait',          'tabler:puzzle'],
  ['async',          'tabler:arrows-shuffle'],
  ['concurrency',    'tabler:arrows-split-2'],
  ['error',          'tabler:alert-triangle'],
  ['enum',           'tabler:list'],
  ['match',          'tabler:code'],
  ['closure',        'tabler:braces'],
  // DevOps / cloud / infra
  ['cicd',           'tabler:git-pull-request'],
  ['deployment',     'tabler:rocket'],
  ['monitor',        'tabler:activity'],
  ['observability',  'tabler:eye'],
  ['logging',        'tabler:file-text'],
  ['tracing',        'tabler:route'],
  ['metrics',        'tabler:chart-line'],
  ['alert',          'tabler:bell'],
  ['aws',            'tabler:brand-aws'],
  ['azure',          'tabler:brand-azure'],
  ['gcp',            'tabler:brand-google'],
  ['cloudflare',     'tabler:brand-cloudflare'],
  ['vercel',         'simple-icons:vercel'],
  ['netlify',        'simple-icons:netlify'],
  ['linux',          'tabler:brand-ubuntu'],
  ['git',            'tabler:brand-git'],
  ['github',         'tabler:brand-github'],
  // terminal / tooling
  ['terminal',       'tabler:terminal-2'],
  ['cli',            'tabler:terminal'],
  ['shell',          'tabler:terminal-2'],
  ['vim',            'simple-icons:vim'],
  ['neovim',         'simple-icons:neovim'],
  ['vscode',         'tabler:brand-vscode'],
  ['debug',          'tabler:bug'],
  ['test',           'tabler:test-pipe'],
  ['benchmark',      'tabler:chart-bar'],
  ['performance',    'tabler:gauge'],
  // frontend / design
  ['figma',          'tabler:brand-figma'],
  ['design',         'tabler:palette'],
  ['animation',      'tabler:brand-framer'],
  ['css',            'tabler:brand-css3'],
  ['accessibility',  'tabler:accessible'],
  ['responsive',     'tabler:devices'],
  ['dark',           'tabler:moon'],
  ['theme',          'tabler:color-swatch'],
  // security
  ['security',       'tabler:shield-lock'],
  ['auth',           'tabler:lock'],
  ['oauth',          'tabler:key'],
  ['jwt',            'tabler:certificate'],
  ['encryption',     'tabler:lock-cog'],
  ['vulnerability',  'tabler:shield-x'],
  ['pentest',        'tabler:spy'],
  // career / business
  ['freelance',      'tabler:briefcase'],
  ['career',         'tabler:user-star'],
  ['visibility',     'tabler:eye'],
  ['brand',          'tabler:badge'],
  ['market',         'tabler:trending-up'],
  ['product',        'tabler:package'],
  ['skill',          'tabler:award'],
  ['junior',         'tabler:users'],
  ['senior',         'tabler:user-star'],
  ['fullstack',      'tabler:stack-2'],
  ['remote',         'tabler:world'],
  ['startup',        'tabler:rocket'],
  ['saas',           'tabler:cloud'],
  // misc engineering
  ['type',           'tabler:braces'],
  ['pattern',        'tabler:puzzle'],
  ['refactor',       'tabler:refresh'],
  ['legacy',         'tabler:database-export'],
  ['mental',         'tabler:bulb'],
  ['clean',          'tabler:sparkles'],
  ['productivity',   'tabler:rocket'],
  ['offline',        'tabler:wifi-off'],
  ['mobile',         'tabler:device-mobile'],
  ['ble',            'tabler:bluetooth'],
  ['event',          'tabler:calendar-event'],
]

const MONO_PREFIXES = ['tabler', 'ph', 'lucide', 'solar', 'mdi', 'carbon', 'material-symbols', 'ri', 'simple-icons']

function curatedIcon(token) {
  const variants = [token, ...token.split('-')]
  let best = null, score = 0
  for (const v of variants) {
    for (const [kw, id] of ICON_DICT) {
      const s = v === kw ? 1 : dice(v, kw)
      if (s > score) { score = s; best = id }
    }
  }
  return score >= 0.62 ? best : null
}

async function searchIcon(keyword, cacheDir) {
  const dir = ensureCache(cacheDir)
  const query = keyword.split('-')[0]
  const file = join(dir, 'icons', 'search', `${query.replace(/[^a-z0-9]/gi, '_')}.txt`)
  if (existsSync(file)) { const v = readFileSync(file, 'utf8').trim(); return v || null }
  try {
    const res = await fetch(
      `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=64`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) { writeFileSync(file, ''); return null }
    const icons = (await res.json())?.icons ?? []
    const hit = icons.find((id) => MONO_PREFIXES.includes(id.split(':')[0])) || icons[0] || ''
    writeFileSync(file, hit)
    return hit || null
  } catch { return null }
}

/** Resolve the best Iconify icon id from ranked keywords. */
export async function resolveIcon(keywords, { cacheDir } = {}) {
  const kws = (keywords || []).filter(Boolean)
  for (const kw of kws) { const c = curatedIcon(kw); if (c) return c }
  for (const kw of kws) { const s = await searchIcon(kw, cacheDir); if (s) return s }
  return ICON_DICT[hash(kws.join('') || 'x') % ICON_DICT.length][1]
}

/** Fetch (disk-cached) an Iconify icon SVG, recolored to `color`. */
export async function fetchIcon(id, color, size = 340, { cacheDir } = {}) {
  const dir = ensureCache(cacheDir)
  const safe = id.replace(/[^a-z0-9]+/gi, '_')
  const file = join(dir, 'icons', `${safe}_${color.slice(1)}.svg`)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const [prefix, name] = id.split(':')
  const url = `https://api.iconify.design/${prefix}/${name}.svg?height=${size}&color=${encodeURIComponent(color)}`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return null
    const svg = await res.text()
    if (!svg.startsWith('<svg') || svg.includes('404')) return null
    writeFileSync(file, svg)
    return svg
  } catch { return null }
}
