import { error, getOptionalAdmin, json } from '../../_utils.js'
import { normalizeYear, projectRouteId, projectSelect, serializeProject } from '../../_projectUtils.js'

export async function onRequestGet(context) {
  const { request, env, params } = context
  if (!env.DB) return error('D1 数据库尚未绑定', 503)
  const year = normalizeYear(params.year)
  if (!year || typeof params.id !== 'string' || !params.id) return error('项目不存在', 404)

  try {
    const admin = Boolean(await getOptionalAdmin(request, env))
    const result = await env.DB.prepare(`
      ${projectSelect}
      WHERE p.year = ? ${admin ? '' : "AND p.status = 'published'"}
      ORDER BY g.sort_order, p.id
    `).bind(year).all()
    const row = (result.results || []).find((candidate) => projectRouteId(candidate) === params.id)
    if (!row) return error('项目不存在', 404)
    return json({
      year,
      viewer: { isTeacher: admin },
      project: serializeProject(row, { admin }),
    })
  } catch (cause) {
    console.error('project detail failed', cause)
    return error('项目数据暂时无法读取', 503)
  }
}
