"use client"

import { useMemo } from "react"
import { useModelStore, MaterialPreset } from "@/lib/store"
import * as THREE from "three"

// Material preset configurations
export const MATERIAL_CONFIGS: Record<MaterialPreset, {
  color?: string
  metalness: number
  roughness: number
  emissive?: string
  emissiveIntensity?: number
  transparent?: boolean
  opacity?: number
  envMapIntensity?: number
}> = {
  default: {
    metalness: 0.1,
    roughness: 0.3,
    envMapIntensity: 1,
  },
  gold: {
    color: '#ffd700',
    metalness: 1,
    roughness: 0.2,
    envMapIntensity: 1.5,
  },
  chrome: {
    color: '#e8e8e8',
    metalness: 1,
    roughness: 0.05,
    envMapIntensity: 2,
  },
  matte: {
    metalness: 0,
    roughness: 0.9,
    envMapIntensity: 0.5,
  },
  glass: {
    color: '#88ccff',
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.3,
    envMapIntensity: 1.5,
  },
  neon: {
    metalness: 0.3,
    roughness: 0.2,
    emissive: '#ff00ff',
    emissiveIntensity: 0.5,
    envMapIntensity: 1,
  },
}

export function useMaterialPreset() {
  const materialPreset = useModelStore(state => state.materialPreset)
  const plateColor = useModelStore(state => state.parameters.plateColor)
  const textColor = useModelStore(state => state.parameters.textColor)
  const roughness = useModelStore(state => state.parameters.roughness)
  const metalness = useModelStore(state => state.parameters.metalness)
  
  const getMaterialProps = useMemo(() => {
    return (isPlate: boolean = true) => {
      const config = MATERIAL_CONFIGS[materialPreset]
      const baseColor = isPlate ? plateColor : textColor
      
      if (materialPreset === 'default') {
        // Use user's custom settings
        return {
          color: baseColor,
          metalness,
          roughness,
          envMapIntensity: config.envMapIntensity,
        }
      }
      
      // Use preset settings, but keep user's color if preset doesn't override
      return {
        color: config.color || baseColor,
        metalness: config.metalness,
        roughness: config.roughness,
        emissive: config.emissive,
        emissiveIntensity: config.emissiveIntensity,
        transparent: config.transparent,
        opacity: config.opacity,
        envMapIntensity: config.envMapIntensity,
      }
    }
  }, [materialPreset, plateColor, textColor, roughness, metalness])
  
  return { materialPreset, getMaterialProps }
}

// Simple component wrapper for applying material presets
export function PresetMaterial({ 
  isPlate = true,
  ...props 
}: { 
  isPlate?: boolean
} & Partial<THREE.MeshStandardMaterialParameters>) {
  const { getMaterialProps } = useMaterialPreset()
  const materialProps = getMaterialProps(isPlate)
  
  return (
    <meshStandardMaterial 
      {...materialProps}
      {...props}
    />
  )
}
