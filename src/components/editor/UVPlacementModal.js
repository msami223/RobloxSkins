'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, Image as FabImage } from 'fabric'
import { useEditor } from './EditorContext'

// Constants matching CanvasArea dimensions
const CANVAS_WIDTH = 585
const CANVAS_HEIGHT = 559

export default function UVPlacementModal() {
  const {
    uvPlacementMode,
    setUvPlacementMode,
    uvImageData,
    setUvImageData,
    fabricRefShirt,
    fabricRefPants,
    syncLayers,
  } = useEditor()

  const canvasElRef = useRef(null)
  const fabricRef = useRef(null)
  const uploadedImageRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const isInitializedRef = useRef(false)

  // Initialize Fabric canvas when modal opens
  useEffect(() => {
    if (!uvPlacementMode || !uvImageData) return
    if (!canvasElRef.current) return
    if (isInitializedRef.current) return

    isInitializedRef.current = true
    setIsLoading(true)

    // Small delay to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      // Dispose any existing canvas
      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }

      // Create Fabric canvas for placement
      const canvas = new Canvas(canvasElRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#ffffff',
        selection: true,
        uniformScaling: false,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        skipTargetFind: false,
        interactive: true,
      })

      fabricRef.current = canvas

      // Load the wireframe template
      const templateUrl =
        uvPlacementMode === 'shirt'
          ? '/templates/roblox_background_frame.348e21bb.png'
          : '/templates/roblox_background_frame.348e21bc.png'

      // Load wireframe as background reference
      FabImage.fromURL(templateUrl)
        .then((wireframe) => {
          if (!fabricRef.current) return

          wireframe.scaleToWidth(CANVAS_WIDTH)
          wireframe.set({
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
            opacity: 0.7,
            excludeFromExport: true,
          })
          canvas.add(wireframe)
          canvas.sendObjectToBack(wireframe)

          // Load the user's uploaded image
          FabImage.fromURL(uvImageData)
            .then((img) => {
              if (!fabricRef.current) return

              // Scale down if too large
              const maxSize = 300
              if (img.width > maxSize || img.height > maxSize) {
                const scale = maxSize / Math.max(img.width, img.height)
                img.scale(scale)
              }

              img.set({
                left: CANVAS_WIDTH / 2,
                top: CANVAS_HEIGHT / 2,
                originX: 'center',
                originY: 'center',
                // Control styling
                cornerColor: '#4c83f0',
                cornerStyle: 'circle',
                borderColor: '#4c83f0',
                transparentCorners: false,
                cornerSize: 14,
                padding: 5,
                borderScaleFactor: 2,
                // Enable all controls
                hasControls: true,
                hasBorders: true,
                hasRotatingPoint: true,
                // Ensure transforms are NOT locked
                lockScalingX: false,
                lockScalingY: false,
                lockRotation: false,
                lockMovementX: false,
                lockMovementY: false,
                lockUniScaling: false,
                // Additional settings
                centeredScaling: false,
                centeredRotation: true,
                selectable: true,
                evented: true,
              })

              uploadedImageRef.current = img
              canvas.add(img)
              canvas.setActiveObject(img)
              img.setCoords()
              canvas.requestRenderAll()
              setIsLoading(false)
            })
            .catch((err) => {
              console.error('Failed to load uploaded image:', err)
              setIsLoading(false)
            })
        })
        .catch((err) => {
          console.error('Failed to load wireframe template:', err)
          setIsLoading(false)
        })
    }, 100)

    return () => {
      clearTimeout(initTimeout)
    }
  }, [uvPlacementMode, uvImageData])

  // Cleanup on close
  useEffect(() => {
    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [])

  // Handle Apply - transfer the image to the main canvas
  const handleApply = useCallback(() => {
    if (!uploadedImageRef.current) return

    const targetCanvas =
      uvPlacementMode === 'shirt'
        ? fabricRefShirt.current
        : fabricRefPants.current

    if (!targetCanvas) return

    // Clone the image with its current transform
    const imgObj = uploadedImageRef.current

    FabImage.fromURL(uvImageData).then((newImg) => {
      // Apply the same transforms
      newImg.set({
        left: imgObj.left,
        top: imgObj.top,
        scaleX: imgObj.scaleX,
        scaleY: imgObj.scaleY,
        angle: imgObj.angle,
        originX: imgObj.originX,
        originY: imgObj.originY,
        cornerColor: '#4c83f0',
        cornerStyle: 'circle',
        borderColor: '#4c83f0',
        transparentCorners: false,
      })

      targetCanvas.add(newImg)
      targetCanvas.setActiveObject(newImg)
      targetCanvas.renderAll()
      syncLayers()

      // Close the modal
      handleClose()
    })
  }, [uvPlacementMode, uvImageData, fabricRefShirt, fabricRefPants, syncLayers])

  // Handle Cancel
  const handleClose = useCallback(() => {
    if (fabricRef.current) {
      fabricRef.current.dispose()
      fabricRef.current = null
    }
    isInitializedRef.current = false
    uploadedImageRef.current = null
    setUvPlacementMode(null)
    setUvImageData(null)
  }, [setUvPlacementMode, setUvImageData])

  // Don't render if not active
  if (!uvPlacementMode || !uvImageData) return null

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Place Image on {uvPlacementMode === 'shirt' ? 'Shirt' : 'Pants'} UV
            Map
          </h2>
          <button onClick={handleClose} style={closeButtonStyle}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Instructions */}
        <p style={instructionStyle}>
          Drag, scale, and rotate your image. The wireframe shows UV regions
          that map to the 3D model.
        </p>

        {/* Canvas Container */}
        <div style={canvasContainerStyle}>
          {isLoading && (
            <div style={loadingOverlayStyle}>
              <i className="fa-solid fa-spinner fa-spin"></i> Loading...
            </div>
          )}
          <canvas
            ref={canvasElRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          />
        </div>

        {/* Help text */}
        <p style={helpTextStyle}>
          <i className="fa-solid fa-lightbulb"></i> Tip: Use corner handles to
          resize, rotate handle to rotate
        </p>

        {/* Actions */}
        <div style={actionsStyle}>
          <button onClick={handleClose} style={cancelButtonStyle}>
            Cancel
          </button>
          <button onClick={handleApply} style={applyButtonStyle}>
            <i className="fa-solid fa-check"></i> Apply to Canvas
          </button>
        </div>
      </div>
    </div>
  )
}

// Styles
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
}

const modalStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '24px',
  maxWidth: '680px',
  width: '95%',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
}

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  color: '#64748b',
  padding: '4px 8px',
  borderRadius: '4px',
}

const instructionStyle = {
  fontSize: '14px',
  color: '#64748b',
  marginBottom: '16px',
}

const canvasContainerStyle = {
  border: '2px solid #e2e8f0',
  borderRadius: '8px',
  overflow: 'visible', // Changed from 'hidden' to allow control handles to show
  backgroundColor: '#f8fafc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  position: 'relative',
}

const loadingOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(248, 250, 252, 0.9)',
  color: '#64748b',
  fontSize: '14px',
  zIndex: 10,
}

const helpTextStyle = {
  fontSize: '12px',
  color: '#94a3b8',
  marginTop: '12px',
  marginBottom: '16px',
}

const actionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
}

const cancelButtonStyle = {
  padding: '10px 20px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  color: '#64748b',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const applyButtonStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#4c83f0',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}
