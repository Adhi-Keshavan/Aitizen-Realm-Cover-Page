import * as THREE from 'three'
import { mesh, hoop, bake, randomSource, signalPath, TAU } from './atelier.js'
import { palette, pavilion, tree } from './settlement.js'

function rock(radius, random) {
  const positions = [], indices = [], sides = 18
  const rim = Array.from({length: sides}, () => 0.88 + random() * 0.2)
  for (const [width, depth] of [[1, 0], [0.94, -0.24], [0.56, -0.6], [0.14, -1]]) {
    for (let i = 0; i < sides; i++) {
      const angle = i * TAU / sides
      positions.push(Math.cos(angle) * rim[i] * radius * width,
        radius * depth * (0.83 + random() * 0.3), Math.sin(angle) * rim[i] * radius * width)
    }
  }
  for (let row = 0; row < 3; row++) for (let i = 0; i < sides; i++) {
    const a = row * sides + i, b = row * sides + (i + 1) % sides
    indices.push(a, b, b + sides, a, b + sides, a + sides)
  }
  for (let i = 1; i < sides - 1; i++) indices.push(0, i + 1, i, 3 * sides, 3 * sides + i, 3 * sides + i + 1)
  const result = new THREE.BufferGeometry()
  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  result.setIndex(indices)
  result.computeVertexNormals()
  return result
}

export function createSignalSociety() {
  const group = new THREE.Group()
  group.name = 'Signal to society'
  const m = palette(), random = randomSource(61)
  const core = new THREE.Group()
  core.position.set(-1.26, 0.62, 0)
  mesh(core, new THREE.SphereGeometry(0.91, 48, 28), m.dark)
  for (let i = 0; i < 5; i++) hoop(core, 0.934 + i * 0.035, i ? 0.006 : 0.015, m.gold).rotation.set(i * 0.58, i * 0.81, 0.33)
  group.add(core)
  const islands = [
    {x: 1.33, y: -0.80, z: 0.64, r: 1.16}, {x: 2.18, y: 0.12, z: -1.55, r: 0.77},
    {x: -0.84, y: -1.14, z: -1.32, r: 0.63}, {x: -2.4, y: -0.98, z: -2.7, r: 0.38},
  ]
  const paths = []
  const wire = new THREE.LineBasicMaterial({ color: 0xe8bd7e, transparent: true, opacity: 0.45 })
  islands.forEach(({x, y, z, r}, index) => {
    const land = new THREE.Group()
    mesh(land, rock(r, random), m.dark)
    const lawn = mesh(land, new THREE.CylinderGeometry(r * 0.85, r * 0.88, r * 0.045, 36), m.foliage)
    lawn.position.y = 0.014
    for (let i = 0; i < 3; i++) {
      const angle = i * TAU / 3 + 0.21
      const building = pavilion(0.42 + 0.1 * i, i, m)
      building.scale.setScalar(r * 0.81)
      building.position.set(Math.cos(angle) * r * 0.48, 0.035, Math.sin(angle) * r * 0.48)
      land.add(building)
      tree(land, Math.cos(angle + 0.74) * r * 0.61, 0.03, Math.sin(angle + 0.74) * r * 0.61, r, m)
    }
    hoop(land, r * 0.73, 0.009, m.gold, 0.035).rotation.x = Math.PI / 2
    for (let i = 0; i < 7; i++) {
      const angle = i * TAU / 7 + random() * 0.2
      const px = r * 0.72 * Math.cos(angle), pz = r * 0.72 * Math.sin(angle)
      mesh(land, new THREE.ConeGeometry(0.022 * r, 0.085 * r, 6), m.light, px, 0.05 + 0.04 * r, pz)
      mesh(land, new THREE.IcosahedronGeometry(0.019 * r, 0), m.light, px, 0.05 + 0.10 * r, pz)
    }
    bake(land)
    land.position.set(x, y, z)
    group.add(land)
    for (let i = 0; i < (index === 0 ? 12 : 5); i++) {
      const end = new THREE.Vector3(x + (random() - 0.5) * r, y + 0.08, z + (random() - 0.5) * r)
      const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(-0.42, 0.64, 0.22),
        new THREE.Vector3(0.24, 0.7 + random() * 0.61, 0.38 + random() * 0.18),
        new THREE.Vector3(end.x - 0.3, end.y + 0.25 + random() * 0.58, end.z), end)
      signalPath(group, curve.getPoints(48), wire)
      paths.push(curve)
    }
  })
  const count = paths.length * 4, motes = new THREE.BufferGeometry()
  motes.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage))
  const sparks = new THREE.Points(motes, new THREE.PointsMaterial({color: 0xffe2b1, size: 0.031, depthWrite: false}))
  sparks.frustumCulled = false
  group.add(sparks)
  const sample = new THREE.Vector3()
  return {
    group, camera: { position: [0.2, 0.86, 8.15], target: [0.15, -0.12, 0] },
    update(time, progress, burst) {
      core.rotation.y = time * 0.075 + progress * 0.3
      core.scale.setScalar(1 + burst * 0.12)
      group.rotation.y = (progress - 0.5) * 0.14
      for (let i = 0; i < count; i++) {
        paths[i % paths.length].getPoint((time * 0.13 + i * 0.173 + progress * 0.3 + burst * 0.2) % 1, sample)
        motes.attributes.position.setXYZ(i, sample.x, sample.y, sample.z)
      }
      motes.attributes.position.needsUpdate = true
    },
  }
}
