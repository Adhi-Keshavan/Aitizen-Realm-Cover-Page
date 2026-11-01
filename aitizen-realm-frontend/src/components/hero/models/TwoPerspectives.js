import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { mesh, metal, disk, hoop, TAU, signalPath, bake } from './atelier.js'
import { pavilion, palette } from './settlement.js'

// Both sculptures face local +Z. The nose is at 55% of the marble bust's
// height and 52% of the automaton's. Match that landmark with uniform scaling.
const PORTRAITS = [
  { file: 'human', x: -1.46, yaw: 1.17, nose: 0.55 },
  { file: 'automaton', x: 1.46, yaw: -1.17, nose: 0.52 },
]
const height = 3.7

function dressAutomaton(figure, brass, graphite) {
  // A machined ear module on the side facing the camera.
  const ear = new THREE.Group()
  ear.position.set(0.83, 0.47, -0.12)
  ear.rotation.y = Math.PI / 2
  const housing = mesh(ear, new THREE.CylinderGeometry(0.28, 0.31, 0.125, 48), graphite)
  housing.rotation.x = Math.PI / 2
  hoop(ear, 0.252, 0.022, brass).position.z = 0.075
  hoop(ear, 0.171, 0.01, brass).position.z = 0.079
  mesh(ear, new THREE.SphereGeometry(0.074, 16, 10), new THREE.MeshStandardMaterial({ color: 0xfad09a, emissive: 0xb88740, emissiveIntensity: 0.72 }), 0, 0, 0.08)
  figure.add(ear)
}

function laurel(figure, surface, brass) {
  // Fit a small branch to the existing sculpted hair. Sample the actual surface
  // so the leaf positions follow the head even when its base has a different pivot.
  figure.updateWorldMatrix(true, true)
  const local = figure.matrixWorld.clone().invert()
  const samples = []
  surface.traverse(object => {
    if (!object.isMesh) return
    const matrix = new THREE.Matrix4().multiplyMatrices(local, object.matrixWorld)
    const attribute = object.geometry.attributes.position
    for (let i = 0; i < attribute.count; i++) {
      const p = new THREE.Vector3().fromBufferAttribute(attribute, i).applyMatrix4(matrix)
      if (p.y > 0.86 && p.y < 1.46) samples.push(p)
    }
  })
  const points = []
  for (let i = 0; i < 18; i++) {
    const angle = -2.85 + i * 0.17, y = 1.05 + 0.18 * Math.cos(angle)
    const x = Math.sin(angle), z = Math.cos(angle)
    let best, score = Infinity
    for (const p of samples) {
      const radial = p.x * x + p.z * z
      if (radial <= 0) continue
      const distance = 3 * Math.abs(p.y - y) + Math.abs(p.x * z - p.z * x) - radial * 0.06
      if (distance < score) { score = distance; best = p }
    }
    if (best) points.push(best.clone().add(new THREE.Vector3(0.017 * x, 0, 0.017 * z)))
  }
  if (points.length < 3) return
  const leaves = new THREE.Group()
  mesh(leaves, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 36, 0.012, 5, false), brass)
  points.slice(1).forEach((p, i) => {
    const leaf = mesh(leaves, new THREE.SphereGeometry(1, 8, 5), brass, p.x, p.y + 0.04, p.z)
    leaf.scale.set(0.036, 0.087, 0.023)
    leaf.rotation.set(0.28, -2.85 + i * 0.17, i % 2 ? 0.58 : -0.58)
  })
  figure.add(bake(leaves))
}

function loadCoverBust(name) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  return loader.loadAsync((import.meta.env?.BASE_URL || '/') + 'models/cover/' + name + '.glb').then(asset => asset.scene)
}

function disposeSource(model) {
  model.traverse(item => {
    if (!item.isMesh) return
    item.geometry.dispose()
    item.material.dispose()
  })
}

export function createTwoPerspectives(load = loadCoverBust) {
  const group = new THREE.Group()
  group.name = 'Two perspectives'
  const brass = metal(0xc6a263, 0.27)
  const graphite = metal(0x444947, 0.29, 0.86)
  const marble = metal(0xe1d6bb, 0.76, 0.04)
  let retired = false
  const distantTown = new THREE.Group()
  const townPalette = palette()
  disk(distantTown, 1.20, 0.08, townPalette.dark, -0.04)
  for (let i = 0; i < 8; i++) {
    const building = pavilion(0.29 + (i % 3) * 0.15, i, townPalette)
    building.scale.setScalar(0.59)
    building.position.set(Math.sin(i * TAU / 8) * 0.86, 0, Math.cos(i * TAU / 8) * 0.60)
    distantTown.add(building)
  }
  bake(distantTown)
  distantTown.position.set(0, -1.22, -3)
  group.add(distantTown)
  const mounts = PORTRAITS.map(({ x, yaw, file, nose }) => {
    const base = 0.14 - nose * height
    const stand = disk(group, 0.94, 0.15, graphite, base - 0.075)
    stand.position.x = x
    const inlay = hoop(group, 0.92, 0.009, brass, base)
    inlay.rotation.x = Math.PI / 2
    inlay.position.x = x
    const figure = new THREE.Group()
    figure.name = file
    figure.position.x = x
    figure.rotation.y = yaw
    group.add(figure)
    return figure
  })
  const waves = Array.from({length: 3}, (_, i) => {
    const line = signalPath(group, Array.from({length: 65}, () => new THREE.Vector3()),
      new THREE.LineBasicMaterial({ color: i ? 0xe9c17d : 0xffe8b2, transparent: true, opacity: i ? 0.48 : 0.93 }))
    line.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage)
    line.frustumCulled = false
    return line
  })
  const spark = mesh(group, new THREE.SphereGeometry(0.032, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe5aa }))
  const ready = Promise.all(PORTRAITS.map(async ({ file, nose }, index) => {
    const figure = mounts[index]
    let model
    try {
      model = await load(file)
    } catch (error) {
      if (retired) return
      console.warn('Cover bust unavailable:', file, error)
      // The plinth retains a sculptural head even when a model request fails.
      mesh(figure, new THREE.IcosahedronGeometry(0.87, 2), index ? graphite : marble, 0, 0.46, 0).scale.set(0.86, 1.22, 0.98)
      mesh(figure, new THREE.CylinderGeometry(0.4, 0.81, 1.23, 32), index ? graphite : marble, 0, -1.25, 0)
      return
    }
    if (retired) { disposeSource(model); return }
    const box = new THREE.Box3().setFromObject(model, true)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = height / size.y
    const align = new THREE.Group()
    align.scale.setScalar(scale)
    align.position.set(-center.x * scale, -(box.min.y + size.y * nose) * scale + 0.14, -center.z * scale)
    model.traverse(object => {
      if (!object.isMesh) return
      object.material.dispose()
      object.material = index ? graphite : marble
    })
    align.add(model)
    figure.add(align)
    if (index === 1) dressAutomaton(figure, brass, graphite)
    else laurel(figure, model, brass)
  }))
  return {
    group, ready, camera: { position: [0.16, 0.22, 8.55], target: [0.16, -0.06, 0] },
    update(time, progress, burst) {
      const distance = 0.48 + burst * 0.21
      mounts.forEach((mount, i) => {
        const pose = PORTRAITS[i]
        mount.position.x = pose.x + Math.sign(pose.x) * burst * 0.21
        mount.rotation.y = pose.yaw + Math.sign(pose.x) * (progress * 0.10 + Math.sin(time * 0.22) * 0.012)
      })
      waves.forEach((wave, i) => {
        const points = wave.geometry.attributes.position
        for (let sample = 0; sample < points.count; sample++) {
          const u = sample / (points.count - 1)
          const envelope = Math.sin(Math.PI * u)
          points.setXYZ(sample, (u * 2 - 1) * distance,
            0.48 + 0.074 * envelope * Math.sin(u * TAU * 1.4 - time * 2 + i * 2.1), 0.38 + i * 0.008)
        }
        points.needsUpdate = true
      })
      spark.position.set(Math.sin(time * 1.25) * distance * 0.95, 0.48, 0.41)
    },
    dispose() { retired = true },
  }
}
