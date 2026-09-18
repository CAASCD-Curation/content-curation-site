import { assertSameOrigin, error, json, requireAdmin } from '../../../_utils.js'
import { projectSelect, serializeProject } from '../../../_projectUtils.js'

export async function onRequestPost(context) {
  const { request, env, params } = context
  const auth = await requireAdmin(request, env)
  if (auth.response) return auth.response
  if (!assertSameOrigin(request)) return error('来源校验失败', 403)

  try {
    const results = await env.DB.batch([
      env.DB.prepare(`
        UPDATE student_projects
        SET status = 'draft', published_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(params.id),
      env.DB.prepare(`${projectSelect} WHERE p.id = ?`).bind(params.id),
    ])
    if (Number(results[0]?.meta?.changes || 0) !== 1) return error('项目不存在', 404)
    return json({ project: serializeProject(results[1]?.results?.[0], { admin: true }) })
  } catch (cause) {
    console.error('admin project unpublish failed', cause)
    return error('项目撤回失败', 503)
  }
}
