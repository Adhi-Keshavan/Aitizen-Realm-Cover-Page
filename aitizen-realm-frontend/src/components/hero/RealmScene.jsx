import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createTwoPerspectives } from './models/TwoPerspectives.js'
import { createCognitiveOrbit } from './models/CognitiveOrbit.js'
import { createSignalSociety } from './models/SignalSociety.js'
import { createLivingWorld } from './models/LivingWorld.js'
import { randomSource } from './models/atelier.js'
import { getChapterIndex } from './chapters.js'

const builders = [createTwoPerspectives, createCognitiveOrbit, createSignalSociety, createLivingWorld]

function studioEnvironment(renderer) {
  const room = new RoomEnvironment()
  const generator = new THREE.PMREMGenerator(renderer)
  const target = generator.fromScene(room, 0.04)
  room.dispose()
  generator.dispose()
  return target
}

function releaseScene(scene) {
  const geometries = new Set(), materials = new Set()
  scene.traverse(object => {
    if (object.geometry) geometries.add(object.geometry)
    if (object.material) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material)
    }
    if (object.isInstancedMesh) object.dispose()
  })
  geometries.forEach(item => item.dispose())
  materials.forEach(item => item.dispose())
}

export default function RealmScene({ progressRef, redrawRef, motion, dispersed }) {
  const canvasRef = useRef(null)
  const controls = useRef({ motion, dispersed })
  useEffect(() => {
    controls.current = { motion, dispersed }
    redrawRef.current?.()
  }, [motion, dispersed, redrawRef])

  useEffect(() => {
    const canvas = canvasRef.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
    } catch {
      canvas.hidden = true
      return
    }
    renderer.setClearColor(0x080908, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.18
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x100f0c, 0.044)
    let environment = studioEnvironment(renderer)
    scene.environment = environment.texture
    scene.environmentIntensity = 0.68
    scene.add(new THREE.HemisphereLight(0xf5ead3, 0x312c23, 1.15))
    const key = new THREE.DirectionalLight(0xffe3ba, 3.25)
    key.position.set(-3.8, 4.6, 4.3)
    const rim = new THREE.DirectionalLight(0xfacb83, 3.0)
    rim.position.set(2.9, 3.2, -2.5)
    const fill = new THREE.DirectionalLight(0xc0cdd0, 1.4)
    fill.position.set(4, 0.4, 3)
    scene.add(key, rim, fill)
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 60)
    const random = randomSource(48)
    const stars = new Float32Array(420 * 3)
    for (let i = 0; i < stars.length; i += 3) {
      stars[i] = (random() - 0.5) * 23
      stars[i + 1] = random() * 9 - 3.5
      stars[i + 2] = -2 - random() * 9
    }
    const sky = new THREE.BufferGeometry()
    sky.setAttribute('position', new THREE.BufferAttribute(stars, 3))
    scene.add(new THREE.Points(sky, new THREE.PointsMaterial({ color: 0xae9a74, size: 0.014, transparent: true, opacity: 0.48, depthWrite: false })))
    const chapters = new Map()
    const pointer = new THREE.Vector2()
    const easedPointer = new THREE.Vector2()
    const eye = new THREE.Vector3(), target = new THREE.Vector3()
    let frame = 0, visible = true, lost = false, retired = false
    let lastTime = 0, elapsed = 0, active = -1, burst = 0, held = false, fadeStart = 0
    const request = () => {
      if (!frame && visible && !lost && !retired && !document.hidden) frame = requestAnimationFrame(draw)
    }
    function draw(now) {
      frame = 0
      if (!visible || lost || retired || document.hidden) return
      const dt = Math.min(0.05, lastTime ? (now - lastTime) / 1000 : 0)
      lastTime = now
      const { motion: moving, dispersed: spread } = controls.current
      if (moving) elapsed += dt
      const progress = progressRef.current
      const index = getChapterIndex(progress)
      if (index !== active) {
        if (chapters.has(active)) chapters.get(active).group.visible = false
        if (!chapters.has(index)) {
          const chapter = builders[index]()
          scene.add(chapter.group)
          chapters.set(index, chapter)
          chapter.ready?.then(request)
        }
        chapters.get(index).group.visible = true
        fadeStart = active === -1 ? -1000 : now
        active = index
      }
      const chapter = chapters.get(active)
      const local = Math.min(1, Math.max(0, progress * 4 - index))
      const easing = moving ? 1 - Math.exp(-15 * dt) : 1
      burst = THREE.MathUtils.lerp(burst, held || spread ? 1 : 0, easing)
      easedPointer.lerp(pointer, easing)
      chapter.update(elapsed, local, burst)
      target.fromArray(chapter.camera.target)
      eye.fromArray(chapter.camera.position).sub(target)
      const fit = Math.max(1, (index === 1 ? 1.34 : 1.18) / camera.aspect)
      eye.multiplyScalar(fit * (1 + (moving ? (0.5 - local) * 0.032 : 0)))
      camera.position.copy(target).add(eye)
      if (moving) {
        camera.position.x += easedPointer.x * 0.10
        camera.position.y += easedPointer.y * 0.055
      }
      camera.lookAt(target)
      canvas.style.opacity = String(moving ? 0.55 + 0.45 * Math.min(1, (now - fadeStart) / 200) : 1)
      renderer.render(scene, camera)
      if (moving) request()
    }
    const resize = () => {
      const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth <= 700 ? 1 : 1.5))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      request()
    }
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      lastTime = 0
      request()
    })
    const size = new ResizeObserver(resize)
    size.observe(canvas)
    visibility.observe(canvas)
    const move = event => {
      const bounds = canvas.getBoundingClientRect()
      pointer.set((event.clientX - bounds.left) / bounds.width - 0.5, 0.5 - (event.clientY - bounds.top) / bounds.height)
    }
    const press = event => { held = event.pointerType === 'mouse' && event.button === 0; request() }
    const release = () => { held = false; request() }
    const leave = () => { pointer.set(0, 0); release() }
    const contextLost = event => { event.preventDefault(); lost = true }
    const contextRestored = () => {
      environment.dispose()
      environment = studioEnvironment(renderer)
      scene.environment = environment.texture
      lost = false
      request()
    }
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerdown', press)
    canvas.addEventListener('pointerleave', leave)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    canvas.addEventListener('webglcontextlost', contextLost)
    canvas.addEventListener('webglcontextrestored', contextRestored)
    document.addEventListener('visibilitychange', request)
    redrawRef.current = request
    resize()
    return () => {
      retired = true
      redrawRef.current = null
      cancelAnimationFrame(frame)
      size.disconnect()
      visibility.disconnect()
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerdown', press)
      canvas.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      canvas.removeEventListener('webglcontextlost', contextLost)
      canvas.removeEventListener('webglcontextrestored', contextRestored)
      document.removeEventListener('visibilitychange', request)
      chapters.forEach(chapter => chapter.dispose?.())
      releaseScene(scene)
      environment.dispose()
      renderer.dispose()
    }
  }, [progressRef, redrawRef])
  return <canvas className="realm-film__canvas" ref={canvasRef} aria-hidden="true" />
}
