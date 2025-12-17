'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, PencilBrush, Image as FabImage, Line, Group } from 'fabric'
import { useEditor } from './EditorContext'

// Constants for canvas dimensions
const CANVAS_WIDTH = 585
const CANVAS_HEIGHT = 559
const CONTAINER_WIDTH = 320
const CONTAINER_HEIGHT = 500

export default function CanvasArea() {
  const { fabricRefShirt, fabricRefPants, triggerTextureUpdate, brushColor, brushSize, isEraser, activeTab, syncLayers } = useEditor()
  
  // Refs
  const containerRef = useRef(null)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const wireframeShirtRef = useRef(null)
  const wireframePantsRef = useRef(null)
  const gridShirtRef = useRef(null)
  const gridPantsRef = useRef(null)
  const isInitialized = useRef(false)
  
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
        backgroundColor: null
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
        backgroundColor: null
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

    // Cleanup timeout on unmount
    return () => {
      if (textureUpdateTimeout.current) {
        clearTimeout(textureUpdateTimeout.current)
      }
    }
  }, [debouncedTextureUpdate])

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
    if (fabricRefShirt.current) fabricRefShirt.current.isDrawingMode = isDraw
    if (fabricRefPants.current) fabricRefPants.current.isDrawingMode = isDraw
  }, [activeTab])

  // Sync Layers
  useEffect(() => {
    const events = ['object:added', 'object:removed', 'object:modified']
    const canvases = [fabricRefShirt.current, fabricRefPants.current]
    const handler = () => syncLayers()

    canvases.forEach(c => {
      if (c) {
        events.forEach(e => c.on(e, handler))
        c.on('path:created', handler)
      }
    })

    return () => {
      canvases.forEach(c => {
        if (c) {
          events.forEach(e => c.off(e, handler))
          c.off('path:created', handler)
        }
      })
    }
  }, [syncLayers])

  // Update Brush
  useEffect(() => {
    ;[fabricRefShirt.current, fabricRefPants.current].forEach(c => {
      if (c && c.freeDrawingBrush) {
        c.freeDrawingBrush.color = isEraser ? '#ffffff' : brushColor
        c.freeDrawingBrush.width = parseInt(brushSize)
      }
    })
  }, [brushColor, brushSize, isEraser])

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