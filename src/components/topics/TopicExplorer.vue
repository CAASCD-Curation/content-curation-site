<template>
  <figure class="screen-universe" aria-label="屏幕宇宙" @click="handleUniverseClick">
    <TopicBar
      :keywords="topicKeywords"
      :active-keyword="activeTopic"
      :topic-colors="topicColors"
      @select-topic="selectTopic"
    />

    <div class="screen-universe-stage-shell">
      <div
        ref="stageElement"
        class="screen-universe-stage"
        :class="{
          'is-dragging': dragState.active && dragState.moved,
          'is-screen-expanded': isScreenExpanded,
          'is-idle': !activeTopic,
        }"
        :style="stageStyle"
        tabindex="0"
        aria-label="球面屏幕浏览区。移动鼠标环顾，触屏拖拽，或使用方向键浏览。"
        @click="handleStageClick"
        @keydown="handleStageKeydown"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerCancel"
        @pointerleave="handlePointerLeave"
      >
        <div ref="rendererHost" class="screen-universe-world" />

        <CentralScreen
          ref="centralScreenRef"
          :rooms="rooms"
          :view-mode="viewMode"
          :active-room-id="activeRoomId"
          :active-keyword="activeKeyword"
          :topic-colors="topicColors"
          :mode-notice="modeNotice"
          :is-expanded="isScreenExpanded"
          @activate-space="$emit('activate-space', $event)"
          @clear-space="$emit('clear-space')"
          @exit-immersive="handleExitImmersive"
          @pointer-lock-change="$emit('pointer-lock-change', $event)"
          @toggle-expand="toggleScreenExpand"
        />

        <p v-if="Boolean(activeTopic)" class="screen-universe-navigation-hint" aria-hidden="true">移动鼠标环顾 · 触屏拖拽 · 方向键浏览</p>
        <p v-if="!activeTopic" class="screen-universe-idle-hint" aria-hidden="true">点击标签浏览</p>
        <p class="screen-universe-orientation-hint" role="status">请横屏查看详细</p>
      </div>
    </div>

    <p class="screen-universe-status" aria-live="polite">{{ liveStatus }}</p>
  </figure>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import TopicBar from './TopicBar.vue'
import CentralScreen from './CentralScreen.vue'
import { useScreenUniverseScene } from '../../composables/useScreenUniverseScene.js'
import { topicColors as catalogTopicColors } from '../../data/topics/catalog.js'
import {
  SCREEN_UNIVERSE_STAGE_ASPECT,
  createScreenItems,
} from '../../utils/screenUniverseSphere.js'

const props = defineProps({
  rooms: { type: Array, required: true },
  imageLibrary: { type: Object, default: () => ({}) },
  textLibrary: { type: Object, default: () => ({}) },
  topicColors: { type: Object, default: () => ({}) },
  viewMode: { type: String, default: 'overview' },
  activeRoomId: { type: String, default: '' },
  activeKeyword: { type: String, default: '' },
  visibleKeywords: { type: Array, default: null },
  modeNotice: { type: String, default: '' },
})

const emit = defineEmits([
  'activate-space',
  'clear-space',
  'exit-immersive',
  'pointer-lock-change',
])

const DRAG_THRESHOLD = 6

const stageElement = ref(null)
const rendererHost = ref(null)
const centralScreenRef = ref(null)
const isScreenExpanded = ref(false)
const liveStatus = ref('')
const reducedMotion = ref(false)
const isPortraitPhone = ref(false)

const dragState = reactive({
  active: false,
  moved: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  lastTime: 0,
})

const keywords = computed(() => [...new Set(props.rooms.flatMap((room) => room.keywords))])
const topicKeywords = computed(() => {
  if (!Array.isArray(props.visibleKeywords)) return keywords.value
  const visible = new Set(props.visibleKeywords)
  return keywords.value.filter((keyword) => visible.has(keyword))
})
const activeTopic = computed(() => props.activeKeyword)
const stageStyle = { '--screen-universe-stage-aspect': SCREEN_UNIVERSE_STAGE_ASPECT }

let stageResizeObserver
let motionQuery
let portraitQuery
let motionQueryHandler
let portraitQueryHandler

function colorFor(keyword) {
  return props.topicColors[keyword] || catalogTopicColors[keyword] || 'var(--home-ink)'
}

const sceneManager = useScreenUniverseScene({
  getActiveTopic: () => activeTopic.value,
  getTopicColor: (keyword) => colorFor(keyword),
  isReducedMotion: () => reducedMotion.value,
  isPortraitPhone: () => isPortraitPhone.value,
  isScreenExpanded: () => isScreenExpanded.value,
  getIsDragging: () => dragState.active,
  onSelectTopic: (keyword) => selectTopic(keyword),
  onImageLoadError: () => {
    liveStatus.value = `“${activeTopic.value || '当前选题'}”有一张图片载入失败，已替换为文字屏。`
  },
})

function updateLiveStatus() {
  if (!activeTopic.value) {
    liveStatus.value = `屏幕宇宙待选：点击上方任一空间标签，进入对应选题的屏幕墙。共 ${keywords.value.length} 个选题。`
    return
  }

  const room = props.rooms.find((item) => item.id === props.activeRoomId)
  const roomLabel = room ? `${room.number} / ${room.keywords.join(' · ')}` : activeTopic.value
  const imageCount = createScreenItems({
    keyword: activeTopic.value,
    keywords: keywords.value,
    imageLibrary: props.imageLibrary,
    textLibrary: props.textLibrary,
  }).filter((item) => item.type === 'image').length

  if (props.viewMode === 'immersive') {
    liveStatus.value = `${roomLabel} · 沉浸漫游已准备，点击中央场景开始移动。`
  } else if (imageCount) {
    liveStatus.value = `${roomLabel} · 球面已载入 ${imageCount} 张图片，可拖拽环顾。`
  } else {
    liveStatus.value = `${roomLabel} · 当前选题暂无图片。`
  }
}

function selectTopic(keyword) {
  const room = props.rooms.find((roomItem) => roomItem.keywords.includes(keyword))
  if (!room) return
  emit('activate-space', { roomId: room.id, keyword, source: 'universe' })
}

function resetFromUniverse() {
  emit('clear-space')
}

function toggleScreenExpand() {
  isScreenExpanded.value = !isScreenExpanded.value
  sceneManager.requestUniverseRender()
}

function handleExitImmersive(payload) {
  isScreenExpanded.value = false
  emit('exit-immersive', payload)
  sceneManager.requestUniverseRender()
}

function endPointerInteraction(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) return
  if (dragState.moved) sceneManager.setSuppressClickUntil(performance.now() + 80)
  if (stageElement.value?.hasPointerCapture(event.pointerId)) {
    stageElement.value.releasePointerCapture(event.pointerId)
  }
  dragState.active = false
  dragState.pointerId = null
  sceneManager.requestUniverseRender()
}

function handlePointerDown(event) {
  // 鼠标不进入拖拽：视角由指针位置直接驱动；触屏 / 触控笔仍按拖拽环顾。
  if (event.pointerType === 'mouse') return
  if (!activeTopic.value || isPortraitPhone.value || isScreenExpanded.value || event.button !== 0) return
  if (event.target.closest('.screen-universe-central-screen')) return
  dragState.active = true
  dragState.moved = false
  dragState.pointerId = event.pointerId
  dragState.startX = event.clientX
  dragState.startY = event.clientY
  dragState.lastX = event.clientX
  dragState.lastY = event.clientY
  dragState.lastTime = performance.now()
  sceneManager.stopInertia()
}

function handlePointerMove(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) {
    // 只有鼠标触发位置跟随；触屏的 pointermove 属于拖拽手势。
    if (!event.pointerType || event.pointerType === 'mouse') {
      sceneManager.updateSwayTarget(event.clientX, event.clientY)
    }
    return
  }
  const totalDistance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY)
  if (!dragState.moved && totalDistance < DRAG_THRESHOLD) return
  if (!dragState.moved) {
    dragState.moved = true
    stageElement.value?.setPointerCapture(event.pointerId)
  }

  const now = performance.now()
  const elapsed = Math.max(8, now - dragState.lastTime)
  const deltaX = event.clientX - dragState.lastX
  const deltaY = event.clientY - dragState.lastY
  const yawDelta = -deltaX * 0.0044
  const pitchDelta = -deltaY * 0.0037
  sceneManager.rotateBy(yawDelta, pitchDelta)
  sceneManager.setVelocities(yawDelta / elapsed, pitchDelta / elapsed)
  dragState.lastX = event.clientX
  dragState.lastY = event.clientY
  dragState.lastTime = now
  event.preventDefault()
  sceneManager.requestUniverseRender()
}

function handlePointerUp(event) {
  endPointerInteraction(event)
}

function handlePointerCancel(event) {
  sceneManager.stopInertia()
  endPointerInteraction(event)
}

function handlePointerLeave() {
  sceneManager.resetSwayTarget()
}

function handleStageKeydown(event) {
  if (!activeTopic.value || isPortraitPhone.value || isScreenExpanded.value) return
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  sceneManager.stepKeyboard(event.key)
}

function handleStageClick(event) {
  if (sceneManager.isClickSuppressed()) return
  if (event.target.closest('.screen-universe-satellite, .screen-universe-central-screen')) return
  resetFromUniverse()
}

function handleUniverseClick(event) {
  if (event.target === event.currentTarget) resetFromUniverse()
}

function triggerRebuild() {
  sceneManager.rebuildSphereLayout({
    keyword: activeTopic.value,
    keywords: keywords.value,
    imageLibrary: props.imageLibrary,
    textLibrary: props.textLibrary,
  })
}

watch(
  [() => props.activeKeyword, () => props.imageLibrary, keywords],
  triggerRebuild,
  { immediate: true },
)

watch(
  [() => props.activeKeyword, () => props.activeRoomId, () => props.viewMode, keywords],
  updateLiveStatus,
  { immediate: true },
)

watch(() => props.viewMode, (mode) => {
  if (mode !== 'immersive' && mode !== 'overview') isScreenExpanded.value = false
  sceneManager.requestUniverseRender()
})

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  portraitQuery = window.matchMedia('(max-width: 767px) and (orientation: portrait)')
  motionQueryHandler = () => {
    reducedMotion.value = motionQuery.matches
    if (reducedMotion.value) {
      sceneManager.stopInertia()
    }
    sceneManager.requestUniverseRender()
  }
  portraitQueryHandler = () => {
    isPortraitPhone.value = portraitQuery.matches
    sceneManager.requestUniverseRender()
  }
  motionQueryHandler()
  portraitQueryHandler()
  motionQuery.addEventListener?.('change', motionQueryHandler)
  portraitQuery.addEventListener?.('change', portraitQueryHandler)

  stageResizeObserver = new ResizeObserver(() => sceneManager.resizeUniverse())
  if (stageElement.value) stageResizeObserver.observe(stageElement.value)
  sceneManager.initialize(rendererHost.value, stageElement.value, centralScreenRef)
})

onBeforeUnmount(() => {
  stageResizeObserver?.disconnect()
  motionQuery?.removeEventListener?.('change', motionQueryHandler)
  portraitQuery?.removeEventListener?.('change', portraitQueryHandler)
  sceneManager.destroy()
})
</script>

<style scoped>
.screen-universe {
  --universe-ink: var(--home-ink, #111111);
  --universe-muted: var(--home-muted, #747474);
  --universe-rule: var(--home-rule, #dddddd);
  --universe-paper: var(--home-paper, #ffffff);
  --universe-accent: var(--home-blue, #78a2ed);
  width: 100%;
  margin: clamp(3.5rem, 7vw, 7rem) 0 0;
  color: var(--universe-ink);
}

.screen-universe-stage-shell {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.screen-universe-stage {
  position: relative;
  width: 100%;
  aspect-ratio: var(--screen-universe-stage-aspect);
  overflow: hidden;
  isolation: isolate;
  color: var(--universe-ink);
  background: #ffffff;
  cursor: default;
  touch-action: pan-y;
}

.screen-universe-stage.is-dragging {
  cursor: grabbing;
}

.screen-universe-stage.is-idle {
  cursor: default;
}

.screen-universe-stage.is-idle .screen-universe-world {
  opacity: 0;
  pointer-events: none;
}

.screen-universe-stage:focus-visible {
  outline: 1px solid var(--universe-accent);
  outline-offset: 3px;
}

.screen-universe-world {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  transition: opacity 220ms ease;
}

.screen-universe-stage.is-screen-expanded .screen-universe-world {
  opacity: 0;
  pointer-events: none;
}

.screen-universe-stage :deep(.screen-universe-css3d) {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.screen-universe-stage :deep(.screen-universe-object) {
  transform-style: preserve-3d;
  pointer-events: none;
}

.screen-universe-stage :deep(.screen-universe-satellite) {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--universe-ink);
  background: transparent;
  cursor: grab;
  opacity: var(--screen-opacity, 0.72);
  filter: grayscale(var(--screen-gray, 0.2)) saturate(var(--screen-saturation, 0.88));
  transform: skewY(var(--drag-skew, 0deg));
  pointer-events: auto;
  backface-visibility: hidden;
  transition: opacity 220ms ease, filter 220ms ease;
}

.screen-universe-stage.is-dragging :deep(.screen-universe-satellite) {
  cursor: grabbing;
}

.screen-universe-stage :deep(button.screen-universe-satellite) {
  cursor: pointer;
  font: inherit;
}

.screen-universe-stage :deep(.screen-universe-satellite:hover),
.screen-universe-stage :deep(.screen-universe-satellite:focus-visible) {
  opacity: 1;
  filter: grayscale(0) saturate(1);
}

.screen-universe-stage :deep(.screen-universe-satellite:focus-visible) {
  outline: 2px solid var(--universe-accent);
  outline-offset: 5px;
}

.screen-universe-stage :deep(.screen-universe-frame) {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 0;
  border-radius: 0.5px;
  background: rgba(246, 246, 244, 0.94);
  box-shadow:
    inset 0 0 0 0.75px rgba(255, 255, 255, 0.94),
    inset -0.5px -0.5px 0 rgba(255, 255, 255, 0.58),
    0 12px 28px rgba(17, 17, 17, 0.08),
    0 2px 7px rgba(17, 17, 17, 0.05);
}

.screen-universe-stage :deep(.screen-universe-satellite.is-topic .screen-universe-frame) {
  box-shadow:
    inset 3px 0 0 var(--topic-color, transparent),
    inset 0 0 0 0.75px rgba(255, 255, 255, 0.94),
    inset -0.5px -0.5px 0 rgba(255, 255, 255, 0.58),
    0 12px 28px rgba(17, 17, 17, 0.08),
    0 2px 7px rgba(17, 17, 17, 0.05);
}

.screen-universe-stage :deep(.screen-universe-satellite.is-blank .screen-universe-frame) {
  background: rgba(242, 242, 239, 0.88);
}

.screen-universe-stage :deep(.screen-universe-frame img) {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.screen-universe-stage :deep(.screen-universe-signal) {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 14px;
  overflow: hidden;
  border-radius: inherit;
  color: rgba(17, 17, 17, 0.8);
  background: rgba(247, 247, 245, 0.94);
  font-family: var(--font-body), "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.screen-universe-stage :deep(.screen-universe-signal-word) {
  display: block;
  width: 100%;
  color: inherit;
  font-size: var(--screen-signal-font-size, 22px);
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
  text-align: center;
  white-space: normal;
  word-break: break-word;
}

.screen-universe-navigation-hint,
.screen-universe-idle-hint {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 120;
  margin: 0;
  color: var(--universe-muted);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  pointer-events: none;
}

.screen-universe-orientation-hint {
  display: none;
}

.screen-universe-status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 767px) {
  .screen-universe {
    margin-top: 3rem;
  }
}

@media (max-width: 767px) and (orientation: landscape) {
  .screen-universe-stage {
    touch-action: none;
  }
}

@media (max-width: 767px) and (orientation: portrait) {
  .screen-universe-stage {
    aspect-ratio: 4 / 5;
    cursor: default;
  }

  .screen-universe-world,
  .screen-universe-navigation-hint,
  .screen-universe-idle-hint {
    display: none;
  }

  .screen-universe-orientation-hint {
    position: absolute;
    right: 0;
    bottom: 12%;
    left: 0;
    z-index: 210;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    color: var(--universe-muted);
    font-size: 0.75rem;
    letter-spacing: 0.06em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .screen-universe-world,
  .screen-universe-stage :deep(.screen-universe-satellite) {
    transition: none;
  }
}
</style>
