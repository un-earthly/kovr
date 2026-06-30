export const COMPOUND_TERMS = [
  'machine learning', 'deep learning', 'neural network', 'natural language',
  'bloom filter', 'hash table', 'hash map', 'skip list', 'binary tree',
  'linked list', 'binary search', 'merge sort', 'quick sort',
  'type safety', 'type system', 'type inference',
  'event loop', 'event driven', 'event sourcing',
  'dependency injection', 'inversion of control',
  'domain driven', 'test driven', 'behaviour driven',
  'continuous integration', 'continuous deployment', 'continuous delivery',
  'load balancer', 'load balancing', 'rate limiting', 'circuit breaker',
  'dead letter', 'message queue', 'message broker',
  'consistent hashing', 'distributed system', 'distributed database',
  'service mesh', 'service worker', 'service discovery',
  'garbage collection', 'memory leak', 'memory management',
  'async await', 'error handling', 'error boundary',
  'design pattern', 'design system', 'component library',
  'open source', 'pull request', 'code review',
  'unit test', 'integration test', 'end to end',
  'tech debt', 'clean code', 'clean architecture',
  'product market', 'market fit', 'go to market',
  'side project', 'pet project',
  'web assembly', 'web socket', 'web worker',
  'react native', 'react query', 'server component',
  'edge function', 'edge runtime', 'serverless function',
  'foreign key', 'primary key', 'full text search',
  'api gateway', 'reverse proxy', 'content delivery',
  'zero downtime', 'blue green', 'canary deployment',
  'prompt engineering', 'retrieval augmented', 'vector database',
  'large language', 'language model', 'foundation model',
  'strangler fig', 'anti corruption', 'bounded context',
]

/**
 * Find compound terms from the curated list that appear in `text`.
 * Returns matched phrases as hyphenated tokens ("bloom filter" → "bloom-filter")
 * so they survive the keyword pipeline as atomic units.
 */
export function extractNgrams(text) {
  const lower = String(text).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ')
  const found = []
  for (const phrase of COMPOUND_TERMS) {
    if (lower.includes(phrase)) {
      found.push(phrase.replace(/\s+/g, '-'))
    }
  }
  return found
}
