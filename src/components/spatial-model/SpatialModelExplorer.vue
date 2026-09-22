<template>
  <section
    class="spatial-model-explorer"
    :class="{
      'is-expanded': isExpandedState,
      'is-roaming': roamingActive,
      'is-pointer-locked': pointerLocked,
      'is-embedded': embedded,
    }"
    tabindex="0"
    aria-label="3D 场地三维模型视口"
    @click="handleStageClick"
  >
    <!-- 三维舞台主容器 -->
    <div class="spatial-model-stage-container">
      <div
        ref="stage"
        class="spatial-model-stage"
      >
        <!-- 3D 视口内置 HUD 图标工具栏（微型紧凑版） -->
        <!-- 1. 右上角：竖排功能工具栏 -->
        <nav class="hud-top-right-vertical" aria-label="3D 视图工具栏" @click.stop>
          <!-- 空间目录按钮（内嵌未放大时隐藏） -->
          <button
            v-if="showAdvancedTools"
            type="button"
            class="hud-icon-btn hud-btn-spaces has-tooltip tooltip-left"
            :class="{ 'is-active': spacesDrawerOpen }"
            :aria-expanded="spacesDrawerOpen"
            data-tooltip="空间目录"
            aria-label="空间目录"
            @click="toggleSpacesDrawer"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <!-- 3D 内部：轴测 / 透视 两态相机循环切换按钮 -->
          <button
            type="button"
            class="hud-icon-btn hud-btn-projection has-tooltip tooltip-left"
            :class="[`is-projection-${internal3DMode}`, { 'is-disabled': !canEnterImmersive && internal3DMode === 'overview' }]"
            :disabled="!canEnterImmersive && internal3DMode === 'overview'"
            :data-tooltip="projectionTooltip"
            :aria-label="projectionTooltip"
            @click="cycleProjectionMode"
          >
            <!-- 1. 轴测状态：等角轴测立方体 -->
            <svg
              v-if="internal3DMode === 'overview'"
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            >
              <path d="M12 2.5 L20.5 7.4 V17.2 L12 22.1 L3.5 17.2 V7.4 Z"/>
              <path d="M12 2.5 V12.3"/>
              <path d="M12 12.3 L20.5 7.4"/>
              <path d="M12 12.3 L3.5 7.4"/>
            </svg>

            <!-- 2. 透视状态：带透视收缩深度的立方体 -->
            <svg
              v-else
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="18" height="18"/>
              <rect x="8" y="8" width="8" height="8"/>
              <line x1="3" y1="3" x2="8" y2="8"/>
              <line x1="21" y1="3" x2="16" y2="8"/>
              <line x1="3" y1="21" x2="8" y2="16"/>
              <line x1="21" y1="21" x2="16" y2="16"/>
            </svg>

            <span class="hud-projection-badge">{{ currentModeShortName }}</span>
          </button>

          <!-- 极地白模模式 -->
          <button
            type="button"
            class="hud-icon-btn has-tooltip tooltip-left"
            :class="{ 'is-active': arcticMode }"
            :aria-pressed="arcticMode"
            data-tooltip="极地白模模式"
            aria-label="极地白模模式"
            @click="toggleArcticMode"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="2" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              <line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/>
            </svg>
          </button>

          <!-- 图层控制（内嵌未放大时隐藏） -->
          <button
            v-if="showAdvancedTools"
            type="button"
            class="hud-icon-btn has-tooltip tooltip-left"
            :class="{ 'is-active': layersPanelOpen }"
            :aria-expanded="layersPanelOpen"
            data-tooltip="图层控制 (Rhino/GLTF节点)"
            aria-label="图层控制"
            @click="toggleLayersPanel"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </button>

          <!-- 机位标定（内嵌未放大时隐藏） -->
          <button
            v-if="showAdvancedTools && internal3DMode === 'immersive'"
            type="button"
            class="hud-icon-btn has-tooltip tooltip-left"
            :class="{ 'is-active': calibrationOpen }"
            :aria-expanded="calibrationOpen"
            data-tooltip="标定镜头参数 (C)"
            aria-label="标定镜头参数"
            @click="toggleCalibrationPanel"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="22" y1="12" x2="18" y2="12"/>
              <line x1="6" y1="12" x2="2" y2="12"/>
              <line x1="12" y1="6" x2="12" y2="2"/>
              <line x1="12" y1="22" x2="12" y2="18"/>
            </svg>
          </button>

          <!-- 全屏展开 / 退出放大 按钮 -->
          <button
            type="button"
            class="hud-icon-btn hud-btn-expand has-tooltip tooltip-left"
            :class="{ 'is-active': isExpandedState }"
            :data-tooltip="isExpandedState ? '退出全屏 (F / Esc)' : '全屏放大 (F)'"
            :aria-label="isExpandedState ? '退出全屏 (F / Esc)' : '全屏放大 (F)'"
            @click="toggleExpandState"
          >
            <!-- 展开图标 -->
            <svg
              v-if="!isExpandedState"
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            <!-- 收起图标 -->
            <svg
              v-else
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="4 14 10 14 10 20"/>
              <polyline points="20 10 14 10 14 4"/>
              <line x1="14" y1="10" x2="21" y2="3"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
        </nav>

        <!-- 2. 右下角：返回剖面独立按钮（仅在需要时展示） -->
        <div v-if="showBackButton" class="hud-bottom-right" @click.stop>
          <button
            type="button"
            class="hud-icon-btn hud-btn-back has-tooltip tooltip-left"
            data-tooltip="返回剖面 (Esc)"
            aria-label="返回剖面 (Esc)"
            @click="leaveImmersive('escape')"
          >
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="9 14 4 9 9 4"/>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
            </svg>
          </button>
        </div>

        <!-- 浮层组件：空间清单抽屉（放大或独立组件模式下可用） -->
        <SpatialModelSpacesDrawer
          v-if="spacesDrawerOpen && showAdvancedTools"
          :rooms="rooms"
          :active-room-id="effectiveActiveRoomId"
          :active-keyword="effectiveActiveKeyword"
          @close="spacesDrawerOpen = false"
          @select-room="activateRoom"
          @request-overview="requestOverview"
        />

        <!-- 浮层组件：图层调试面板（Rhino父子层级，放大或独立组件模式下可用） -->
        <SpatialModelLayerDebug
          v-if="layersPanelOpen && showAdvancedTools"
          :groups="debugLayerGroups"
          :visibility-map="debugLayerVisibility"
          @close="layersPanelOpen = false"
          @toggle-layer="onToggleDebugLayer"
          @reset="resetDebugLayerVisibility"
        />

        <!-- 浮层组件：镜头机位标定面板（放大或独立组件模式下可用） -->
        <SpatialModelCalibration
          v-if="calibrationOpen && showAdvancedTools"
          :active-room-id="effectiveActiveRoomId"
          :selected-room="selectedRoom"
          :calibration-fov="calibrationFov"
          :calibration-snapshot="calibrationSnapshot"
          :calibration-notice="calibrationNotice"
          :copy-fallback-visible="copyFallbackVisible"
          :calibration-data-text="calibrationDataText"
          @close="closeCalibration"
          @update:fov="handleFovUpdate"
          @copy="copyCameraData"
        />

        <!-- 加载中遮罩 -->
        <div
          v-if="loading"
          class="spatial-model-loading"
          role="status"
          aria-live="polite"
        >
          <div class="spatial-model-loading-box">
            <span class="spatial-model-loading-spinner" />
            <p>正在装载场地三维模型…</p>
          </div>
        </div>

        <!-- 错误提示 -->
        <div
          v-if="loadError"
          class="spatial-model-error"
          role="alert"
        >
          <p>{{ loadError }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  DEBUG_LAYER_GROUPS,
  DEBUG_LAYER_DEFINITIONS,
  DEBUG_LAYER_BY_ID,
  MODEL_ASSETS,
  requiredAssetKeysForMode,
} from '../../data/spatial/modelConfig.js'
import {
  calculateOverviewCamera,
  calculateSectionCamera,
  calculateImmersiveCamera,
} from '../../utils/spatial-model/cameraController.js'
import { useSpatialModelStage } from './composables/useSpatialModelStage.js'
import { useSpatialModelAssets } from './composables/useSpatialModelAssets.js'
import { useSpatialModelControls } from './composables/useSpatialModelControls.js'
import { useSpatialModelCalibration } from './composables/useSpatialModelCalibration.js'
import SpatialModelSpacesDrawer from './SpatialModelSpacesDrawer.vue'
import SpatialModelLayerDebug from './SpatialModelLayerDebug.vue'
import SpatialModelCalibration from './SpatialModelCalibration.vue'

const props = defineProps({
  rooms: {
    type: Array,
    required: true,
  },
  viewMode: {
    type: String,
    default: 'overview',
  },
  activeRoomId: {
    type: String,
    default: '',
  },
  activeKeyword: {
    type: String,
    default: '',
  },
  modeNotice: {
    type: String,
    default: '',
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
  showBackButton: {
    type: Boolean,
    default: false,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'activate-space',
  'change-mode',
  'request-overview',
  'exit-immersive',
  'pointer-lock-change',
  'toggle-expand',
])

const stage = ref(null)
const mobileViewport = ref(false)
const localExpanded = ref(false)
const localActiveRoomId = ref('')
const localActiveKeyword = ref('')
const spacesDrawerOpen = ref(false)
const layersPanelOpen = ref(false)
const arcticMode = ref(true)
const internal3DMode = ref('immersive')

let model = null
let mobileQuery = null
let mobileQueryHandler = null

const isExpandedState = computed(() => Boolean(props.isExpanded || localExpanded.value))
const effectiveActiveRoomId = computed(() => props.activeRoomId || localActiveRoomId.value)
const effectiveActiveKeyword = computed(() => props.activeKeyword || localActiveKeyword.value)

// 内嵌在中央监视器模式下仅在放大时展示空间目录、图层、镜头参数按钮；独立使用时全功能展示
const showAdvancedTools = computed(() => {
  if (!props.embedded) return true
  return isExpandedState.value
})

watch(showAdvancedTools, (allowed) => {
  if (!allowed) {
    spacesDrawerOpen.value = false
    layersPanelOpen.value = false
    calibrationOpen.value = false
  }
})

function toggleExpandState() {
  localExpanded.value = !localExpanded.value
  emit('toggle-expand', isExpandedState.value)
}

const selectedRoom = computed(() =>
  props.rooms.find((room) => room.id === effectiveActiveRoomId.value),
)

const canEnterImmersive = computed(() => Boolean(effectiveActiveRoomId.value))

const currentModeShortName = computed(() => (
  internal3DMode.value === 'overview' ? '轴测' : '透视'
))

const projectionTooltip = computed(() => {
  if (!canEnterImmersive.value && internal3DMode.value === 'overview') {
    return '请先选择具体空间以进入室内透视漫游 (当前为全局轴测)'
  }
  return internal3DMode.value === 'overview'
    ? '当前：3D轴测 (点击切换到3D透视漫游)'
    : '当前：3D透视 (点击切换到3D轴测总览)'
})

const debugLayerGroups = computed(() => DEBUG_LAYER_GROUPS)

const debugLayerEntries = computed(() => DEBUG_LAYER_DEFINITIONS.map((layer) => ({
  ...layer,
  assetLabel: MODEL_ASSETS[layer.assetKey]?.label || layer.assetKey,
})))

// 1. 初始化 Stage 舞台
const {
  getTHREE,
  getGLTFLoader,
  getMergeGeometries,
  getRenderer,
  getScene,
  getOrthoCamera,
  getPerspectiveCamera,
  getActiveCamera,
  setActiveCamera,
  getControls,
  getLights,
  getTransitionManager,
  getModelBounds,
  getModelCenter,
  getModelSize,
  immersiveReady,
  initStage,
  startRendering,
  stopRendering,
  requestRender,
  requestShadowUpdate,
  resizeRenderer,
  enterActiveMotionDpr,
  scheduleRestoreStaticDpr,
  updateSceneMetrics,
  setRenderStepHook,
} = useSpatialModelStage({
  stageRef: stage,
  arcticMode,
})

// 2. 初始化 Assets 资产管理
const {
  loading,
  loadError,
  loadedAssetKeys,
  debugLayerVisibility,
  assetRecords,
  roomNodes,
  roomBounds,
  roomMeshes,
  preloadAllAssets,
  requestRequiredAssets,
  applyDisplayStyle,
  applyVisibilityForMode,
  applyDebugLayerOverride,
  nodesForDebugLayer,
} = useSpatialModelAssets({
  getTHREE,
  getGLTFLoader,
  getMergeGeometries,
  arcticMode,
})

// 3. 初始化机位标定
const {
  calibrationOpen,
  calibrationFov,
  calibrationSnapshot,
  calibrationNotice,
  copyFallbackVisible,
  calibrationDataText,
  applyPerspectiveFov,
  refreshCalibrationSnapshot,
  handleFovUpdate,
  toggleCalibration,
  closeCalibration,
  copyCameraData,
} = useSpatialModelCalibration({
  props,
  selectedRoom,
  getTHREE,
  getPerspectiveCamera,
  requestRender,
  releasePointerLock: () => controlsContext.releasePointerLock(),
})

function toggleCalibrationPanel() {
  toggleCalibration(mobileViewport, immersiveReady)
}

// 4. 初始化控制器与漫游物理
const controlsContext = useSpatialModelControls({
  props,
  emit,
  getTHREE,
  getRenderer,
  getPerspectiveCamera,
  getActiveCamera,
  getLights,
  internal3DMode,
  mobileViewport,
  immersiveReady,
  calibrationOpen,
  spacesDrawerOpen,
  layersPanelOpen,
  roomMeshes,
  requestRender,
  enterActiveMotionDpr,
  scheduleRestoreStaticDpr,
  leaveImmersive,
  toggleCalibration: toggleCalibrationPanel,
  onPositionChanged: refreshCalibrationSnapshot,
})

const {
  roamingActive,
  pointerLocked,
  initRaycasters,
  updateCollisionMeshes,
  releasePointerLock,
  startRoaming,
  handlePointerDown,
  handlePointerUp,
  handlePointerMove,
  stepPhysics,
} = controlsContext

setRenderStepHook((delta) => stepPhysics(delta))

function setArcticMode(enabled) {
  arcticMode.value = enabled
  applyDisplayStyle()
  const THREE = getTHREE()
  if (THREE && model) {
    updateSceneMetrics(model)
  }
  requestShadowUpdate()
  requestRender()
}

function toggleArcticMode() {
  setArcticMode(!arcticMode.value)
}

function toggleSpacesDrawer() {
  spacesDrawerOpen.value = !spacesDrawerOpen.value
  if (spacesDrawerOpen.value) layersPanelOpen.value = false
}

function toggleLayersPanel() {
  layersPanelOpen.value = !layersPanelOpen.value
  if (layersPanelOpen.value) spacesDrawerOpen.value = false
}

function activateRoom(room) {
  const keyword = room.keywords.includes(effectiveActiveKeyword.value)
    ? effectiveActiveKeyword.value
    : room.keywords[0]
  localActiveRoomId.value = room.id
  localActiveKeyword.value = keyword
  internal3DMode.value = 'immersive'
  setArcticMode(true)
  spacesDrawerOpen.value = false
  syncSceneState()
  requestRender()
  emit('activate-space', {
    roomId: room.id,
    keyword,
    source: 'model-room-list',
  })
}

function requestOverview() {
  localActiveRoomId.value = ''
  localActiveKeyword.value = ''
  internal3DMode.value = 'overview'
  spacesDrawerOpen.value = false
  syncSceneState()
  requestRender()
  emit('request-overview')
}

function leaveImmersive(reason = 'manual') {
  releasePointerLock()
  if (localExpanded.value) {
    localExpanded.value = false
    emit('toggle-expand', false)
    return
  }
  emit('change-mode', 'section')
  emit('exit-immersive', { reason })
}

function cycleProjectionMode() {
  if (internal3DMode.value === 'immersive') {
    internal3DMode.value = 'overview'
    releasePointerLock()
  } else {
    if (!effectiveActiveRoomId.value) return
    internal3DMode.value = 'immersive'
    setArcticMode(true)
  }
  syncSceneState()
}

function onToggleDebugLayer({ layer, visible }) {
  debugLayerVisibility.value = {
    ...debugLayerVisibility.value,
    [layer.id]: visible,
  }
  applyDebugLayerOverride(layer, visible)
  updateCollisionMeshes(model)
  requestShadowUpdate()
  requestRender()
}

function resetDebugLayerVisibility() {
  debugLayerVisibility.value = {}
  if (!model) return
  applyVisibilityForMode(
    model,
    internal3DMode.value,
    effectiveActiveRoomId.value,
    DEBUG_LAYER_BY_ID,
    selectedRoom.value?.modelLayerIds,
  )
  updateCollisionMeshes(model)
  requestShadowUpdate()
  requestRender()
}

function handleStageClick() {
  if (internal3DMode.value === 'immersive' && immersiveReady.value && !roamingActive.value) {
    startRoaming({ requestLock: !calibrationOpen.value })
  }
}

function syncSceneState() {
  const THREE = getTHREE()
  const activeCam = getActiveCamera()
  if (!model || !THREE || !activeCam) return

  const currentRoomId = effectiveActiveRoomId.value
  const mode = (!currentRoomId) ? 'overview' : internal3DMode.value
  immersiveReady.value = false
  if (requestRequiredAssets(mode, () => syncSceneState())) return

  updateSceneMetrics(model)
  loading.value = false
  if (mode !== 'immersive') {
    calibrationOpen.value = false
    releasePointerLock()
  }
  applyVisibilityForMode(
    model,
    mode,
    currentRoomId,
    DEBUG_LAYER_BY_ID,
    selectedRoom.value?.modelLayerIds,
  )
  updateCollisionMeshes(model)

  const orthoCam = getOrthoCamera()
  const perspectiveCam = getPerspectiveCamera()
  const controls = getControls()
  const transitionManager = getTransitionManager()
  const renderer = getRenderer()

  if (mode === 'immersive') {
    if (mobileViewport.value) {
      emit('exit-immersive', { reason: 'mobile' })
      return
    }
    setActiveCamera(perspectiveCam)
    if (controls) controls.enabled = false
    transitionManager?.stopCameraAnimation()
    const next = calculateImmersiveCamera(
      THREE,
      currentRoomId,
      roomNodes,
      roomBounds,
      getModelBounds(),
      effectiveActiveKeyword.value,
    )
    applyPerspectiveFov(next.fov)
    if (next.position && next.target && perspectiveCam) {
      perspectiveCam.position.set(next.position.x, next.position.y, next.position.z)
      perspectiveCam.lookAt(next.target.x, next.target.y, next.target.z)
      perspectiveCam.updateProjectionMatrix()
    }
    immersiveReady.value = true
    startRoaming({ requestLock: false })
    requestRender()
    return
  }

  setActiveCamera(orthoCam)
  if (controls) controls.enabled = true
  const next = mode === 'section' && currentRoomId
    ? calculateSectionCamera(THREE, currentRoomId, roomNodes, roomBounds, getModelSize(), getModelBounds(), getModelCenter())
    : calculateOverviewCamera(THREE, getModelCenter(), getModelSize(), getModelBounds())

  transitionManager?.animateOrtho({
    nextPosition: next.position,
    nextTarget: next.center,
    frameWidth: next.frameWidth,
    frameHeight: next.frameHeight,
    renderer,
  })
  requestRender()
}

async function initialise() {
  try {
    const { THREE } = await initStage()
    initRaycasters(THREE)

    const scene = getScene()
    const renderer = getRenderer()

    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('pointerup', handlePointerUp)
    renderer.domElement.addEventListener('pointermove', handlePointerMove)

    model = new THREE.Group()
    model.name = 'spatial-model'
    scene.add(model)
    syncSceneState()

    preloadAllAssets(model, () => {
      updateSceneMetrics(model)
      syncSceneState()
    })
  } catch (error) {
    loading.value = false
    loadError.value = '场地模型未能载入，请稍后重试。'
    console.error(error)
  }
}

function handleMobileChange() {
  mobileViewport.value = mobileQuery?.matches || false
  if (mobileViewport.value && props.viewMode === 'immersive') {
    emit('exit-immersive', { reason: 'mobile' })
  }
}

function handleVisibilityChange() {
  if (document.hidden) stopRendering()
  else startRendering()
}

watch(
  () => [props.viewMode, props.activeRoomId, props.activeKeyword, props.isExpanded, localActiveRoomId.value],
  (newVal, oldVal) => {
    const currentRoomId = effectiveActiveRoomId.value
    // 若未选中具体空间，强制退回全局轴测，绝不保留在旧透视机位中
    if (!currentRoomId) {
      if (internal3DMode.value === 'immersive') {
        releasePointerLock()
      }
      internal3DMode.value = 'overview'
    } else if (props.viewMode === 'immersive' && oldVal?.[0] !== 'immersive') {
      internal3DMode.value = 'immersive'
      setArcticMode(true)
    }
    syncSceneState()
    const is3D = props.viewMode === 'immersive' || props.viewMode === 'overview' || true
    if (is3D) {
      startRendering()
      setTimeout(() => {
        resizeRenderer()
      }, 30)
    } else {
      stopRendering()
    }
  },
)

onMounted(() => {
  mobileQuery = window.matchMedia('(max-width: 767px)')
  mobileViewport.value = mobileQuery.matches
  mobileQueryHandler = handleMobileChange
  mobileQuery.addEventListener?.('change', mobileQueryHandler)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  initialise()
})

onBeforeUnmount(() => {
  mobileQuery?.removeEventListener?.('change', mobileQueryHandler)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.spatial-model-explorer {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--home-paper);
  color: var(--home-ink);
  outline: none;
}

.spatial-model-explorer.is-expanded:not(.is-embedded) {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
}

.spatial-model-stage-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  flex: 1;
}

.spatial-model-stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f1efe9;
}

.spatial-model-explorer.is-pointer-locked .spatial-model-stage {
  cursor: none;
}

.spatial-model-stage :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

/* 1. 右上角竖排功能工具栏 */
.hud-top-right-vertical {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
  display: inline-flex;
  flex-direction: column;
  gap: 3px;
  padding: 3px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--home-border);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

/* 2. 右下角独立返回按钮 */
.hud-bottom-right {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 20;
  display: inline-flex;
  padding: 3px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--home-border);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.hud-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 26px;
  height: 26px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  color: var(--home-muted);
  font-size: 0.68rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 140ms ease;
}

.hud-icon-btn:hover,
.hud-icon-btn:focus-visible {
  background: rgba(0, 0, 0, 0.04);
  color: var(--home-ink);
  border-color: var(--home-border);
}

.hud-icon-btn.is-active {
  background: var(--home-ink);
  color: var(--home-paper);
  border-color: var(--home-ink);
}

.hud-btn-back {
  color: #b91c1c;
  font-weight: 500;
}

.hud-btn-back:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #991b1b;
}

.hud-btn-projection {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.hud-icon-btn.is-disabled,
.hud-icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.hud-projection-badge {
  display: none;
}

/* Tooltip 提示气泡 */
.has-tooltip {
  position: relative;
}

.has-tooltip::after {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  z-index: 50;
  padding: 3px 6px;
  background: var(--home-ink);
  color: var(--home-paper);
  font-size: 0.64rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateY(-2px);
  transition: opacity 120ms ease, transform 120ms ease;
  content: attr(data-tooltip);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.has-tooltip.tooltip-left::after {
  top: 50%;
  right: calc(100% + 6px);
  bottom: auto;
  left: auto;
  transform: translateY(-50%) translateX(2px);
}

.has-tooltip.tooltip-left:hover::after,
.has-tooltip.tooltip-left:focus-visible::after {
  transform: translateY(-50%) translateX(0);
}

.has-tooltip:hover::after,
.has-tooltip:focus-visible::after {
  opacity: 1;
  transform: translateY(0);
}

/* 加载遮罩与错误 */
.spatial-model-loading,
.spatial-model-error {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(241, 239, 233, 0.88);
}

.spatial-model-loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--home-muted);
}

.spatial-model-loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--home-border);
  border-top-color: var(--home-ink);
  border-radius: 50%;
  animation: hud-spinner 0.6s linear infinite;
}

@keyframes hud-spinner {
  to { transform: rotate(360deg); }
}

@media (max-width: 767px) {
  .hud-btn-label {
    display: none;
  }
}
</style>
