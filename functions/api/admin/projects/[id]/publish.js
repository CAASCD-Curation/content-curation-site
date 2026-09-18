import { assertSameOrigin, error, json, requireAdmin } from '../../../_utils.js'
import { getPublicationSource, projectSelect, serializeProject } from '../../../_projectUtils.js'

export async function onRequestPost(context) {
  const { request, env, params } = context
  const auth = await requireAdmin(request, env)
  if (auth.response) return auth.response
  if (!assertSameOrigin(request)) return error('来源校验失败', 403)

  try {
    const project = await env.DB.prepare(`${projectSelect} WHERE p.id = ?`).bind(params.id).first()
    if (!project) return error('项目不存在', 404)
    if (!project.title?.trim()) return error('发布前请填写项目标题', 409)
    if (!project.description?.trim()) return error('发布前请填写项目简介', 409)
    try {
      const liveUrl = new URL(project.liveUrl || '')
      if (liveUrl.protocol !== 'https:') throw new Error('invalid protocol')
    } catch {
      return error('发布前请填写有效的 HTTPS 线上地址', 409)
    }

    if (!project.firstPublishedAt) {
      const source = await getPublicationSource(env, project)
      if (!source.members.length) return error('发布前请先确认小组成员', 409)
      if (!source.topicLabel) return error('发布前请先完成小组选题', 409)
    } else {
      let members = []
      try { members = JSON.parse(project.snapshotMembersJson || '[]') } catch { members = [] }
      if (!Array.isArray(members) || !members.length || !project.snapshotTopicLabel) return error('项目年度快照不完整，无法发布', 409)
    }

    const results = await env.DB.batch([
      env.DB.prepare(`
        UPDATE student_projects
        SET snapshot_members_json = CASE WHEN first_published_at IS NULL THEN (
              SELECT json_group_array(json_object('displayName', members.displayName, 'className', members.className))
              FROM (
                SELECT u.display_name AS displayName, u.class_name AS className
                FROM group_members gm
                JOIN users u ON u.id = gm.user_id AND u.role = 'student'
                WHERE gm.group_id = student_projects.group_id
                ORDER BY gm.joined_at, lower(u.username), u.id
              ) members
            ) ELSE snapshot_members_json END,
            snapshot_topic_label = CASE WHEN first_published_at IS NULL THEN (
              SELECT t.label
              FROM topic_assignments a
              JOIN topics t ON t.id = a.topic_id
              WHERE a.group_id = student_projects.group_id
            ) ELSE snapshot_topic_label END,
            status = 'published',
            first_published_at = COALESCE(first_published_at, CURRENT_TIMESTAMP),
            published_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND (
          first_published_at IS NOT NULL OR (
            EXISTS (
              SELECT 1
              FROM group_members gm
              JOIN users u ON u.id = gm.user_id AND u.role = 'student'
              WHERE gm.group_id = student_projects.group_id
            )
            AND EXISTS (SELECT 1 FROM topic_assignments a WHERE a.group_id = student_projects.group_id)
          )
        )
      `).bind(params.id),
      env.DB.prepare(`${projectSelect} WHERE p.id = ?`).bind(params.id),
    ])
    if (Number(results[0]?.meta?.changes || 0) !== 1) return error('小组成员或选题已变化，请刷新后重试', 409)
    const updated = results[1]?.results?.[0]
    return json({ project: serializeProject(updated, { admin: true }) })
  } catch (cause) {
    console.error('admin project publish failed', cause)
    return error('项目发布失败', 503)
  }
}
