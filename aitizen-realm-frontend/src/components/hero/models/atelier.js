import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export const TAU = Math.PI * 2

export function metal(color, roughness = 0.34, metalness = 0.66) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}

export function mesh(group, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material)
  object.position.set(x, y, z)
  group.add(object)
  return object
}

export function hoop(group, radius, thickness, material, y = 0) {
  return mesh(group, new THREE.TorusGeometry(radius, thickness, 6, 80), material, 0, y)
}

export function disk(group, radius, height, material, y) {
  return mesh(group, new THREE.CylinderGeometry(radius, radius, height, 72), material, 0, y)
}

export function signalPath(group, points, material) {
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material)
  group.add(line)
  return line
}

// Bake static scenery into one mesh per surface. Animated groups remain separate.
export function bake(group) {
  group.updateWorldMatrix(true, true)
  const inverse = group.matrixWorld.clone().invert()
  const batches = new Map()
  const originals = new Set()
  group.traverse(item => {
    if (!item.isMesh) return
    originals.add(item.geometry)
    let copy = item.geometry.index ? item.geometry.toNonIndexed() : item.geometry.clone()
    for (const key of Object.keys(copy.attributes)) {
      if (key !== 'position' && key !== 'normal') copy.deleteAttribute(key)
    }
    copy.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, item.matrixWorld))
    if (!batches.has(item.material)) batches.set(item.material, [])
    batches.get(item.material).push(copy)
  })
  group.clear()
  for (const [material, parts] of batches) {
    group.add(new THREE.Mesh(mergeGeometries(parts), material))
    parts.forEach(part => part.dispose())
  }
  originals.forEach(geometry => geometry.dispose())
  return group
}

export function randomSource(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}
