import * as THREE from 'three'
import { TAU, mesh, metal, hoop, disk, signalPath, randomSource } from './atelier.js'

export function createCognitiveOrbit() {
  const group = new THREE.Group()
  group.name = 'Cognitive orbit'
  const brass = metal(0xb29660, 0.25)
  const black = metal(0x20221e, 0.3)
  const thread = new THREE.LineBasicMaterial({ color: 0xe0c08a, transparent: true, opacity: 0.62 })
  const membrane = new THREE.MeshStandardMaterial({ color: 0x758372, metalness: 0.55, roughness: 0.34, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide })
  const random = randomSource(105)
  const gates = []
  for (let index = 0; index < 6; index++) {
    const gate = new THREE.Group()
    gate.name = ['Perception', 'Memory', 'Reasoning', 'Decision', 'Action', 'Evolution'][index]
    gate.position.set((index - 2.5) * 0.97, 0.03, -0.3)
    const radius = 1.23 - Math.abs(index - 2.5) * 0.055
    hoop(gate, radius, 0.017, brass)
    hoop(gate, radius - 0.058, 0.005, brass)
    mesh(gate, new THREE.CircleGeometry(radius - 0.025, 64), membrane)
    const tracks = []
    for (let j = 0; j < 25; j++) {
      const angle = j * TAU / 25
      const outer = radius * (0.76 + random() * 0.17)
      const inner = outer - (0.12 + random() * 0.38)
      const x = Math.cos(angle), y = Math.sin(angle)
      tracks.push(x * outer, y * outer, 0.015, x * inner, y * inner, 0.015,
        x * inner, y * inner, 0.015, x * inner - y * 0.09, y * inner + x * 0.09, 0.015)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(tracks, 3))
    gate.add(new THREE.LineSegments(geometry, thread))
    group.add(gate)
    gates.push(gate)
  }

  const core = new THREE.Group()
  core.position.z = 0.72
  mesh(core, new THREE.IcosahedronGeometry(0.82, 3), black)
  for (let i = 0; i < 3; i++) hoop(core, 0.831, i === 0 ? 0.012 : 0.006, brass).rotation.set(0.5 + i, i * 0.8, 0.3)
  group.add(core)
  disk(group, 2.95, 0.1, black, -1.49)
  hoop(group, 2.86, 0.012, brass, -1.43).rotation.x = Math.PI / 2
  const conduit = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.1, -0.09, 0), new THREE.Vector3(-1.5, 0.07, 0.32),
    new THREE.Vector3(0, 0.04, 1.58), new THREE.Vector3(1.5, -0.03, 0.32),
    new THREE.Vector3(3.1, 0.1, 0),
  ])
  signalPath(group, conduit.getPoints(128), thread)
  const signal = new THREE.MeshBasicMaterial({ color: 0xffdeb0 })
  const lights = Array.from({length: 12}, () => mesh(group, new THREE.SphereGeometry(0.026, 8, 6), signal))
  return {
    group, camera: {position: [0.2, 1.0, 8.45], target: [0, -0.22, 0]},
    update(time, progress, burst) {
      gates.forEach((gate, index) => {
        gate.rotation.y = 0.87 + 0.11 * Math.sin(time * 0.25 + index) + progress * 0.1
        gate.rotation.z = Math.sin(time * 0.14 + index) * 0.08
        gate.position.x = (index - 2.5) * (0.97 + burst * 0.12)
      })
      core.rotation.y = time * 0.1
      lights.forEach((point, i) => conduit.getPoint((time * 0.10 + progress * 0.45 + i / lights.length) % 1, point.position))
    },
  }
}
