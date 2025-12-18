'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, PencilBrush, SprayBrush, CircleBrush, Shadow, Image as FabImage, Line, Group, Circle, PatternBrush } from 'fabric'
import { useEditor } from './EditorContext'

// Constants for canvas dimensions
const CANVAS_WIDTH = 585
const CANVAS_HEIGHT = 559
const CONTAINER_WIDTH = 320
const CONTAINER_HEIGHT = 500

export default function CanvasArea() {
  const { 
    fabricRefShirt, 
    fabricRefPants, 
    triggerTextureUpdate, 
    brushColor, 
    brushSize, 
    isEraser, 
    brushOpacity,
    brushSoftness,
    brushSpacing,
    brushStyle,
    brushText,
    activeTab, 
    syncLayers 
  } = useEditor()
  
  // Refs
  const containerRef = useRef(null)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const wireframeShirtRef = useRef(null)
  const wireframePantsRef = useRef(null)
  const gridShirtRef = useRef(null)
  const gridPantsRef = useRef(null)
  const isInitialized = useRef(false)
  
  // Custom brush drawing refs
  const isCustomDrawing = useRef(false)
  const lastDrawPos = useRef({ x: 0, y: 0 })
  const staricImage = useRef(null)
  const strokeStamps = useRef([]) // Collect stamps during a stroke for grouping
  const currentStrokeCanvas = useRef(null) // Track which canvas is being drawn on
  
  // State
  const [showGrid, setShowGrid] = useState(false)
  // Calculate initial zoom to fit the canvas width in the container
  const initialZoom = CONTAINER_WIDTH / (CANVAS_WIDTH + 40) // +40 for padding
  const [zoom, setZoom] = useState(initialZoom)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })

  // Debounced texture update to prevent infinite loops
  const textureUpdateTimeout = useRef(null)
  const debouncedTextureUpdate = useCallback(() => {
    if (textureUpdateTimeout.current) {
      clearTimeout(textureUpdateTimeout.current)
    }
    textureUpdateTimeout.current = setTimeout(() => {
      triggerTextureUpdate()
    }, 50)
  }, [triggerTextureUpdate])

  // Initialization of Fabric
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    // Helper to load image as a fabric object (using Promise API for Fabric v6+)
    const loadTemplateObject = async (canvas, imageUrl, wireframeRef) => {
      try {
        const img = await FabImage.fromURL(imageUrl)
        img.scaleToWidth(CANVAS_WIDTH)
        img.set({
          selectable: false,
          evented: false,
          hoverCursor: 'default',
          left: 0,
          top: 0,
          excludeFromExport: true  // Don't include in texture export to 3D model
        })
        wireframeRef.current = img
        canvas.add(img)
        // Send to back (templates should be behind drawings)
        canvas.sendObjectToBack(img)
        canvas.renderAll()
      } catch (err) {
        console.error('Failed to load template:', imageUrl, err)
      }
    }
    
    if (!fabricRefShirt.current) {
      const cShirt = new Canvas('canvas-shirt', { 
        width: CANVAS_WIDTH, 
        height: CANVAS_HEIGHT, 
        isDrawingMode: false,
        backgroundColor: null,
        selection: false,  // Disable object selection to prevent interference
        preserveObjectStacking: true  // Keep drawn objects in their layer order
      })
      fabricRefShirt.current = cShirt
      loadTemplateObject(cShirt, '/templates/roblox_background_frame.348e21bb.png', wireframeShirtRef)
      // NOTE: Removed after:render listener - it causes infinite loops
      // Object events (add, remove, modify) handled separately are sufficient
    }

    if (!fabricRefPants.current) {
      const cPants = new Canvas('canvas-pants', { 
        width: CANVAS_WIDTH, 
        height: CANVAS_HEIGHT, 
        isDrawingMode: false,
        backgroundColor: null,
        selection: false,  // Disable object selection to prevent interference
        preserveObjectStacking: true  // Keep drawn objects in their layer order
      })
      fabricRefPants.current = cPants
      loadTemplateObject(cPants, '/templates/roblox_background_frame.348e21bc.png', wireframePantsRef)
      // NOTE: Removed after:render listener - it causes infinite loops
    }

    // Configure brushes
    const configureBrush = (canvas) => {
      if (!canvas) return
      canvas.freeDrawingBrush = new PencilBrush(canvas)
      canvas.freeDrawingBrush.color = isEraser ? '#ffffff' : brushColor
      canvas.freeDrawingBrush.width = parseInt(brushSize)
    }

    configureBrush(fabricRefShirt.current)
    configureBrush(fabricRefPants.current)

    // Load staric brush image
    const loadStaricImage = () => {
      const img = new Image()
      img.onload = () => {
        staricImage.current = img
      }
      img.src = '/brush/staric.webp'
    }
    loadStaricImage()

    // Cleanup timeout on unmount
    return () => {
      if (textureUpdateTimeout.current) {
        clearTimeout(textureUpdateTimeout.current)
      }
    }
  }, [debouncedTextureUpdate])

  // =======================================================
  // === Custom Draw Cursor ================================
  // =======================================================
  useEffect(() => {
    if (activeTab === 'draw') {
      const cursorSize = Math.max(20, Math.min(brushSize * 2, 50))
      
      // Create a simpler crosshair cursor that works better
      const cursorSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='${cursorSize}' height='${cursorSize}' viewBox='0 0 ${cursorSize} ${cursorSize}'><circle cx='${cursorSize/2}' cy='${cursorSize/2}' r='${(cursorSize/2)-2}' fill='none' stroke='white' stroke-width='2'/><circle cx='${cursorSize/2}' cy='${cursorSize/2}' r='${(cursorSize/2)-2}' fill='none' stroke='black' stroke-width='1'/><line x1='${cursorSize/2}' y1='0' x2='${cursorSize/2}' y2='${cursorSize}' stroke='black' stroke-width='1'/><line x1='0' y1='${cursorSize/2}' x2='${cursorSize}' y2='${cursorSize/2}' stroke='black' stroke-width='1'/></svg>`
      
      const encodedSVG = encodeURIComponent(cursorSVG).replace(/'/g, '%27')
      const cursorURL = `url("data:image/svg+xml,${encodedSVG}") ${cursorSize/2} ${cursorSize/2}, crosshair`
      
      // Set cursor on DOM canvas elements
      const canvasElements = document.querySelectorAll('#canvas-shirt, #canvas-pants')
      canvasElements.forEach(el => {
        if (el) {
          el.style.cursor = cursorURL
        }
      })
      
      // Also set cursor on Fabric canvas objects
      if (fabricRefShirt.current) {
        fabricRefShirt.current.defaultCursor = cursorURL
        fabricRefShirt.current.hoverCursor = cursorURL
        fabricRefShirt.current.freeDrawingCursor = cursorURL
      }
      if (fabricRefPants.current) {
        fabricRefPants.current.defaultCursor = cursorURL
        fabricRefPants.current.hoverCursor = cursorURL
        fabricRefPants.current.freeDrawingCursor = cursorURL
      }
    } else {
      // Reset cursor when not in draw mode
      const canvasElements = document.querySelectorAll('#canvas-shirt, #canvas-pants')
      canvasElements.forEach(el => {
        if (el) {
          el.style.cursor = ''
        }
      })
      
      // Reset Fabric cursors
      if (fabricRefShirt.current) {
        fabricRefShirt.current.defaultCursor = 'default'
        fabricRefShirt.current.hoverCursor = 'move'
        fabricRefShirt.current.freeDrawingCursor = 'crosshair'
      }
      if (fabricRefPants.current) {
        fabricRefPants.current.defaultCursor = 'default'
        fabricRefPants.current.hoverCursor = 'move'
        fabricRefPants.current.freeDrawingCursor = 'crosshair'
      }
    }
  }, [activeTab, brushSize, fabricRefShirt, fabricRefPants])

  // =======================================================
  // === Update Brush Settings ==============================
  // =======================================================
  useEffect(() => {
    const updateBrushForCanvas = (canvas) => {
      if (!canvas) return

      // Create appropriate brush based on style
      let brush
      switch(brushStyle) {
        case 'spray':
          brush = new SprayBrush(canvas)
          brush.density = 20
          brush.dotWidth = 3
          break
        case 'splatter':
          brush = new SprayBrush(canvas)
          brush.density = 30
          brush.dotWidth = 8
          break
        case 'circle':
          brush = new CircleBrush(canvas)
          break
        case 'dots':
          brush = new CircleBrush(canvas)
          brush.width = parseInt(brushSize) / 2 // Smaller circles for dots
          break
        case 'marker':
          brush = new PencilBrush(canvas)
          brush.strokeLineCap = 'square'
          brush.strokeLineJoin = 'miter'
          break
        case 'basic':
        default:
          // basic and custom stamp styles use PencilBrush as fallback
          // Custom stamps (stars, hearts, etc.) are handled separately
          brush = new PencilBrush(canvas)
          break
      }

      // Apply color with opacity
      const opacity = brushOpacity / 100
      const r = parseInt(brushColor.slice(1, 3), 16)
      const g = parseInt(brushColor.slice(3, 5), 16)
      const b = parseInt(brushColor.slice(5, 7), 16)
      const color = isEraser ? '#ffffff' : `rgba(${r}, ${g}, ${b}, ${opacity})`

      brush.color = color
      brush.width = parseInt(brushSize)

      // Apply softness as shadow blur (only for non-eraser)
      if (brushSoftness > 1 && !isEraser) {
        brush.shadow = new Shadow({
          blur: brushSoftness * 3,
          offsetX: 0,
          offsetY: 0,
          color: `rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`
        })
      }

      canvas.freeDrawingBrush = brush
      // Only enable drawing mode when on Draw tab
      canvas.isDrawingMode = activeTab === 'draw'
    }

    updateBrushForCanvas(fabricRefShirt.current)
    updateBrushForCanvas(fabricRefPants.current)
  }, [brushColor, brushSize, isEraser, brushOpacity, brushSoftness, brushStyle, activeTab])

  // Helper to convert hex to rgba
  const hexToRgba = (hex, alpha = 1) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return `rgba(255, 0, 0, ${alpha})`
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // =======================================================
  // === Custom Stamp Generation Functions =================
  // =======================================================
  
  // Generate star stamp
  const createStarStamp = useCallback((size, color, opacity) => {
    const canvas = document.createElement('canvas')
    // Add padding for shadow to prevent clipping
    const padding = brushSoftness > 1 ? brushSoftness * 3 : 0
    const totalSize = size + padding * 2
    
    canvas.width = totalSize
    canvas.height = totalSize
    const ctx = canvas.getContext('2d')
    
    // Apply softness as shadow if enabled
    if (brushSoftness > 1) {
      ctx.shadowBlur = brushSoftness
      ctx.shadowColor = hexToRgba(color, opacity * 0.8)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
    
    ctx.fillStyle = hexToRgba(color, opacity)
    ctx.beginPath()
    const spikes = 5
    const outerRadius = size / 2
    const innerRadius = size / 4
    const cx = totalSize / 2
    const cy = totalSize / 2
    
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (Math.PI * i) / spikes - Math.PI / 2
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    
    return canvas.toDataURL()
  }, [hexToRgba, brushSoftness])
  
  // Generate heart stamp
  const createHeartStamp = useCallback((size, color, opacity) => {
    const canvas = document.createElement('canvas')
    // Add padding for shadow to prevent clipping
    const padding = brushSoftness > 1 ? brushSoftness * 3 : 0
    const totalSize = size + padding * 2
    
    canvas.width = totalSize
    canvas.height = totalSize
    const ctx = canvas.getContext('2d')
    
    // Apply softness as shadow if enabled
    if (brushSoftness > 1) {
      ctx.shadowBlur = brushSoftness
      ctx.shadowColor = hexToRgba(color, opacity * 0.8)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
    
    ctx.fillStyle = hexToRgba(color, opacity)
    ctx.beginPath()
    const topCurveHeight = size * 0.3
    const centerOffset = padding
    ctx.moveTo(totalSize / 2, size * 0.8 + centerOffset)
    ctx.bezierCurveTo(totalSize / 2, size * 0.6 + centerOffset, centerOffset, size * 0.5 + centerOffset, centerOffset, topCurveHeight + centerOffset)
    ctx.bezierCurveTo(centerOffset, centerOffset, totalSize / 2, centerOffset, totalSize / 2, topCurveHeight + centerOffset)
    ctx.bezierCurveTo(totalSize / 2, centerOffset, size + centerOffset, centerOffset, size + centerOffset, topCurveHeight + centerOffset)
    ctx.bezierCurveTo(size + centerOffset, size * 0.5 + centerOffset, totalSize / 2, size * 0.6 + centerOffset, totalSize / 2, size * 0.8 + centerOffset)
    ctx.closePath()
    ctx.fill()
    
    return canvas.toDataURL()
  }, [hexToRgba, brushSoftness])
  
  // Generate flower stamp
  const createFlowerStamp = useCallback((size, color, opacity) => {
    const canvas = document.createElement('canvas')
    // Add padding for shadow to prevent clipping
    const padding = brushSoftness > 1 ? brushSoftness * 3 : 0
    const totalSize = size + padding * 2
    
    canvas.width = totalSize
    canvas.height = totalSize
    const ctx = canvas.getContext('2d')
    
    // Apply softness as shadow if enabled
    if (brushSoftness > 1) {
      ctx.shadowBlur = brushSoftness
      ctx.shadowColor = hexToRgba(color, opacity * 0.8)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
    
    ctx.fillStyle = hexToRgba(color, opacity)
    const petals = 5
    const cx = totalSize / 2
    const cy = totalSize / 2
    const petalRadius = size / 4
    
    for (let i = 0; i < petals; i++) {
      const angle = (Math.PI * 2 * i) / petals
      const px = cx + (size / 3) * Math.cos(angle)
      const py = cy + (size / 3) * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(px, py, petalRadius, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Center
    ctx.beginPath()
    ctx.arc(cx, cy, size / 6, 0, Math.PI * 2)
    ctx.fill()
    
    return canvas.toDataURL()
  }, [hexToRgba, brushSoftness])
  
  // Generate lightning stamp
  const createLightningStamp = useCallback((size, color, opacity) => {
    const canvas = document.createElement('canvas')
    // Add padding for shadow to prevent clipping
    const padding = brushSoftness > 1 ? brushSoftness * 3 : 0
    const totalSize = size + padding * 2
    
    canvas.width = totalSize
    canvas.height = totalSize
    const ctx = canvas.getContext('2d')
    
    // Apply softness as shadow if enabled
    if (brushSoftness > 1) {
      ctx.shadowBlur = brushSoftness
      ctx.shadowColor = hexToRgba(color, opacity * 0.8)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
    
    ctx.fillStyle = hexToRgba(color, opacity)
    ctx.beginPath()
    const offset = padding
    ctx.moveTo(size * 0.6 + offset, offset)
    ctx.lineTo(size * 0.2 + offset, size * 0.5 + offset)
    ctx.lineTo(size * 0.5 + offset, size * 0.5 + offset)
    ctx.lineTo(size * 0.3 + offset, size + offset)
    ctx.lineTo(size * 0.7 + offset, size * 0.4 + offset)
    ctx.lineTo(size * 0.5 + offset, size * 0.4 + offset)
    ctx.closePath()
    ctx.fill()
    
    return canvas.toDataURL()
  }, [hexToRgba, brushSoftness])
  
  // Generate spiral stamp
  const createSpiralStamp = useCallback((size, color, opacity) => {
    const canvas = document.createElement('canvas')
    // Add padding for shadow to prevent clipping
    const padding = brushSoftness > 1 ? brushSoftness * 3 : 0
    const totalSize = size + padding * 2
    
    canvas.width = totalSize
    canvas.height = totalSize
    const ctx = canvas.getContext('2d')
    
    // Apply softness as shadow if enabled
    if (brushSoftness > 1) {
      ctx.shadowBlur = brushSoftness
      ctx.shadowColor = hexToRgba(color, opacity * 0.8)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
    
    ctx.strokeStyle = hexToRgba(color, opacity)
    ctx.lineWidth = 2
    ctx.beginPath()
    
    const cx = totalSize / 2
    const cy = totalSize / 2
    const maxRadius = size / 2
    const coils = 3
    
    for (let i = 0; i < 100; i++) {
      const angle = 0.1 * i
      const radius = (maxRadius * i) / 100
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    
    return canvas.toDataURL()
  }, [hexToRgba, brushSoftness])
  
  // Generate square stamp
  const createSquareStamp = useCallback((size, color, opacity) => {
    const canvas = document.createElement('canvas')
    // Add padding for shadow to prevent clipping
    const padding = brushSoftness > 1 ? brushSoftness * 3 : 0
    const totalSize = size + padding * 2
    
    canvas.width = totalSize
    canvas.height = totalSize
    const ctx = canvas.getContext('2d')
    
    // Apply softness as shadow if enabled
    if (brushSoftness > 1) {
      ctx.shadowBlur = brushSoftness
      ctx.shadowColor = hexToRgba(color, opacity * 0.8)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
    
    ctx.fillStyle = hexToRgba(color, opacity)
    const squareSize = size * 0.8
    const offset = (totalSize - squareSize) / 2
    ctx.fillRect(offset, offset, squareSize, squareSize)
    
    return canvas.toDataURL()
  }, [hexToRgba, brushSoftness])
  
  // Generate triangle stamp
  const createTriangleStamp = useCallback((size, color, opacity) => {
    const canvas = document.createElement('canvas')
    // Add padding for shadow to prevent clipping
    const padding = brushSoftness > 1 ? brushSoftness * 3 : 0
    const totalSize = size + padding * 2
    
    canvas.width = totalSize
    canvas.height = totalSize
    const ctx = canvas.getContext('2d')
    
    // Apply softness as shadow if enabled
    if (brushSoftness > 1) {
      ctx.shadowBlur = brushSoftness
      ctx.shadowColor = hexToRgba(color, opacity * 0.8)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
    
    ctx.fillStyle = hexToRgba(color, opacity)
    ctx.beginPath()
    const offset = padding
    ctx.moveTo(totalSize / 2, size * 0.1 + offset)
    ctx.lineTo(size * 0.9 + offset, size * 0.9 + offset)
    ctx.lineTo(size * 0.1 + offset, size * 0.9 + offset)
    ctx.closePath()
    ctx.fill()
    
    return canvas.toDataURL()
  }, [hexToRgba, brushSoftness])
  
  // Generate diamond stamp
  const createDiamondStamp = useCallback((size, color, opacity) => {
    const canvas = document.createElement('canvas')
    // Add padding for shadow to prevent clipping
    const padding = brushSoftness > 1 ? brushSoftness * 3 : 0
    const totalSize = size + padding * 2
    
    canvas.width = totalSize
    canvas.height = totalSize
    const ctx = canvas.getContext('2d')
    
    // Apply softness as shadow if enabled
    if (brushSoftness > 1) {
      ctx.shadowBlur = brushSoftness
      ctx.shadowColor = hexToRgba(color, opacity * 0.8)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
    
    ctx.fillStyle = hexToRgba(color, opacity)
    ctx.beginPath()
    const offset = padding
    ctx.moveTo(totalSize / 2, offset)
    ctx.lineTo(size + offset, totalSize / 2)
    ctx.lineTo(totalSize / 2, size + offset)
    ctx.lineTo(offset, totalSize / 2)
    ctx.closePath()
    ctx.fill()
    
    return canvas.toDataURL()
  }, [hexToRgba, brushSoftness])
  
  // Generate text stamp
  const createTextStamp = useCallback((size, color, opacity) => {
    if (!brushText || brushText.trim() === '') {
      // Return null if no text provided
      return null
    }
    
    const canvas = document.createElement('canvas')
    const fontSize = size
    
    // Estimate canvas size based on text length and font size
    // Add padding for shadow/softness
    const padding = brushSoftness > 1 ? brushSoftness * 6 : 0
    const estimatedWidth = fontSize * brushText.length * 0.7 + padding * 2
    const estimatedHeight = fontSize * 1.4 + padding * 2
    
    canvas.width = estimatedWidth
    canvas.height = estimatedHeight
    const ctx = canvas.getContext('2d')
    
    // Apply softness as shadow if enabled
    if (brushSoftness > 1) {
      ctx.shadowBlur = brushSoftness
      ctx.shadowColor = hexToRgba(color, opacity * 0.8)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
    
    // Set text styling
    ctx.font = `${fontSize}px Arial`
    ctx.fillStyle = hexToRgba(color, opacity)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Draw text at center of canvas
    ctx.fillText(brushText, estimatedWidth / 2, estimatedHeight / 2)
    
    return canvas.toDataURL()
  }, [brushText, brushSoftness, hexToRgba])

  // =======================================================
  // === Custom Spaced Brush Drawing =======================
  // =======================================================
  
  // Helper function to create stamp based on brush style
  const createStamp = useCallback((x, y) => {
    const opacity = brushOpacity / 100
    const size = parseInt(brushSize)
    const color = isEraser ? '#ffffff' : brushColor
    
    // Determine stamp type based on brush style
    let stampDataURL
    
    switch(brushStyle) {
      case 'stars':
        stampDataURL = createStarStamp(size, color, opacity)
        break
      case 'hearts':
        stampDataURL = createHeartStamp(size, color, opacity)
        break
      case 'flowers':
        stampDataURL = createFlowerStamp(size, color, opacity)
        break
      case 'lightning':
        stampDataURL = createLightningStamp(size, color, opacity)
        break
      case 'spirals':
        stampDataURL = createSpiralStamp(size, color, opacity)
        break
      case 'squares':
        stampDataURL = createSquareStamp(size, color, opacity)
        break
      case 'triangles':
        stampDataURL = createTriangleStamp(size, color, opacity)
        break
      case 'diamonds':
        stampDataURL = createDiamondStamp(size, color, opacity)
        break
      case 'staric':
        // Use existing staric image logic
        if (staricImage.current) {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = size
          tempCanvas.height = size
          const tempCtx = tempCanvas.getContext('2d')
          
          tempCtx.drawImage(staricImage.current, 0, 0, size, size)
          tempCtx.globalCompositeOperation = 'source-in'
          tempCtx.fillStyle = color
          tempCtx.fillRect(0, 0, size, size)
          tempCtx.globalCompositeOperation = 'destination-in'
          tempCtx.fillStyle = `rgba(0,0,0,${opacity})`
          tempCtx.fillRect(0, 0, size, size)
          
          stampDataURL = tempCanvas.toDataURL()
        }
        break
      case 'text':
        stampDataURL = createTextStamp(size, color, opacity)
        break
      default:
        // For basic/circle and other styles, use simple circle
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = size
        tempCanvas.height = size
        const tempCtx = tempCanvas.getContext('2d')
        tempCtx.fillStyle = hexToRgba(color, opacity)
        tempCtx.beginPath()
        tempCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
        tempCtx.fill()
        stampDataURL = tempCanvas.toDataURL()
    }
    
    
    if (!stampDataURL) return null
    
    // Create fabric Image object from the stamp data URL
    // Shadow is baked into the image during canvas rendering
    return FabImage.fromURL(stampDataURL, {}, {
      left: x,
      top: y,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      scaleX: 1,
      scaleY: 1
    })
  }, [brushColor, brushSize, brushOpacity, brushStyle, brushSoftness, isEraser, brushText, staricImage, hexToRgba, createStarStamp, createHeartStamp, createFlowerStamp, createLightningStamp, createSpiralStamp, createSquareStamp, createTriangleStamp, createDiamondStamp, createTextStamp])
  
  // Setup custom drawing event handlers for spaced drawing
  // Groups all stamps into a single fabric Group object on mouseup (= 1 layer per stroke)
  useEffect(() => {
    // Enable custom spacing drawing when:
    // 1. spacing > 20 (gives visual separation)
    // 2. OR using custom stamp brushes (stars, hearts, etc.)
    const isCustomStampBrush = ['stars', 'hearts', 'flowers', 'lightning', 'spirals', 'squares', 'triangles', 'diamonds', 'staric', 'text'].includes(brushStyle)
    const useCustomDrawing = (brushSpacing > 20 || isCustomStampBrush) && activeTab === 'draw'
    
    if (!useCustomDrawing) return
    
    const canvases = [
      { canvas: fabricRefShirt.current, el: document.querySelector('#canvas-shirt') },
      { canvas: fabricRefPants.current, el: document.querySelector('#canvas-pants') }
    ]
    
    const getCanvasPoint = (canvas, e) => {
      if (!canvas) return null
      const pointer = canvas.getPointer(e.e || e)
      return pointer
    }
    
    const handleMouseDown = async (opt, canvas) => {
      if (!canvas) return
      const pointer = getCanvasPoint(canvas, opt)
      if (!pointer) return
      
      isCustomDrawing.current = true
      lastDrawPos.current = { x: pointer.x, y: pointer.y }
      currentStrokeCanvas.current = canvas
      strokeStamps.current = [] // Reset stamps for new stroke
      
      // Create initial stamp (returns a Promise)
      const stampPromise = createStamp(pointer.x, pointer.y)
      if (stampPromise) {
        const stamp = await stampPromise
        if (stamp) {
          // Add stamp to canvas immediately for real-time rendering
          canvas.add(stamp)
          canvas.renderAll()
          // Keep reference for grouping later
          strokeStamps.current.push(stamp)
          // Trigger 3D texture update immediately
          debouncedTextureUpdate()
        }
      }
    }
    
    const handleMouseMove = async (opt, canvas) => {
      if (!isCustomDrawing.current || !canvas) return
      if (currentStrokeCanvas.current !== canvas) return
      
      const pointer = getCanvasPoint(canvas, opt)
      if (!pointer) return
      
      // Calculate distance from last stamp
      const dx = pointer.x - lastDrawPos.current.x
      const dy = pointer.y - lastDrawPos.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Calculate spacing distance based on brush size and spacing percentage
      let spacingDistance
      if (brushStyle === 'text') {
        // For text brush, base spacing on estimated text width
        const fontSize = parseInt(brushSize)
        const estimatedTextWidth = fontSize * brushText.length * 0.7
        // brushSpacing controls density: 1-20 = ribbon, 21-50 = touching, 51-100 = separated
        spacingDistance = estimatedTextWidth * (brushSpacing / 50)
      } else if (isCustomStampBrush) {
        // Fixed spacing for other custom stamps
        spacingDistance = parseInt(brushSize) * 1.5
      } else {
        // Standard spacing for built-in brushes
        spacingDistance = (brushSpacing / 100) * parseInt(brushSize) * 3
      }
      
      // If we've moved far enough, create stamps
      if (distance >= spacingDistance) {
        const steps = Math.floor(distance / spacingDistance)
        const stepX = dx / distance * spacingDistance
        const stepY = dy / distance * spacingDistance
        
        // Create all stamps for this movement
        const stampPromises = []
        for (let i = 1; i <= steps; i++) {
          const stampX = lastDrawPos.current.x + stepX * i
          const stampY = lastDrawPos.current.y + stepY * i
          const stampPromise = createStamp(stampX, stampY)
          if (stampPromise) stampPromises.push(stampPromise)
        }
        
        // Wait for all stamps to be created (ensures complete images)
        const stamps = await Promise.all(stampPromises)
        stamps.forEach(stamp => {
          if (stamp) {
            // Add stamp to canvas immediately for real-time rendering
            canvas.add(stamp)
            // Keep reference for grouping later
            strokeStamps.current.push(stamp)
          }
        })
        // Render all new stamps at once for better performance
        canvas.renderAll()
        // Trigger 3D texture update after stamps are rendered
        debouncedTextureUpdate()
        
        lastDrawPos.current = {
          x: lastDrawPos.current.x + stepX * steps,
          y: lastDrawPos.current.y + stepY * steps
        }
      }
    }
    
    const handleMouseUp = () => {
      if (!isCustomDrawing.current) return
      
      const canvas = currentStrokeCanvas.current
      if (canvas && strokeStamps.current.length > 0) {
        // Remove individual stamps from canvas
        strokeStamps.current.forEach(stamp => {
          canvas.remove(stamp)
        })
        
        // Group all stamps into a single object
        // This group will be properly exported by toCanvasElement()
        const group = new Group(strokeStamps.current, {
          selectable: false,
          evented: false,
          hoverCursor: 'default'
        })
        
        // Add the grouped object to canvas
        canvas.add(group)
        canvas.renderAll()
        
        // Final texture update with completed group
        // This ensures 3D model gets the grouped stamps
        debouncedTextureUpdate()
        
        // Sync layers to update UI
        syncLayers()
      }
      
      isCustomDrawing.current = false
      strokeStamps.current = []
      currentStrokeCanvas.current = null
    }
    
    // Attach event handlers to both canvases
    const handlers = []
    canvases.forEach(({ canvas }) => {
      if (!canvas) return
      
      // Disable fabric's built-in drawing mode when using custom spacing
      canvas.isDrawingMode = false
      
      const onMouseDown = (opt) => handleMouseDown(opt, canvas)
      const onMouseMove = (opt) => handleMouseMove(opt, canvas)
      const onMouseUp = () => handleMouseUp()
      
      canvas.on('mouse:down', onMouseDown)
      canvas.on('mouse:move', onMouseMove)
      canvas.on('mouse:up', onMouseUp)
      
      handlers.push({ canvas, onMouseDown, onMouseMove, onMouseUp })
    })
    
    return () => {
      handlers.forEach(({ canvas, onMouseDown, onMouseMove, onMouseUp }) => {
        if (canvas) {
          canvas.off('mouse:down', onMouseDown)
          canvas.off('mouse:move', onMouseMove)
          canvas.off('mouse:up', onMouseUp)
          // Re-enable drawing mode
          canvas.isDrawingMode = activeTab === 'draw'
        }
      })
    }
  }, [brushSpacing, activeTab, brushSize, brushColor, brushOpacity, brushSoftness, isEraser, brushStyle, brushText, hexToRgba, syncLayers, createStamp])

  // Grid Visibility Toggle
  useEffect(() => {
    // Helper to create grid lines for a canvas
    const createGrid = (canvas, gridRef) => {
      if (!canvas) return
      
      // Remove existing grid if any
      if (gridRef.current) {
        canvas.remove(gridRef.current)
        gridRef.current = null
      }
      
      if (!showGrid) {
        canvas.renderAll()
        return
      }
      
      // Create grid lines
      const gridSize = 20 // pixels between grid lines
      const lines = []
      const lineColor = 'rgba(100, 116, 139, 0.3)' // semi-transparent gray
      const lineWidth = 0.5
      
      // Vertical lines
      for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
        const line = new Line([x, 0, x, CANVAS_HEIGHT], {
          stroke: lineColor,
          strokeWidth: lineWidth,
          selectable: false,
          evented: false,
          excludeFromExport: true
        })
        lines.push(line)
      }
      
      // Horizontal lines
      for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
        const line = new Line([0, y, CANVAS_WIDTH, y], {
          stroke: lineColor,
          strokeWidth: lineWidth,
          selectable: false,
          evented: false,
          excludeFromExport: true
        })
        lines.push(line)
      }
      
      // Create a group for all grid lines
      const gridGroup = new Group(lines, {
        selectable: false,
        evented: false,
        excludeFromExport: true,
        hoverCursor: 'default'
      })
      
      gridRef.current = gridGroup
      canvas.add(gridGroup)
      // Send grid to back but above wireframe
      canvas.sendObjectToBack(gridGroup)
      // Make sure wireframe is at the very back
      if (wireframeShirtRef.current && canvas === fabricRefShirt.current) {
        canvas.sendObjectToBack(wireframeShirtRef.current)
      }
      if (wireframePantsRef.current && canvas === fabricRefPants.current) {
        canvas.sendObjectToBack(wireframePantsRef.current)
      }
      canvas.renderAll()
    }
    
    createGrid(fabricRefShirt.current, gridShirtRef)
    createGrid(fabricRefPants.current, gridPantsRef)
  }, [showGrid, fabricRefShirt, fabricRefPants])

  // Toggle Drawing Mode
  useEffect(() => {
    const isDraw = activeTab === 'draw'
    // When spacing > 1, we use custom stamped drawing, not Fabric's built-in drawing
    const useBuiltInDrawing = isDraw && brushSpacing <= 1
    if (fabricRefShirt.current) fabricRefShirt.current.isDrawingMode = useBuiltInDrawing
    if (fabricRefPants.current) fabricRefPants.current.isDrawingMode = useBuiltInDrawing
  }, [activeTab, brushSpacing])

  // Sync Layers
  useEffect(() => {
    const events = ['object:added', 'object:removed', 'object:modified']
    const canvases = [fabricRefShirt.current, fabricRefPants.current]
    const handler = () => syncLayers()
    
    // Handler to make paths non-selectable after they're created
    const pathCreatedHandler = (e) => {
      if (e.path) {
        e.path.set({
          selectable: false,
          evented: false,
          hoverCursor: 'default'
        })
      }
      syncLayers()
    }

    canvases.forEach(c => {
      if (c) {
        events.forEach(e => c.on(e, handler))
        c.on('path:created', pathCreatedHandler)
      }
    })

    return () => {
      canvases.forEach(c => {
        if (c) {
          events.forEach(e => c.off(e, handler))
          c.off('path:created', pathCreatedHandler)
        }
      })
    }
  }, [syncLayers])



  // Update Brush with all settings
  useEffect(() => {
    ;[fabricRefShirt.current, fabricRefPants.current].forEach(canvas => {
      if (!canvas) return
      
      // Create appropriate brush based on style
      let brush
      switch(brushStyle) {
        case 'spray':
          brush = new SprayBrush(canvas)
          brush.density = 20
          break
        case 'circle':
          brush = new CircleBrush(canvas)
          break
        default:
          brush = new PencilBrush(canvas)
      }
      
      // Apply color with opacity
      const opacity = brushOpacity / 100
      const color = isEraser ? '#ffffff' : hexToRgba(brushColor, opacity)
      brush.color = color
      brush.width = parseInt(brushSize)
      
      // Apply softness as shadow blur
      if (brushSoftness > 1 && !isEraser) {
        brush.shadow = new Shadow({
          blur: brushSoftness * 2,
          offsetX: 0,
          offsetY: 0,
          color: hexToRgba(brushColor, opacity * 0.5)
        })
      } else {
        brush.shadow = null
      }
      
      canvas.freeDrawingBrush = brush
    })
  }, [brushColor, brushSize, isEraser, brushOpacity, brushSoftness, brushSpacing, brushStyle])

  // =======================================================
  // === Panning Logic (Using CSS Transform) ===============
  // =======================================================
  
  // Helper to force cursor globally
  const setGlobalCursor = (cursor) => {
    if (cursor) {
      document.body.style.cursor = cursor
      // Also inject a style to override canvas cursors
      let style = document.getElementById('pan-cursor-style')
      if (!style) {
        style = document.createElement('style')
        style.id = 'pan-cursor-style'
        document.head.appendChild(style)
      }
      style.textContent = `* { cursor: ${cursor} !important; }`
    } else {
      document.body.style.cursor = ''
      const style = document.getElementById('pan-cursor-style')
      if (style) style.remove()
    }
  }
  
  const handleMouseDown = (e) => {
    // Check if clicking on a canvas element
    const isCanvas = e.target.tagName === 'CANVAS' || 
                     e.target.classList.contains('upper-canvas') ||
                     e.target.classList.contains('lower-canvas')
    
    // Middle mouse button (button === 1) - ALWAYS allow panning, even on canvas
    if (e.button === 1) {
      e.preventDefault() // Prevent default middle-click behavior (auto-scroll)
      isDragging.current = true
      lastPos.current = { x: e.clientX, y: e.clientY }
      setGlobalCursor('grab')
      return
    }
    
    // Left click on canvas - let Fabric.js handle it (drawing/selecting)
    if (isCanvas) return
    
    // Left click on background - pan the view
    if (e.button !== 0) return
    
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    setGlobalCursor('grab')
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current) return
    
    const deltaX = e.clientX - lastPos.current.x
    const deltaY = e.clientY - lastPos.current.y
    
    lastPos.current = { x: e.clientX, y: e.clientY }
    
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))
  }

  const handleMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false
      setGlobalCursor(null)
    }
  }

  // =======================================================
  // === Zoom Logic (Center-based) =========================
  // =======================================================
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      const delta = e.deltaY * -0.001
      const newZoom = Math.min(Math.max(0.2, zoom + delta), 3)
      
      if (newZoom === zoom) return

      // Get mouse position relative to container center
      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left - rect.width / 2
      const mouseY = e.clientY - rect.top - rect.height / 2

      // Adjust pan offset to zoom toward mouse position
      const zoomRatio = newZoom / zoom
      setPanOffset(prev => ({
        x: mouseX - (mouseX - prev.x) * zoomRatio,
        y: mouseY - (mouseY - prev.y) * zoomRatio
      }))
      
      setZoom(newZoom)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [zoom])

  // =======================================================
  // === Scroll Isolation ==================================
  // =======================================================
  useEffect(() => {
    const widget = document.querySelector('.canvas-widget')
    if (!widget) return

    const preventScroll = (e) => {
      const isCanvas = e.target.tagName === 'CANVAS' || 
                       e.target.classList.contains('upper-canvas') ||
                       e.target.classList.contains('lower-canvas')
      
      // Allow touch on canvas for drawing
      if (isCanvas && activeTab === 'draw') return
      
      e.preventDefault()
      e.stopPropagation()
    }

    widget.addEventListener('wheel', preventScroll, { passive: false })
    widget.addEventListener('touchmove', preventScroll, { passive: false })

    return () => {
      widget.removeEventListener('wheel', preventScroll)
      widget.removeEventListener('touchmove', preventScroll)
    }
  }, [activeTab])

  // =======================================================
  // === Reset View ========================================
  // =======================================================
  const resetView = () => {
    setZoom(initialZoom)
    setPanOffset({ x: 0, y: 0 })
  }

  // =======================================================
  // === RENDER ============================================
  // =======================================================
  return (
    <div 
      className="canvas-panel"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Panel Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'white'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '14px', 
          fontWeight: 600, 
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="fa-solid fa-pencil" style={{ color: 'var(--primary)' }}></i>
          2D Canvas Editor
        </h2>
      </div>

      {/* Canvas Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: 'var(--bg-workspace)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div 
          className="canvas-widget"
          style={{ 
            width: '100%',
            flex: 1,
            backgroundColor: 'white',
            overflow: 'hidden',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
      {/* Header / Controls */}
      <div style={{display:'flex',paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', justifyContent:'space-between', alignItems:'center', width: '100%'}}>
        <div 
          style={{fontSize:'12px', fontWeight:600, color:'#64748b', display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}
          onClick={() => setShowGrid(s => !s)}
        >
          <span 
            style={{
              width:'32px', 
              height:'18px', 
              background: showGrid ? '#4c83f0' : '#cbd5e1', 
              borderRadius:'10px', 
              position:'relative', 
              transition: 'background-color 0.2s'
            }}
          >
            <div 
              style={{
                position:'absolute', 
                top:'2px', 
                height:'14px', 
                width:'14px', 
                background:'white', 
                borderRadius:'50%', 
                left: showGrid ? '16px' : '2px',
                transition: 'left 0.2s'
              }}
            />
          </span>
          Grid
        </div>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <button 
            onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} 
            style={{background:'#f1f5f9', border:'none', borderRadius:'4px', width:'24px', height:'24px', cursor:'pointer', color:'#475569', fontWeight:'bold'}}
          >−</button>
          <span style={{fontSize:'11px', color:'#64748b', minWidth:'40px', textAlign:'center'}}>
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={() => setZoom(z => Math.min(3, z + 0.1))} 
            style={{background:'#f1f5f9', border:'none', borderRadius:'4px', width:'24px', height:'24px', cursor:'pointer', color:'#475569', fontWeight:'bold'}}
          >+</button>
          <button 
            onClick={resetView} 
            style={{background:'#f1f5f9', border:'none', borderRadius:'4px', padding:'0 8px', height:'24px', cursor:'pointer', color:'#475569', fontSize:'11px', marginLeft:'4px'}}
          >Reset</button>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="pannable-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: '100%',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          background: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          cursor: isDragging.current ? 'grabbing' : 'grab'
        }}
      >
        {/* Transformed Content - Centered with pan offset */}
        <div style={{ 
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          alignItems: 'center'
        }}>
          
          {/* Shirt Canvas Wrapper */}
          <div style={{ 
            position: 'relative', 
            width: CANVAS_WIDTH, 
            height: CANVAS_HEIGHT, 
            backgroundColor: 'transparent', 
            border: '2px dashed #94a3b8', 
            borderRadius: '4px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
          }}>
            <div style={{ 
              position: 'absolute', top: -22, left: 0, 
              color: '#64748b', fontSize: '10px', fontWeight: '600', letterSpacing: '0.05em' 
            }}>SHIRT (ARMS & TORSO)</div>
            <canvas id="canvas-shirt" width={CANVAS_WIDTH} height={CANVAS_HEIGHT}></canvas>
          </div>

          {/* Pants Canvas Wrapper */}
          <div style={{ 
            position: 'relative', 
            width: CANVAS_WIDTH, 
            height: CANVAS_HEIGHT, 
            backgroundColor: 'transparent', 
            border: '2px dashed #94a3b8',
            borderRadius: '4px', 
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
          }}>
            <div style={{ 
              position: 'absolute', top: -22, left: 0, 
              color: '#64748b', fontSize: '10px', fontWeight: '600', letterSpacing: '0.05em' 
            }}>PANTS (LEGS & TORSO)</div>
            <canvas id="canvas-pants" width={CANVAS_WIDTH} height={CANVAS_HEIGHT}></canvas>
          </div>

        </div>
      </div>

        </div>
      </div>
    </div>
  )
}