'use client'

import React, { useState } from 'react'
import { useEditor } from './EditorContext'

export default function Sidebar() {
  const { activeTab, setActiveTab, downloadShirtTemplate, downloadPantsTemplate } = useEditor()
  const [showExportModal, setShowExportModal] = useState(false)

  const items = [
    { id: 'upload', icon: 'fa-cloud-arrow-up', label: 'Uploads' },
    { id: 'draw', icon: 'fa-paintbrush', label: 'Draw' },
    { id: 'layers', icon: 'fa-layer-group', label: 'Layers' },
  ]

  return (
    <>
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

        <div 
          onClick={() => setShowExportModal(true)}
          className="nav-item" 
          style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            color: '#6b7280', 
            cursor: 'pointer', 
            textAlign: 'center',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#818cf8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
        >
            <i className="fa-solid fa-download" style={{ fontSize: '1.2rem', marginBottom: '5px' }}></i>
            <span style={{ display: 'block', fontSize: '0.75rem' }}>Export</span>
        </div>
      </nav>
      
      {/* Export Modal */}
      {showExportModal && (
        <div 
          onClick={() => setShowExportModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderRadius: '12px',
              padding: '30px',
              minWidth: '400px',
              border: '1px solid var(--border)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 600 }}>
                Export Templates
              </h2>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--bg-workspace)'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
              Download your custom templates (585x559 PNG)
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  downloadShirtTemplate()
                  setShowExportModal(false)
                }}
                style={{
                  padding: '16px 24px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#6366f1'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--primary)'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                <i className="fa-solid fa-shirt"></i>
                Download Shirt Template
              </button>
              
              <button
                onClick={() => {
                  downloadPantsTemplate()
                  setShowExportModal(false)
                }}
                style={{
                  padding: '16px 24px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#6366f1'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--primary)'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                <i className="fa-solid fa-person"></i>
                Download Pants Template
              </button>
              
              <button
                onClick={() => {
                  downloadShirtTemplate()
                  downloadPantsTemplate()
                  setShowExportModal(false)
                }}
                style={{
                  padding: '16px 24px',
                  backgroundColor: 'var(--bg-workspace)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  marginTop: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-panel)'
                  e.target.style.borderColor = 'var(--primary)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-workspace)'
                  e.target.style.borderColor = 'var(--border)'
                }}
              >
                <i className="fa-solid fa-download"></i>
                Download Both Templates
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
