/**
 * 三维模型镜头与平滑过渡系统
 * 负责轴测总览、剖面观察、沉浸漫游三种模式的相机推导、视锥体自适应与 Cubic 缓动过渡
 */

import {
  presetForRoom,
  immersiveFovFor,
} from '../../data/spatial/modelConfig.js'
import { boxFor } from './modelLoader.js'

export function isReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - ((-2 * value + 2) ** 3) / 2
}

export function projectedFrameForBox(box, position, target, THREE) {
  const direction = target.clone().sub(position).normalize()
  const screenRight = direction.clone().cross(new THREE.Vector3(0, 1, 0)).normalize()
  const screenUp = screenRight.clone().cross(direction).normalize()
  const corners = []
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z))
    }
  }
  const horizontal = corners.map((corner) => corner.dot(screenRight))
  const vertical = corners.map((corner) => corner.dot(screenUp))
  return {
    width: (Math.max(...horizontal) - Math.min(...horizontal)) * 1.16,
    height: (Math.max(...vertical) - Math.min(...vertical)) * 1.16,
  }
}

export function calculateOverviewCamera(THREE, modelCenter, modelSize, modelBounds) {
  const center = modelCenter.clone()
  const size = modelSize.clone()
  const direction = new THREE.Vector3(1.08, 0.92, 1.16).normalize()
  const distance = Math.max(size.length() * 1.42, 92)
  const position = center.clone().add(direction.multiplyScalar(distance))
  const projectedFrame = projectedFrameForBox(modelBounds, position, center, THREE)
  const frameWidth = projectedFrame.width
  const frameHeight = projectedFrame.height
  return { position, center, frameWidth, frameHeight }
}

export function calculateSectionCamera(THREE, roomId, roomNodes, roomBounds, modelSize, modelBounds, modelCenter) {
  const node = roomNodes.get(`r${roomId.replace('room', '')}`)
  if (!node) return calculateOverviewCamera(THREE, modelCenter, modelSize, modelBounds)
  const box = roomBounds.get(node.name) || boxFor(THREE, node)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const depth = Math.max(modelSize.z * 1.3, 78)
  const position = new THREE.Vector3(center.x, center.y, modelBounds.min.z - depth)
  const frameWidth = Math.max(size.x * 2.7, 25)
  const frameHeight = Math.max(size.y * 2.9, 13)
  return { position, center, frameWidth, frameHeight }
}

export function calculateImmersiveCamera(THREE, roomId, roomNodes, roomBounds, modelBounds, keyword = '') {
  const node = roomNodes.get(`r${roomId.replace('room', '')}`)
  const box = node ? roomBounds.get(node.name) || boxFor(THREE, node) : modelBounds
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const preset = presetForRoom(roomId, keyword)
  const position = Array.isArray(preset.position)
    ? new THREE.Vector3(...preset.position)
    : new THREE.Vector3(
      center.x + size.x * preset.offset.x,
      Math.max(box.min.y + 1.6, modelBounds.min.y + 1.6),
      center.z + size.z * preset.offset.z,
    )
  const target = Array.isArray(preset.target)
    ? new THREE.Vector3(...preset.target)
    : position.clone().add(new THREE.Vector3(...preset.direction))
  return { position, target, fov: immersiveFovFor(roomId, keyword) }
}

export function updateOrthoFrustum(orthoCamera, renderer, orthoFrameSize) {
  if (!orthoCamera || !renderer) return
  const rect = renderer.domElement.getBoundingClientRect()
  const aspect = Math.max(rect.width / Math.max(rect.height, 1), 0.5)
  const verticalSpan = Math.max(orthoFrameSize.height, orthoFrameSize.width / aspect) * 1.16
  orthoCamera.left = -verticalSpan * aspect / 2
  orthoCamera.right = verticalSpan * aspect / 2
  orthoCamera.top = verticalSpan / 2
  orthoCamera.bottom = -verticalSpan / 2
  orthoCamera.updateProjectionMatrix()
}

export function createCameraTransitionManager({
  getOrthoCamera,
  getPerspectiveCamera,
  getControls,
  onRequestRender,
  onImmersiveReady,
}) {
  let cameraAnimationFrame = null
  let transitionSerial = 0
  let orthoFrameSize = { width: 120, height: 60 }

  function stopCameraAnimation() {
    if (cameraAnimationFrame) cancelAnimationFrame(cameraAnimationFrame)
    cameraAnimationFrame = null
    transitionSerial += 1
  }

  function setOrthoFrame(frameWidth, frameHeight, renderer) {
    orthoFrameSize = { width: Math.max(frameWidth, 1), height: Math.max(frameHeight, 1) }
    const orthoCamera = getOrthoCamera()
    if (orthoCamera && renderer) updateOrthoFrustum(orthoCamera, renderer, orthoFrameSize)
  }

  function animateOrtho({ nextPosition, nextTarget, frameWidth, frameHeight, renderer }) {
    const orthoCamera = getOrthoCamera()
    const controls = getControls()
    if (!orthoCamera || !controls) return
    stopCameraAnimation()
    setOrthoFrame(frameWidth, frameHeight, renderer)
    const serial = transitionSerial
    const initialPosition = orthoCamera.position.clone()
    const initialTarget = controls.target.clone()
    const start = performance.now()
    const duration = isReducedMotion() ? 0 : 360

    const step = (now) => {
      if (serial !== transitionSerial) return
      const amount = duration ? Math.min(1, (now - start) / duration) : 1
      const eased = easeInOutCubic(amount)
      orthoCamera.position.lerpVectors(initialPosition, nextPosition, eased)
      controls.target.lerpVectors(initialTarget, nextTarget, eased)
      controls.update()
      onRequestRender?.()
      if (amount < 1) cameraAnimationFrame = requestAnimationFrame(step)
      else cameraAnimationFrame = null
    }

    cameraAnimationFrame = requestAnimationFrame(step)
  }

  function animatePerspective({ nextPosition, nextTarget, isImmersiveMode }) {
    const perspectiveCamera = getPerspectiveCamera()
    if (!perspectiveCamera) return
    stopCameraAnimation()
    const serial = transitionSerial
    const initialPosition = perspectiveCamera.position.clone()
    const initialQuaternion = perspectiveCamera.quaternion.clone()
    const targetCamera = perspectiveCamera.clone()
    targetCamera.position.copy(nextPosition)
    targetCamera.lookAt(nextTarget)
    const start = performance.now()
    const duration = isReducedMotion() ? 0 : 380

    const step = (now) => {
      if (serial !== transitionSerial) return
      const amount = duration ? Math.min(1, (now - start) / duration) : 1
      const eased = easeInOutCubic(amount)
      perspectiveCamera.position.lerpVectors(initialPosition, nextPosition, eased)
      perspectiveCamera.quaternion.slerpQuaternions(initialQuaternion, targetCamera.quaternion, eased)
      onRequestRender?.()
      if (amount < 1) cameraAnimationFrame = requestAnimationFrame(step)
      else {
        cameraAnimationFrame = null
        if (isImmersiveMode) onImmersiveReady?.(true)
      }
    }

    cameraAnimationFrame = requestAnimationFrame(step)
  }

  return {
    stopCameraAnimation,
    setOrthoFrame,
    animateOrtho,
    animatePerspective,
    getOrthoFrameSize: () => orthoFrameSize,
  }
}
