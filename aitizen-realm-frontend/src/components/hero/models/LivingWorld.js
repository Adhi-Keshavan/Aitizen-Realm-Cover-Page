import * as THREE from 'three'
import { createContextActivity } from './cityActivity.js'
import { palette, pavilion, tree } from './settlement.js'
import { mesh, disk, hoop, TAU, bake, randomSource } from './atelier.js'

export function createLivingWorld() {
  const group = new THREE.Group()
  group.name = 'Living civilization'
  const city = new THREE.Group()
  const park = new THREE.Group()
  const m = palette(), random = randomSource(108)
  group.add(city)
  disk(city, 2.49, 0.31, m.dark, -1.515)
  disk(city, 2.43, 0.05, m.stone, -1.378)
  disk(city, 2.39, 0.035, m.dark, -1.352)
  for (const [radius, y] of [[2.48, -1.42], [2.47, -1.57], [2.32, -1.33]]) {
    hoop(park, radius, 0.012, m.gold, y).rotation.x = Math.PI / 2
  }
  const buildings = []
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    const x = (col - 1.5) * 0.76, z = (row - 1.5) * 0.76
    const height = 0.39 + random() * 0.72 + (row === 0 && col === 2 ? 0.42 : 0)
    const building = pavilion(height, row * 4 + col, m)
    building.position.set(x, -1.33, z)
    city.add(building)
    buildings.push({ group: building, height })
    tree(park, x - 0.25, -1.33, z + 0.2, 0.76, m)
  }
  // Parks and lamps sit around the perimeter rather than in the traffic lanes.
  for (let i = 0; i < 38; i++) {
    const angle = i * TAU / 38
    const x = Math.cos(angle) * 2.18, z = Math.sin(angle) * 2.18
    if (i % 3) tree(park, x, -1.33, z, 0.82 + random() * 0.7, m)
    else {
      mesh(park, new THREE.CylinderGeometry(0.012, 0.014, 0.27, 7), m.gold, x, -1.195, z)
      mesh(park, new THREE.SphereGeometry(0.029, 10, 7), m.light, x, -1.045, z)
    }
  }
  for (let i = -2; i <= 2; i++) {
    const lane = i * 0.76
    mesh(park, new THREE.BoxGeometry(3.36, 0.006, 0.012), m.gold, 0, -1.337, lane)
    mesh(park, new THREE.BoxGeometry(0.012, 0.006, 3.36), m.gold, lane, -1.337, 0)
  }
  city.add(bake(park))
  const plaza = disk(city, 0.27, 0.035, m.gold, -1.30)
  const column = mesh(city, new THREE.CylinderGeometry(0.015, 0.055, 1.5, 16), m.light, 0, -0.53)
  const orb = new THREE.Group()
  mesh(orb, new THREE.SphereGeometry(0.39, 40, 24), m.dark)
  for (let i = 0; i < 3; i++) hoop(orb, 0.404, 0.009, m.gold).rotation.set(0.55 * i, 0.95 * i, i * 0.32)
  city.add(orb)
  const updateActors = createContextActivity(city, buildings, m)
  return {
    group, camera: {position: [4.4, 2.4, 5.85], target: [0, -0.63, 0]},
    update(time, progress, burst) {
      city.rotation.y = -0.34 + progress * 0.36
      buildings.forEach((item, i) => {
        item.group.scale.y = 0.82 + 0.18 * Math.min(1, progress * 2 + (i % 4) / 5)
      })
      orb.position.y = 0.56 + 0.12 * burst + 0.035 * Math.sin(time * 0.65)
      orb.rotation.y = time * 0.15
      column.scale.y = (orb.position.y - 0.32 - plaza.position.y) / 1.5
      column.position.y = plaza.position.y + 0.75 * column.scale.y
      updateActors(progress, time)
    },
  }
}
