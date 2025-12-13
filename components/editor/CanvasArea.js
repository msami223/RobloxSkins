'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, PencilBrush, Image as FabImage } from 'fabric'
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
  const isInitialized = useRef(false)
  
  // State
  const [showWireframe, setShowWireframe] = useState(true)
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
          top: 0
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
        backgroundColor: '#ffffff'
      })
      fabricRefShirt.current = cShirt
      loadTemplateObject(cShirt, '/templates/roblox_background_frame.348e21bb.png', wireframeShirtRef)
      // Use debounced update to prevent infinite loops
      cShirt.on('after:render', debouncedTextureUpdate)
    }

    if (!fabricRefPants.current) {
      const cPants = new Canvas('canvas-pants', { 
        width: CANVAS_WIDTH, 
        height: CANVAS_HEIGHT, 
        isDrawingMode: false,
        backgroundColor: '#ffffff'
      })
      fabricRefPants.current = cPants
      loadTemplateObject(cPants, '/templates/roblox_background_frame.348e21bc.png', wireframePantsRef)
      cPants.on('after:render', debouncedTextureUpdate)
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

  // Wireframe Visibility Toggle - without triggering texture update to avoid loop
  useEffect(() => {
    const toggleVisibility = (ref, canvasRef) => {
      if (ref.current && canvasRef.current) {
        ref.current.set({ visible: showWireframe })
        canvasRef.current.renderAll()
        // Don't call triggerTextureUpdate here - it will be called by after:render
      }
    }
    toggleVisibility(wireframeShirtRef, fabricRefShirt)
    toggleVisibility(wireframePantsRef, fabricRefPants)
  }, [showWireframe, fabricRefShirt, fabricRefPants])

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
  const handleMouseDown = (e) => {
    // Only pan with left click on the container background, not on canvas
    const isCanvas = e.target.tagName === 'CANVAS' || 
                     e.target.classList.contains('upper-canvas') ||
                     e.target.classList.contains('lower-canvas')
    
    // Allow canvas interactions (drawing) when in draw mode
    if (isCanvas && activeTab === 'draw') return
    
    if (e.button !== 0) return
    
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing'
    }
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
    isDragging.current = false
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab'
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
      className="canvas-widget"
      style={{ 
        width: 'auto',
        height: 'auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        overflow: 'hidden',
        pointerEvents: 'auto',
        border: '1px solid #e2e8f0',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Header / Controls */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width: '100%'}}>
        <div 
          style={{fontSize:'12px', fontWeight:600, color:'#64748b', display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}
          onClick={() => setShowWireframe(s => !s)}
        >
          <span 
            style={{
              width:'32px', 
              height:'18px', 
              background: showWireframe ? '#4c83f0' : '#cbd5e1', 
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
                left: showWireframe ? '16px' : '2px',
                transition: 'left 0.2s'
              }}
            />
          </span>
          Wireframe
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
          width: `${CONTAINER_WIDTH}px`,
          height: `${CONTAINER_HEIGHT}px`,
          overflow: 'hidden',
          position: 'relative',
          background: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
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
            backgroundColor: 'white', 
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
            backgroundColor: 'white', 
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

      {/* Help Text */}
      <div style={{fontSize:'10px', color:'#94a3b8', textAlign:'center'}}>
        Scroll to zoom • Drag to pan • Switch to Draw mode to paint
      </div>

    </div>
  )
}