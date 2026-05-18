import * as THREE from 'https://unpkg.com/three@0.179.1/build/three.module.js'

class GalaxyBackground extends HTMLElement {
  static observedAttributes = [
    'count',
    'branches',
    'radius',
    'inside-color',
    'outside-color',
    'interaction',
    'mouse-smoothing'
  ]

  static {
    customElements.define(
      'galaxy-background',
      GalaxyBackground
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
        }

        #container{
          position:absolute;
          inset:0;
        }

        canvas{
          width:100%;
          height:100%;
          display:block;
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
    cancelAnimationFrame(
      this.frameId
    )

    this.resizeObserver?.disconnect()

    window.removeEventListener(
      'pointermove',
      this.handlePointerMove
    )

    this.geometry?.dispose()
    this.material?.dispose()
    this.renderer?.dispose()
  }

  attributeChangedCallback() {
    if (!this.initialized) return

    this.destroyGalaxy()
    this.createGalaxy()
  }

  init() {
    if (this.initialized) return

    this.initialized = true

    const width =
      this.clientWidth ||
      window.innerWidth

    const height =
      this.clientHeight ||
      window.innerHeight

    this.scene =
      new THREE.Scene()

    this.camera =
      new THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        100
      )

    this.camera.position.z = 8

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
      new THREE.Vector2(
        .5,
        .5
      )

    this.targetMouse =
      new THREE.Vector2(
        .5,
        .5
      )

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

    this.createGalaxy()

    this.clock =
      new THREE.Clock()

    this.resizeObserver =
      new ResizeObserver(() => {
        this.resize()
      })

    this.resizeObserver.observe(
      this
    )

    this.animate()
  }

  createGalaxy() {

    const count =
      Number(
        this.getAttribute(
          'count'
        )
      ) || 20000

    const branches =
      Number(
        this.getAttribute(
          'branches'
        )
      ) || 5

    const radius =
      Number(
        this.getAttribute(
          'radius'
        )
      ) || 5

    const positions =
      new Float32Array(
        count * 3
      )

    const colors =
      new Float32Array(
        count * 3
      )

    const inside =
      new THREE.Color(
        this.getAttribute(
          'inside-color'
        ) || '#ff6030'
      )

    const outside =
      new THREE.Color(
        this.getAttribute(
          'outside-color'
        ) || '#1b6cff'
      )

    for (let i = 0; i < count; i++) {

      const i3 = i * 3

      const r =
        Math.random()
        * radius

      const spin =
        r * 2

      const angle =
        (
          i % branches
        )
        /
        branches
        *
        Math.PI
        *
        2

      positions[i3] =
        Math.cos(
          angle + spin
        ) * r

      positions[i3 + 1] =
        (
          Math.random()
          - .5
        ) * .5

      positions[i3 + 2] =
        Math.sin(
          angle + spin
        ) * r

      const mixed =
        inside.clone()

      mixed.lerp(
        outside,
        r / radius
      )

      colors[i3] = mixed.r
      colors[i3 + 1] = mixed.g
      colors[i3 + 2] = mixed.b
    }

    this.geometry =
      new THREE.BufferGeometry()

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        positions,
        3
      )
    )

    this.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(
        colors,
        3
      )
    )

    this.material =
      new THREE.ShaderMaterial({

        uniforms: {

          uTime: {
            value: 0
          },

          uMouse: {
            value:
              new THREE.Vector2(
                .5,
                .5
              )
          }

        },

        vertexColors: true,

        transparent: true,

        depthWrite: false,

        blending:
          THREE.AdditiveBlending,

        vertexShader: `

uniform float uTime;
uniform vec2 uMouse;

varying vec3 vColor;

void main(){

vColor=color;

vec3 pos=position;

vec2 mouse=
(uMouse-.5)*10.0;

vec2 direction=
mouse-pos.xz;

float lengthDir=
max(
length(direction),
0.001
);

float force=
1.0/
(
lengthDir+1.0
);

pos.xz+=
normalize(
direction
)
*
force
*
0.3;

float dist=
distance(
pos.xz,
mouse
);

pos.y+=
sin(
dist*2.0
-uTime*2.0
)
*.2;

float d=
max(
length(pos.xz),
0.1
);

float angle=
atan(
pos.z,
pos.x
);

angle+=
uTime*.05/d;

pos.x=
cos(angle)
*d;

pos.z=
sin(angle)
*d;

vec4 mvPosition=
modelViewMatrix*
vec4(
pos,
1.0
);

gl_Position=
projectionMatrix*
mvPosition;

gl_PointSize=
30.0/
-max(
mvPosition.z,
1.0
);

}
`,

        fragmentShader: `

varying vec3 vColor;

void main(){

float d=
distance(
gl_PointCoord,
vec2(.5)
);

float strength=
1.0
-d*2.0;

strength=
pow(
max(
strength,
0.0
),
3.0
);

gl_FragColor=
vec4(
vColor,
strength
);

}
`
      })

    this.points =
      new THREE.Points(
        this.geometry,
        this.material
      )

    this.scene.add(
      this.points
    )
  }

  destroyGalaxy() {
    if (!this.points) return

    this.scene.remove(
      this.points
    )

    this.geometry.dispose()

    this.material.dispose()
  }

  onPointerMove(e) {

    const rect =
      this.getBoundingClientRect()

    const x =
      (
        e.clientX
        - rect.left
      )
      /
      rect.width

    const y =
      (
        e.clientY
        - rect.top
      )
      /
      rect.height

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

    this.material.uniforms
      .uTime.value =
      this.clock.getElapsedTime()

    const smoothing =
      Number(
        this.getAttribute(
          'mouse-smoothing'
        )
      ) || .05

    this.mouse.lerp(
      this.targetMouse,
      smoothing
    )

    this.material.uniforms
      .uMouse.value.copy(
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

    this.camera.aspect =
      width / height

    this.camera
      .updateProjectionMatrix()

    this.renderer.setSize(
      width,
      height
    )
  }
}