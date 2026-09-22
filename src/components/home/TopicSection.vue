<template>
  <section
    id="city"
    class="home-section city-section"
    data-section
    aria-labelledby="city-title"
  >
    <div class="section-grid section-intro-grid">
      <div class="section-title-column">
        <p class="eyebrow">2026 · New Direction</p>
        <div class="section-title-lockup">
          <h2 id="city-title">
            <span class="city-title-name">策展<br />超市<span class="city-title-version"> 2.0</span></span>
          </h2>
        </div>
      </div>
      <div class="section-copy-column city-copy">
        <p class="lead-copy">
          “策展超市 2.0”将选题从物拓展到空间：每组选择一个兼具观念包容度与空间类型性的“词”，以此编织艺术档案、文学意象、社会素材与形式灵感的内容数据库；再通过网站、空间与视觉系统，把研究转化为可浏览、可讨论、可实施的展览方案。
        </p>
        <p class="micro-copy">从词与空间出发，建立内容关系；从数据库出发，形成展览。</p>
      </div>
    </div>

    <p v-if="loading" class="city-data-status" aria-live="polite">正在读取共享选题库……</p>
    <div v-else-if="stateError" class="city-data-status is-error" role="status">
      <span>共享选题库暂时无法读取：{{ stateError }}</span>
      <button type="button" @click="$emit('retry')">重试</button>
    </div>
    <template v-else>
      <TopicExplorer
        :rooms="rooms"
        :view-mode="viewMode"
        :active-room-id="activeRoomId"
        :active-keyword="activeKeyword"
        :visible-keywords="visibleTopicLabels"
        :topic-colors="topicColors"
        :image-library="topicImages"
        :text-library="topicTexts"
        :mode-notice="modeNotice"
        @activate-space="activateSpace"
        @clear-space="clearSpace"
        @exit-immersive="exitImmersive"
        @pointer-lock-change="handlePointerLockChange"
      />
    </template>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import TopicExplorer from '../topics/TopicExplorer.vue'
import { topicImages } from '../../data/topics/images.js'
import { topicTexts } from '../../data/topics/texts.js'

const viewMode = ref('section')
const activeRoomId = ref('')
const activeKeyword = ref('')
const pointerLocked = ref(false)
const modeNotice = ref('')

let mobileQuery
let mobileQueryHandler

function isMobileViewport() {
  return mobileQuery?.matches ?? false
}

function activateSpace(payload) {
  const roomId = payload?.roomId
  const keyword = payload?.keyword
  if (!roomId || !keyword) return

  // 只有再次点击完全相同的标签，或者显式指定 force3D（如双击房间）时，才直接切入 3D 漫游
  const isSameTarget = activeRoomId.value === roomId && activeKeyword.value === keyword
  const direct3D = Boolean(payload?.force3D || isSameTarget)
  activeRoomId.value = roomId
  activeKeyword.value = keyword
  modeNotice.value = ''

  // 如果已经处于 3D 漫游状态，只需同步空间机位
  if (viewMode.value === 'immersive') {
    return
  }

  // 再次点击同一标签 或 双击空间：直接切入 3D 室内沉浸透视漫游
  if (direct3D) {
    if (isMobileViewport()) {
      modeNotice.value = '沉浸漫游仅在桌面端开放，当前保持剖面浏览。'
      return
    }
    viewMode.value = 'immersive'
    return
  }
}

function clearSpace() {
  viewMode.value = 'section'
  activeRoomId.value = ''
  activeKeyword.value = ''
  pointerLocked.value = false
  modeNotice.value = ''
}

function exitImmersive(payload = {}) {
  viewMode.value = 'section'
  pointerLocked.value = false
  if (payload.reason === 'mobile') {
    modeNotice.value = '沉浸漫游仅在桌面端开放，当前保持剖面浏览。'
  } else if (payload.reason === 'escape') {
    modeNotice.value = '已退出三维视图，当前回到空间剖面。'
  }
}

function handlePointerLockChange(isLocked) {
  pointerLocked.value = isLocked
}

onMounted(() => {
  mobileQuery = window.matchMedia('(max-width: 767px)')
  mobileQueryHandler = () => {
    if (mobileQuery.matches && viewMode.value === 'immersive') exitImmersive({ reason: 'mobile' })
  }
  mobileQuery.addEventListener?.('change', mobileQueryHandler)
})

onBeforeUnmount(() => {
  mobileQuery?.removeEventListener?.('change', mobileQueryHandler)
})

defineProps({
  rooms: { type: Array, default: () => [] },
  visibleTopicLabels: { type: Array, default: null },
  topicColors: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  stateError: { type: String, default: '' },
})
defineEmits(['retry'])
</script>

<style scoped>
.city-section { padding-bottom: clamp(1rem, 2vw, 2rem); }

.city-copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--home-column-gap);
}

.city-title-name,
.city-title-version {
  white-space: nowrap;
}

.city-data-status { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 2rem 0 0; padding: 0.8rem 0; border-top: 1px solid var(--home-rule); color: var(--home-muted); font-size: 0.8rem; }
.city-data-status.is-error { color: var(--home-ink); }
.city-data-status.is-fallback { color: var(--home-muted); }
.city-data-status button { border: 1px solid var(--home-ink); background: var(--home-paper); padding: 0.35rem 0.65rem; cursor: pointer; font: inherit; }
</style>
