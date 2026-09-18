import assert from 'node:assert/strict'
import { afterEach, test, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import {
  getAdminProjects,
  getStudentProject,
  getStudentProjects,
  publishAdminProject,
  unpublishAdminProject,
  updateAdminProject,
} from '../src/services/studentProjects.js'
import { useStudentProjects } from '../src/composables/useStudentProjects.js'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const jsonResponse = (payload, options = {}) => new Response(JSON.stringify(payload), {
  status: options.status || 200,
  headers: { 'Content-Type': 'application/json' },
})

test('student project service builds public and admin request contracts', async () => {
  const calls = []
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    calls.push({ url, options })
    return jsonResponse({ projects: [], project: { id: 'A1' } })
  }))

  await getStudentProjects(2026)
  await getStudentProject(2026, 'A/1')
  await getAdminProjects(2026)
  await updateAdminProject('A/1', { title: '标题' })
  await publishAdminProject('A/1')
  await unpublishAdminProject('A/1')

  assert.deepEqual(calls.map(({ url }) => url), [
    '/api/projects?year=2026',
    '/api/projects/2026/A%2F1',
    '/api/admin/projects?year=2026',
    '/api/admin/projects/A%2F1',
    '/api/admin/projects/A%2F1/publish',
    '/api/admin/projects/A%2F1/unpublish',
  ])
  assert.equal(calls[0].options.credentials, 'same-origin')
  assert.equal(calls[3].options.method, 'PATCH')
  assert.equal(calls[3].options.headers.Accept, 'application/json')
  assert.equal(calls[3].options.headers['Content-Type'], 'application/json')
  assert.deepEqual(JSON.parse(calls[3].options.body), { title: '标题' })
  assert.equal(calls[4].options.method, 'POST')
  assert.equal(calls[5].options.method, 'POST')
})

test('student project service exposes API error payload and status', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: '未找到已发布的项目。' }, { status: 404 })))

  await assert.rejects(
    () => getStudentProject(2026, 'missing'),
    (error) => error.status === 404 && error.message === '未找到已发布的项目。',
  )
})

test('useStudentProjects separates published projects and preserves teacher viewer state', async () => {
  const response = {
    viewer: { isTeacher: true },
    projects: [
      { id: 'A1', status: 'published' },
      { id: 'A2', status: 'draft' },
      { id: 'A3', status: 'ready' },
    ],
  }
  const fetchMock = vi.fn(async () => jsonResponse(response))
  vi.stubGlobal('fetch', fetchMock)
  const scope = effectScope()
  const state = scope.run(() => useStudentProjects(2026))

  assert.equal(state.loading.value, false)
  assert.equal(state.loaded.value, false)
  await state.refresh()
  await nextTick()

  assert.equal(fetchMock.mock.calls[0][0], '/api/projects?year=2026')
  assert.equal(state.loading.value, false)
  assert.equal(state.loaded.value, true)
  assert.equal(state.error.value, '')
  assert.equal(state.viewer.value.isTeacher, true)
  assert.deepEqual(state.publishedProjects.value.map(({ id }) => id), ['A1'])
  assert.deepEqual(state.unpublishedProjects.value.map(({ id }) => id), ['A2', 'A3'])
  scope.stop()
})

test('useStudentProjects clears stale projects and exposes retryable errors', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(jsonResponse({ projects: [{ id: 'A1', status: 'published' }] }))
    .mockRejectedValueOnce(new Error('网络不可用'))
  vi.stubGlobal('fetch', fetchMock)
  const scope = effectScope()
  const state = scope.run(() => useStudentProjects())

  await state.refresh()
  assert.equal(state.projects.value.length, 1)
  await assert.rejects(() => state.refresh(), /网络不可用/)
  assert.equal(state.projects.value.length, 0)
  assert.equal(state.loaded.value, true)
  assert.equal(state.loading.value, false)
  assert.equal(state.error.value, '网络不可用')
  scope.stop()
})
