import { error, json, requireAdmin } from '../_utils.js'
import { normalizeYear, projectSelect, serializeProject } from '../_projectUtils.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const auth = await requireAdmin(request, env)
  if (auth.response) return auth.response
  const year = normalizeYear(new URL(request.url).searchParams.get('year'))
  if (!year) return error('请提供有效年份', 400)

  try {
    const result = await env.DB.prepare(`
      ${projectSelect}
      WHERE p.year = ?
      ORDER BY g.sort_order, p.id
    `).bind(year).all()
    return json({ projects: (result.results || []).map((row) => serializeProject(row, { admin: true })) })
  } catch (cause) {
    console.error('admin projects list failed', cause)
    return error('项目数据暂时无法读取', 503)
  }
}
