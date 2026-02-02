"use client"

import { useRef, useEffect, useState } from "react"
import { TransformControls } from "@react-three/drei"
import { useThree, ThreeEvent } from "@react-three/fiber"
import { useModelStore } from "@/lib/store"
import * as THREE from "three"

interface TransformableObjectProps {
  children: React.ReactNode
  onTransformChange?: (position: THREE.Vector3, rotation: THREE.Euler) => void
}

export function TransformableObject({ 
  children, 
  onTransformChange 
}: TransformableObjectProps) {
  const [group, setGroup] = useState<THREE.Group | null>(null)
  type TransformControlsLike = {
    addEventListener: (type: string, listener: (event?: { value?: boolean }) => void) => void
    removeEventListener: (type: string, listener: (event?: { value?: boolean }) => void) => void
  }
  const controlsRef = useRef<TransformControlsLike | null>(null)
  const { gl } = useThree()
  
  const { 
    transformMode, 
    isTransformEnabled, 
    setTransformEnabled 
  } = useModelStore()
  
  // Handle click to select
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setTransformEnabled(true)
  }
  
  // Track transform changes
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls || !group) return
    
    const handleChange = () => {
      if (group && onTransformChange) {
        onTransformChange(
          group.position.clone(),
          group.rotation.clone()
        )
      }
    }
    
    controls.addEventListener('change', handleChange)
    return () => controls.removeEventListener('change', handleChange)
  }, [onTransformChange, group])
  
  // Disable orbit controls while transforming
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    
    const handleDraggingChanged = (event?: { value?: boolean }) => {
      // Find orbit controls and disable during drag
      const orbitControls = (gl.domElement.parentElement as { __r3f?: { orbitControls?: { enabled: boolean } } })?.__r3f?.orbitControls
      if (orbitControls) {
        orbitControls.enabled = !(event?.value ?? false)
      }
    }
    
    controls.addEventListener('dragging-changed', handleDraggingChanged)
    return () => controls.removeEventListener('dragging-changed', handleDraggingChanged)
  }, [gl])

  return (
    <>
      <group 
        ref={setGroup} 
        onClick={handleClick}
      >
        {children}
      </group>
      
      {isTransformEnabled && group && (
        <TransformControls
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={controlsRef as any}
          object={group}
          mode={transformMode}
          size={0.8}
        />
      )}
    </>
  )
}
