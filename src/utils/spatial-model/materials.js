/**
 * 三维模型材质与线框管理系统
 * 负责材质识别、建筑基础材质、极地白模材质、极地线框提取与导航热区交互材质
 */

export function categoryForMaterial(material) {
  const source = `${material?.name || ''} ${material?.userData?.name || ''}`.toLowerCase()
  const transmission = Number(material?.transmission || 0)
  if (transmission > 0.2 || source.includes('glass') || source.includes('玻璃')) return 'glass'
  if (source.includes('water') || source.includes('pool') || source.includes('水')) return 'water'
  if (source.includes('wood') || source.includes('floor') || source.includes('bamboo') || source.includes('木')) return 'wood'
  if (source.includes('frame') || source.includes('window') || source.includes('black') || source.includes('metal') || source.includes('fenc') || source.includes('roof')) return 'graphite'
  if (source.includes('concrete') || source.includes('stone') || source.includes('asphalt') || source.includes('cement') || source.includes('wall') || source.includes('ground') || source.includes('dimgray') || source.includes('灰')) return 'mineral'
  return 'plaster'
}

export function createArchitecturalMaterial(THREE, sourceMaterial, cache, { doubleSided = false } = {}) {
  const category = categoryForMaterial(sourceMaterial)
  const cacheKey = `${category}:${doubleSided ? 'double' : 'front'}`
  const cachedMaterial = cache.get(cacheKey)
  if (cachedMaterial) return cachedMaterial

  const colors = {
    mineral: 0xb8b3aa,
    wood: 0xb98b58,
    graphite: 0x505556,
    plaster: 0xd8d4c9,
    glass: 0xabc5c4,
    water: 0x77a7a8,
  }

  const material = category === 'glass' || category === 'water'
    ? new THREE.MeshPhysicalMaterial({
      color: colors[category],
      roughness: category === 'glass' ? 0.16 : 0.18,
      metalness: 0,
      transmission: category === 'glass' ? 0.3 : 0.1,
      opacity: category === 'glass' ? 0.58 : 0.56,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    : new THREE.MeshStandardMaterial({
      color: colors[category],
      roughness: category === 'graphite' ? 0.68 : category === 'wood' ? 0.72 : 0.86,
      metalness: category === 'graphite' ? 0.08 : 0,
      side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    })

  material.name = sourceMaterial?.name || category
  cache.set(cacheKey, material)
  return material
}

export function createArcticMaterial(THREE, sourceMaterial, cache, { doubleSided = false } = {}) {
  const category = categoryForMaterial(sourceMaterial)
  const cacheKey = `${category}:${doubleSided ? 'double' : 'front'}`
  const cachedMaterial = cache.get(cacheKey)
  if (cachedMaterial) return cachedMaterial

  const colors = {
    mineral: 0xfafaf7,
    wood: 0xf5f3ed,
    graphite: 0xe9ece8,
    plaster: 0xffffff,
    glass: 0xffffff,
    water: 0xe3eeee,
  }

  const material = category === 'glass'
    ? new THREE.MeshPhysicalMaterial({
      color: colors[category],
      roughness: 0.12,
      metalness: 0,
      transmission: 0.58,
      ior: 1.45,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    : new THREE.MeshStandardMaterial({
      color: colors[category],
      roughness: 0.94,
      metalness: 0,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    })

  material.name = `Arctic ${category}`
  cache.set(cacheKey, material)
  return material
}

export function isNavigationMesh(node) {
  return Boolean(node.userData?.isWebNavigation)
}

export function createNavigationMaterial(THREE, { active = false } = {}) {
  const material = new THREE.MeshBasicMaterial({
    color: active ? 0xb4825f : 0xb78862,
    transparent: true,
    opacity: active ? 0.3 : 0.035,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  material.userData.navBaseOpacity = 0.035
  material.userData.navActiveOpacity = 0.3
  return material
}

export function configureNavigationNode(THREE, node, roomMeshes) {
  node.traverse((child) => {
    if (!child.isMesh) return
    child.userData.isWebNavigation = true
    child.userData.navigationRoom = node.name
    child.material = Array.isArray(child.material)
      ? child.material.map(() => createNavigationMaterial(THREE))
      : createNavigationMaterial(THREE)
    child.renderOrder = 5
    roomMeshes.push(child)
  })
}

export function applyArchitecturalMaterials(THREE, root, cache) {
  if (!root) return
  root.traverse((child) => {
    if (!child.isMesh || isNavigationMesh(child) || child.userData?.isStaticBatch) return
    const createMaterial = (material) => createArchitecturalMaterial(THREE, material, cache, {
      doubleSided: root.userData?.spatialAssetKey === 'env'
        && categoryForMaterial(material) === 'mineral',
    })
    child.material = Array.isArray(child.material)
      ? child.material.map(createMaterial)
      : createMaterial(child.material)
  })
}

export function applyDisplayStyleToRoot(THREE, root, arcticMode, arcticCache) {
  if (!root) return
  root.traverse((node) => {
    if (!node.isMesh || isNavigationMesh(node)) return
    if (!node.userData.spatialBaseMaterial) node.userData.spatialBaseMaterial = node.material
    if (!arcticMode) {
      node.material = node.userData.spatialBaseMaterial
      return
    }
    const sourceMaterials = Array.isArray(node.userData.spatialBaseMaterial)
      ? node.userData.spatialBaseMaterial
      : [node.userData.spatialBaseMaterial]
    const arcticMaterial = sourceMaterials.map((material) => createArcticMaterial(THREE, material, arcticCache, {
      doubleSided: root.userData?.spatialAssetKey === 'env'
        && categoryForMaterial(material) === 'mineral',
    }))
    node.material = Array.isArray(node.userData.spatialBaseMaterial)
      ? arcticMaterial
      : arcticMaterial[0]
  })
}

export function applyArcticEdgeVisibility(root, arcticMode) {
  if (!root) return
  root.traverse((node) => {
    if (node.userData?.isArcticEdge) node.visible = arcticMode
  })
}

export function createArcticEdges(THREE, root, arcticMode, edgeMaterialHolder) {
  if (!root || !THREE?.EdgesGeometry || !THREE?.LineSegments) return
  const meshes = []
  root.traverse((node) => {
    if (!node.isMesh || isNavigationMesh(node) || node.userData?.isArcticEdge) return
    const position = node.geometry?.getAttribute('position')
    if (!position) return
    if (!node.userData?.isStaticBatch && position.count > 12000) return
    meshes.push(node)
  })

  meshes.forEach((mesh) => {
    const edgeGeometry = new THREE.EdgesGeometry(mesh.geometry, 24)
    if (!edgeGeometry.getAttribute('position')?.count) {
      edgeGeometry.dispose()
      return
    }
    if (!edgeMaterialHolder.current) {
      edgeMaterialHolder.current = new THREE.LineBasicMaterial({
        color: 0x69716e,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        toneMapped: false,
      })
    }
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterialHolder.current)
    edges.name = `${mesh.name || 'mesh'}-arctic-edges`
    edges.userData.isArcticEdge = true
    edges.renderOrder = 4
    edges.visible = arcticMode
    mesh.add(edges)
  })
}

export function setNavigationAppearance(roomNodes, activeRoomId = '') {
  roomNodes.forEach((node, nodeName) => {
    const active = nodeName === `r${activeRoomId.replace('room', '')}`
    node.traverse((child) => {
      if (!child.isMesh || !isNavigationMesh(child)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        material.opacity = active ? material.userData.navActiveOpacity : material.userData.navBaseOpacity
        material.color.set(active ? 0xb4825f : 0x747570)
        material.needsUpdate = true
      })
    })
  })
}
