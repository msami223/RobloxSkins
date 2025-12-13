'use client'

import React from 'react'
import { useEditor } from './EditorContext'

export default function Sidebar() {
  const { activeTab, setActiveTab } = useEditor()

  const items = [
    { id: 'upload', icon: 'fa-cloud-arrow-up', label: 'Uploads' },
    { id: 'draw', icon: 'fa-paintbrush', label: 'Draw' },
    { id: 'layers', icon: 'fa-layer-group', label: 'Layers' },
  ]

  return (
    <nav style={{ 
        width: '80px', 
        backgroundColor: 'var(--bg-sidebar)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        paddingTop: '20px',
        borderRight: '1px solid var(--border)',
        zIndex: 10
    }}>
      {items.map(item => (
        <div 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '15px 0',
                width: '100%',
                cursor: 'pointer',
                color: activeTab === item.id ? '#818cf8' : '#6b7280',
                borderLeft: activeTab === item.id ? '3px solid #818cf8' : '3px solid transparent',
                backgroundColor: activeTab === item.id ? 'rgba(129, 140, 248, 0.1)' : 'transparent',
                transition: 'all 0.2s'
            }}
        >
            <i className={`fa-solid ${item.icon}`} style={{ fontSize: '1.2rem' }}></i>
            <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{item.label}</span>
        </div>
      ))}
      
      <div style={{ flex: 1 }}></div>

      <div className="nav-item" style={{ marginBottom: '20px', padding: '15px', color: '#6b7280', cursor: 'pointer', textAlign: 'center' }}>
          <i className="fa-solid fa-download" style={{ fontSize: '1.2rem', marginBottom: '5px' }}></i>
          <span style={{ display: 'block', fontSize: '0.75rem' }}>Export</span>
      </div>
    </nav>
  )
}
