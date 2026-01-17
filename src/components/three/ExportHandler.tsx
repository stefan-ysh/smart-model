"use client"

import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import { STLExporter } from "three-stdlib"
import { useModelStore } from "@/lib/store"

export function ExportHandler() {
  const { scene } = useThree()
  const { parameters } = useModelStore()
  const { exportTrigger } = parameters

  useEffect(() => {
    if (exportTrigger === 0) return

    // Find the export target group
    const target = scene.getObjectByName('export-target')
    if (!target) {
        console.warn("Export target not found")
        return
    }

    const exporter = new STLExporter()
    // export binary STL
    const result = exporter.parse(target, { binary: true }) as DataView
    
    // Convert DataView to ArrayBuffer for Blob compatibility
    const arrayBuffer = result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `smart-model-${Date.now()}.stl`
    link.click()
    
  }, [exportTrigger, scene])

  return null
}
