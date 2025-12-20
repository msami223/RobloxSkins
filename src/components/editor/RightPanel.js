'use client'

import React from 'react'
import { useEditor } from './EditorContext'

// Default color palette - Red (#FF0000) first to match default brushColor
const DEFAULT_COLORS = [
  '#FF0000',
  '#000000',
  '#FFFFFF', // Red (default), Black, White
  '#EF4444',
  '#F97316',
  '#FACC15',
  '#22C55E',
  '#06B6D4',
  '#3B82F6', // Row 1
  '#6366F1',
  '#A855F7',
  '#EC4899',
  '#F43F5E', // Row 2
  '#78716C',
  '#1E293B', // Grays
]

export default function RightPanel() {
  const {
    activeTab,
    brushColor,
    brushSize,
    isEraser,
    brushOpacity,
    brushSoftness,
    brushSpacing,
    brushStyle,
    updateBrush,
    activeLayerId,
    layers,
    fabricRefShirt,
    fabricRefPants,
    syncLayers,
  } = useEditor()

  // Handle layer deletion - delete selected object or last drawn object
  const handleDeleteLayer = () => {
    // Try to delete from shirt canvas first
    const shirtCanvas = fabricRefShirt.current
    const pantsCanvas = fabricRefPants.current

    // Check if there's an active object selected on either canvas
    let activeObject =
      shirtCanvas?.getActiveObject() || pantsCanvas?.getActiveObject()
    let targetCanvas = shirtCanvas?.getActiveObject()
      ? shirtCanvas
      : pantsCanvas?.getActiveObject()
        ? pantsCanvas
        : null

    // If no active selection, try to use activeLayerId
    if (!activeObject && activeLayerId) {
      const layer = layers.find((l) => l.id === activeLayerId)
      if (layer && layer.object) {
        activeObject = layer.object
        targetCanvas =
          layer.canvasTarget === 'shirt' ? shirtCanvas : pantsCanvas
      }
    }

    // If still no object, delete the most recent object from either canvas
    if (!activeObject) {
      const shirtObjs =
        shirtCanvas?.getObjects().filter((o) => !o.excludeFromExport) || []
      const pantsObjs =
        pantsCanvas?.getObjects().filter((o) => !o.excludeFromExport) || []

      // Delete from the canvas with more recent drawing (last in array)
      if (shirtObjs.length > 0) {
        activeObject = shirtObjs[shirtObjs.length - 1]
        targetCanvas = shirtCanvas
      } else if (pantsObjs.length > 0) {
        activeObject = pantsObjs[pantsObjs.length - 1]
        targetCanvas = pantsCanvas
      }
    }

    // Perform the deletion
    if (activeObject && targetCanvas) {
      targetCanvas.remove(activeObject)
      targetCanvas.discardActiveObject()
      targetCanvas.renderAll()
      syncLayers()
    }
  }

  if (activeTab === 'draw') {
    return (
      <aside style={panelStyle}>
        <div className="panel-content">
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <button
              onClick={() => {}}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <h2 style={headerStyle}>Draw</h2>
            {/* Current color preview */}
            <div
              style={{
                marginLeft: 'auto',
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                backgroundColor: brushColor,
                border: '2px solid var(--border)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            />
          </div>

          {/* Default Colors Palette */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Default colors</label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginTop: '10px',
              }}
            >
              {DEFAULT_COLORS.map((color, i) => (
                <div
                  key={i}
                  onClick={() => updateBrush({ color, eraser: false })}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: color,
                    cursor: 'pointer',
                    border:
                      brushColor.toUpperCase() === color.toUpperCase()
                        ? '2px solid var(--primary)'
                        : '2px solid var(--border)',
                    boxShadow:
                      brushColor.toUpperCase() === color.toUpperCase()
                        ? '0 0 0 2px rgba(99, 102, 241, 0.3)'
                        : 'none',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.transform = 'scale(1.1)')
                  }
                  onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                />
              ))}
              {/* Custom color picker */}
              <label
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background:
                    'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                  cursor: 'pointer',
                  border: '2px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) =>
                    updateBrush({ color: e.target.value, eraser: false })
                  }
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />
              </label>
            </div>
          </div>

          {/* Size Slider */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <label style={labelStyle}>Size</label>
              <span style={valueStyle}>{brushSize}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={brushSize}
              onChange={(e) => updateBrush({ size: parseInt(e.target.value) })}
              style={rangeStyle}
            />
          </div>

          {/* Opacity Slider */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <label style={labelStyle}>Opacity</label>
              <span style={valueStyle}>{brushOpacity}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={brushOpacity}
              onChange={(e) =>
                updateBrush({ opacity: parseInt(e.target.value) })
              }
              style={rangeStyle}
            />
          </div>

          {/* Softness Slider */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <label style={labelStyle}>Softness</label>
              <span style={valueStyle}>{brushSoftness}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={brushSoftness}
              onChange={(e) =>
                updateBrush({ softness: parseInt(e.target.value) })
              }
              style={rangeStyle}
            />
          </div>

          {/* Spacing Slider */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <label style={labelStyle}>Spacing</label>
              <span style={valueStyle}>{brushSpacing}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={brushSpacing}
              onChange={(e) =>
                updateBrush({ spacing: parseInt(e.target.value) })
              }
              style={rangeStyle}
            />
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginTop: '4px',
              }}
            >
              {brushSpacing > 20 ? 'Dotted stroke mode' : 'Continuous stroke'}
            </p>
          </div>

          {/* Brush / Eraser Toggle */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button
              onClick={() => updateBrush({ eraser: false })}
              style={{
                ...toolBtnStyle,
                flex: 1,
                backgroundColor: !isEraser
                  ? 'var(--primary)'
                  : 'var(--bg-workspace)',
                borderColor: !isEraser ? 'var(--primary)' : 'var(--border)',
                color: !isEraser ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              <i className="fa-solid fa-pencil"></i>
            </button>
            <button
              onClick={() => updateBrush({ eraser: true })}
              style={{
                ...toolBtnStyle,
                flex: 1,
                backgroundColor: isEraser
                  ? 'var(--primary)'
                  : 'var(--bg-workspace)',
                borderColor: isEraser ? 'var(--primary)' : 'var(--border)',
                color: isEraser ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              <i className="fa-solid fa-eraser"></i>
            </button>
          </div>

          {/* Additional Action Buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              marginBottom: '24px',
            }}
          >
            <button style={actionBtnStyle} title="Fill">
              <i className="fa-solid fa-fill-drip"></i>
            </button>
            <button style={actionBtnStyle} title="Color Picker">
              <i className="fa-solid fa-eye-dropper"></i>
            </button>
            <button style={actionBtnStyle} title="Select">
              <i className="fa-solid fa-arrow-pointer"></i>
            </button>
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDeleteLayer}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: 'transparent',
              border: '1px solid #ef444480',
              borderRadius: '8px',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#ef444420'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
            }}
          >
            <i className="fa-regular fa-trash-can"></i>
            Delete
          </button>
        </div>
      </aside>
    )
  }

  if (activeTab === 'upload' || activeTab === 'layers') {
    // Show layer properties if a layer is selected
    const activeLayer = layers.find((l) => l.id === activeLayerId)
    if (activeLayer) {
      return (
        <aside style={panelStyle}>
          <h2 style={headerStyle}>Layer Properties</h2>
          <div
            style={{
              padding: '10px',
              background: 'var(--bg-workspace)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px',
                color: 'var(--text-main)',
              }}
            >
              {activeLayer.type || activeLayer.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Selected
            </div>
          </div>
        </aside>
      )
    }
    return null
  }

  return null
}

const panelStyle = {
  width: '280px',
  backgroundColor: 'var(--bg-panel)',
  borderLeft: '1px solid var(--border)',
  padding: '20px',
  overflowY: 'auto',
}

const headerStyle = {
  margin: 0,
  color: 'var(--text-main)',
  fontSize: '1rem',
  fontWeight: 600,
}

const labelStyle = {
  fontSize: '0.85rem',
  fontWeight: 500,
  color: 'var(--text-muted)',
}

const valueStyle = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  backgroundColor: 'var(--bg-workspace)',
  padding: '2px 8px',
  borderRadius: '4px',
  minWidth: '36px',
  textAlign: 'center',
}

const rangeStyle = {
  width: '100%',
  accentColor: 'var(--primary)',
  height: '6px',
  borderRadius: '3px',
  cursor: 'pointer',
}

const toolBtnStyle = {
  padding: '12px',
  border: '1px solid',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  transition: 'all 0.2s',
}

const actionBtnStyle = {
  padding: '10px',
  backgroundColor: 'var(--bg-workspace)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  transition: 'all 0.2s',
}

const brushStyleBtnStyle = {
  width: '48px',
  height: '48px',
  backgroundColor: 'var(--bg-workspace)',
  border: '2px solid var(--border)',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
}
