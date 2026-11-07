import assert from 'node:assert/strict'
import { rankReadTargets } from '../../server/research/read-target-ranker.ts'

const createResult = (title, url, snippet = 'CanvasMind xpnobug/CanvasMind') => ({
  title,
  url,
  snippet,
  siteName: '',
  publishedTime: '',
})

const subject = 'xpnobug/CanvasMind CanvasMind canvasmind xpnobug 后端工作流'
const queryAnchors = ['CanvasMind', 'canvasmind', 'xpnobug', 'xpnobug/CanvasMind']

const initialSearchResults = [
  createResult('some-stars | 我的star列表，每天自动更新', 'https://rcy1314.github.io/some-stars/'),
  createResult('Efficiency资源干货全收录', 'https://t.me/s/quanshoulu/9667'),
  createResult('Oberon / X', 'https://x.com/jimail0218/with_replies'),
  createResult('CanvasMind - Linux.do', 'https://linux.do/t/topic/12345'),
  createResult('Tool.lu CanvasMind', 'https://tool.lu/article/CanvasMind'),
  createResult('xpnobug', 'https://github.com/xpnobug'),
  createResult('CanvasMind Security', 'https://github.com/xpnobug/CanvasMind/security'),
  createResult(
    'I Just Found One of the Most Powerful AI Workflows for Research and Building',
    'https://elshad-karimov.medium.com/i-just-found-one-of-the-most-powerful-ai-workflows-for-research-and-building-24785e4adc8b',
    'Deep Research workflow, agents, automation and research building tips',
  ),
  createResult(
    'Deep Research - Federated, Multi-Vendor, Synthesizable',
    'https://claudeblattman.com/workflows/deep-research/',
    'Deep Research workflow and research synthesis notes',
  ),
  createResult('CanvasMind/index.html at master', 'https://github.com/xpnobug/CanvasMind/blob/master/index.html'),
  createResult('CanvasMind/.dockerignore at master', 'https://github.com/xpnobug/CanvasMind/blob/master/.dockerignore'),
  createResult('CanvasMind/pnpm-lock.yaml at master', 'https://github.com/xpnobug/CanvasMind/blob/master/pnpm-lock.yaml'),
  createResult('Other CanvasMind Repo', 'https://github.com/another/CanvasMind'),
  createResult('GitHub - xpnobug/CanvasMind', 'https://github.com/xpnobug/CanvasMind'),
  createResult('CanvasMind README.md', 'https://github.com/xpnobug/CanvasMind/blob/master/README.md'),
  createResult('CanvasMind/server at master', 'https://github.com/xpnobug/CanvasMind/tree/master/server'),
  createResult('CanvasMind/prisma at master', 'https://github.com/xpnobug/CanvasMind/tree/master/prisma'),
  createResult('CanvasMind/docs at master', 'https://github.com/xpnobug/CanvasMind/tree/master/docs'),
  createResult('CanvasMind/Dockerfile at master', 'https://github.com/xpnobug/CanvasMind/blob/master/Dockerfile'),
  createResult('CanvasMind/docker-compose.yml at master', 'https://github.com/xpnobug/CanvasMind/blob/master/docker-compose.yml'),
]

const ranked = rankReadTargets(
  [],
  initialSearchResults,
  [],
  subject,
  queryAnchors,
  12,
)

const rankedUrls = ranked.map(item => item.url)
const absentUrls = [
  'https://rcy1314.github.io/some-stars/',
  'https://t.me/s/quanshoulu/9667',
  'https://x.com/jimail0218/with_replies',
  'https://linux.do/t/topic/12345',
  'https://tool.lu/article/CanvasMind',
  'https://github.com/xpnobug',
  'https://github.com/xpnobug/CanvasMind/security',
  'https://elshad-karimov.medium.com/i-just-found-one-of-the-most-powerful-ai-workflows-for-research-and-building-24785e4adc8b',
  'https://claudeblattman.com/workflows/deep-research/',
  'https://github.com/xpnobug/CanvasMind/blob/master/index.html',
  'https://github.com/xpnobug/CanvasMind/blob/master/.dockerignore',
  'https://github.com/xpnobug/CanvasMind/blob/master/pnpm-lock.yaml',
  'https://github.com/another/CanvasMind',
]
const requiredUrls = [
  'https://github.com/xpnobug/CanvasMind',
  'https://github.com/xpnobug/CanvasMind/blob/master/README.md',
  'https://github.com/xpnobug/CanvasMind/tree/master/server',
  'https://github.com/xpnobug/CanvasMind/tree/master/docs',
  'https://github.com/xpnobug/CanvasMind/blob/master/Dockerfile',
  'https://github.com/xpnobug/CanvasMind/blob/master/docker-compose.yml',
]

for (const url of absentUrls) {
  assert(!rankedUrls.includes(url), `噪声页不应进入深读队列：${url}`)
}

for (const url of requiredUrls) {
  assert(rankedUrls.includes(url), `高价值页面应进入深读队列：${url}`)
}

assert.equal(rankedUrls[0], 'https://github.com/xpnobug/CanvasMind/blob/master/README.md')
assert(rankedUrls.indexOf('https://github.com/xpnobug/CanvasMind') <= 4, 'repo 根页应处于高优先级')
assert(rankedUrls.indexOf('https://github.com/xpnobug/CanvasMind/tree/master/server') <= 3, 'server 目录应处于高优先级')

const seedUrl = 'https://example.com/manual-research-entry'
const seededUrls = rankReadTargets(
  [seedUrl],
  initialSearchResults,
  [],
  subject,
  queryAnchors,
  12,
).map(item => item.url)
assert(seededUrls.includes(seedUrl), '用户显式提供的外部入口不应被主体锚点规则过滤')

console.log('research read target ranker regression passed')
console.log(JSON.stringify(rankedUrls, null, 2))
