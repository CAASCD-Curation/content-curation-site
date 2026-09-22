<template>
  <aside
    class="spatial-model-spaces-drawer"
    aria-label="空间目录"
  >
    <header class="spaces-drawer-header">
      <div class="spaces-drawer-heading">
        <p class="spaces-drawer-tag">SPATIAL DIRECTORY</p>
        <h4 class="spaces-drawer-title">空间目录</h4>
      </div>
      <div class="spaces-drawer-actions">
        <button
          type="button"
          class="spaces-drawer-overview-btn"
          :class="{ 'is-active': !activeRoomId }"
          title="切换至全局轴测总览"
          aria-label="全局轴测总览"
          @click="$emit('request-overview')"
        >
          全景
        </button>
        <button
          type="button"
          class="spaces-drawer-close"
          aria-label="关闭空间目录"
          @click="$emit('close')"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </header>

    <div class="spaces-drawer-body">
      <div class="spaces-drawer-list" role="listbox" aria-label="空间列表">
        <button
          v-for="room in rooms"
          :key="room.id"
          type="button"
          class="space-item-button"
          :class="{ 'is-active': room.id === activeRoomId }"
          :aria-selected="room.id === activeRoomId"
          role="option"
          @click="$emit('select-room', room)"
        >
          <span class="space-item-number">{{ room.number }}</span>
          <div class="space-item-content">
            <div class="space-item-main">
              <strong class="space-item-name">{{ room.name }}</strong>
              <span v-if="room.floor" class="space-item-floor">{{ room.floor }}</span>
            </div>
            <small v-if="room.keywords?.length" class="space-item-keywords">
              {{ room.keywords.join(' · ') }}
            </small>
            <small v-if="room.modelLayerIds?.length" class="space-item-layers">
              图层：{{ roomLayerLabels(room).join(' · ') }}
            </small>
          </div>
          <span v-if="room.id === activeRoomId" class="space-item-active-marker" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { DEBUG_LAYER_BY_ID } from '../../data/spatial/modelConfig.js'

const roomLayerLabels = (room) => (room.modelLayerIds || []).map((id) => (
  DEBUG_LAYER_BY_ID.get(id)?.label || id
))

defineProps({
  rooms: {
    type: Array,
    required: true,
  },
  activeRoomId: {
    type: String,
    default: '',
  },
  activeKeyword: {
    type: String,
    default: '',
  },
  viewMode: {
    type: String,
    default: 'overview',
  },
})

defineEmits(['select-room', 'request-overview', 'close'])
</script>

<style scoped>
.spatial-model-spaces-drawer {
  position: absolute;
  top: 8px;
  right: 42px;
  bottom: 8px;
  z-index: 25;
  display: flex;
  flex-direction: column;
  width: min(17rem, calc(100% - 3.5rem));
  border: 1px solid var(--home-rule, #e5e5e0);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
  color: var(--home-ink, #111111);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.spaces-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.65rem 0.8rem;
  border-bottom: 1px solid var(--home-rule, #e5e5e0);
  background: #fafaf8;
}

.spaces-drawer-heading {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.spaces-drawer-tag {
  margin: 0;
  color: var(--home-muted, #747474);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.spaces-drawer-title {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--home-ink, #111111);
  letter-spacing: 0.02em;
}

.spaces-drawer-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.spaces-drawer-overview-btn {
  padding: 0.2rem 0.45rem;
  border: 1px solid var(--home-rule, #e5e5e0);
  background: #ffffff;
  color: var(--home-ink, #111111);
  font: inherit;
  font-size: 0.65rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s ease;
}

.spaces-drawer-overview-btn:hover,
.spaces-drawer-overview-btn.is-active {
  border-color: var(--home-ink, #111111);
  background: var(--home-ink, #111111);
  color: #ffffff;
}

.spaces-drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid var(--home-rule, #e5e5e0);
  background: #ffffff;
  color: var(--home-ink, #111111);
  cursor: pointer;
  transition: all 0.12s ease;
}

.spaces-drawer-close:hover,
.spaces-drawer-close:focus-visible {
  border-color: var(--home-ink, #111111);
  background: var(--home-ink, #111111);
  color: #ffffff;
}

.spaces-drawer-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0.4rem;
}

.spaces-drawer-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.space-item-button {
  display: grid;
  grid-template-columns: 1.6rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.55rem;
  border: 1px solid transparent;
  background: #fbfbfa;
  color: var(--home-ink, #111111);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: all 0.12s ease;
}

.space-item-button:hover {
  border-color: var(--home-rule, #e5e5e0);
  background: #f3f2ee;
}

.space-item-button.is-active {
  border-color: var(--home-ink, #111111);
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.space-item-number {
  color: var(--home-muted, #747474);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.72rem;
  font-weight: 600;
}

.space-item-button.is-active .space-item-number {
  color: var(--home-ink, #111111);
}

.space-item-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 0.1rem;
}

.space-item-main {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.space-item-name {
  overflow: hidden;
  font-size: 0.75rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-item-floor {
  font-size: 0.6rem;
  color: var(--home-muted, #747474);
}

.space-item-keywords {
  overflow: hidden;
  color: var(--home-muted, #747474);
  font-size: 0.62rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-item-layers {
  color: var(--home-muted, #747474);
  font-size: 0.62rem;
  line-height: 1.35;
}

.space-item-active-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--home-ink, #111111);
}

.space-item-button:focus-visible,
.spaces-drawer-overview-btn:focus-visible,
.spaces-drawer-close:focus-visible {
  outline: 2px solid var(--home-ink, #111111);
  outline-offset: 1px;
}
</style>
