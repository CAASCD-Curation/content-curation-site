import { works2025 } from './2025.js'

const workMarkers = {
  jiejie: '绳',
  headline: '发',
  'northward-river': '尺',
  'chess-box': '棋',
  threshold: '钥',
  'four-hat-act': '帽',
  'hand-held-drama': '手',
  'why-we-look': '眼',
  'black-chamber': '信',
}

const workKeywords = {
  jiejie: ['编织', '关系', '结构', '记忆'],
  headline: ['身份', '身体', '权力', '装扮'],
  'northward-river': ['国企改革', '下岗潮', '家庭', '尺度'],
  'chess-box': ['国际象棋', '手提箱', '微型展览', '杜尚'],
  threshold: ['精密', '阈限', '钥匙', '开启'],
  'four-hat-act': ['轻与重', '帽子', '象征', '剧场'],
  'hand-held-drama': ['手套', '劳动', '身份', '文明'],
  'why-we-look': ['观看', '眼睛', '凝视', '媒介'],
  'black-chamber': ['信箱', '黑匣子', '隐私', '通信'],
}

const workThemeColors = {
  jiejie: '#ce33b7',
  headline: '#5ea6cd',
  'northward-river': '#5b8e5d',
  'chess-box': '#dcc55d',
  threshold: '#618888',
  'four-hat-act': '#8b3455',
  'hand-held-drama': '#4465ac',
  'why-we-look': '#6d5782',
  'black-chamber': '#4f4f4f',
}

export const projectThemeColors = {
  A1: '#d81b60',
  A2: '#3158d8',
  A3: '#7040c0',
  A4: '#c74a00',
  A5: '#007fae',
  A6: '#a62bbf',
  A7: '#007a5b',
  A8: '#d8327b',
  B1: '#008e83',
  B2: '#d72f5d',
  B3: '#6340c7',
  B4: '#0072c6',
  B5: '#b37800',
  B6: '#4b8f1f',
  B7: '#c52d72',
  B8: '#008f7e',
}

const works2025Index = works2025.map((work, index) => ({
  id: work.id,
  year: '2025',
  number: String(index + 1).padStart(2, '0'),
  title: work.name,
  titleEn: work.nameEn,
  topic: work.topic,
  authors: work.authors.students,
  summary: work.descriptionZh[0],
  keywords: workKeywords[work.id] || [],
  preview: `/works/2025/${work.images[0].filename.replace(/-01\.(gif|webp)$/i, '-thumb.webp')}`,
  previewAlt: `${work.name}项目预览`,
  gallery: (work.images || []).map((img) => `/works/2025/${img.filename}`),
  marker: workMarkers[work.id] || '作',
  themeColor: workThemeColors[work.id] || '#3f3f3a',
}))

export const workYears = [
  { id: '2025', label: '2025', note: '策展超市 · 已归档' },
  { id: '2026', label: '2026', note: '内容与策展2026 · 进行中' },
]

const worksByYear = {
  2025: works2025Index,
  2026: [],
}

export const getWorksForYear = (year) => worksByYear[year] || worksByYear[2025]
