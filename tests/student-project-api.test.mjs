import assert from 'node:assert/strict'
import { test } from 'vitest'
import { serializeProject, validateProjectPatch } from '../functions/api/_projectUtils.js'

const projectRow = (overrides = {}) => ({
  id: 'project-2026-a1',
  year: 2026,
  groupId: 'group-a1',
  groupCode: 'A1',
  repositoryName: 'A1-balcony',
  repositoryUrl: 'https://github.com/CAASCD-Curation/A1-balcony',
  title: '阳台计划',
  description: '一个关于阳台的学生项目。',
  liveUrl: 'https://caascd-curation.github.io/A1-balcony/',
  coverUrl: null,
  status: 'draft',
  snapshotMembersJson: null,
  snapshotTopicLabel: null,
  currentMembersJson: JSON.stringify([{ displayName: '张三', className: '1' }]),
  currentTopicLabel: '阳台',
  firstPublishedAt: null,
  publishedAt: null,
  createdAt: '2026-09-18 08:00:00',
  updatedAt: '2026-09-18 08:00:00',
  ...overrides,
})

test('draft serialization uses the current group membership and topic', () => {
  const project = serializeProject(projectRow(), { admin: true })

  assert.deepEqual(project.members, [{ displayName: '张三', className: '1' }])
  assert.equal(project.topicLabel, '阳台')
  assert.equal(project.routeId, 'balcony')
  assert.equal(project.status, 'draft')
  assert.equal(project.canPublish, true)
  assert.deepEqual(project.missingFields, [])
})

test('serialization freezes members and topic after the first publication', () => {
  const project = serializeProject(projectRow({
    status: 'published',
    firstPublishedAt: '2026-09-18 09:00:00',
    publishedAt: '2026-09-18 09:00:00',
    snapshotMembersJson: JSON.stringify([{ displayName: '历史成员', className: '2' }]),
    snapshotTopicLabel: '历史选题',
    currentMembersJson: JSON.stringify([{ displayName: '当前成员', className: '1' }]),
    currentTopicLabel: '当前选题',
  }))

  assert.deepEqual(project.members, [{ displayName: '历史成员', className: '2' }])
  assert.equal(project.topicLabel, '历史选题')
  assert.equal(project.status, 'published')
  assert.equal('groupId' in project, false)
  assert.equal('missingFields' in project, false)
})

test('admin serialization reports every missing publication field', () => {
  const project = serializeProject(projectRow({
    title: null,
    description: null,
    repositoryUrl: '',
    liveUrl: null,
    currentMembersJson: '[]',
    currentTopicLabel: null,
  }), { admin: true })

  assert.equal(project.canPublish, false)
  assert.deepEqual(project.missingFields, [
    '项目标题',
    '项目简介',
    'GitHub 仓库',
    '线上地址',
    '小组成员',
    '选题',
  ])
})

test('project patch accepts only its explicit field whitelist', () => {
  const valid = validateProjectPatch({ title: '  新标题  ', description: '  新简介  ' })
  assert.deepEqual(valid.updates, [
    { column: 'title', value: '新标题' },
    { column: 'description', value: '新简介' },
  ])

  assert.match(validateProjectPatch({ title: '标题', status: 'published' }).error, /不允许/)
  assert.match(validateProjectPatch({ repositoryUrl: 'https://example.com' }).error, /不允许/)
})

test('project patch requires HTTPS and permits clearing optional values', () => {
  assert.match(validateProjectPatch({ liveUrl: 'http://example.com' }).error, /HTTPS/)
  assert.match(validateProjectPatch({ coverUrl: 'javascript:alert(1)' }).error, /HTTPS/)

  const result = validateProjectPatch({ description: '   ', liveUrl: '', coverUrl: '' })
  assert.deepEqual(result.updates, [
    { column: 'description', value: null },
    { column: 'live_url', value: null },
    { column: 'cover_url', value: null },
  ])
})
