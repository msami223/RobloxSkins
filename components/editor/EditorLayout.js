'use client'

import React, { useState } from 'react'
import Sidebar from './Sidebar'
import PropertiesPanel from './PropertiesPanel'
import CanvasArea from './CanvasArea'
import ThreePreview from './ThreePreview'
import UVPlacementModal from './UVPlacementModal'

// Toggle Arrow Button Component
function ToggleArrow({ isCollapsed, onClick, direction = 'left' }) {
  const getArrowIcon = () => {
    if (direction === 'left') {
      return isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'
    } else {
      return isCollapsed ? 'fa-chevron-left' : 'fa-chevron-right'
    }
  }

  return (
    <div
      onClick={onClick}
      style={{
        width: '20px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-panel)',
        borderLeft: direction === 'right' ? '1px solid var(--border)' : 'none',
        borderRight: direction === 'left' ? '1px solid var(--border)' : 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        flexShrink: 0
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-workspace)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-panel)'}
      title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
    >
      <i 
        className={`fa-solid ${getArrowIcon()}`} 
        style={{ 
          fontSize: '10px', 
          color: 'var(--text-muted)',
          transition: 'transform 0.2s'
        }}
      ></i>
    </div>
  )
}

// Collapsible Panel Wrapper Component
function CollapsiblePanel({ isCollapsed, maxWidth, children, side }) {
  return (
    <div 
      style={{ 
        width: isCollapsed ? 0 : maxWidth,
        minWidth: isCollapsed ? 0 : maxWidth,
        maxWidth: maxWidth,
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.3s ease, min-width 0.3s ease',
        flexShrink: 0,
        borderLeft: side === 'right' ? '1px solid var(--border)' : 'none',
        borderRight: side === 'left' ? '1px solid var(--border)' : 'none'
      }}
    >
      <div style={{ 
        width: maxWidth, 
        height: '100%',
        overflow: 'hidden'
      }}>
        {children}
      </div>
    </div>
  )
}

export default function EditorLayout() {
  // Panel collapsed states
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(false)
  const [isCanvasCollapsed, setIsCanvasCollapsed] = useState(false)

  // Max widths
  const PROPERTIES_MAX = 300
  const CANVAS_MAX = 400

  return (
    <div id="app" style={{ 
      display: 'flex', 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden', 
      backgroundColor: 'var(--bg-dark)', 
      color: 'var(--text-main)' 
    }}>
      
      {/* 1. Left Navigation */}
      <Sidebar />

      {/* 2. Tools & Properties Panel (Collapsible) */}
      <CollapsiblePanel isCollapsed={isPropertiesCollapsed} maxWidth={PROPERTIES_MAX} side="left">
        <PropertiesPanel />
      </CollapsiblePanel>

      {/* Toggle Arrow - Properties Panel */}
      <ToggleArrow 
        isCollapsed={isPropertiesCollapsed} 
        onClick={() => setIsPropertiesCollapsed(!isPropertiesCollapsed)}
        direction="left"
      />

      {/* 3. Main Workspace (3D Preview - Flexible) */}
      <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
        <ThreePreview />
      </div>

      {/* Toggle Arrow - Canvas Panel */}
      <ToggleArrow 
        isCollapsed={isCanvasCollapsed} 
        onClick={() => setIsCanvasCollapsed(!isCanvasCollapsed)}
        direction="right"
      />

      {/* 4. 2D Canvas (Right Panel - Collapsible) */}
      <CollapsiblePanel isCollapsed={isCanvasCollapsed} maxWidth={CANVAS_MAX} side="right">
        <CanvasArea />
      </CollapsiblePanel>

      {/* UV Placement Modal (renders when active) */}
      <UVPlacementModal />
      
    </div>
  )
}
