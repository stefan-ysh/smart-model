"use client"

import { useEffect } from "react"
import { useModelStore } from "@/lib/store"

export function useSceneNormalization() {
  const currentMode = useModelStore((state) => state.currentMode)
  const layerCoordsVersion = useModelStore((state) => state.parameters.layerCoordsVersion)
  const normalizeLayerPositions = useModelStore((state) => state.normalizeLayerPositions)

  useEffect(() => {
    if (["relief", "hollow", "image", "qr"].includes(currentMode) && layerCoordsVersion === 2) {
      normalizeLayerPositions()
    }
  }, [currentMode, layerCoordsVersion, normalizeLayerPositions])
}
