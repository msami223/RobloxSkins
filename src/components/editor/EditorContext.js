'use client'

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react'

const EditorContext = createContext()

export function useEditor() {
  return useContext(EditorContext)
}

export function EditorProvider({ children }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('upload') // upload, draw, layers

  // Tool State
  const [brushColor, setBrushColor] = useState('#ff0000')
  const [brushSize, setBrushSize] = useState(15)
  const [isEraser, setIsEraser] = useState(false)
  const [brushOpacity, setBrushOpacity] = useState(100) // 0-100 percentage
  const [brushSoftness, setBrushSoftness] = useState(1) // 1-10 blur/feather
  const [brushSpacing, setBrushSpacing] = useState(1) // 1-100 spacing (1=continuous, >20=dotted)
  const [brushStyle, setBrushStyle] = useState('basic') // basic, spray, circle, pattern
  const [brushText, setBrushText] = useState('ABCD') // Text to use for text brush

  // Canvas State - Single ordered array of all layers
  const [activeLayerId, setActiveLayerId] = useState(null) // Use ID for active layer
  // Layer structure: {id: string, name: string, visible: bool, canvasTarget: 'shirt'|'pants', type: string}
  const [layers, setLayers] = useState([])

  // State to explicitly track which canvas's content should be used for torso
  const [torsoPriority, setTorsoPriority] = useState('shirt') // 'shirt' or 'pants'

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

  // Text Tool State
  const [textOptions, setTextOptions] = useState({
    text: 'Custom Text',
    fontFamily: 'Arial',
    fontSize: 40,
    color: '#000000',
    isBold: false,
    isItalic: false,
    target: 'shirt', // 'shirt' or 'pants'
  })

  const updateTextOptions = (updates) => {
    setTextOptions((prev) => ({ ...prev, ...updates }))
  }

  // Refs for clean texture canvases (without selection UI or wireframe)
  const cleanTextureShirtRef = useRef(null)
  const cleanTexturePantsRef = useRef(null)

  // Refs for UV triangle data from GLB model
  const uvTrianglesShirtRef = useRef([])
  const uvTrianglesPantsRef = useRef([])

  // Flag to prevent re-entrant syncLayers calls (prevents infinite loop)
  const isSyncingRef = useRef(false)

  // Actions
  const updateBrush = (updates) => {
    // Handle legacy calls: updateBrush(color, size, eraser)
    if (typeof updates !== 'object' || updates === null) {
      const [color, size, eraser] = arguments
      updates = { color, size, eraser }
    }

    const { color, size, eraser, opacity, softness, spacing, style, text } =
      updates

    if (color !== undefined) setBrushColor(color)
    if (size !== undefined) setBrushSize(size)
    if (eraser !== undefined) setIsEraser(eraser)
    if (opacity !== undefined) setBrushOpacity(opacity)
    if (softness !== undefined) setBrushSoftness(softness)
    if (spacing !== undefined) setBrushSpacing(spacing)
    if (style !== undefined) setBrushStyle(style)
    if (text !== undefined)
      setBrushText(text)[
        // Apply to fabric instances if they exist
        (fabricRefShirt.current, fabricRefPants.current)
      ].forEach((canvas) => {
        if (canvas && canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = eraser
            ? '#ffffff'
            : color || brushColor
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
      return canvas
        .getObjects()
        .filter((o) => !o.excludeFromExport)
        .map((o) => {
          // Assign UID if object doesn't have one (first time seeing it)
          if (!o.uid) {
            o.uid = Math.random().toString(36).substr(2, 9)
          }
          return {
            id: o.uid,
            type: o.type === 'image' ? 'Sticker' : 'Drawing',
            name:
              o.customName || `${o.type === 'image' ? 'Sticker' : 'Drawing'}`,
            visible: o.visible,
            canvasTarget: target, // 'shirt' or 'pants'
            object: o, // Keep reference
          }
        })
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
    const index = layers.findIndex((l) => l.id === layerId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index + 1 : index - 1
    if (newIndex < 0 || newIndex >= layers.length) return

    // 1. Update the layers state array for UI display
    const newLayers = [...layers]
    const [layer] = newLayers.splice(index, 1)
    newLayers.splice(newIndex, 0, layer)
    setLayers(newLayers)

    // 2. Update the Z-index on the corresponding Fabric canvas
    const canvasRef =
      layer.canvasTarget === 'shirt' ? fabricRefShirt : fabricRefPants
    const fabricObject = canvasRef.current
      ?.getObjects()
      .find((o) => o.uid === layerId)

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
    setTextureUpdateTrigger((prev) => prev + 1)
  }

  // Generate clean canvas exports without selection UI or wireframe
  // Also masks torso region from non-priority canvas to prevent z-fighting
  const updateCleanTextures = () => {
    const generateCleanCanvas = (fabricCanvas) => {
      if (!fabricCanvas) return null

      // Hide wireframe/excludeFromExport objects temporarily
      const hiddenObjects = []
      fabricCanvas.getObjects().forEach((obj) => {
        if (obj.excludeFromExport && obj.visible) {
          obj.visible = false
          hiddenObjects.push(obj)
        }
      })

      // toCanvasElement() creates a clean export WITHOUT selection controls
      // It respects transparency which is what we need for layering
      const exportedCanvas = fabricCanvas.toCanvasElement()

      // Restore hidden objects (wireframe)
      hiddenObjects.forEach((obj) => {
        obj.visible = true
      })

      return exportedCanvas
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
    const torsoRegion = {
      x: 128, // Left edge of torso area
      y: 99, // Top edge of torso area
      width: 320, // Width covering R + FRONT + BACK + L
      height: 192, // Height of main torso
    }

    // TORSO PRIORITY LOGIC:
    // Use torsoPriority state (set by layer order / Swap button) to decide which torso to show
    // The mesh with cleared torso will be transparent there, letting the other mesh show through
    if (torsoPriority === 'shirt') {
      // Shirt has priority - clear PANTS torso so shirt shows on top
      const ctx = pantsCanvas.getContext('2d')
      ctx.clearRect(
        torsoRegion.x,
        torsoRegion.y,
        torsoRegion.width,
        torsoRegion.height
      )
    } else if (torsoPriority === 'pants') {
      // Pants has priority - clear SHIRT torso so pants shows through
      const ctx = shirtCanvas.getContext('2d')
      ctx.clearRect(
        torsoRegion.x,
        torsoRegion.y,
        torsoRegion.width,
        torsoRegion.height
      )
    }

    cleanTextureShirtRef.current = shirtCanvas
    cleanTexturePantsRef.current = pantsCanvas
  }

  // Helper function to create UV clipping mask for shirt template
  const createShirtUVMask = (ctx) => {
    // Roblox shirt UV map - exact coordinates for 585x559 template

    ctx.beginPath()

    // Top/Neck section
    ctx.rect(195, 0, 195, 128)

    // Middle row - Arms and Torso
    // Left Arm
    ctx.rect(0, 128, 128, 128)
    // Torso (Front, Back, Left, Right sides)
    ctx.rect(128, 128, 320, 128)
    // Right Arm
    ctx.rect(448, 128, 128, 128)

    // Bottom Torso section
    ctx.rect(195, 256, 195, 128)

    ctx.closePath()
  }

  // Helper function to create UV clipping mask for pants template
  const createPantsUVMask = (ctx) => {
    // Roblox pants UV map - exact coordinates for 585x559 template

    ctx.beginPath()

    // Upper Torso section
    ctx.rect(195, 0, 195, 128)

    // Middle Torso section
    ctx.rect(128, 128, 320, 128)

    // Legs section
    // Left Leg
    ctx.rect(0, 256, 195, 128)
    // Center/Crotch area
    ctx.rect(195, 256, 195, 128)
    // Right Leg
    ctx.rect(390, 256, 195, 128)

    ctx.closePath()
  }

  // Download functions - use destination-in masking with UV triangles (matches reference code)
  const downloadShirtTemplate = async () => {
    if (!fabricRefShirt.current) return

    const fabricCanvas = fabricRefShirt.current
    const triangles = uvTrianglesShirtRef.current

    // Hide wireframe temporarily
    const hiddenObjects = []
    fabricCanvas.getObjects().forEach((obj) => {
      if (obj.excludeFromExport && obj.visible) {
        obj.visible = false
        hiddenObjects.push(obj)
      }
    })

    // Export canvas content
    const exportedCanvas = fabricCanvas.toCanvasElement()

    // Restore wireframe
    hiddenObjects.forEach((obj) => {
      obj.visible = true
    })

    // Create final canvas for masked output
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = 585
    maskCanvas.height = 559
    const ctx = maskCanvas.getContext('2d')

    // Step 1: Draw exported content
    ctx.drawImage(exportedCanvas, 0, 0)

    // Step 2: Apply UV mask using destination-in (matches reference code)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = 'white'
    ctx.beginPath()

    // Fill UV triangles
    triangles.forEach((tri) => {
      ctx.moveTo(tri.u1, tri.v1)
      ctx.lineTo(tri.u2, tri.v2)
      ctx.lineTo(tri.u3, tri.v3)
    })

    ctx.fill()

    // Download
    const link = document.createElement('a')
    link.download = `shirt-template-${Date.now()}.png`
    link.href = maskCanvas.toDataURL('image/png')
    link.click()
  }

  const downloadPantsTemplate = async () => {
    if (!fabricRefPants.current) return

    const fabricCanvas = fabricRefPants.current
    const triangles = uvTrianglesPantsRef.current

    // Hide wireframe temporarily
    const hiddenObjects = []
    fabricCanvas.getObjects().forEach((obj) => {
      if (obj.excludeFromExport && obj.visible) {
        obj.visible = false
        hiddenObjects.push(obj)
      }
    })

    // Export canvas content
    const exportedCanvas = fabricCanvas.toCanvasElement()

    // Restore wireframe
    hiddenObjects.forEach((obj) => {
      obj.visible = true
    })

    // Create final canvas for masked output
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = 585
    maskCanvas.height = 559
    const ctx = maskCanvas.getContext('2d')

    // Step 1: Draw exported content
    ctx.drawImage(exportedCanvas, 0, 0)

    // Step 2: Apply UV mask using destination-in (matches reference code)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = 'white'
    ctx.beginPath()

    // Fill UV triangles
    triangles.forEach((tri) => {
      ctx.moveTo(tri.u1, tri.v1)
      ctx.lineTo(tri.u2, tri.v2)
      ctx.lineTo(tri.u3, tri.v3)
    })

    ctx.fill()

    // Download
    const link = document.createElement('a')
    link.download = `pants-template-${Date.now()}.png`
    link.href = maskCanvas.toDataURL('image/png')
    link.click()
  }

  // Download Arms texture only
  const downloadArmsTexture = () => {
    if (!fabricRefShirt.current) return
    updateCleanTextures()

    const canvas = cleanTextureShirtRef.current
    if (!canvas) return

    const templateCanvas = document.createElement('canvas')
    templateCanvas.width = 585
    templateCanvas.height = 559
    const ctx = templateCanvas.getContext('2d')

    // Clip to arms only
    ctx.save()
    ctx.beginPath()
    // Left Arm
    ctx.rect(0, 99, 128, 192)
    // Right Arm
    ctx.rect(448, 99, 128, 192)
    ctx.closePath()
    ctx.clip()

    ctx.drawImage(
      canvas,
      0,
      0,
      Math.min(canvas.width, 585),
      Math.min(canvas.height, 559),
      0,
      0,
      585,
      559
    )
    ctx.restore()

    const link = document.createElement('a')
    link.download = `arms-texture-${Date.now()}.png`
    link.href = templateCanvas.toDataURL('image/png')
    link.click()
  }

  // Download Torso texture only
  const downloadTorsoTexture = () => {
    if (!fabricRefShirt.current) return
    updateCleanTextures()

    const canvas = cleanTextureShirtRef.current
    if (!canvas) return

    const templateCanvas = document.createElement('canvas')
    templateCanvas.width = 585
    templateCanvas.height = 559
    const ctx = templateCanvas.getContext('2d')

    // Clip to torso only
    ctx.save()
    ctx.beginPath()
    // Top section
    ctx.rect(195, 0, 195, 99)
    // Middle torso
    ctx.rect(128, 99, 320, 192)
    // Bottom torso
    ctx.rect(195, 291, 195, 268)
    ctx.closePath()
    ctx.clip()

    ctx.drawImage(
      canvas,
      0,
      0,
      Math.min(canvas.width, 585),
      Math.min(canvas.height, 559),
      0,
      0,
      585,
      559
    )
    ctx.restore()

    const link = document.createElement('a')
    link.download = `torso-texture-${Date.now()}.png`
    link.href = templateCanvas.toDataURL('image/png')
    link.click()
  }

  const value = {
    activeTab,
    setActiveTab,
    brushColor,
    brushSize,
    isEraser,
    brushOpacity,
    brushSoftness,
    brushSpacing,
    brushStyle,
    brushText,
    setBrushText,
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
    // Text Tool
    textOptions,
    updateTextOptions,
    // Clean texture refs for 3D model
    cleanTextureShirtRef,
    cleanTexturePantsRef,
    // UV triangle data from GLB model
    uvTrianglesShirtRef,
    uvTrianglesPantsRef,
    // Download functions
    downloadShirtTemplate,
    downloadPantsTemplate,
    downloadArmsTexture,
    downloadTorsoTexture,
  }

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  )
}
