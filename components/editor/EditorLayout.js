'use client'

import React from 'react'
import Sidebar from './Sidebar'
import PropertiesPanel from './PropertiesPanel'
import CanvasArea from './CanvasArea'
import ThreePreview from './ThreePreview'
import UVPlacementModal from './UVPlacementModal'

export default function EditorLayout() {
  return (
    <div id="app" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}>
      
      {/* 1. Left Navigation */}
      <Sidebar />

      {/* 2. Tools & Properties */}
      <PropertiesPanel />

      {/* 3. Main Workspace (Canvas) */}
      <CanvasArea />

      {/* 4. 3D Preview (Right Panel) */}
      <ThreePreview />

      {/* UV Placement Modal (renders when active) */}
      <UVPlacementModal />
      
    </div>
  )
}
