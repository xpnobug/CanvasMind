import assert from 'node:assert/strict'
import {
  buildResearchSectionDelta,
  stripDuplicateSectionHeading,
} from '../../server/research/report-section-format.ts'

const section = {
  id: 'section-risk',
  title: '主要风险与潜在问题',
  objective: '识别风险',
}

assert.equal(
  stripDuplicateSectionHeading('## 主要风险与潜在问题\n\n### 1. 风险\n正文', section.title),
  '### 1. 风险\n正文',
  '模型返回同名 Markdown 标题时应剥离',
)

assert.equal(
  stripDuplicateSectionHeading('### 主要风险与潜在问题 ###\n\n正文', section.title),
  '正文',
  '带闭合井号的同名标题也应剥离',
)

assert.equal(
  stripDuplicateSectionHeading('### 1. 主要风险与潜在问题\n\n正文', section.title),
  '正文',
  '带编号前缀的同名标题也应剥离',
)

assert.equal(
  stripDuplicateSectionHeading('### 其他标题\n\n正文', section.title),
  '### 其他标题\n\n正文',
  '不同标题不应被误删',
)

const delta = buildResearchSectionDelta(section, '## 主要风险与潜在问题\n\n### 1. 风险\n正文')
assert.equal(
  delta,
  '## 主要风险与潜在问题\n\n### 1. 风险\n正文\n\n',
  '章节增量应只包含一个外层章节标题',
)

console.log('research report writer regression passed')
