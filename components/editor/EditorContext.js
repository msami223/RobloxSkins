'use client'

import React, { createContext, useContext, useState, useRef, useEffect } from 'react'

const EditorContext = createContext()

export function useEditor() {
  return useContext(EditorContext)
}

export function EditorProvider({ children }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('upload') // upload, draw, layers

  // Tool State
  const [brushColor, setBrushColor] = useState('#ff0000')
  const [brushSize, setBrushSize] = useState(5)
  const [isEraser, setIsEraser] = useState(false)

  // Canvas State - Single ordered array of all layers
  const [activeLayerId, setActiveLayerId] = useState(null) // Use ID for active layer
  // Layer structure: {id: string, name: string, visible: bool, canvasTarget: 'shirt'|'pants', type: string}
  const [layers, setLayers] = useState([])
  
  // State to explicitly track which canvas's content should be used for torso
  const [torsoPriority, setTorsoPriority] = useState('shirt') // 'shirt' or 'pants'
  
  // Refs to access Fabric instances directly when needed
  const fabricRefShirt = useRef(null)
  const fabricRefPants = useRef(null)

  console.log("fabricRefShirt",fabricRefShirt)
  
  // 3D Texture Update Trigger
  const [textureUpdateTrigger, setTextureUpdateTrigger] = useState(0)

  // 3D Model State
  const [currentModel, setCurrentModel] = useState('boy') // 'boy', 'girl', 'blocky'

  // UV Placement State (for new feature)
  const [uvPlacementMode, setUvPlacementMode] = useState(null) // null | 'shirt' | 'pants'
  const [uvImageData, setUvImageData] = useState(null) // Uploaded image dataURL

  // Refs for clean texture canvases (without selection UI or wireframe)
  const cleanTextureShirtRef = useRef(null)
  const cleanTexturePantsRef = useRef(null)
  
  // Flag to prevent re-entrant syncLayers calls (prevents infinite loop)
  const isSyncingRef = useRef(false)

  // Actions
  const updateBrush = (color, size, eraser) => {
    if (color !== undefined) setBrushColor(color)
    if (size !== undefined) setBrushSize(size)
    if (eraser !== undefined) setIsEraser(eraser)
    
    // Apply to fabric instances if they exist
    [fabricRefShirt.current, fabricRefPants.current].forEach(canvas => {
      if (canvas && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = eraser ? '#ffffff' : (color || brushColor)
        canvas.freeDrawingBrush.width = parseInt(size || brushSize)
      }
    })
  }

  const syncLayers = () => {
    // Prevent re-entrant calls (prevents infinite loop)
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    
    const getLayerObjects = (canvas, target) => {
        if (!canvas) return []
        // Collect objects, assigning which canvas they belong to
        return canvas.getObjects().filter(o => !o.excludeFromExport)
            .map(o => ({
                id: o.uid || Math.random().toString(36).substr(2, 9),
                type: o.type === 'image' ? 'Sticker' : 'Drawing',
                name: o.customName || `${o.type === 'image' ? 'Sticker' : 'Drawing'}`,
                visible: o.visible,
                canvasTarget: target, // 'shirt' or 'pants'
                object: o // Keep reference
            }))
    }

    const shirtObjects = getLayerObjects(fabricRefShirt.current, 'shirt')
    const pantsObjects = getLayerObjects(fabricRefPants.current, 'pants')

    // Merge: Shirt layers above Pants layers by default (can be reordered later)
    const mergedLayers = [...pantsObjects, ...shirtObjects]
    
    setLayers(mergedLayers)
    
    // Set torso priority based on top-most layer's canvasTarget
    // Only update if actually changed to prevent re-renders
    const topMostLayer = mergedLayers.slice(-1)[0]
    if (topMostLayer && topMostLayer.canvasTarget !== torsoPriority) {
        setTorsoPriority(topMostLayer.canvasTarget)
    }
    
    triggerTextureUpdate()
    
    // Reset flag after a small delay to allow state updates to complete
    setTimeout(() => {
      isSyncingRef.current = false
    }, 100)
  }
  
  // Function to move a layer up or down in the stack
  const updateLayerOrder = (layerId, direction) => {
    const index = layers.findIndex(l => l.id === layerId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index + 1 : index - 1
    if (newIndex < 0 || newIndex >= layers.length) return

    // 1. Update the layers state array for UI display
    const newLayers = [...layers]
    const [layer] = newLayers.splice(index, 1)
    newLayers.splice(newIndex, 0, layer)
    setLayers(newLayers)
    
    // 2. Update the Z-index on the corresponding Fabric canvas
    const canvasRef = layer.canvasTarget === 'shirt' ? fabricRefShirt : fabricRefPants
    const fabricObject = canvasRef.current?.getObjects().find(o => o.uid === layerId)
    
    if (fabricObject) {
        if (direction === 'up') {
            fabricObject.bringForward()
        } else {
            fabricObject.sendBackwards()
        }
        canvasRef.current.renderAll()
    }

    // 3. Recalculate and set Torso Priority based on the new top layer
    const topMostLayer = newLayers.slice(-1)[0]
    if (topMostLayer) {
        setTorsoPriority(topMostLayer.canvasTarget)
    }

    triggerTextureUpdate()
  }

  const triggerTextureUpdate = () => {
    // Update clean texture canvases before triggering the update
    updateCleanTextures()
    setTextureUpdateTrigger(prev => prev + 1)
  }

  // Generate clean canvas exports without selection UI or wireframe
  // Also masks torso region from non-priority canvas to prevent z-fighting
  const updateCleanTextures = () => {
    const generateCleanCanvas = (fabricCanvas) => {
      if (!fabricCanvas) return null
      
      // Hide wireframe/excludeFromExport objects temporarily
      const hiddenObjects = []
      fabricCanvas.getObjects().forEach(obj => {
        if (obj.excludeFromExport && obj.visible) {
          obj.visible = false
          hiddenObjects.push(obj)
        }
      })
      
      // toCanvasElement() creates a clean export WITHOUT selection controls
      const exportedCanvas = fabricCanvas.toCanvasElement()
      
      // Restore hidden objects (wireframe)
      hiddenObjects.forEach(obj => {
        obj.visible = true
      })
      
      // Create a new canvas with WHITE BACKGROUND
      // This ensures model parts without images are still visible (white, not transparent)
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = exportedCanvas.width
      finalCanvas.height = exportedCanvas.height
      const ctx = finalCanvas.getContext('2d')
      
      // Fill with white background first
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
      
      // Draw the exported content on top
      ctx.drawImage(exportedCanvas, 0, 0)
      
      return finalCanvas
    }

    // Generate base clean canvases
    const shirtCanvas = generateCleanCanvas(fabricRefShirt.current)
    const pantsCanvas = generateCleanCanvas(fabricRefPants.current)
    
    if (!shirtCanvas || !pantsCanvas) {
      cleanTextureShirtRef.current = shirtCanvas
      cleanTexturePantsRef.current = pantsCanvas
      return
    }

    // TORSO REGION COORDINATES (approximate for 585x559 template)
    // The torso is in the center of both templates
    // Adjust these values based on your actual template layout
    const torsoRegion = {
      x: 128,      // Left edge of torso area
      y: 99,       // Top edge of torso area  
      width: 320,  // Width covering R + FRONT + BACK + L
      height: 192  // Height of main torso
    }

    // ALWAYS MASK TORSO FROM PANTS CANVAS
    // The shirt torso and pants torso overlap on the 3D model, causing z-fighting
    // By always clearing the pants torso, only the shirt texture shows in that area
    // This eliminates the flickering/overlap issue when rotating the model
    const ctx = pantsCanvas.getContext('2d')
    ctx.clearRect(torsoRegion.x, torsoRegion.y, torsoRegion.width, torsoRegion.height)

    cleanTextureShirtRef.current = shirtCanvas
    cleanTexturePantsRef.current = pantsCanvas
  }

  const value = {
    activeTab,
    setActiveTab,
    brushColor,
    brushSize,
    isEraser,
    updateBrush,
    activeLayerId,
    setActiveLayerId,
    layers,
    setLayers,
    syncLayers,
    updateLayerOrder,
    torsoPriority,
    setTorsoPriority,
    fabricRefShirt,
    fabricRefPants,
    textureUpdateTrigger,
    triggerTextureUpdate,
    currentModel,
    setCurrentModel,
    // UV Placement
    uvPlacementMode,
    setUvPlacementMode,
    uvImageData,
    setUvImageData,
    // Clean texture refs for 3D model
    cleanTextureShirtRef,
    cleanTexturePantsRef
  }

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  )
}
