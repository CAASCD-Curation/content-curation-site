import { error, json } from './_utils.js'

export async function onRequestGet(context) {
  const { env } = context
  if (!env.DB) return error('D1 数据库尚未绑定', 503)

  try {
    const [roomsResult, topicsResult, groupsResult] = await env.DB.batch([
      env.DB.prepare('SELECT id, number, name, sort_order, model_layer_ids_json AS modelLayerIds FROM rooms ORDER BY sort_order, id'),
      env.DB.prepare(`
        SELECT id, label, source, room_id AS roomId, color_token AS colorToken, sort_order AS sortOrder
        FROM topics
        WHERE is_active = 1
        ORDER BY sort_order, id
      `),
      env.DB.prepare(`
        SELECT g.id, g.code, g.sort_order AS sortOrder, a.topic_id AS topicId, t.label AS topicLabel
        FROM course_groups g
        LEFT JOIN topic_assignments a ON a.group_id = g.id
        LEFT JOIN topics t ON t.id = a.topic_id
        ORDER BY g.sort_order, g.id
      `),
    ])

    const topics = topicsResult.results || []
    const rooms = (roomsResult.results || []).map((room) => ({
      id: room.id,
      number: room.number,
      name: room.name,
      keywords: topics.filter((topic) => topic.roomId === room.id).map((topic) => topic.label),
      modelLayerIds: parseModelLayerIds(room.modelLayerIds),
    }))

    return json({
      rooms,
      topics,
      groups: groupsResult.results || [],
      generatedAt: new Date().toISOString(),
    })
  } catch (cause) {
    console.error('course-state failed', cause)
    return error('课程数据暂时无法读取', 503)
  }
}

function parseModelLayerIds(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
