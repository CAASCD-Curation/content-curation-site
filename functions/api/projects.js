import { error, getOptionalAdmin, json } from './_utils.js'
import { normalizeYear, projectSelect, serializeProject } from './_projectUtils.js'

export async function onRequestGet(context) {
  const { request, env } = context
  if (!env.DB) return error('D1 数据库尚未绑定', 503)
  const year = normalizeYear(new URL(request.url).searchParams.get('year'))
  if (!year) return error('请提供有效年份', 400)

  try {
    const admin = Boolean(await getOptionalAdmin(request, env))
    const result = await env.DB.prepare(`
      ${projectSelect}
      WHERE p.year = ? ${admin ? '' : "AND p.status = 'published'"}
      ORDER BY g.sort_order, p.id
    `).bind(year).all()
    return json({
      year,
      viewer: { isTeacher: admin },
      projects: (result.results || []).map((row) => serializeProject(row, { admin })),
    })
  } catch (cause) {
    console.error('projects list failed', cause)
    return error('项目数据暂时无法读取', 503)
  }
}
