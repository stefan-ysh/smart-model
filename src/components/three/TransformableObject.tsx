"use client"

import { useRef, useEffect, useState } from "react"
import { TransformControls } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
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
  const controlsRef = useRef<any>(null)
  const { gl, camera } = useThree()
  
  const { 
    transformMode, 
    isTransformEnabled, 
    setTransformEnabled 
  } = useModelStore()
  
  // Handle click to select
  const handleClick = (e: any) => {
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
    
    const handleDraggingChanged = (event: any) => {
      // Find orbit controls and disable during drag
      const orbitControls = (gl.domElement.parentElement as any)?.__r3f?.orbitControls
      if (orbitControls) {
        orbitControls.enabled = !event.value
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
          ref={controlsRef}
          object={group}
          mode={transformMode}
          size={0.8}
        />
      )}
    </>
  )
}
