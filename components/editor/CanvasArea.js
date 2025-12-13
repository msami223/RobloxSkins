'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Canvas, PencilBrush, Image as FabImage } from 'fabric'
import { useEditor } from './EditorContext'

export default function CanvasArea() {
  const { fabricRefShirt, fabricRefPants, triggerTextureUpdate, brushColor, brushSize, isEraser, activeTab, syncLayers } = useEditor()
  
  const containerRef = useRef(null)
  const isDragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const [zoom, setZoom] = useState(1)

  // Initialization of Fabric
  useEffect(() => {
    if (!fabricRefShirt.current) {
        const cShirt = new Canvas('canvas-shirt', { width: 585, height: 559, isDrawingMode: false })
        fabricRefShirt.current = cShirt
        
        // Load Template as Background (won't move with pan/zoom)
        FabImage.fromURL('/templates/roblox_background_frame.348e21bb.png').then(img => {
            img.scaleToWidth(585)
            cShirt.setBackgroundImage(img, cShirt.renderAll.bind(cShirt), {
                originX: 'left',
                originY: 'top'
            })
        })
        
        cShirt.on('after:render', triggerTextureUpdate)
    }

    if (!fabricRefPants.current) {
        const cPants = new Canvas('canvas-pants', { width: 585, height: 559, isDrawingMode: false })
        fabricRefPants.current = cPants

        // Load Template as Background (won't move with pan/zoom)
        FabImage.fromURL('/templates/roblox_background_frame.348e21bc.png').then(img => {
            img.scaleToWidth(585)
            cPants.setBackgroundImage(img, cPants.renderAll.bind(cPants), {
                originX: 'left',
                originY: 'top'
            })
        })

        cPants.on('after:render', triggerTextureUpdate)
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
  }, [])

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

  // Panning Logic
  const handleMouseDown = (e) => {
    if (e.target !== containerRef.current) return
    
    isDragging.current = true
    startPos.current = {
      x: e.pageX,
      y: e.pageY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop
    }
    containerRef.current.style.cursor = 'grabbing'
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current) return
    e.preventDefault()
    const x = e.pageX - startPos.current.x
    const y = e.pageY - startPos.current.y
    containerRef.current.scrollLeft = startPos.current.scrollLeft - x
    containerRef.current.scrollTop = startPos.current.scrollTop - y
  }

  const handleMouseUp = () => {
    isDragging.current = false
    if (containerRef.current) {
        containerRef.current.style.cursor = 'default'
    }
  }

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
        gap: '16px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
        {/* Header / Toggle */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width: '100%', marginBottom: '4px'}}>
            <div style={{fontSize:'12px', fontWeight:600, color:'#64748b', display:'flex', alignItems:'center', gap:'8px'}}>
                <span className="toggle" style={{width:'32px', height:'18px', background:'#cbd5e1', borderRadius:'10px', position:'relative', cursor:'pointer'}}>
                    <div style={{position:'absolute', left:'2px', top:'2px', height:'14px', width:'14px', background:'white', borderRadius:'50%'}}></div>
                </span>
                View Grid
            </div>
            
            <div style={{display: 'flex', gap: '8px'}}>
                 <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} style={{background:'#f1f5f9', border:'none', borderRadius:'4px', width:'24px', height:'24px', cursor:'pointer', color:'#475569'}}>-</button>
                 <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} style={{background:'#f1f5f9', border:'none', borderRadius:'4px', width:'24px', height:'24px', cursor:'pointer', color:'#475569'}}>+</button>
            </div>
        </div>

        {/* Pannable Container */}
        <div 
            ref={containerRef}
            className="pannable-container no-scrollbar"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                width: '300px',
                height: '400px',
                overflow: 'hidden',
                position: 'relative',
                background: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                borderRadius: '8px',
                border: '1px solid #f1f5f9',
                cursor: isDragging.current ? 'grabbing' : 'grab'
            }}
        >
            <div style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'top center',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '20px',
                padding: '20px',
                alignItems: 'center'
            }}>
                
                {/* Shirt Canvas Wrapper */}
                <div style={{ 
                    position: 'relative', 
                    width: 585, height: 559, 
                    backgroundColor: 'white', 
                    border: '2px dashed #94a3b8', 
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' 
                }}>
                    <div style={{ 
                        position: 'absolute', top: -25, left: 0, 
                        color: '#64748b', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em' 
                    }}>SHIRT (ARMS & TORSO)</div>
                    <canvas id="canvas-shirt" width="585" height="559"></canvas>
                </div>

                {/* Pants Canvas Wrapper */}
                <div style={{ 
                    position: 'relative', 
                    width: 585, height: 559, 
                    backgroundColor: 'white', 
                    border: '2px dashed #94a3b8',
                    borderRadius: '4px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' 
                }}>
                    <div style={{ 
                        position: 'absolute', top: -25, left: 0, 
                        color: '#64748b', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em' 
                    }}>PANTS (LEGS & TORSO)</div>
                    <canvas id="canvas-pants" width="585" height="559"></canvas>
                </div>

            </div>
        </div>

    </div>
  )
}
