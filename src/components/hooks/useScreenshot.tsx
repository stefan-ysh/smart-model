"use client"

import { useEffect, useCallback } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useModelStore } from "@/lib/store"

export function useScreenshot() {
  const { gl, scene, camera } = useThree()
  const screenshotTrigger = useModelStore(state => state.screenshotTrigger)
  
  const takeScreenshot = useCallback(() => {
    const size = new THREE.Vector2()
    gl.getDrawingBufferSize(size)

    const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
      colorSpace: THREE.SRGBColorSpace,
    })
    const previousRenderTarget = gl.getRenderTarget()
    const pixelBuffer = new Uint8Array(size.x * size.y * 4)

    try {
      gl.setRenderTarget(renderTarget)
      gl.render(scene, camera)
      gl.readRenderTargetPixels(renderTarget, 0, 0, size.x, size.y, pixelBuffer)
    } finally {
      gl.setRenderTarget(previousRenderTarget)
      renderTarget.dispose()
    }

    const flipped = new Uint8ClampedArray(pixelBuffer.length)
    const rowLength = size.x * 4
    for (let y = 0; y < size.y; y++) {
      const srcOffset = y * rowLength
      const destOffset = (size.y - y - 1) * rowLength
      flipped.set(pixelBuffer.subarray(srcOffset, srcOffset + rowLength), destOffset)
    }

    const canvas = document.createElement("canvas")
    canvas.width = size.x
    canvas.height = size.y
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.putImageData(new ImageData(flipped, size.x, size.y), 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = `smart-model-${Date.now()}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    }, "image/png")
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
