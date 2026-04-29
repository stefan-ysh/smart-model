"use client"

import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { useShallow } from "zustand/react/shallow"
import { useModelStore } from "@/lib/store"

export function StoreInvalidator() {
  const invalidate = useThree((state) => state.invalidate)
  const invalidateDeps = useModelStore(
    useShallow((state) => ({
      currentMode: state.currentMode,
      isLoadingFont: state.isLoadingFont,
      transformMode: state.transformMode,
      isTransformEnabled: state.isTransformEnabled,
      selectedLayerId: state.selectedLayerId,
      focusTarget: state.focusTarget,
      viewPreset: state.viewPreset,
      resetViewTrigger: state.resetViewTrigger,
      showGrid: state.showGrid,
      wireframeMode: state.wireframeMode,
      materialPreset: state.materialPreset,
      bloomEnabled: state.bloomEnabled,
      showShadows: state.parameters.showShadows,
    }))
  )

  useEffect(() => {
    invalidate()
  }, [invalidate, invalidateDeps])

  return null
}
