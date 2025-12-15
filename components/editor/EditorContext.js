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

  // Canvas State
  const [activeLayer, setActiveLayer] = useState(null)
  const [layers, setLayers] = useState({ shirt: [], pants: [] })
  
  // Refs to access Fabric instances directly when needed
  const fabricRefShirt = useRef(null)
  const fabricRefPants = useRef(null)
  
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
    const getLayers = (canvas) => {
        if (!canvas) return []
        // exclude background image (usually index 0, check 'excludeFromExport')
        return canvas.getObjects().filter(o => !o.excludeFromExport).reverse().map((o, i) => ({
            id: o.uid || Math.random().toString(36).substr(2, 9), // Ensure ID
            type: o.type === 'image' ? 'Sticker' : 'Drawing',
            name: o.customName || `${o.type === 'image' ? 'Sticker' : 'Drawing'}`,
            visible: o.visible,
            object: o // Keep reference (be careful with React state, might need just ID)
        }))
    }

    setLayers({
        shirt: getLayers(fabricRefShirt.current),
        pants: getLayers(fabricRefPants.current)
    })
    
    // Also trigger texture update whenever layers change
    triggerTextureUpdate()
  }

  const triggerTextureUpdate = () => {
    // Update clean texture canvases before triggering the update
    updateCleanTextures()
    setTextureUpdateTrigger(prev => prev + 1)
  }

  // Generate clean canvas exports without selection UI or wireframe
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
      // This does NOT modify the main canvas or interfere with user interactions
      const cleanCanvas = fabricCanvas.toCanvasElement()
      
      // Restore hidden objects (wireframe)
      hiddenObjects.forEach(obj => {
        obj.visible = true
      })
      
      // Note: We don't call renderAll() here to avoid triggering more updates
      // The wireframe will be restored on the next natural render
      
      return cleanCanvas
    }

    cleanTextureShirtRef.current = generateCleanCanvas(fabricRefShirt.current)
    cleanTexturePantsRef.current = generateCleanCanvas(fabricRefPants.current)
  }

  const value = {
    activeTab,
    setActiveTab,
    brushColor,
    brushSize,
    isEraser,
    updateBrush,
    activeLayer,
    setActiveLayer,
    layers,
    setLayers,
    syncLayers, // Expose sync function
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
