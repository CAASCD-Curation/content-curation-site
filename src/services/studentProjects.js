async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  if (!response.ok) {
    const error = new Error(payload?.error || `请求失败（${response.status}）`)
    error.status = response.status
    throw error
  }
  return payload
}

export const getStudentProjects = (year = 2026) => request(`/api/projects?year=${encodeURIComponent(year)}`)
export const getStudentProject = (year, id) => request(`/api/projects/${encodeURIComponent(year)}/${encodeURIComponent(id)}`)
export const getAdminProjects = (year = 2026) => request(`/api/admin/projects?year=${encodeURIComponent(year)}`)
export const updateAdminProject = (id, project) => request(`/api/admin/projects/${encodeURIComponent(id)}`, {
  method: 'PATCH',
  body: JSON.stringify(project),
})
export const publishAdminProject = (id) => request(`/api/admin/projects/${encodeURIComponent(id)}/publish`, { method: 'POST' })
export const unpublishAdminProject = (id) => request(`/api/admin/projects/${encodeURIComponent(id)}/unpublish`, { method: 'POST' })
