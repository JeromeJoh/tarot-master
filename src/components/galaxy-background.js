import * as THREE from 'https://unpkg.com/three@0.179.1/build/three.module.js'
import vertexShader
  from '../shaders/fullscreen.vert?raw'

import fragmentShader
  from '../shaders/galaxy.frag?raw'

export class ShaderBackground extends HTMLElement {
  static observedAttributes = [
    'shader-src',
    'interaction',
    'mouse-smoothing'
  ]

  static {
    customElements.define(
      'shader-background',
      ShaderBackground
    )
  }

  constructor() {
    super()

    this.attachShadow({
      mode: 'open'
    })

    this.shadowRoot.innerHTML = `
      <style>
        :host{
          display:block;
          position:relative;
          width:100%;
          height:100%;
          overflow:hidden;
          background:#000;
        }

        #container{
          position:absolute;
          inset:0;
        }

        canvas{
          display:block;
          width:100%;
          height:100%;
        }
      </style>

      <div id="container"></div>
    `

    this.initialized = false
  }

  connectedCallback() {
    requestAnimationFrame(() => {
      this.init()
    })
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.frameId)

    this.resizeObserver?.disconnect()

    window.removeEventListener(
      'pointermove',
      this.handlePointerMove
    )

    this.mesh?.removeFromParent()

    this.geometry?.dispose()
    this.material?.dispose()

    this.renderer?.dispose()
  }

  attributeChangedCallback(
    name,
    oldValue,
    newValue
  ) {
    if (!this.initialized) return

    if (
      name === 'shader-src' &&
      oldValue !== newValue
    ) {
      this.reloadShader()
    }
  }

  async init() {
    if (this.initialized) return

    this.initialized = true

    const width =
      this.clientWidth ||
      window.innerWidth

    const height =
      this.clientHeight ||
      window.innerHeight

    this.scene = new THREE.Scene()

    this.camera =
      new THREE.OrthographicCamera(
        -1,
        1,
        1,
        -1,
        0,
        1
      )

    this.renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      })

    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    )

    this.renderer.setSize(
      width,
      height
    )

    this.shadowRoot
      .querySelector('#container')
      .appendChild(
        this.renderer.domElement
      )

    this.mouse =
      new THREE.Vector2()

    this.targetMouse =
      new THREE.Vector2()

    this.handlePointerMove =
      this.onPointerMove.bind(this)

    if (
      this.getAttribute(
        'interaction'
      ) !== 'false'
    ) {
      window.addEventListener(
        'pointermove',
        this.handlePointerMove
      )
    }

    await this.createShaderPlane(
      width,
      height
    )

    this.clock =
      new THREE.Clock()

    this.resizeObserver =
      new ResizeObserver(() => {
        this.resize()
      })

    this.resizeObserver.observe(this)

    this.animate()
  }

  async loadText(url) {
    const res = await fetch(url)

    if (!res.ok) {
      throw new Error(
        `Failed to load: ${url}`
      )
    }

    return await res.text()
  }

  async createShaderPlane(
    width,
    height
  ) {
    this.geometry =
      new THREE.PlaneGeometry(
        2,
        2
      )

    this.material =
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: {
            value: 0
          },

          uResolution: {
            value:
              new THREE.Vector2(
                width,
                height
              )
          },

          uMouse: {
            value:
              new THREE.Vector2()
          }
        },

        transparent: true,

        depthWrite: false,

        vertexShader,
        fragmentShader
      })

    this.mesh =
      new THREE.Mesh(
        this.geometry,
        this.material
      )

    this.scene.add(this.mesh)
  }

  async reloadShader() {
    if (!this.material) return

    const fragmentShader =
      await this.loadText(
        this.getAttribute(
          'shader-src'
        )
      )

    const material =
      new THREE.ShaderMaterial({
        uniforms:
          this.material.uniforms,

        vertexShader:
          this.material.vertexShader,

        fragmentShader,

        transparent: true,

        depthWrite: false
      })

    this.material.dispose()

    this.mesh.material =
      material

    this.material =
      material
  }

  onPointerMove(event) {
    const rect =
      this.getBoundingClientRect()

    const x =
      (event.clientX -
        rect.left) /
      rect.width -
      0.5

    const y =
      (event.clientY -
        rect.top) /
      rect.height -
      0.5

    this.targetMouse.set(
      x,
      y
    )
  }

  animate = () => {
    this.frameId =
      requestAnimationFrame(
        this.animate
      )

    const elapsed =
      this.clock.getElapsedTime()

    this.material.uniforms.uTime.value =
      elapsed

    const smoothing =
      Number(
        this.getAttribute(
          'mouse-smoothing'
        )
      ) || 0.02

    this.mouse.lerp(
      this.targetMouse,
      smoothing
    )

    this.material.uniforms.uMouse.value.copy(
      this.mouse
    )

    this.renderer.render(
      this.scene,
      this.camera
    )
  }

  resize() {
    const width =
      this.clientWidth ||
      window.innerWidth

    const height =
      this.clientHeight ||
      window.innerHeight

    this.renderer.setSize(
      width,
      height
    )

    this.material.uniforms.uResolution.value.set(
      width,
      height
    )
  }
}