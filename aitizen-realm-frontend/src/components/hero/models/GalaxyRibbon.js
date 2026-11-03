import * as THREE from 'three'
import { randomSource } from './atelier.js'

// Twist the strip in world space so its silhouette also changes with scroll.
export function createGalaxyRibbon() {
  const group = new THREE.Group()
  const geometry = new THREE.PlaneGeometry(12, 1.65, 160, 8)
  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { phase: { value: 0 } },
    vertexShader: `
      uniform float phase;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float bend = p.x * .65 + phase;
        p.y = sin(bend) * 1.02 + position.y * cos(bend * .87);
        p.z = position.y * sin(bend * .87);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float phase;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
          mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
      }
      void main() {
        vec2 p = vec2((vUv.x - .57)*6.4 + .2*sin(phase), vUv.y - .52);
        float r = length(p);
        float swirl = atan(p.y,p.x) + 7.*sqrt(r);
        float dust = noise(p*33.)*.55 + noise(p*80.)*.3 + noise(p*190.)*.15;
        float arm = pow(.5+.5*cos(3.*swirl+dust*4.),3.) * exp(-2.8*r);
        float core = exp(-18.*r);
        float stars = smoothstep(.993,1.,hash(floor(vUv*vec2(1500.,290.))));
        float edge = 1.-smoothstep(.0,.014,min(vUv.y,1.-vUv.y));
        vec3 color = vec3(.031,.032,.033) + vec3(1.,.81,.60)*(core + arm*dust*2.)
          + vec3(.72)*(edge + stars*.8 + .16*pow(.5+.5*cos(vUv.x*20.+phase),14.));
        gl_FragColor = vec4(color,1.);
      }`,
  })
  group.add(new THREE.Mesh(geometry, material))
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.18, 40, 28),
    new THREE.MeshStandardMaterial({ color: 0x29241c, metalness: .28, roughness: .7 }))
  moon.position.set(3.8,.45,-3.5)
  group.add(moon)
  const cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(.28,.28,.28),
    new THREE.MeshStandardMaterial({ color: 0x353537, metalness: .75, roughness: .26 }), 24)
  const random = randomSource(51)
  const field = Array.from({ length: cubes.count }, () => ({
    x: (random()-.5)*8, y: (random()-.5)*4, z: -1-random()*2, phase: random()*6.28,
  }))
  const pose = new THREE.Object3D()
  group.add(cubes)
  return {
    group,
    camera: { position: [0,.12,7.6], target: [0,0,0] },
    update(time, progress, spread) {
      material.uniforms.phase.value = progress*3.8 + time*.13
      field.forEach((item,index) => {
        const angle = time*.16 + progress*2 + item.phase
        pose.position.set(item.x*(1+spread*.25),item.y+Math.sin(angle)*.32,item.z)
        pose.rotation.set(angle*.7,angle,angle*.25)
        pose.updateMatrix()
        cubes.setMatrixAt(index,pose.matrix)
      })
      cubes.instanceMatrix.needsUpdate = true
    },
  }
}
