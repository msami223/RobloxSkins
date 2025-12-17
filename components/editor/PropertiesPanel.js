'use client'

import React, { useRef } from 'react'
import { Image as FabImage } from 'fabric'
import { useEditor } from './EditorContext'

export default function PropertiesPanel() {
  const { 
    activeTab, 
    brushColor, updateBrush, brushSize, isEraser,
    activeLayerId, setActiveLayerId, layers, syncLayers, updateLayerOrder,
    fabricRefShirt, fabricRefPants,
    // UV Placement
    setUvPlacementMode, setUvImageData,
    // Torso Priority
    torsoPriority, setTorsoPriority, triggerTextureUpdate
  } = useEditor()

  // Upload Handler (existing - adds to center)
  const handleUpload = (e, canvasRef) => {
    const file = e.target.files[0]
    if (!file || !canvasRef.current) return

    const reader = new FileReader()
    reader.onload = (f) => {
      FabImage.fromURL(f.target.result).then(img => {
        if (img.width > 300) img.scaleToWidth(300)
        canvasRef.current.add(img)
        canvasRef.current.centerObject(img)
        canvasRef.current.setActiveObject(img)
        canvasRef.current.renderAll()
        syncLayers() // Trigger sync immediately
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // NEW: UV Placement Upload Handler
  const handleUVUpload = (e, target) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (f) => {
      setUvImageData(f.target.result)
      setUvPlacementMode(target) // 'shirt' or 'pants'
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Layer Actions
  const toggleVisibility = (layer) => {
    const canvas = layer.canvasTarget === 'shirt' ? fabricRefShirt.current : fabricRefPants.current
    if (!canvas || !layer.object) return
    layer.object.visible = !layer.object.visible
    canvas.renderAll()
    syncLayers()
  }

  const deleteLayer = (layer) => {
    const canvas = layer.canvasTarget === 'shirt' ? fabricRefShirt.current : fabricRefPants.current
    if (!canvas || !layer.object) return
    canvas.remove(layer.object)
    canvas.renderAll()
    syncLayers()
  }

  // Drag and Drop Logic
  const handleDragStart = (e, index, type) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ index, type }))
  }

  const handleDragOver = (e) => {
    e.preventDefault() // Necessary for drop
  }

  const handleDrop = (e, targetIndex, targetType) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('application/json'))
    if (data.type !== targetType) return // Prevent dropping shirt layer on pants

    const sourceIndex = data.index
    if (sourceIndex === targetIndex) return

    const canvas = targetType === 'shirt' ? fabricRefShirt.current : fabricRefPants.current
    if (!canvas) return

    const objects = canvas.getObjects().filter(o => !o.excludeFromExport)
    // The rendered list is reversed (top to bottom), so we need to map indices back to canvas indices
    // Visual Index 0 = Topmost (Canvas Index N-1)
    
    // Actually, let's keep it simple: we want to move the object at `sourceIndex` in our list to `targetIndex`.
    // Our list is `objects.reverse()`.
    
    // Let's get the actual object references
    const list = layers[targetType]
    const sourceLayer = list[sourceIndex]
    const targetLayer = list[targetIndex]
    
    // In Fabric: higher index = on top.
    // In UI: lower index (top of list) = on top.
    
    // We want to move sourceLayer.object to lie just before/after targetLayer.object?
    // Using moveTo:
    // If I drag Item A (index 0, top) to Item B (index 1, below):
    // I want A to be below B.
    
    // Easiest is to move the object in fabric stack.
    // Calculate new index.
    
    const objToMove = sourceLayer.object
    // targetLayer.object is the reference point.
    
    // If we move DOWN in the list (0 -> 1), we are moving it BEHIND the target.
    // If we move UP in the list (1 -> 0), we are moving it IN FRONT of the target.
    
    // Let's rely on Fabric's moveObjectTo.
    // We need the absolute index in Fabric's stack.
    const allObjects = canvas.getObjects()
    let destinationIndex = allObjects.indexOf(targetLayer.object)
    
    // If dragging down the list (visually), we want to be below the target?
    // Actually, in a layer list, dropping ONTO an item usually places it above or below.
    // Let's assume dropping "on" replaces position.
    
    canvas.moveObjectTo(objToMove, destinationIndex)
    canvas.renderAll()
    syncLayers()
  }

  // Render unified layer list (single array with canvasTarget)
  const renderUnifiedLayerList = () => {
    if (layers.length === 0) return <div style={{ padding: '10px', color: '#64748b', fontStyle: 'italic', fontSize: '0.8rem' }}>No layers</div>
    
    // Reverse so top-most layer (last in array) appears first in UI
    const displayLayers = [...layers].reverse()
    
    return displayLayers.map((layer, i) => (
        <div key={layer.id} 
             style={{
                 ...layerItemStyle,
                 borderColor: activeLayerId === layer.id ? 'var(--primary)' : 'var(--border)'
             }}
             onClick={() => {
                 const canvas = layer.canvasTarget === 'shirt' ? fabricRefShirt.current : fabricRefPants.current
                 if(canvas && layer.object) {
                     canvas.setActiveObject(layer.object)
                     canvas.renderAll()
                     setActiveLayerId(layer.id)
                 }
             }}
        >
            {/* Canvas Target Badge */}
            <div style={{ 
                marginRight: '8px', 
                padding: '2px 6px', 
                fontSize: '0.65rem', 
                fontWeight: 600, 
                borderRadius: '3px',
                backgroundColor: layer.canvasTarget === 'shirt' ? '#dbeafe' : '#fce7f3',
                color: layer.canvasTarget === 'shirt' ? '#1e40af' : '#be185d'
            }}>
                {layer.canvasTarget === 'shirt' ? 'S' : 'P'}
            </div>
            
            {/* Thumbnail */}
            <div style={{
                width: '32px', height: '32px', 
                backgroundColor: '#f1f5f9', borderRadius: '4px', 
                border: '1px solid #e2e8f0', marginRight: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
            }}>
                {layer.type === 'Sticker' && layer.object?.getSrc ? (
                    <img src={layer.object.getSrc()} alt="" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                ) : (
                    <i className="fa-solid fa-pencil" style={{fontSize: '10px', color: '#cbd5e1'}}></i>
                )}
            </div>

            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                {layer.name}
            </div>
            
            <div style={{ display: 'flex', gap: '4px' }}>
                {/* Reorder buttons */}
                <button onClick={(e) => { e.stopPropagation(); updateLayerOrder(layer.id, 'up') }} style={layerBtnStyle} title="Move up">
                    <i className="fa-solid fa-chevron-up" style={{fontSize: '10px'}}></i>
                </button>
                <button onClick={(e) => { e.stopPropagation(); updateLayerOrder(layer.id, 'down') }} style={layerBtnStyle} title="Move down">
                    <i className="fa-solid fa-chevron-down" style={{fontSize: '10px'}}></i>
                </button>
                <button onClick={(e) => { e.stopPropagation(); toggleVisibility(layer) }} style={layerBtnStyle}>
                    <i className={`fa-regular ${layer.visible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer) }} style={{...layerBtnStyle, color: '#ef4444'}}>
                    <i className="fa-regular fa-trash-can"></i>
                </button>
            </div>
        </div>
    ))
  }

  // Render Content based on Tab
  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="panel-content">
            <h2 style={headerStyle}>Uploads</h2>
            
            {/* Quick Upload (Centered) */}
            <h3 style={subHeaderStyle}>Quick Upload</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <label className="upload-btn" style={btnStyle}>
                <i className="fa-solid fa-shirt"></i> Upload to Shirt
                <input type="file" accept="image/*" hidden onChange={(e) => handleUpload(e, fabricRefShirt)} />
              </label>
              <label className="upload-btn" style={btnStyle}>
                <i className="fa-solid fa-socks"></i> Upload to Pants
                <input type="file" accept="image/*" hidden onChange={(e) => handleUpload(e, fabricRefPants)} />
              </label>
            </div>

            {/* UV Map Placement (Precise) */}
            <h3 style={subHeaderStyle}>Place on UV Map</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
              Position your image precisely on the UV wireframe
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="upload-btn" style={{...btnStyle, backgroundColor: '#f0f9ff', borderColor: '#4c83f0'}}>
                <i className="fa-solid fa-crosshairs"></i> Place on Shirt UV
                <input type="file" accept="image/*" hidden onChange={(e) => handleUVUpload(e, 'shirt')} />
              </label>
              <label className="upload-btn" style={{...btnStyle, backgroundColor: '#f0f9ff', borderColor: '#4c83f0'}}>
                <i className="fa-solid fa-crosshairs"></i> Place on Pants UV
                <input type="file" accept="image/*" hidden onChange={(e) => handleUVUpload(e, 'pants')} />
              </label>
            </div>

            <p style={{ marginTop: '20px', color: '#6b7280', fontSize: '0.85rem' }}>
              <strong>Quick Upload:</strong> Centers image on canvas.<br/>
              <strong>UV Map:</strong> Drag & position on wireframe.
            </p>
          </div>
        )
      case 'draw':
        return (
          <div className="panel-content">
             <h2 style={headerStyle}>Brushes</h2>
             <p style={{fontSize:'0.9rem', color:'var(--text-muted)', marginBottom:'20px'}}>Select a brush style</p>
             
             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                 {['Basic', 'Airbrush', 'Marker', 'Pixel'].map(b => (
                     <div key={b} style={{
                         padding:'15px', border:'1px solid var(--border)', borderRadius:'8px',
                         textAlign:'center', fontSize:'0.9rem', cursor:'pointer',
                         backgroundColor:'white', color:'var(--text-main)',
                         boxShadow:'0 1px 2px rgba(0,0,0,0.05)'
                     }}>
                         {b}
                     </div>
                 ))}
             </div>
          </div>
        )
      case 'layers':
        return (
          <div className="panel-content">
             <h2 style={headerStyle}>Layers</h2>
             
             {/* Torso Priority Indicator */}
             <div style={{ 
               marginBottom: '20px', 
               padding: '12px', 
               backgroundColor: '#f0f9ff', 
               borderRadius: '8px',
               border: '1px solid #bae6fd'
             }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', textTransform: 'uppercase' }}>
                   Torso Texture
                 </span>
                 <button 
                   onClick={() => {
                     const newPriority = torsoPriority === 'shirt' ? 'pants' : 'shirt'
                     setTorsoPriority(newPriority)
                     triggerTextureUpdate()
                   }}
                   style={{ 
                     padding: '4px 10px', 
                     fontSize: '0.75rem', 
                     backgroundColor: '#0ea5e9', 
                     color: 'white', 
                     border: 'none', 
                     borderRadius: '4px',
                     cursor: 'pointer'
                   }}
                 >
                   Swap
                 </button>
               </div>
               <div style={{ fontSize: '0.85rem', color: '#0c4a6e' }}>
                 Using: <strong>{torsoPriority === 'shirt' ? 'Shirt' : 'Pants'}</strong> texture
               </div>
             </div>
             
             {/* Unified Layer List */}
             <div style={{ marginBottom: '20px' }}>
                 <h3 style={subHeaderStyle}>All Layers (Top = Priority)</h3>
                 <div style={layerGroupStyle}>
                    {renderUnifiedLayerList()}
                 </div>
             </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <aside style={{ 
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-panel)', 
        borderRight: '1px solid var(--border)',
        padding: '20px',
        overflowY: 'auto'
    }}>
      {renderContent()}
    </aside>
  )
}

const headerStyle = { marginBottom: '20px', color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 600 }
const subHeaderStyle = { fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '5px' }
const layerGroupStyle = { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }

const btnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--bg-workspace)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: 500
}

const toolBtnStyle = {
    flex: 1,
    padding: '10px',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-main)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s'
}

const layerItemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 10px',
    backgroundColor: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '1px solid var(--border)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
}

const layerBtnStyle = {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px'
}
