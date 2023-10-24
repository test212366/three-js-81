import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'
 
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'


import one from './earthbump1k.jpg'
import two from './earthmap1k.jpg'

const random_bm = () => {
	let u = 0, v = 0
	while(u === 0) u = Math.random()
	while(v === 0) v = Math.random()
	return Math.sqrt(-2. * Math.log(u)) * Math.cos(2. * Math.PI * v)

}
export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0x00000, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.01,
			 1000
		)
 
		this.camera.position.set(0, 0, 100) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true

		this.addObjects()		 
		this.resize()
		this.render()
		this.setupResize()
		this.addLights()

 
	}

	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 853/1280
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) / this.imageAspect
		} 


		// this.material.uniforms.resolution.value.x = this.width
		// this.material.uniforms.resolution.value.y = this.height
		// this.material.uniforms.resolution.value.z = a1
		// this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}


	addObjects() {
		let that = this
		this.material1 = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				hover: {value: 0},
				resolution: {value: new THREE.Vector4()}
			},
			transparent: true,
			
			vertexShader,
			fragmentShader
		})
		this.material = new THREE.MeshStandardMaterial({
 
			map: new THREE.TextureLoader().load(two),
			// displacementMap: new THREE.TextureLoader().load(one),
			// displacementScale: 0.05

		})
		this.geometry = new THREE.SphereGeometry(24,164, 164)
		this.plane = new THREE.Mesh(this.geometry, this.material)
		this.planes = []
		let R = 26
		this.group = new THREE.Group()
		for (let i = 0; i < 20 ; i++) {

			let geometry = new THREE.PlaneGeometry(1,1)
			let material = new THREE.MeshBasicMaterial({
				color: 0x00ff00,
				side: THREE.DoubleSide
			})
			let plane = new THREE.Mesh(geometry, this.material1)
			let x = random_bm()
			let y = random_bm()
			let z = random_bm()
			let sq = 1/Math.sqrt(x*x + y * y + z * z)
			plane.position.x = R * x * sq
			plane.position.y = R * y * sq
			plane.position.z = R * z * sq

			this.group.add(plane)
			this.planes.push(plane)
		}
		this.group.add(this.plane)
		this.scene.add(this.group)
		console.log(this.group);
		 
 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05
		// this.material.uniforms.time.value = this.time
		this.planes.forEach(e => {
			let conj = new THREE.Quaternion()
			conj.copy(this.group.quaternion)
			conj.conjugate()
			e.quaternion.multiplyQuaternions(
				conj,
				this.camera.quaternion
			)
			e.quaternion.copy(this.camera.quaternion)

		})
		//this.renderer.setRenderTarget(this.renderTarget)
		this.renderer.render(this.scene, this.camera)
		//this.renderer.setRenderTarget(null)
		// this.group.rotation.y = this.time / 10 
 
		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 