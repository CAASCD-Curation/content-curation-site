import { assertSameOrigin, error, json, readJson, requireAdmin } from '../../_utils.js'
import { projectSelect, serializeProject, validateProjectPatch } from '../../_projectUtils.js'

export async function onRequestPatch(context) {
  const { request, env, params } = context
  const auth = await requireAdmin(request, env)
  if (auth.response) return auth.response
  if (!assertSameOrigin(request)) return error('来源校验失败', 403)

  const validation = validateProjectPatch(await readJson(request))
  if (validation.error) return error(validation.error, 400)
  const assignments = validation.updates.map(({ column }) => `${column} = ?`).join(', ')
  const values = validation.updates.map(({ value }) => value)

  try {
    const current = await env.DB.prepare(`${projectSelect} WHERE p.id = ?`).bind(params.id).first()
    if (!current) return error('项目不存在', 404)
    if (current.status === 'published') {
      const pending = Object.fromEntries(validation.updates.map(({ column, value }) => [column, value]))
      const nextTitle = Object.hasOwn(pending, 'title') ? pending.title : current.title
      const nextDescription = Object.hasOwn(pending, 'description') ? pending.description : current.description
      const nextLiveUrl = Object.hasOwn(pending, 'live_url') ? pending.live_url : current.liveUrl
      if (!nextTitle?.trim() || !nextDescription?.trim() || !nextLiveUrl) {
        return error('已发布项目必须保留标题、简介和线上地址', 409)
      }
    }
    const result = await env.DB.prepare(`
      UPDATE student_projects
      SET ${assignments}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(...values, params.id).run()
    if (Number(result.meta?.changes || 0) !== 1) return error('项目不存在', 404)
    const project = await env.DB.prepare(`${projectSelect} WHERE p.id = ?`).bind(params.id).first()
    return json({ project: serializeProject(project, { admin: true }) })
  } catch (cause) {
    console.error('admin project update failed', cause)
    return error('项目资料保存失败', 503)
  }
}
