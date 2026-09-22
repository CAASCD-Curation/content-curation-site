/**
 * 三维空间模型配置与静态常量
 * 包含资产列表、漫游预设机位、图层定义及物理碰撞常量
 */

export const MODEL_BASE_URL = '/assets/spatial/model/'

export const MODEL_ASSETS = {
  outside: {
    file: '0828-site1.3-outside.glb',
    label: '室外与外壳',
  },
  stairs: {
    file: '0828-site1.3-stairs.glb',
    label: '楼梯',
  },
  env: {
    file: '0828-site1.3-env.glb',
    label: '环境',
  },
  inner: {
    file: '0828-site1.3-inner.glb',
    label: '室内楼层',
  },
  navigation: {
    file: '0828-site1.3-web_nav.glb',
    label: '导航热区',
  },
}

export const MODEL_FILE_LABEL = '0828-site1.3 分层模型组'

// 非房间热区的空间目录项通过模型图层建立关联。
export const SPATIAL_ROOM_LAYER_IDS = {
  room13: ['stair-inside', 'stair-midside', 'stair-outside'],
}

export const DEBUG_LAYER_GROUPS = [
  {
    id: 'group-arch',
    label: 'ARCH (建筑主体架构)',
    assetKey: 'outside',
    nodeNames: ['ARCH'],
    children: [
      { id: 'facede-inside', label: 'facede-inside (内立面)', assetKey: 'outside', nodeNames: ['facede-inside'] },
      { id: 'wall-midside', label: 'wall-midside (中间隔墙)', assetKey: 'outside', nodeNames: ['wall-midside'] },
      { id: 'doors', label: 'doors (门扇系统)', assetKey: 'outside', nodeNames: ['doors'] },
      { id: 'stair-inside', label: 'stair-inside (室内楼梯)', assetKey: 'stairs', nodeNames: ['stair-inside'] },
      { id: 'stair-midside', label: 'stair-midside (中庭楼梯)', assetKey: 'stairs', nodeNames: ['stair-midside'] },
      { id: 'stair-outside', label: 'stair-outside (室外楼梯)', assetKey: 'stairs', nodeNames: ['stair-outside'] },
    ],
  },
  {
    id: 'group-room',
    label: 'ROOM (室内楼层空间)',
    assetKey: 'inner',
    nodeNames: ['ROOM'],
    children: [
      { id: 'floor-1f', label: '1F 空间与结构', assetKey: 'inner', nodeNames: ['1F'] },
      { id: 'floor-2f', label: '2F 空间与结构', assetKey: 'inner', nodeNames: ['2F'] },
      { id: 'floor-3f', label: '3F 空间与结构', assetKey: 'inner', nodeNames: ['3F'] },
    ],
  },
  {
    id: 'group-dec',
    label: 'DEC (外饰与场地装饰)',
    assetKey: 'outside',
    nodeNames: ['DEC'],
    children: [
      { id: 'facede-front', label: 'facede-front (前立面)', assetKey: 'outside', nodeNames: ['facede-front'] },
      { id: 'facade-back', label: 'facade-back (背立面)', assetKey: 'outside', nodeNames: ['facade-back'] },
      { id: 'wall-outside', label: 'wall-outside (外墙)', assetKey: 'outside', nodeNames: ['wall-outside'] },
      { id: 'roof', label: 'roof (屋面顶棚)', assetKey: 'outside', nodeNames: ['roof'] },
      { id: 'ground', label: 'ground (室外地面)', assetKey: 'outside', nodeNames: ['ground'] },
      { id: 'env', label: 'env (场地地形环境)', assetKey: 'env', nodeNames: ['env'] },
    ],
  },
  {
    id: 'group-nav',
    label: 'WEB_NAV (空间导航热区)',
    assetKey: 'navigation',
    nodeNames: ['WEB_NAV'],
    children: [
      { id: 'web-nav', label: 'WEB_NAV (12个房间热区网格)', assetKey: 'navigation', nodeNames: ['WEB_NAV'] },
    ],
  },
]

export const DEBUG_LAYER_DEFINITIONS = [
  ...DEBUG_LAYER_GROUPS,
  ...DEBUG_LAYER_GROUPS.flatMap((group) => group.children || []),
]

export const DEBUG_LAYER_BY_ID = new Map(DEBUG_LAYER_DEFINITIONS.map((layer) => [layer.id, layer]))

export const STATIC_BATCH_ROOTS = [
  'facede-inside',
  'stair-inside',
  'stair-outside',
  'doors',
  'wall-midside',
  '1F',
  '2F',
  '3F',
  'facede-front',
  'env',
  'roof',
  'wall-outside',
  'facade-back',
  'Layer0',
]

export const IMMERSIVE_VIEW_PRESETS = {
  room1: {
    position: [122.924, 2.8, -406.436],
    target: [122.15, 2.798, -407.068],
    fov: 67,
  },
  room2: {
    position: [98.969, 2.8, -409.615],
    target: [97.97, 2.769, -409.631],
    fov: 50,
  },
  room3: {
    position: [37.528, 2.8, -405.389],
    target: [37.528, 2.8, -406.389],
    fov: 63,
  },
  room4: {
    position: [32.774, 2.8, -405.868],
    target: [32.3, 2.812, -406.749],
    fov: 50,
  },
  room5: {
    position: [76.517, 6.56, -407.255],
    target: [77.294, 6.743, -407.856],
    fov: 50,
  },
  room6: {
    position: [58.976, 6.56, -415.305],
    target: [59.76, 6.508, -414.686],
    fov: 50,
  },
  room7: {
    position: [48.105, 6.56, -413.68],
    target: [48.64, 6.787, -412.867],
    fov: 69,
  },
  room8: {
    position: [30.43, 6.56, -407.018],
    target: [30.911, 6.607, -407.893],
    fov: 50,
  },
  room9: {
    position: [27.278, 7.116, -405.797],
    target: [27.276, 7.03, -406.793],
    fov: 68,
  },
  room10: {
    position: [60.315, 10.101, -407.523],
    target: [61.133, 10.059, -408.097],
    fov: 50,
  },
  room11: {
    position: [54.559, 10.101, -406.982],
    target: [55.192, 10.104, -407.756],
    fov: 78,
  },
  room12: {
    position: [43.539, 10.061, -406.594],
    target: [42.987, 10.06, -407.428],
    fov: 69,
  },
}

// 个别词条的三维浏览点不跟随其平面空间归属，直接复用模型中已标定的机位。
export const IMMERSIVE_TOPIC_PRESET_ROOMS = {
  楼梯间: 'room1',
}

export const DEFAULT_IMMERSIVE_FOV = 50
export const MIN_IMMERSIVE_FOV = 35
export const MAX_IMMERSIVE_FOV = 85
export const PLAYER_EYE_HEIGHT = 1.6
export const PLAYER_RADIUS = 0.34
export const MAX_STEP_HEIGHT = 0.72
export const MAX_DROP_HEIGHT = 1.8

export function clampImmersiveFov(value) {
  const num = Number(value) || DEFAULT_IMMERSIVE_FOV
  return Math.min(Math.max(num, MIN_IMMERSIVE_FOV), MAX_IMMERSIVE_FOV)
}

export function presetForRoom(roomId, keyword = '') {
  const presetRoomId = IMMERSIVE_TOPIC_PRESET_ROOMS[keyword] || roomId
  return IMMERSIVE_VIEW_PRESETS[presetRoomId] || {
    offset: { x: 0, z: 0 },
    direction: [0, 0, -1],
  }
}

export function immersiveFovFor(roomId, keyword = '') {
  return clampImmersiveFov(presetForRoom(roomId, keyword).fov)
}

export function roomIdFromNodeName(name) {
  return `room${name.slice(1)}`
}

export function formatVector(values) {
  return Array.isArray(values)
    ? values.map((value) => Number(value).toFixed(3)).join(', ')
    : '—'
}

export function vectorSnapshot(vector) {
  return vector?.toArray?.().map((value) => Number(value.toFixed(3))) || []
}

export function requiredAssetKeysForMode(mode) {
  if (mode === 'overview') return ['outside', 'stairs', 'env', 'navigation']
  if (mode === 'section') return ['outside', 'stairs', 'inner', 'navigation']
  return ['outside', 'stairs', 'inner']
}
