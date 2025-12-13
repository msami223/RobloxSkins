'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { useEditor } from './EditorContext'

export default function ThreePreview() {
  const containerRef = useRef(null)
  const { fabricRefShirt, fabricRefPants, textureUpdateTrigger, currentModel, setCurrentModel } = useEditor()
  
  // Refs for Three.js objects to survive re-renders
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const modelRef = useRef(null)
  const textureShirtRef = useRef(null)
  const texturePantsRef = useRef(null)

  // Map model keys to file paths
  const MODELS = {
    boy: '/models/model-boy.glb',
    girl: '/models/model-girl.glb',
    blocky: '/models/roblox_model_blocky.glb'
  }

  useEffect(() => {
    if (!containerRef.current) return

    // Scene Setup if not already done
    if (!rendererRef.current) {
        const scene = new THREE.Scene()
        scene.background = new THREE.Color('#f8fafc') // Light background
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000)
        camera.position.set(0, 1, 3.5)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.outputColorSpace = THREE.SRGBColorSpace
        containerRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.target.set(0, 1, 0)

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
        scene.add(ambientLight)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
        dirLight.position.set(2, 5, 5)
        scene.add(dirLight)

        // Textures
        const textureShirt = new THREE.Texture()
        textureShirt.colorSpace = THREE.SRGBColorSpace
        textureShirt.flipY = false
        textureShirtRef.current = textureShirt

        const texturePants = new THREE.Texture()
        texturePants.colorSpace = THREE.SRGBColorSpace
        texturePants.flipY = false
        texturePantsRef.current = texturePants

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate)
            controls.update()
            renderer.render(scene, camera)
        }
        animate()

        // Resize Handle
        const handleResize = () => {
            if (!containerRef.current || !camera || !renderer) return
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        }
        window.addEventListener('resize', handleResize)
    }

    // Load Model logic (Runs whenever currentModel changes)
    let isMounted = true
    
    const loadModel = () => {
        const loader = new GLTFLoader()
        const path = MODELS[currentModel]
        
        // Remove old model locally and from scene if tracked
        if (modelRef.current) {
            sceneRef.current.remove(modelRef.current)
            // Optional: Dispose geometry/material if needed, 
            // but Three.js cache might want to keep it.
        }

        loader.load(path, (gltf) => {
            if (!isMounted) return

            const model = gltf.scene
            modelRef.current = model
            
            // Scale and Center
            const box = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = 2 / maxDim
            model.scale.set(scale, scale, scale)
            model.position.sub(center.multiplyScalar(scale))
            model.position.y += 0.8
            
            sceneRef.current.add(model)
            updateModelMaterials()
        })
    }
    
    loadModel()
    
    return () => {
        isMounted = false
    }
    
  }, [currentModel]) // Re-run when model changes

  // Material Update Logic
  const updateModelMaterials = () => {
     if (!modelRef.current) return
     
     modelRef.current.traverse((child) => {
        if (child.isMesh) {
            const name = child.name.toLowerCase()
            const mat = child.material

            if (name.includes('bot') || name.includes('leg') || name.includes('pants')) {
                mat.map = texturePantsRef.current
                mat.needsUpdate = true
            } else if (name.includes('top') || name.includes('shirt') || name.includes('arm')) {
                mat.map = textureShirtRef.current
                mat.needsUpdate = true
            } else if (name.includes('torso') || name.includes('body')) {
                // Torso often shares shirt texture
                mat.map = textureShirtRef.current
                mat.needsUpdate = true
            }

            if (mat.map) {
                mat.transparent = true
                mat.alphaTest = 0.1 // Prevent Z-fighting with transparency
                if (mat.color) mat.color.setHex(0xffffff)
                mat.needsUpdate = true
            }
        }
     })
  }

  // Sync Textures from Fabric when triggered
  useEffect(() => {
    // Shirt Update
    if (fabricRefShirt.current && textureShirtRef.current) {
        const canvas = fabricRefShirt.current.getElement()
        textureShirtRef.current.image = canvas
        textureShirtRef.current.needsUpdate = true
    }

    // Pants Update
    if (fabricRefPants.current && texturePantsRef.current) {
        const canvas = fabricRefPants.current.getElement()
        texturePantsRef.current.image = canvas
        texturePantsRef.current.needsUpdate = true
    }
    
    // Ensure materials are linked
    updateModelMaterials()

  }, [textureUpdateTrigger, fabricRefShirt.current, fabricRefPants.current, currentModel])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div 
        ref={containerRef} 
        style={{ flex: 1, width: '100%' }}
      ></div>
      
      {/* Model Switcher Buttons */}
      <div style={{ 
          position: 'absolute', 
          bottom: 24, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          display: 'flex', 
          gap: '4px',
          backgroundColor: 'white',
          padding: '4px',
          borderRadius: '999px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          border: '1px solid #e2e8f0'
      }}>
         {Object.keys(MODELS).map(key => (
             <button
                key={key}
                onClick={() => setCurrentModel(key)}
                style={{
                    background: currentModel === key ? '#f1f5f9' : 'transparent',
                    color: currentModel === key ? '#0f172a' : '#64748b',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                    minWidth: '70px'
                }}
             >
                 {key}
             </button>
         ))}
      </div>
    </div>
  )
}
