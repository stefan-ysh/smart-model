"use client"

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { useModelStore } from "@/lib/store"

export function SceneEffects() {
  const bloomEnabled = useModelStore((state) => state.bloomEnabled)

  if (!bloomEnabled) return null

  return (
    <EffectComposer enabled={true}>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.1} darkness={0.5} />
    </EffectComposer>
  )
}
