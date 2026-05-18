import * as THREE from 'https://unpkg.com/three@0.179.1/build/three.module.js'

/*
 * Original Shader: "The Universe Within" by Martijn Steinrucken aka BigWings (2018)
 * License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
 * Integrated into Web Component for Tarot Application context.
 */

class GalaxyBackground extends HTMLElement {
  static observedAttributes = [
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
          background: #030107;
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
    cancelAnimationFrame(this.frameId)
    this.resizeObserver?.disconnect()
    window.removeEventListener('pointermove', this.handlePointerMove)

    this.geometry?.dispose()
    this.material?.dispose()
    this.renderer?.dispose()
  }

  attributeChangedCallback() {
    // 基础星网不依赖过多动态外部标签属性，保持自渲染
  }

  init() {
    if (this.initialized) return
    this.initialized = true

    const width = this.clientWidth || window.innerWidth
    const height = this.clientHeight || window.innerHeight

    // 2.D 平面特殊 Shader 渲染，使用正交相机或标准平面即可
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(width, height)

    this.shadowRoot
      .querySelector('#container')
      .appendChild(this.renderer.domElement)

    // 初始化坐标，默认停留在中心
    this.mouse = new THREE.Vector2(0, 0)
    this.targetMouse = new THREE.Vector2(0, 0)

    this.handlePointerMove = this.onPointerMove.bind(this)

    if (this.getAttribute('interaction') !== 'false') {
      window.addEventListener('pointermove', this.handlePointerMove)
    }

    this.createUniverseNet(width, height)

    this.clock = new THREE.Clock()

    this.resizeObserver = new ResizeObserver(() => {
      this.resize()
    })
    this.resizeObserver.observe(this)

    this.animate()
  }

  createUniverseNet(width, height) {
    // 使用一个铺满全屏的几何平面来承载 2D Fragment Shader
    this.geometry = new THREE.PlaneGeometry(2, 2)

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: new THREE.Vector2(0, 0) }
      },

      transparent: true,
      depthWrite: false,

      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;

        varying vec2 vUv;

        #define S(a, b, t) smoothstep(a, b, t)
        #define NUM_LAYERS 4.

        float N21(vec2 p) {
          vec3 a = fract(vec3(p.xyx) * vec3(213.897, 653.453, 253.098));
          a += dot(a, a.yzx + 79.76);
          return fract((a.x + a.y) * a.z);
        }

        vec2 GetPos(vec2 id, vec2 offs, float t) {
          float n = N21(id + offs);
          float n1 = fract(n * 10.);
          float n2 = fract(n * 100.);
          // 减缓星点晃动速度，从原版的 t 改为 t*0.6，使其更具有占卜冥想的静谧感
          float a = t * 0.6 + n;
          return offs + vec2(sin(a * n1), cos(a * n2)) * 0.4;
        }

        float df_line(in vec2 a, in vec2 b, in vec2 p) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);	
          return length(pa - ba * h);
        }

        float line(vec2 a, vec2 b, vec2 uv) {
          float r1 = .04;
          float r2 = .01;
          
          float d = df_line(a, b, uv);
          float d2 = length(a - b);
          float fade = S(1.5, .5, d2);
          
          fade += S(.05, .02, abs(d2 - .75));
          return S(r1, r2, d) * fade;
        }

        float NetLayer(vec2 st, float n, float t) {
          vec2 id = floor(st) + n;
          st = fract(st) - .5;
          
          vec2 p[9];
          int idx = 0;
          for(float y = -1.; y <= 1.; y++) {
            for(float x = -1.; x <= 1.; x++) {
              p[idx++] = GetPos(id, vec2(x, y), t);
            }
          }
          
          float m = 0.;
          float sparkle = 0.;
          
          for(int i = 0; i < 9; i++) {
            m += line(p[4], p[i], st);

            float d = length(st - p[i]);
            float s = (.005 / (d * d));
            s *= S(1., .7, d);
            // 减缓粒子闪烁高频感
            float pulse = sin((fract(p[i].x) + fract(p[i].y) + t) * 3.0) * .4 + .6;
            pulse = pow(pulse, 20.);

            s *= pulse;
            sparkle += s;
          }
          
          m += line(p[1], p[3], st);
          m += line(p[1], p[5], st);
          m += line(p[7], p[5], st);
          m += line(p[7], p[3], st);
          
          float sPhase = (sin(t + n) + sin(t * .1)) * .25 + .5;
          sPhase += pow(sin(t * .1) * .5 + .5, 50.) * 5.;
          m += sparkle * sPhase;
          
          return m;
        }

        void main() {
          // 映射标准全屏 UV 坐标
          vec2 fragCoord = vUv * uResolution;
          vec2 uv = (fragCoord - uResolution.xy * .5) / uResolution.y;
          
          // 接收平滑处理后的鼠标进行 3D 空间平移
          vec2 M = uMouse;
          
          // 减缓整体旋转基准速度 (由 0.1 调至 0.04)
          float t = uTime * 0.04;
          
          float s = sin(t);
          float c = cos(t);
          mat2 rot = mat2(c, -s, s, c);
          vec2 st = uv * rot;  
          M *= rot * 1.5;
          
          float m = 0.;
          for(float i = 0.; i < 1.; i += 1. / NUM_LAYERS) {
            float z = fract(t + i);
            float size = mix(15., 1., z);
            float fade = S(0., .6, z) * S(1., .8, z);
            
            m += fade * NetLayer(st * size - M * z, i, uTime);
          }
          
          // 塔罗高档感：用平滑常态呼吸微光，替换原版剔除掉的音频动态输入(fft)
          float pulseGlow = sin(uTime * 0.5) * 0.15 + 0.2;
          float glow = -uv.y * pulseGlow;
          
          // 随时间缓缓演变的皇家星空色调（蓝紫金相互晕染）
          vec3 baseCol = vec3(sin(t), cos(t * .4), -sin(t * .24)) * .3 + .6;
          
          // 增强星点的暖金色底蕴，使其符合塔罗神秘法阵质感
          baseCol.r += 0.15;
          baseCol.g += 0.05;
          
          vec3 col = baseCol * m;
          col += baseCol * glow;
          
          // 暗角晕影保护（Vignette）让边缘变暗，聚焦视觉中心
          col *= 1. - dot(uv, uv) * 0.8;
          
          // 优雅的淡入效果，防止初始渲染时画面生硬闪烁
          float runTime = mod(uTime, 230.0);
          col *= S(0., 5., runTime); 
          
          gl_FragColor = vec4(col, 1.0);
        }
      `
    })

    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  onPointerMove(e) {
    const rect = this.getBoundingClientRect()
    // 转换为 NDC 坐标（-0.5 到 0.5）以适配原版的平移系数
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    this.targetMouse.set(x, y)
  }

  animate = () => {
    this.frameId = requestAnimationFrame(this.animate)

    // 更新时间线
    this.material.uniforms.uTime.value = this.clock.getElapsedTime()

    // 贯彻迟滞平滑，让视差效果显得极其丝滑优雅
    const smoothing = Number(this.getAttribute('mouse-smoothing')) || 0.02
    this.mouse.lerp(this.targetMouse, smoothing)

    this.material.uniforms.uMouse.value.copy(this.mouse)

    this.renderer.render(this.scene, this.camera)
  }

  resize() {
    const width = this.clientWidth || window.innerWidth
    const height = this.clientHeight || window.innerHeight

    this.material.uniforms.uResolution.value.set(width, height)
    this.renderer.setSize(width, height)
  }
}