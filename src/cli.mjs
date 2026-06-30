#!/usr/bin/env node
import { writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve, join, basename } from 'node:path'
import { composeCover, readFrontmatter, tokenize, buildIdf, extractKeywords } from './index.mjs'

// ── ANSI helpers ─────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
}
const bold  = (s) => `${c.bold}${s}${c.reset}`
const dim   = (s) => `${c.dim}${s}${c.reset}`
const cyan  = (s) => `${c.cyan}${s}${c.reset}`
const green = (s) => `${c.green}${s}${c.reset}`
const gray  = (s) => `${c.gray}${s}${c.reset}`
const red   = (s) => `${c.red}${s}${c.reset}`
const yellow = (s) => `${c.yellow}${s}${c.reset}`

// ── arg parsing ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { positional: [], flags: {} }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') { args.flags.help = true; continue }
    if (a === '--version' || a === '-v') { args.flags.version = true; continue }
    if (a === '--out'       || a === '-o') { args.flags.out      = argv[++i]; continue }
    if (a === '--cache-dir' || a === '-c') { args.flags.cacheDir = argv[++i]; continue }
    if (a === '--quiet'     || a === '-q') { args.flags.quiet    = true; continue }
    if (a.startsWith('--out='))       { args.flags.out      = a.slice(6); continue }
    if (a.startsWith('--cache-dir=')) { args.flags.cacheDir = a.slice(12); continue }
    if (!a.startsWith('-')) args.positional.push(a)
  }
  return args
}

// ── usage ─────────────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
${bold('kovr')} — generate branded SVG covers for your blog posts

${bold('USAGE')}
  ${cyan('kovr')} ${yellow('<blogs-dir>')} ${gray('[options]')}

${bold('ARGUMENTS')}
  ${yellow('<blogs-dir>')}          Directory containing markdown (.md) files

${bold('OPTIONS')}
  ${cyan('-o')}, ${cyan('--out')} ${yellow('<dir>')}      Output directory  ${gray('[default: <blogs-dir>/../public/blog-covers]')}
  ${cyan('-c')}, ${cyan('--cache-dir')} ${yellow('<dir>')}  Icon cache directory  ${gray('[default: ~/.cache/kovr]')}
  ${cyan('-q')}, ${cyan('--quiet')}         Suppress per-file output
  ${cyan('-v')}, ${cyan('--version')}       Print version and exit
  ${cyan('-h')}, ${cyan('--help')}          Show this help

${bold('EXAMPLES')}
  ${gray('# Generate covers for all posts in src/content/blogs/')}
  ${cyan('kovr')} src/content/blogs/

  ${gray('# Custom output directory')}
  ${cyan('kovr')} src/content/blogs/ ${cyan('--out')} public/covers/

  ${gray('# Use a shared icon cache across projects')}
  ${cyan('kovr')} src/content/blogs/ ${cyan('--cache-dir')} /tmp/kovr-cache

${bold('ENVIRONMENT')}
  ${yellow('KOVR_CACHE_DIR')}       Same as --cache-dir
`)
}

// ── progress bar ──────────────────────────────────────────────────────────────
function printProgress(done, total, slug) {
  const pct   = Math.round((done / total) * 100)
  const width = 24
  const filled = Math.round((done / total) * width)
  const bar = green('█'.repeat(filled)) + gray('░'.repeat(width - filled))
  process.stdout.write(`\r  ${bar}  ${dim(`${done}/${total}`)}  ${gray(slug.padEnd(40))}`)
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))

  if (flags.version) {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const pkg = require('../package.json')
    console.log(pkg.version)
    process.exit(0)
  }

  if (flags.help || positional.length === 0) {
    printHelp()
    process.exit(flags.help ? 0 : 1)
  }

  const blogsDir = resolve(positional[0])
  const outDir   = flags.out
    ? resolve(flags.out)
    : resolve(blogsDir, '..', '..', 'public', 'blog-covers')
  const cacheDir = flags.cacheDir || process.env.KOVR_CACHE_DIR || undefined
  const quiet    = flags.quiet || false

  mkdirSync(outDir, { recursive: true })

  const files = readdirSync(blogsDir).filter(f => f.endsWith('.md'))
  if (files.length === 0) {
    console.error(red(`✗ No .md files found in ${blogsDir}`))
    process.exit(1)
  }

  const line = gray('─'.repeat(60))

  console.log()
  console.log(`  ${bold('kovr')}  ${dim('generating covers')}`)
  console.log()
  console.log(`  ${dim('blogs')}   ${cyan(blogsDir)}`)
  console.log(`  ${dim('output')}  ${cyan(outDir)}`)
  if (cacheDir) console.log(`  ${dim('cache')}   ${cyan(cacheDir)}`)
  console.log()
  console.log(`  ${line}`)
  console.log()

  // 1) read all posts
  const entries = files.map(f => {
    const slug = f.replace(/\.md$/, '')
    const fm   = readFrontmatter(join(blogsDir, f))
    const weighted = `${fm.title} ${fm.title} ${fm.title} ${fm.tags.join(' ')} ${fm.tags.join(' ')} ${fm.body}`
    return { slug, fm, tokens: tokenize(weighted), weighted }
  })

  // 2) build corpus IDF so rare terms score higher
  const idf = buildIdf(entries.map(e => e.tokens))

  // 3) generate per post
  const start = Date.now()
  let n = 0, errors = 0

  for (const e of entries) {
    const keywords = extractKeywords(e.weighted, idf, 6)
    const outFile  = join(outDir, `${e.slug}.svg`)

    if (!quiet) {
      process.stdout.write(`  ${dim('▸')} ${e.slug.padEnd(42)} `)
    }

    try {
      const svg = await composeCover(
        { slug: e.slug, ...e.fm, keywords },
        { cacheDir }
      )
      writeFileSync(outFile, svg)
      n++
      if (!quiet) {
        process.stdout.write(green('✓') + `  ${gray(keywords.slice(0, 3).join(', '))}\n`)
      } else {
        printProgress(n, files.length, e.slug)
      }
    } catch (err) {
      errors++
      if (!quiet) {
        process.stdout.write(red('✗') + `  ${red(err.message)}\n`)
      }
    }
  }

  if (quiet) {
    process.stdout.write('\n')
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log()
  console.log(`  ${line}`)
  console.log()

  if (errors > 0) {
    console.log(`  ${green(bold(`${n} covers generated`))}  ${red(`${errors} errors`)}  ${dim(`in ${elapsed}s`)}`)
  } else {
    console.log(`  ${green(bold(`${n} covers generated`))}  ${dim(`in ${elapsed}s`)}`)
  }

  console.log(`  ${dim('→')}  ${cyan(outDir)}`)
  console.log()

  process.exit(errors > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(red(`\n  ✗ ${err.message}\n`))
  process.exit(1)
})
