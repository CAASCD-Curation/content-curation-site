// 课程选题目录是本地课程状态、空间地图和视觉标识的唯一来源。
// 数组顺序即课程选题的业务排序。
export const topicCatalog = [
  { label: '客厅', roomId: 'room1', colorToken: 'var(--home-spot-03)', sortOrder: 1 },
  { label: '码头', roomId: 'room1', colorToken: 'var(--home-spot-15)', sortOrder: 15 },
  { label: '橱窗', roomId: 'room2', colorToken: 'var(--home-spot-02)', sortOrder: 2 },
  { label: '隧道', roomId: 'room2', colorToken: 'var(--home-spot-14)', sortOrder: 3 },
  { label: '桌面', roomId: 'room3', colorToken: 'var(--home-spot-01)', sortOrder: 4 },
  { label: '蓄水池', roomId: 'room3', colorToken: 'var(--home-spot-05)', sortOrder: 6 },
  { label: '暗房', roomId: 'room4', colorToken: 'var(--home-spot-04)', sortOrder: 5 },
  { label: '影院', roomId: 'room4', colorToken: 'var(--home-spot-16)', sortOrder: 16 },
  { label: '工厂', roomId: 'room5', colorToken: 'var(--home-spot-17)', sortOrder: 17 },
  { label: '田', roomId: 'room6', colorToken: 'var(--home-spot-07)', sortOrder: 7 },
  { label: '黄页', roomId: 'room7', colorToken: 'var(--home-spot-06)', sortOrder: 8 },
  { label: '晒场', roomId: 'room8', colorToken: 'var(--home-spot-08)', sortOrder: 9 },
  { label: '阳台', roomId: 'room9', colorToken: 'var(--home-spot-09)', sortOrder: 10 },
  { label: '宴席', roomId: 'room10', colorToken: 'var(--home-spot-10)', sortOrder: 11 },
  { label: '谷仓', roomId: 'room11', colorToken: 'var(--home-spot-11)', sortOrder: 12 },
  { label: '楼梯间', roomId: 'room13', colorToken: 'var(--home-spot-12)', sortOrder: 13 },
  { label: '监控室', roomId: 'room12', colorToken: 'var(--home-spot-13)', sortOrder: 14 },
]

export const topicColors = Object.fromEntries(
  topicCatalog.map(({ label, colorToken }) => [label, colorToken]),
)
