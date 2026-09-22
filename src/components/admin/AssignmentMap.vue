<template>
  <section class="admin-block" aria-labelledby="topics-title">
    <header class="admin-block-heading">
      <div>
        <p class="eyebrow">01 · Assignment Map</p>
        <h2 id="topics-title">小组、词条与空间</h2>
      </div>
      <form class="inline-form" @submit.prevent="addTopic">
        <input v-model="newTopic" maxlength="24" placeholder="添加自定义词" aria-label="自定义词" required />
        <button type="submit" :disabled="busy">添加</button>
      </form>
    </header>
    <div class="admin-topic-matcher">
      <p class="admin-topic-matcher-hint">左侧为小组选词；点击中间词条，再点击右侧空间完成归属。已匹配小组可点击连线取消。</p>
      <div :ref="setTopicMatcherBoard" class="admin-topic-connection-board">
        <svg
          v-if="connectionLayout.width && connectionLayout.height"
          class="admin-topic-connections"
          :viewBox="`0 0 ${connectionLayout.width} ${connectionLayout.height}`"
          preserveAspectRatio="none"
          role="group"
          aria-label="小组与词条的连接关系"
        >
          <path
            v-for="connection in topicConnections"
            :key="connection.id"
            class="admin-topic-connection-line"
            :class="{
              'is-selected': connection.topicId === selectedTopicId,
              'is-group-connection': connection.kind === 'group',
              'is-active': activeConnectionId === connection.id,
            }"
            :d="connection.path"
          />
          <path
            v-for="connection in interactiveGroupConnections"
            :key="`${connection.id}-hit`"
            class="admin-topic-connection-hit-area"
            :d="connection.path"
            role="button"
            tabindex="0"
            :aria-label="connectionLabel(connection)"
            @pointerenter="activateConnection(connection.id)"
            @pointerleave="deactivateConnection(connection.id)"
            @focus="activateConnection(connection.id)"
            @blur="deactivateConnection(connection.id)"
            @click="clearGroupTopicConnection(connection)"
            @keydown="handleConnectionKeydown($event, connection)"
          />
          <path
            v-for="connection in interactiveRoomConnections"
            :key="`${connection.id}-hover`"
            class="admin-topic-connection-hit-area"
            :d="connection.path"
            @pointerenter="activateConnection(connection.id)"
            @pointerleave="deactivateConnection(connection.id)"
          />
        </svg>
        <div class="admin-connection-column admin-connection-groups" aria-label="小组选词">
          <p class="admin-connection-label">小组选词</p>
          <div
            v-for="group in rosterGroups"
            :key="group.id"
            class="admin-connection-node admin-group-node"
            :data-group-connection-id="group.id"
            :class="{
              'is-unassigned': !group.topicId,
              'is-connected': group.topicId,
              'is-connection-active': isGroupConnectionActive(group.id),
            }"
          >
            <strong>{{ group.code }}</strong>
            <template v-if="group.topicId">
              <span class="admin-group-topic" :title="groupTopicLabel(group)">
                {{ topicDisplayLabel(groupTopicLabel(group)) }}
              </span>
              <button
                type="button"
                class="admin-group-clear"
                :disabled="busy"
                :aria-label="`${group.code} 取消 ${groupTopicLabel(group)} 的连接`"
                @click="clearGroupTopicConnection(group)"
              >
                取消
              </button>
            </template>
            <select
              v-else
              :value="group.topicId || ''"
              :aria-label="`${group.code} 选词`"
              :disabled="busy"
              @change="setGroupTopic(group, $event.target.value)"
            >
              <option value="">待匹配</option>
              <option v-for="topic in orderedTopics" :key="topic.id" :value="topic.id">{{ topicDisplayLabel(topic.label) }}</option>
            </select>
          </div>
        </div>
        <div class="admin-connection-column admin-connection-topics" aria-label="词条">
          <p class="admin-connection-label">词条</p>
          <button
            v-for="topic in orderedTopics"
            :key="topic.id"
            type="button"
            class="admin-connection-node admin-topic-word"
            :data-topic-connection-id="topic.id"
            :class="{
              'is-selected': selectedTopicId === topic.id,
              'is-unassigned': !topic.roomId,
              'is-connection-active': isTopicConnectionActive(topic.id),
            }"
            :aria-pressed="selectedTopicId === topic.id"
            @click="selectTopic(topic.id)"
          >
            <span>{{ topicDisplayLabel(topic.label) }}</span>
          </button>
        </div>
        <div class="admin-connection-column admin-connection-rooms" aria-label="空间">
          <div class="admin-room-connection-heading">
            <p class="admin-connection-label">空间</p>
            <span>{{ assignedTopicCount }} / {{ orderedTopics.length }}</span>
          </div>
          <button
            v-for="room in rooms"
            :key="room.id"
            type="button"
            class="admin-connection-node admin-room-slot"
            :data-room-connection-id="room.id"
            :class="{ 'has-topics': roomTopics(room.id).length, 'is-ready': selectedTopic }"
            :aria-label="roomAssignmentLabel(room)"
            :disabled="busy"
            @click="assignSelectedTopic(room)"
          >
            <span class="admin-room-slot-main">
              <svg
                v-if="roomGeometry(room.id)"
                class="admin-room-shape-icon"
                :viewBox="roomIconViewBox(room.id)"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                <g :transform="roomGeometry(room.id).transform">
                  <component
                    :is="roomGeometry(room.id).type"
                    class="admin-room-shape-icon-path"
                    v-bind="roomGeometryProps(roomGeometry(room.id))"
                  />
                </g>
              </svg>
              <svg
                v-else-if="room.modelLayerIds?.length"
                class="admin-room-shape-icon"
                viewBox="0 0 48 30"
                aria-hidden="true"
              >
                <path
                  class="admin-room-shape-icon-path"
                  d="M3 25h9v-5h9v-5h9v-5h9V5h6v20H3Z"
                />
              </svg>
              <strong>{{ room.name }}</strong>
            </span>
            <span>{{ roomTopics(room.id).length }} 词</span>
          </button>
        </div>
      </div>
      <p class="sr-only" aria-live="polite">{{ topicMatcherMessage }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { spatialRoomGeometries } from '../../data/spatial/roomGeometry.js'
import {
  assignGroupTopic,
  clearGroupTopic,
  createTopic,
  updateTopicRoom,
} from '../../services/courseState.js'

const props = defineProps({
  orderedTopics: { type: Array, required: true },
  rosterGroups: { type: Array, required: true },
  rooms: { type: Array, required: true },
  assignedTopicCount: { type: Number, required: true },
})

const { busy, runAction, showMessage } = inject('adminContext')

const newTopic = ref('')
const selectedTopicId = ref(null)
const activeConnectionId = ref(null)
const topicMatcherBoard = ref(null)
const connectionLayout = ref({ width: 0, height: 0, groups: {}, topicsLeft: {}, topicsRight: {}, rooms: {} })
let topicMatcherResizeObserver
let connectionLayoutScheduled = false

const roomIconViewBoxes = {
  room1: '145 105 1130 335',
  room2: '744 260 1332 180',
  room3: '2242 351 139 88',
  room4: '2386 351 301 88',
  room5: '1044 172 285 173',
  room6: '1488 260 300 85',
  room7: '1794 138 283 207',
  room8: '2242 260 292 85',
  room9: '2539 176 148 169',
  room10: '1335 90 453 165',
  room11: '1637 40 297 214',
  room12: '2084 81 450 174',
}
const roomGeometry = (roomId) => spatialRoomGeometries[roomId]
const roomIconViewBox = (roomId) => roomIconViewBoxes[roomId] || '0 0 2900 480'
const topicDisplayLabel = (label) => {
  const characters = Array.from(String(label || ''))
  return characters.length === 2 ? `${characters[0]}　${characters[1]}` : characters.join('')
}
const roomGeometryProps = (geometry) => {
  if (!geometry) return {}
  const { type, transform, ...rest } = geometry
  return rest
}

const selectedTopic = computed(() => props.orderedTopics.find((topic) => topic.id === selectedTopicId.value) || null)
const activeConnection = computed(() => topicConnections.value.find((connection) => connection.id === activeConnectionId.value) || null)
const interactiveGroupConnections = computed(() => topicConnections.value.filter((connection) => connection.kind === 'group'))
const interactiveRoomConnections = computed(() => topicConnections.value.filter((connection) => connection.kind === 'room'))
const groupTopicLabel = (group) => group.topicLabel || props.orderedTopics.find((topic) => topic.id === group.topicId)?.label || '未命名词条'
const isGroupConnectionActive = (groupId) => activeConnection.value?.groupId === groupId
const isTopicConnectionActive = (topicId) => activeConnection.value?.topicId === topicId
const connectionPath = (start, end) => {
  const curveOffset = Math.max(24, (end.x - start.x) / 2)
  return `M ${start.x} ${start.y} C ${start.x + curveOffset} ${start.y}, ${end.x - curveOffset} ${end.y}, ${end.x} ${end.y}`
}
const topicConnections = computed(() => {
  const groupConnections = props.rosterGroups.map((group) => {
    if (!group.topicId) return null
    const start = connectionLayout.value.groups[group.id]
    const end = connectionLayout.value.topicsLeft[group.topicId]
    if (!start || !end) return null
    return {
      id: `group-${group.id}`,
      kind: 'group',
      groupId: group.id,
      topicId: group.topicId,
      path: connectionPath(start, end),
    }
  })
  const roomConnections = props.orderedTopics.map((topic) => {
    if (!topic.roomId) return null
    const start = connectionLayout.value.topicsRight[topic.id]
    const end = connectionLayout.value.rooms[topic.roomId]
    if (!start || !end) return null
    return {
      id: `room-${topic.id}`,
      kind: 'room',
      topicId: topic.id,
      path: connectionPath(start, end),
    }
  })
  return [...groupConnections, ...roomConnections].filter(Boolean)
})
const connectionLabel = (connection) => {
  const group = props.rosterGroups.find((item) => item.id === connection.groupId)
  const topic = props.orderedTopics.find((item) => item.id === connection.topicId)
  return group && topic
    ? `${group.code} 已连接 ${topic.label}，点击取消连接`
    : '小组选词连接，点击取消连接'
}
const topicMatcherMessage = computed(() => (
  selectedTopic.value
    ? `已选择词条：${selectedTopic.value.label}。请选择一个空间完成归属。`
    : '可在左侧为小组选择词条；请选择中间词条，再选择空间。'
))

const updateConnectionLayout = () => {
  connectionLayoutScheduled = false
  const board = topicMatcherBoard.value
  if (!board) return
  const boardRect = board.getBoundingClientRect()
  const pointFor = (element, edge) => {
    if (!element) return null
    const rect = element.getBoundingClientRect()
    return {
      x: edge === 'right' ? rect.right - boardRect.left : rect.left - boardRect.left,
      y: rect.top - boardRect.top + (rect.height / 2),
    }
  }
  connectionLayout.value = {
    width: Math.round(boardRect.width),
    height: Math.round(boardRect.height),
    groups: Object.fromEntries([...board.querySelectorAll('[data-group-connection-id]')].map((element) => [
      element.dataset.groupConnectionId,
      pointFor(element, 'right'),
    ])),
    topicsLeft: Object.fromEntries([...board.querySelectorAll('[data-topic-connection-id]')].map((element) => [
      element.dataset.topicConnectionId,
      pointFor(element, 'left'),
    ])),
    topicsRight: Object.fromEntries([...board.querySelectorAll('[data-topic-connection-id]')].map((element) => [
      element.dataset.topicConnectionId,
      pointFor(element, 'right'),
    ])),
    rooms: Object.fromEntries([...board.querySelectorAll('[data-room-connection-id]')].map((element) => [
      element.dataset.roomConnectionId,
      pointFor(element, 'left'),
    ])),
  }
}
const scheduleConnectionLayout = () => {
  if (connectionLayoutScheduled) return
  connectionLayoutScheduled = true
  nextTick(() => nextTick(updateConnectionLayout))
}
const setTopicMatcherBoard = (element) => {
  topicMatcherResizeObserver?.disconnect()
  topicMatcherBoard.value = element || null
  if (element && typeof ResizeObserver !== 'undefined') {
    topicMatcherResizeObserver = new ResizeObserver(scheduleConnectionLayout)
    topicMatcherResizeObserver.observe(element)
  }
  scheduleConnectionLayout()
}
const roomTopics = (roomId) => props.orderedTopics.filter((topic) => topic.roomId === roomId)
const roomAssignmentLabel = (room) => {
  const labels = roomTopics(room.id).map((topic) => topic.label)
  const state = labels.length ? `已归属：${labels.join('、')}` : '暂无词条'
  if (!selectedTopic.value) return `${room.name}，${state}。请先选择词条。`
  return selectedTopic.value.roomId === room.id
    ? `${room.name}，${state}。点击可取消 ${selectedTopic.value.label} 的归属。`
    : `${room.name}，${state}。点击可将 ${selectedTopic.value.label} 归属至此。`
}
const selectTopic = (topicId) => {
  selectedTopicId.value = selectedTopicId.value === topicId ? null : topicId
}
const activateConnection = (connectionId) => {
  activeConnectionId.value = connectionId
}
const deactivateConnection = (connectionId) => {
  if (activeConnectionId.value === connectionId) activeConnectionId.value = null
}

const addTopic = () => runAction(async () => {
  await createTopic(newTopic.value.trim())
  newTopic.value = ''
}, '自定义词已添加，可继续指定空间')

const setGroupTopic = (group, topicId) => runAction(
  () => topicId ? assignGroupTopic(group.id, Number(topicId)) : clearGroupTopic(group.id),
  `${group.code} 的选词已更新`,
)

const clearGroupTopicConnection = (target) => {
  const group = target.kind === 'group'
    ? props.rosterGroups.find((item) => item.id === target.groupId)
    : target
  if (!group?.topicId) return
  runAction(async () => {
    await clearGroupTopic(group.id)
    activeConnectionId.value = null
  }, `${group.code} 的选词连接已取消`)
}

const handleConnectionKeydown = (event, connection) => {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  clearGroupTopicConnection(connection)
}
const assignSelectedTopic = (room) => {
  if (!selectedTopic.value) {
    showMessage('请先选择一个词条')
    return
  }
  const topic = selectedTopic.value
  const nextRoomId = topic.roomId === room.id ? null : room.id
  const message = nextRoomId ? `${topic.label} 已归属至 ${room.name}` : `${topic.label} 的空间归属已取消`
  runAction(async () => {
    await updateTopicRoom(topic.id, nextRoomId)
    selectedTopicId.value = null
  }, message)
}

watch(
  () => [props.rosterGroups, props.orderedTopics, props.rooms],
  scheduleConnectionLayout,
  { flush: 'post', deep: true }
)

onBeforeUnmount(() => topicMatcherResizeObserver?.disconnect())
</script>

<style scoped>
.admin-block { margin-top: 3rem; }
.admin-block-heading { margin-bottom: 1rem; display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
.admin-block-heading h2 { margin-top: 0.35rem; font-size: clamp(1.2rem, 2vw, 1.7rem); }
.inline-form { display: flex; gap: 0.4rem; }
.inline-form input { min-height: 2.45rem; border: 1px solid var(--home-ink); border-radius: 0; background: var(--home-paper); padding: 0.4rem 0.6rem; font: inherit; }
.inline-form button { min-height: 2.45rem; border: 1px solid var(--home-ink); border-radius: 0; background: transparent; color: var(--home-ink); padding: 0.4rem 0.8rem; cursor: pointer; font: inherit; }
.inline-form button:disabled { opacity: 0.5; cursor: wait; }

.admin-topic-matcher {
  padding: 1rem 0 0;
  border-top: 1px solid var(--home-rule);
}
.admin-topic-matcher-hint {
  max-width: 35rem;
  margin: 0;
  color: var(--home-muted);
  font-size: 0.78rem;
  line-height: 1.5;
}
.admin-topic-connection-board {
  display: grid;
  grid-template-columns: 11rem minmax(2rem, 1fr) 6rem minmax(2rem, 1fr) 16rem;
  position: relative;
  isolation: isolate;
  gap: 0;
  margin-top: 1rem;
}
.admin-topic-connections {
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.admin-topic-connection-line {
  fill: none;
  stroke: color-mix(in srgb, var(--home-ink) 52%, var(--home-paper));
  stroke-width: 1.75;
  transition: stroke 180ms ease, stroke-width 180ms ease;
}
.admin-topic-connection-hit-area {
  fill: none;
  stroke: transparent;
  stroke-width: 18;
  pointer-events: stroke;
  touch-action: manipulation;
  cursor: pointer;
  outline: none;
}
.admin-topic-connection-line.is-selected {
  stroke: var(--accent-orange);
  stroke-width: 2.5;
}
.admin-topic-connection-line.is-active {
  stroke: var(--accent-orange);
  stroke-width: 3;
}
.admin-connection-column {
  display: flex;
  position: relative;
  z-index: 1;
  flex-direction: column;
  min-width: 0;
}
.admin-connection-topics {
  grid-column: 3;
  gap: 0.4rem;
  align-items: flex-start;
}
.admin-connection-groups {
  grid-column: 1;
  gap: 0.4rem;
  align-items: flex-start;
}
.admin-connection-rooms {
  grid-column: 5;
  align-items: flex-end;
  justify-content: space-between;
}
.admin-connection-label,
.admin-room-connection-heading p,
.admin-room-connection-heading span {
  margin: 0;
  color: var(--home-muted);
  font-size: 0.72rem;
}
.admin-connection-label {
  min-height: 1rem;
  margin-bottom: 0.35rem;
}
.admin-connection-topics > .admin-connection-label {
  width: 6rem;
  max-width: 100%;
  text-align: center;
}
.admin-room-connection-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.35rem;
  min-height: 1rem;
  margin-bottom: 0.35rem;
  width: 16rem;
}
.admin-room-connection-heading .admin-connection-label {
  min-height: 1rem;
  margin: 0;
}
.admin-connection-node {
  min-height: 2.75rem;
  border: 1px solid var(--home-rule);
  border-radius: 0;
  background: var(--home-paper);
  color: var(--home-ink);
  padding: 0.4rem 0.55rem;
  font: inherit;
  line-height: 1.2;
  cursor: pointer;
  transition: background-color 180ms ease, border-color 180ms ease;
}
.admin-group-node {
  display: grid;
  grid-template-columns: 1.8rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.2rem;
  width: min(100%, 11rem);
  padding: 0.3rem 0.35rem;
  text-align: left;
  cursor: default;
}
.admin-group-node.is-connection-active,
.admin-topic-word.is-connection-active {
  border-color: var(--accent-orange);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-orange) 28%, transparent);
}
.admin-group-node.is-connection-active {
  background: color-mix(in srgb, var(--accent-orange) 10%, var(--home-paper));
}
.admin-group-node strong {
  font-size: 0.72rem;
  font-weight: 700;
}
.admin-group-node select {
  grid-column: 2 / -1;
  min-width: 0;
  min-height: 2rem;
  border: 1px solid var(--home-ink);
  border-color: var(--home-rule);
  background: var(--home-paper);
  color: var(--home-ink);
  padding: 0.25rem 0.35rem;
  font-size: 0.68rem;
  cursor: pointer;
}
.admin-group-topic {
  min-width: 0;
  overflow: hidden;
  color: var(--home-ink);
  font-size: 0.68rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.admin-group-clear {
  min-width: 2.45rem;
  min-height: 2rem;
  border: 1px solid var(--home-rule);
  border-radius: 0;
  background: transparent;
  color: var(--home-muted);
  padding: 0.15rem 0.25rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.65rem;
  white-space: nowrap;
}
.admin-group-clear:hover:not(:disabled),
.admin-group-clear:focus-visible {
  border-color: var(--home-ink);
  color: var(--home-ink);
}
.admin-group-clear:disabled {
  cursor: wait;
  opacity: 0.55;
}
.admin-group-node.is-unassigned {
  border-style: dashed;
}
.admin-topic-word {
  display: flex;
  align-items: center;
  align-self: flex-start;
  justify-content: center;
  gap: 0.5rem;
  width: 6rem;
  max-width: 100%;
  border-radius: 999px;
  padding-inline: 0.8rem;
  text-align: center;
}
.admin-topic-word > span,
.admin-room-slot strong {
  font-size: 0.78rem;
  font-weight: 600;
}
.admin-room-slot > span:last-child {
  flex: 0 0 auto;
  color: var(--home-muted);
  font-size: 0.68rem;
}
.admin-topic-word:hover,
.admin-topic-word.is-selected {
  border-color: var(--home-ink);
  background: var(--home-ink);
  color: var(--home-paper);
}
.admin-topic-word.is-connection-active {
  border-color: var(--accent-orange);
  background: color-mix(in srgb, var(--accent-orange) 16%, var(--home-paper));
  color: var(--home-ink);
}
.admin-topic-word.is-unassigned {
  border-style: dashed;
}
.admin-room-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  align-self: flex-end;
  width: min(100%, 16rem);
  max-width: 100%;
  text-align: left;
}
.admin-room-slot-main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 0.55rem;
}
.admin-room-shape-icon {
  display: block;
  flex: 0 0 auto;
  width: 2.4rem;
  height: 1.65rem;
  overflow: visible;
  color: var(--home-muted);
  pointer-events: none;
}
.admin-room-shape-icon-path {
  fill: color-mix(in srgb, var(--home-muted) 14%, var(--home-paper));
  fill-opacity: 0.72;
  stroke: currentColor;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}
.admin-room-slot.has-topics .admin-room-shape-icon,
.admin-room-slot:hover:not(:disabled) .admin-room-shape-icon {
  color: var(--home-ink);
}
.admin-room-slot strong {
  min-width: 0;
}
.admin-room-slot.has-topics {
  border-color: var(--home-ink);
}
.admin-room-slot.is-ready {
  border-style: dashed;
}
.admin-room-slot:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent-orange) 12%, var(--home-paper));
}
.admin-room-slot:disabled {
  cursor: wait;
  opacity: 0.55;
}
.admin-topic-word:focus-visible,
.admin-room-slot:focus-visible,
.admin-group-clear:focus-visible,
.admin-topic-connection-hit-area:focus-visible {
  outline: 2px solid var(--accent-orange);
  outline-offset: 3px;
}
.admin-topic-connection-hit-area:focus-visible {
  stroke: color-mix(in srgb, var(--accent-orange) 28%, transparent);
}
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

@media (prefers-reduced-motion: reduce) {
  .admin-topic-connection-line,
  .admin-connection-node,
  .admin-group-clear {
    transition: none;
  }
}
@media (max-width: 767px) {
  .admin-block-heading {
    align-items: start;
    flex-direction: column;
  }
  .inline-form {
    width: 100%;
  }
  .inline-form input {
    flex: 1;
    min-width: 0;
  }
  .admin-topic-connection-board {
    grid-template-columns: minmax(4.75rem, 0.8fr) minmax(0.8rem, 0.15fr) minmax(5rem, 0.9fr) minmax(0.8rem, 0.15fr) minmax(5rem, 0.9fr);
  }
  .admin-connection-node {
    min-height: 2.5rem;
    padding: 0.35rem 0.4rem;
  }
  .admin-group-node {
    grid-template-columns: 1.7rem minmax(0, 1fr);
    gap: 0.25rem;
    width: min(100%, 11rem);
    padding-inline: 0.3rem;
  }
  .admin-group-node strong {
    font-size: 0.65rem;
  }
  .admin-group-node select {
    grid-column: 2;
    min-height: 1.8rem;
    padding-inline: 0.2rem;
    font-size: 0.6rem;
  }
  .admin-group-clear {
    grid-column: 2;
    justify-self: start;
    min-height: 2.5rem;
  }
  .admin-room-slot {
    width: 100%;
  }
  .admin-room-connection-heading {
    width: 100%;
  }
  .admin-room-shape-icon {
    width: 1.8rem;
    height: 1.35rem;
  }
  .admin-room-slot > span:last-child {
    display: none;
  }
  .admin-topic-word > span,
  .admin-room-slot strong {
    font-size: 0.7rem;
  }
}
</style>
