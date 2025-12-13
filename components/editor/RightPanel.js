'use client'

import React from 'react'
import { useEditor } from './EditorContext'

export default function RightPanel() {
  const { 
    activeTab, 
    brushColor, updateBrush, brushSize, isEraser,
    activeLayer, layers, fabricRefShirt, fabricRefPants
  } = useEditor()

  if (activeTab === 'draw') {
    return (
      <aside style={panelStyle}>
        <div className="panel-content">
             <h2 style={headerStyle}>Draw Settings</h2>
             
             <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Color</label>
                <div style={colorPickerContainerStyle}>
                    <input 
                        type="color" 
                        value={brushColor} 
                        onChange={(e) => updateBrush(e.target.value, undefined, false)}
                        style={colorInputStyle}
                    />
                    <div style={{...colorPreviewStyle, backgroundColor: brushColor}}></div>
                    <span style={hexCodeStyle}>{brushColor.toUpperCase()}</span>
                </div>
             </div>

             <div style={{ marginBottom: '24px' }}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                    <label style={labelStyle}>Size</label>
                    <span style={{fontSize:'12px', color:'#64748b'}}>{brushSize}px</span>
                </div>
                <input 
                    type="range" 
                    min="1" max="50" 
                    value={brushSize} 
                    onChange={(e) => updateBrush(undefined, e.target.value, undefined)}
                    style={rangeStyle}
                />
             </div>

             <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => updateBrush(undefined, undefined, false)}
                  style={{ ...toolBtnStyle, backgroundColor: !isEraser ? '#eff6ff' : 'transparent', borderColor: !isEraser ? '#3b82f6' : '#e2e8f0', color: !isEraser ? '#3b82f6' : '#64748b' }}
                >
                   <i className="fa-solid fa-pencil"></i> Brush
                </button>
                <button 
                  onClick={() => updateBrush(undefined, undefined, true)}
                  style={{ ...toolBtnStyle, backgroundColor: isEraser ? '#eff6ff' : 'transparent', borderColor: isEraser ? '#3b82f6' : '#e2e8f0', color: isEraser ? '#3b82f6' : '#64748b' }}
                >
                   <i className="fa-solid fa-eraser"></i> Eraser
                </button>
             </div>
        </div>
      </aside>
    )
  }

  if (activeTab === 'upload' || activeTab === 'layers') {
      // Show Object Properties if a layer is selected
      if (activeLayer) {
          return (
            <aside style={panelStyle}>
                <h2 style={headerStyle}>Layer Properties</h2>
                <div style={{padding:'10px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:'14px', fontWeight:'500', marginBottom:'4px'}}>{activeLayer.type}</div>
                    <div style={{fontSize:'12px', color:'#94a3b8'}}>Selected</div>
                </div>
                {/* Future: Opacity, Scale, etc */}
            </aside>
          )
      }
      return null // Or empty state
  }

  return null
}

const panelStyle = {
    width: '280px',
    backgroundColor: 'var(--bg-panel)',
    borderLeft: '1px solid var(--border)',
    padding: '20px',
    overflowY: 'auto'
}

const headerStyle = { marginBottom: '20px', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600 }
const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }

const colorPickerContainerStyle = {
    display: 'flex', alignItems: 'center', gap: '12px', 
    marginTop:'8px', padding:'8px', border:'1px solid var(--border)', borderRadius:'8px'
}

const colorInputStyle = { width: '0', height: '0', opacity: 0, padding: 0, border: 0 }
const colorPreviewStyle = { width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border)', boxShadow:'0 1px 2px rgba(0,0,0,0.1)' }
const hexCodeStyle = { fontFamily: 'monospace', fontSize: '14px', color: 'var(--text-muted)' }

const rangeStyle = { width: '100%', accentColor: 'var(--primary)' }

const toolBtnStyle = {
    flex: 1,
    padding: '10px',
    border: '1px solid',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    fontWeight: 500,
    fontSize: '0.9rem'
}
