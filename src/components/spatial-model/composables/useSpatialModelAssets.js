/**
 * 三维资产加载与节点图层管理 Composable
 * 负责 5 个 GLB 资产的并发加载、缓存、网格合批、材质/白模赋予与图层可见性
 */
import { ref } from 'vue'
import { MODEL_BASE_URL, MODEL_ASSETS, requiredAssetKeysForMode } from '../../../data/spatial/modelConfig.js'
import {
  applyArchitecturalMaterials,
  applyDisplayStyleToRoot,
  applyArcticEdgeVisibility,
  createArcticEdges,
  configureNavigationNode,
  setNavigationAppearance,
} from '../../../utils/spatial-model/materials.js'
import {
  boxFor,
  optimiseStaticGeometry,
  configureModelShadows,
  attachRequiredAssets,
  indexDebugLayerNodes,
} from '../../../utils/spatial-model/modelLoader.js'

export function useSpatialModelAssets({ getTHREE, getGLTFLoader, getMergeGeometries, arcticMode }) {
  const loading = ref(true)
  const loadError = ref('')
  const loadedAssetKeys = ref([])
  const debugLayerVisibility = ref({})

  const assetRecords = new Map()
  const assetLoadPromises = new Map()
  const roomNodes = new Map()
  const roomBounds = new Map()
  const namedNodes = new Map()
  const roomMeshes = []
  const debugLayerNodes = new Map()
  const architecturalMaterials = new Map()
  const arcticMaterials = new Map()
  const arcticEdgeMaterialRef = { current: null }

  let assetSyncKey = ''

  function registerAssetNodes(THREE, assetScene) {
    assetScene.updateMatrixWorld(true)
    assetScene.traverse((node) => {
      if (node.name && !namedNodes.has(node.name)) namedNodes.set(node.name, node)
      if (node.name && /^r(?:[1-9]|1[0-2])$/.test(node.name)) {
        roomNodes.set(node.name, node)
        roomBounds.set(node.name, boxFor(THREE, node))
        configureNavigationNode(THREE, node, roomMeshes)
      }
    })
  }

  async function loadAsset(assetKey) {
    const existing = assetRecords.get(assetKey)
    if (existing) return existing.scene
    const pending = assetLoadPromises.get(assetKey)
    if (pending) return pending

    const THREE = getTHREE()
    const GLTFLoader = getGLTFLoader()
    const mergeGeometries = getMergeGeometries()

    const asset = MODEL_ASSETS[assetKey]
    const promise = new GLTFLoader().loadAsync(`${MODEL_BASE_URL}${asset.file}`).then((gltf) => {
      const assetScene = gltf.scene
      assetScene.userData.spatialAssetKey = assetKey
      assetScene.userData.spatialAssetLabel = asset.label
      registerAssetNodes(THREE, assetScene)
      indexDebugLayerNodes(assetScene, assetKey, debugLayerNodes)
      optimiseStaticGeometry(THREE, mergeGeometries, assetScene, architecturalMaterials)
      applyArchitecturalMaterials(THREE, assetScene, architecturalMaterials)
      applyDisplayStyleToRoot(THREE, assetScene, arcticMode.value, arcticMaterials)
      configureModelShadows(assetScene)
      createArcticEdges(THREE, assetScene, arcticMode.value, arcticEdgeMaterialRef)
      assetRecords.set(assetKey, { scene: assetScene })
      if (!loadedAssetKeys.value.includes(assetKey)) {
        loadedAssetKeys.value = [...loadedAssetKeys.value, assetKey]
      }
      return assetScene
    })
    assetLoadPromises.set(assetKey, promise)
    try {
      return await promise
    } finally {
      assetLoadPromises.delete(assetKey)
    }
  }

  function preloadAllAssets(model, onFinished) {
    const allAssetKeys = Object.keys(MODEL_ASSETS)
    Promise.all(allAssetKeys.map((key) => loadAsset(key)))
      .then(() => {
        if (model) {
          attachRequiredAssets(model, assetRecords, allAssetKeys)
        }
        loading.value = false
        if (onFinished) onFinished()
      })
      .catch((error) => {
        console.warn('静默预加载部分模型资产失败:', error)
      })
  }

  function requestRequiredAssets(mode, onReady) {
    const assetKeys = requiredAssetKeysForMode(mode)
    const missingKeys = assetKeys.filter((assetKey) => !assetRecords.has(assetKey))
    if (!missingKeys.length) return false

    const requestKey = `${mode}:${missingKeys.join(',')}`
    if (assetSyncKey === requestKey) return true
    assetSyncKey = requestKey
    loading.value = true
    Promise.all(missingKeys.map((assetKey) => loadAsset(assetKey)))
      .then(() => {
        if (assetSyncKey !== requestKey) return
        assetSyncKey = ''
        loading.value = false
        if (onReady) onReady()
      })
      .catch((error) => {
        if (assetSyncKey !== requestKey) return
        assetSyncKey = ''
        loading.value = false
        loadError.value = `“${MODEL_ASSETS[missingKeys[0]]?.label || missingKeys[0]}”模型未能载入，请稍后重试。`
        console.error(error)
      })
    return true
  }

  function setNodeVisible(name, visible) {
    const node = namedNodes.get(name)
    if (node) node.visible = visible
  }

  function applyDisplayStyle() {
    const THREE = getTHREE()
    if (!THREE) return
    assetRecords.forEach(({ scene: assetScene }) => {
      applyDisplayStyleToRoot(THREE, assetScene, arcticMode.value, arcticMaterials)
      configureModelShadows(assetScene)
      applyArcticEdgeVisibility(assetScene, arcticMode.value)
    })
  }

  function nodesForDebugLayer(layer) {
    return debugLayerNodes.get(layer.id) || []
  }

  function applyDebugLayerOverride(layer, visible) {
    nodesForDebugLayer(layer).forEach((node) => {
      node.visible = visible
    })
  }

  function applyDebugLayerOverrides(debugDefinitionsMap) {
    Object.entries(debugLayerVisibility.value).forEach(([layerId, visible]) => {
      const layer = debugDefinitionsMap.get(layerId)
      if (layer) applyDebugLayerOverride(layer, visible)
    })
  }

  function applyVisibilityForMode(model, mode, activeRoomId, debugDefinitionsMap, associatedLayerIds = []) {
    if (!model) return
    const exteriorNames = ['facede-front', 'facade-back', 'wall-outside', 'roof', 'stair-outside']
    const sectionHiddenNames = ['facade-back', 'wall-outside', 'roof', 'stair-outside']
    model.traverse((node) => {
      node.visible = node.userData?.isArcticEdge ? arcticMode.value : true
    })
    if (mode === 'section') {
      setNodeVisible('env', false)
      sectionHiddenNames.forEach((name) => setNodeVisible(name, false))
      setNodeVisible('WEB_NAV', true)
    } else if (mode === 'immersive') {
      setNodeVisible('env', false)
      exteriorNames.forEach((name) => setNodeVisible(name, true))
      setNodeVisible('WEB_NAV', false)
    }
    applyDebugLayerOverrides(debugDefinitionsMap)
    associatedLayerIds.forEach((layerId) => {
      const layer = debugDefinitionsMap.get(layerId)
      if (layer) applyDebugLayerOverride(layer, true)
    })
    setNavigationAppearance(roomNodes, activeRoomId)
  }

  return {
    loading,
    loadError,
    loadedAssetKeys,
    debugLayerVisibility,
    assetRecords,
    roomNodes,
    roomBounds,
    roomMeshes,
    namedNodes,
    loadAsset,
    preloadAllAssets,
    requestRequiredAssets,
    applyDisplayStyle,
    applyVisibilityForMode,
    applyDebugLayerOverride,
    nodesForDebugLayer,
    setNodeVisible,
  }
}
