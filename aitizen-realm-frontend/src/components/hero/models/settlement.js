import * as THREE from 'three'
import { mesh, metal, bake, hoop } from './atelier.js'

export function palette() {
  return {
    stone: metal(0xb9ab88, 0.61, 0.25), dark: metal(0x363b36),
    gold: metal(0xc5a266, 0.27), glass: metal(0x5a716d, 0.18, 0.7),
    foliage: metal(0x42513a, 0.91, 0), light: new THREE.MeshStandardMaterial({
      color: 0xf7deb1, emissive: 0xcb8c40, emissiveIntensity: 0.9, roughness: 0.5,
    }),
  }
}

// A facade has a base, stacked rows of glazing, cornices, and a roof.
// Bake parts by material while preserving one transform for the entire building.
export function pavilion(height, kind, m) {
  const building = new THREE.Group()
  const width = 0.42
  const levels = Math.max(2, Math.floor(height / 0.17))
  mesh(building, new THREE.BoxGeometry(0.41, height, 0.41), m.glass, 0, height / 2)
  for (let i = 0; i <= levels; i++) {
    const y = height * i / levels
    mesh(building, new THREE.BoxGeometry(width + 0.02, 0.023, width + 0.02), i === levels ? m.gold : m.stone, 0, y)
    if (i === levels) continue
    for (let j = 0; j < 3; j++) {
      const offset = (j - 1) * 0.12
      const pane = (i + j + kind) % 3 ? m.light : m.glass
      mesh(building, new THREE.BoxGeometry(0.09, height / levels * 0.56, 0.005), pane, offset, y + height / levels * 0.52, 0.207)
      mesh(building, new THREE.BoxGeometry(0.005, height / levels * 0.56, 0.09), pane, 0.207, y + height / levels * 0.52, offset)
    }
  }
  for (const x of [-0.2, 0.2]) for (const z of [-0.2, 0.2]) {
    mesh(building, new THREE.BoxGeometry(0.022, height, 0.022), m.stone, x, height / 2, z)
  }
  if (kind % 3 === 0) {
    mesh(building, new THREE.SphereGeometry(0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), m.glass, 0, height)
    hoop(building, 0.172, 0.009, m.gold, height).rotation.x = Math.PI / 2
  } else {
    mesh(building, new THREE.BoxGeometry(0.22, 0.055, 0.18), m.dark, -0.03, height + 0.027)
  }
  return bake(building)
}

export function tree(parent, x, y, z, size, m) {
  mesh(parent, new THREE.CylinderGeometry(0.018 * size, 0.026 * size, 0.20 * size, 6), m.dark, x, y + 0.10 * size, z)
  const crown = mesh(parent, new THREE.IcosahedronGeometry(0.12 * size, 1), m.foliage, x, y + 0.25 * size, z)
  crown.scale.set(1, 1.3, 0.95)
}
