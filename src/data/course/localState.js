import { topicCatalog } from '../topics/catalog.js'
import { SPATIAL_ROOM_LAYER_IDS } from '../spatial/modelConfig.js'

const roomKeywords = topicCatalog.reduce((map, { label, roomId }) => {
  map[roomId] ||= []
  map[roomId].push(label)
  return map
}, {})

export function getLocalCourseState() {
  return {
    rooms: Array.from({ length: 12 }, (_, index) => {
      const id = `room${index + 1}`
      return {
        id,
        number: String(index + 1).padStart(2, '0'),
        name: `空间 ${String(index + 1).padStart(2, '0')}`,
        keywords: [...(roomKeywords[id] || [])],
        modelLayerIds: [...(SPATIAL_ROOM_LAYER_IDS[id] || [])],
      }
    }).concat({
      id: 'room13',
      number: '13',
      name: '楼梯间',
      keywords: [...(roomKeywords.room13 || [])],
      modelLayerIds: [...SPATIAL_ROOM_LAYER_IDS.room13],
    }),
    topics: topicCatalog.map(({ label, roomId, colorToken, sortOrder }, index) => ({
      id: index + 1,
      label,
      source: 'system',
      roomId,
      colorToken,
      sortOrder,
    })),
    groups: Array.from({ length: 16 }, (_, index) => ({
      id: `group-${index < 8 ? 'a' : 'b'}${(index % 8) + 1}`,
      code: `${index < 8 ? 'A' : 'B'}${(index % 8) + 1}`,
      sortOrder: index + 1,
      topicId: null,
      topicLabel: null,
    })),
  }
}
