'use client'

import React from 'react'
import { EditorProvider } from './editor/EditorContext'
import EditorLayout from './editor/EditorLayout'

export default function RobloxEditor() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  )
}
