import * as THREE from 'three'
import { createContextActivity } from '../hero/models/cityActivity.js'

const TAU = Math.PI * 2
const smooth = (value) => { const p = THREE.MathUtils.clamp(value, 0, 1); return p * p * (3 - 2 * p) }
const gold = 0xc9b58e
const ivory = 0xf1f0e9
const sage = 0x91a69a

function randomSequence(seed = 73) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
}

function mesh(parent, geometry, material, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material)
  object.position.set(...position)
  parent.add(object)
  return object
}

function ring(parent, radius, opacity = 0.4, color = gold) {
  return mesh(parent, new THREE.TorusGeometry(radius, 0.006, 4, 96), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }))
}

function lines(parent, coordinates, opacity = 0.3, color = gold) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(coordinates, 3))
  const object = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }))
  parent.add(object)
  return object
}

function edges(parent, geometry, opacity = 0.5) {
  const object = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: gold, transparent: true, opacity }))
  parent.add(object)
  return object
}

function fibonacci(index, count, radius = 1) {
  const y = 1 - (index + 0.5) * 2 / count
  const r = Math.sqrt(1 - y * y)
  const angle = index * Math.PI * (3 - Math.sqrt(5))
  return new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r).multiplyScalar(radius)
}

// 01 — Scattered matter gathers into a coherent, slowly turning idea.
function idea(root, materials) {
  const core = mesh(root, new THREE.IcosahedronGeometry(0.8, 2), materials.dark)
  const cage = mesh(root, new THREE.IcosahedronGeometry(0.84, 1), new THREE.MeshBasicMaterial({ color: gold, wireframe: true, transparent: true, opacity: 0.15 }))
  const count = 144
  const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), materials.stone, count)
  blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  blocks.frustumCulled = false
  root.add(blocks)
  const random = randomSequence()
  const positions = Array.from({ length: count }, (_, i) => ({
    target: fibonacci(i, count, 1.55),
    from: fibonacci(i, count, 2.1 + random() * 0.8),
    size: 0.045 + random() * 0.07,
    spin: random() * TAU,
  }))
  const orbit = ring(root, 2.05, 0.45)
  orbit.rotation.set(1.15, 0.3, -0.2)
  const dummy = new THREE.Object3D()
  return (p, time) => {
    const gather = smooth(p * 1.2)
    root.rotation.y = time * 0.09 + p * 0.5
    core.scale.setScalar(0.55 + gather * 0.45)
    core.rotation.set(time * 0.04, time * 0.06, 0.1)
    cage.rotation.copy(core.rotation)
    cage.scale.copy(core.scale)
    orbit.rotation.z = p * 0.55 + time * 0.035
    positions.forEach((item, i) => {
      dummy.position.copy(item.from).lerp(item.target, gather)
      dummy.position.multiplyScalar(1 + Math.sin(time * 0.5 + item.spin) * 0.025)
      dummy.rotation.set(item.spin + time * 0.07, item.spin, time * 0.05)
      dummy.scale.setScalar(item.size)
      dummy.updateMatrix()
      blocks.setMatrixAt(i, dummy.matrix)
    })
    blocks.instanceMatrix.needsUpdate = true
  }
}

// 04 — A miniature habitat with AI-driven traffic, facade workers, and air travel.
function contexts(root, materials) {
  const city = new THREE.Group()
  root.add(city)
  const roadCoordinates = []
  for (let i = -2; i <= 2; i++) {
    roadCoordinates.push(-1.9, -1.34, i * 0.76, 1.9, -1.34, i * 0.76)
    roadCoordinates.push(i * 0.76, -1.34, -1.9, i * 0.76, -1.34, 1.9)
  }
  lines(city, roadCoordinates, 0.35)
  const random = randomSequence(192)
  const buildings = []
  for (let z = 0; z < 4; z++) for (let x = 0; x < 4; x++) {
    const height = 0.35 + random() * 1.05
    const group = new THREE.Group()
    group.position.set((x - 1.5) * 0.76, -1.33, (z - 1.5) * 0.76)
    const shape = new THREE.BoxGeometry(0.42, height, 0.42)
    mesh(group, shape, (x + z) % 3 ? materials.stone : materials.dark, [0, height / 2, 0])
    const outline = edges(group, shape, 0.3)
    outline.position.y = height / 2
    for (let floor = 0.16; floor < height; floor += 0.2) {
      lines(group, [-0.15, floor, 0.213, 0.15, floor, 0.213, 0.213, floor, -0.15, 0.213, floor, 0.15], 0.6)
    }
    city.add(group)
    buildings.push({ group, height, delay: random() * 0.25 })
  }
  const updateActivity = createContextActivity(city, buildings, materials)
  return (p, time) => {
    city.rotation.y = -0.12 + p * 0.32
    buildings.forEach(({ group, delay }) => {
      group.scale.y = 0.03 + 0.97 * smooth((p - delay) * 1.7)
    })
    updateActivity(p, time)
  }
}

// 05 — An intact lattice ruptures, then precisely rebuilds as the page advances.
function resilience(root, materials) {
  const count = 27
  const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.47, 0.47, 0.47), materials.stone, count)
  blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  blocks.frustumCulled = false
  root.add(blocks)
  const seeds = Array.from({ length: count }, (_, i) => new THREE.Vector3(i % 3 - 1, Math.floor(i / 3) % 3 - 1, Math.floor(i / 9) - 1))
  const heart = mesh(root, new THREE.IcosahedronGeometry(0.19, 1), materials.light)
  const shock = ring(root, 1, 0.45)
  shock.rotation.x = Math.PI / 2.4
  const dummy = new THREE.Object3D()
  return (p, time) => {
    const breakApart = smooth((p - 0.05) / 0.35) * (1 - smooth((p - 0.55) / 0.4))
    root.rotation.set(0.18, p * 0.7 + time * 0.04, 0.12)
    seeds.forEach((seed, i) => {
      dummy.position.copy(seed).multiplyScalar(0.5 + breakApart * 0.62)
      dummy.position.y += Math.sin(i * 1.3 + time * 0.45) * breakApart * 0.13
      dummy.rotation.set(breakApart * Math.sin(i), breakApart * Math.cos(i) * 0.8, breakApart * 0.3)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      blocks.setMatrixAt(i, dummy.matrix)
    })
    blocks.instanceMatrix.needsUpdate = true
    heart.scale.setScalar(1 + breakApart * 0.5)
    shock.scale.setScalar(1 + breakApart * 1.25)
    shock.material.opacity = 0.12 + breakApart * 0.4
  }
}

// 06 — A field of possibilities resolves into an expanding, orbital world.
function vision(root, materials) {
  const count = 900
  const sphere = new Float32Array(count * 3)
  const scattered = new Float32Array(count * 3)
  const random = randomSequence(81)
  for (let i = 0; i < count; i++) {
    fibonacci(i, count, 1.32).toArray(sphere, i * 3)
    const angle = random() * TAU, radius = 0.3 + random() * 2
    scattered.set([Math.cos(angle) * radius, (random() - 0.5) * 0.2, Math.sin(angle) * radius], i * 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(scattered, 3))
  geometry.morphAttributes.position = [new THREE.BufferAttribute(sphere, 3)]
  const world = new THREE.Points(geometry, new THREE.PointsMaterial({ color: ivory, size: 0.023, transparent: true, opacity: 0.8, depthWrite: false }))
  world.frustumCulled = false
  root.add(world)
  const core = mesh(root, new THREE.SphereGeometry(1.23, 40, 28), materials.dark)
  const orbits = Array.from({ length: 3 }, (_, i) => {
    const orbit = ring(root, 1.65 + i * 0.28, 0.35, i === 1 ? sage : gold)
    orbit.rotation.set(0.85 + i * 0.34, 0.2 + i * 0.7, 0)
    return orbit
  })
  return (p, time) => {
    const expansion = smooth(p)
    root.rotation.y = time * 0.065 + p * 0.35
    world.morphTargetInfluences[0] = expansion
    core.scale.setScalar(0.12 + expansion * 0.88)
    orbits.forEach((orbit, i) => {
      orbit.scale.setScalar(0.7 + expansion * 0.3)
      orbit.rotation.z = time * 0.035 * (i % 2 ? -1 : 1) + p * 0.35
    })
  }
}

const builders = { idea, contexts, resilience, vision }

export function createChapterScene(variant) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40)
  const root = new THREE.Group()
  scene.add(root)
  scene.add(new THREE.HemisphereLight(0xd4dfd6, 0x11140f, 2.4))
  const key = new THREE.DirectionalLight(0xf4dfbb, 5)
  key.position.set(-3, 5, 4)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xa3bfb2, 3)
  rim.position.set(4, 1, -2)
  scene.add(rim)
  const materials = {
    dark: new THREE.MeshStandardMaterial({ color: 0x202922, metalness: 0.65, roughness: 0.3 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x6c7061, metalness: 0.58, roughness: 0.34 }),
    gold: new THREE.MeshStandardMaterial({ color: gold, metalness: 0.65, roughness: 0.25 }),
    light: new THREE.MeshBasicMaterial({ color: 0xffe7b8 }),
  }
  const updateScene = builders[variant](root, materials)

  const floor = mesh(scene, new THREE.CircleGeometry(2.65, 64), new THREE.MeshBasicMaterial({ color: 0x060806, transparent: true, opacity: 0.5, depthWrite: false }), [0, -1.48, 0])
  floor.rotation.x = -Math.PI / 2
  const floorRing = ring(scene, 2.5, 0.16)
  floorRing.rotation.x = -Math.PI / 2
  floorRing.position.y = -1.47
  const random = randomSequence(18)
  const particles = new Float32Array(260 * 3)
  for (let i = 0; i < particles.length; i += 3) {
    particles[i] = (random() - 0.5) * 6
    particles[i + 1] = random() * 4.8 - 1.5
    particles[i + 2] = (random() - 0.5) * 5
  }
  const dustGeometry = new THREE.BufferGeometry()
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(particles, 3))
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: gold, size: 0.012, transparent: true, opacity: 0.32, depthWrite: false }))
  scene.add(dust)

  return {
    scene,
    camera,
    update(progress, time, aspect = 1) {
      updateScene(progress, time)
      dust.rotation.y = time * 0.012
      const fit = Math.max(1, 1.1 / aspect)
      const city = variant === 'contexts'
      camera.position.set((city ? 3.5 : Math.sin(progress * 0.7) * 0.35) * fit, (city ? 3 : 0.75 + progress * 0.2) * fit, (city ? 6.6 : 8.3) * fit)
      camera.lookAt(0, city ? -0.45 : 0, 0)
      camera.updateMatrixWorld()
    },
    dispose() {
      const geometries = new Set(), allMaterials = new Set(Object.values(materials))
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry)
        if (object.material) {
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) allMaterials.add(material)
        }
        if (object.isInstancedMesh) object.dispose()
      })
      geometries.forEach((geometry) => geometry.dispose())
      allMaterials.forEach((material) => material.dispose())
    },
  }
}
