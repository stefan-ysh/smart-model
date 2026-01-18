"use client"

import { useEffect, useCallback } from "react"
import { useThree } from "@react-three/fiber"
import { useModelStore } from "@/lib/store"

export function useScreenshot() {
  const { gl, scene, camera } = useThree()
  const screenshotTrigger = useModelStore(state => state.screenshotTrigger)
  
  const takeScreenshot = useCallback(() => {
    // Force a render
    gl.render(scene, camera)
    
    // Get the canvas data
    const dataURL = gl.domElement.toDataURL('image/png')
    
    // Create download link
    const link = document.createElement('a')
    link.download = `smart-model-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }, [gl, scene, camera])
  
  useEffect(() => {
    if (screenshotTrigger > 0) {
      takeScreenshot()
    }
  }, [screenshotTrigger, takeScreenshot])
  
  return { takeScreenshot }
}

// Component to use inside Canvas
export function ScreenshotHandler() {
  useScreenshot()
  return null
}
