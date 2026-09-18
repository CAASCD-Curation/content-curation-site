const PROJECT_SELECT = `
  SELECT p.id, p.year, p.group_id AS groupId, g.code AS groupCode,
         p.repository_name AS repositoryName, p.repository_url AS repositoryUrl,
         p.title, p.description, p.live_url AS liveUrl, p.cover_url AS coverUrl,
         p.status, p.snapshot_members_json AS snapshotMembersJson,
         p.snapshot_topic_label AS snapshotTopicLabel,
         (
           SELECT json_group_array(json_object('displayName', members.displayName, 'className', members.className))
           FROM (
             SELECT u.display_name AS displayName, u.class_name AS className
             FROM group_members gm
             JOIN users u ON u.id = gm.user_id AND u.role = 'student'
             WHERE gm.group_id = p.group_id
             ORDER BY gm.joined_at, lower(u.username), u.id
           ) members
         ) AS currentMembersJson,
         (
           SELECT t.label
           FROM topic_assignments a
           JOIN topics t ON t.id = a.topic_id
           WHERE a.group_id = p.group_id
         ) AS currentTopicLabel,
         p.first_published_at AS firstPublishedAt, p.published_at AS publishedAt,
         p.created_at AS createdAt, p.updated_at AS updatedAt
  FROM student_projects p
  JOIN course_groups g ON g.id = p.group_id
`

export const projectSelect = PROJECT_SELECT

const PROJECT_TOPIC_SLUGS = {
  '阳台': 'balcony',
  '谷仓': 'barn',
  '蓄水池': 'reservoir',
  '桌面': 'desktop',
  '码头': 'wharf',
  '影院': 'cinema',
  '楼梯间': 'stairwell',
  '隧道': 'tunnel',
  '工厂': 'factory',
  '黄页': 'yellow-pages',
  '暗房': 'darkroom',
  '客厅': 'living-room',
  '橱窗': 'shop-window',
  '晒场': 'sunfield',
  '监控室': 'monitor-room',
  '田': 'field',
}

const fallbackSlug = (value) => String(value || 'project')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'project'

export const projectTopicSlug = (label) => PROJECT_TOPIC_SLUGS[String(label || '').trim()] || fallbackSlug(label)

export const projectRouteId = (row) => {
  const topic = row.snapshotTopicLabel || row.currentTopicLabel || row.groupCode
  return projectTopicSlug(topic)
}

function parseMembers(value) {
  if (!value) return []
  try {
    const members = JSON.parse(value)
    return Array.isArray(members) ? members.map((member) => ({
      displayName: String(member?.displayName || ''),
      className: member?.className ? String(member.className) : null,
    })).filter((member) => member.displayName) : []
  } catch {
    return []
  }
}

export function serializeProject(row, { admin = false } = {}) {
  const archived = Boolean(row.firstPublishedAt)
  const project = {
    id: row.id,
    routeId: projectRouteId(row),
    year: Number(row.year),
    groupCode: row.groupCode,
    repositoryName: row.repositoryName,
    repositoryUrl: row.repositoryUrl,
    title: row.title || '',
    description: row.description || '',
    liveUrl: row.liveUrl || '',
    coverUrl: row.coverUrl || '',
    members: parseMembers(archived ? row.snapshotMembersJson : row.currentMembersJson),
    topicLabel: (archived ? row.snapshotTopicLabel : row.currentTopicLabel) || '',
    publishedAt: row.publishedAt || null,
    status: admin ? row.status : 'published',
  }
  if (admin) {
    const missingFields = []
    if (!project.title) missingFields.push('项目标题')
    if (!project.description) missingFields.push('项目简介')
    if (!project.repositoryUrl) missingFields.push('GitHub 仓库')
    if (!project.liveUrl) missingFields.push('线上地址')
    if (!project.members.length) missingFields.push('小组成员')
    if (!project.topicLabel) missingFields.push('选题')

    project.groupId = row.groupId
    project.firstPublishedAt = row.firstPublishedAt || null
    project.createdAt = row.createdAt
    project.updatedAt = row.updatedAt
    project.canPublish = missingFields.length === 0
    project.missingFields = missingFields
  }
  return project
}

export function normalizeYear(value) {
  const year = Number(value)
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null
}

function normalizeText(value, maxLength, { required = false } = {}) {
  if (value === undefined) return { present: false }
  if (typeof value !== 'string') return { error: '字段格式不正确' }
  const normalized = value.trim()
  if (required && !normalized) return { error: '字段不能为空' }
  if (normalized.length > maxLength) return { error: `字段不能超过 ${maxLength} 个字符` }
  return { present: true, value: normalized || null }
}

function normalizeUrl(value, { required = false } = {}) {
  const text = normalizeText(value, 2048, { required })
  if (text.error || !text.present || text.value === null) return text
  try {
    const url = new URL(text.value)
    if (url.protocol !== 'https:') return { error: '网址必须使用 HTTPS' }
    return { present: true, value: url.href }
  } catch {
    return { error: '请填写有效的 HTTPS 网址' }
  }
}

export function validateProjectPatch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: '请提供有效的项目资料' }
  const allowedFields = new Set(['title', 'description', 'liveUrl', 'coverUrl'])
  if (Object.keys(body).some((key) => !allowedFields.has(key))) return { error: '项目资料包含不允许修改的字段' }
  const fields = {
    title: normalizeText(body.title, 120),
    description: normalizeText(body.description, 2000),
    live_url: normalizeUrl(body.liveUrl),
    cover_url: normalizeUrl(body.coverUrl),
  }
  for (const field of Object.values(fields)) {
    if (field.error) return { error: field.error }
  }
  const updates = Object.entries(fields).filter(([, field]) => field.present).map(([column, field]) => ({ column, value: field.value }))
  if (!updates.length) return { error: '没有可保存的项目资料' }
  return { updates }
}

export async function getPublicationSource(env, project) {
  const [membersResult, topic] = await Promise.all([
    env.DB.prepare(`
      SELECT u.display_name AS displayName, u.class_name AS className
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id AND u.role = 'student'
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at, lower(u.username), u.id
    `).bind(project.groupId).all(),
    env.DB.prepare(`
      SELECT t.label
      FROM topic_assignments a
      JOIN topics t ON t.id = a.topic_id
      WHERE a.group_id = ?
    `).bind(project.groupId).first(),
  ])
  return {
    members: (membersResult.results || []).map((member) => ({
      displayName: member.displayName,
      className: member.className || null,
    })),
    topicLabel: topic?.label || '',
  }
}
