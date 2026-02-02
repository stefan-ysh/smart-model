"use client"

import { useRef, useState, useCallback } from "react"
import { useThree, ThreeEvent } from "@react-three/fiber"
import { useModelStore } from "@/lib/store"
import * as THREE from "three"

interface DraggableLayerProps {
  layerId: string  // 'base' or textItem.id
  position: { x: number, y: number }
  rotation: number  // degrees
  onPositionChange: (x: number, y: number) => void
  onRotationChange: (rotation: number) => void
  children: React.ReactNode
}

export function DraggableLayer({
  layerId,
  position,
  rotation,
  onPositionChange,
  onRotationChange,
  children
}: DraggableLayerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera, gl, size } = useThree()
  
  const {
    selectedLayerId,
    setSelectedLayer,
    transformMode,
    isTransformEnabled
  } = useModelStore()
  
  const isSelected = selectedLayerId === layerId
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number, y: number, worldX: number, worldY: number } | null>(null)
  const rotationStartRef = useRef<{ angle: number, mouseAngle: number } | null>(null)
  
  // Convert screen coordinates to world XY plane coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    // Normalize screen coordinates
    const ndcX = (screenX / size.width) * 2 - 1
    const ndcY = -(screenY / size.height) * 2 + 1
    
    // Create ray from camera
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
    
    // Intersect with XY plane (z=0, but we're on XZ plane for flat models)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) // Y-up plane
    const intersection = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, intersection)
    
    return { x: intersection.x, z: intersection.z }
  }, [camera, size])
  
  // Handle click to select
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isTransformEnabled) return
    e.stopPropagation()
    setSelectedLayer(layerId)
  }
  
  // Handle pointer down for drag start
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!isSelected || !isTransformEnabled) return
    e.stopPropagation()
    
    setIsDragging(true)
    document.body.style.cursor = 'grabbing'
    
    // Capture the event
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.nativeEvent.pointerId)
    
    if (transformMode === 'translate') {
      const worldPos = screenToWorld(e.nativeEvent.clientX, e.nativeEvent.clientY)
      dragStartRef.current = {
        x: e.nativeEvent.clientX,
        y: e.nativeEvent.clientY,
        worldX: worldPos.x - position.x,
        worldY: worldPos.z - position.y
      }
    } else if (transformMode === 'rotate') {
      // Calculate mouse angle from center
      const rect = gl.domElement.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const mouseX = e.nativeEvent.clientX - rect.left - centerX
      const mouseY = e.nativeEvent.clientY - rect.top - centerY
      const mouseAngle = Math.atan2(mouseY, mouseX) * (180 / Math.PI)
      
      rotationStartRef.current = {
        angle: rotation,
        mouseAngle: mouseAngle
      }
    }
  }
  
  // Handle pointer move for dragging
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !isSelected) return
    
    if (transformMode === 'translate' && dragStartRef.current) {
      const worldPos = screenToWorld(e.nativeEvent.clientX, e.nativeEvent.clientY)
      const newX = worldPos.x - dragStartRef.current.worldX
      const newY = worldPos.z - dragStartRef.current.worldY
      onPositionChange(newX, newY)
    } else if (transformMode === 'rotate' && rotationStartRef.current) {
      const rect = gl.domElement.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const mouseX = e.nativeEvent.clientX - rect.left - centerX
      const mouseY = e.nativeEvent.clientY - rect.top - centerY
      const currentAngle = Math.atan2(mouseY, mouseX) * (180 / Math.PI)
      const deltaAngle = currentAngle - rotationStartRef.current.mouseAngle
      onRotationChange(rotationStartRef.current.angle + deltaAngle)
    }
  }
  
  // Handle pointer up to end drag
  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    document.body.style.cursor = 'auto'
    dragStartRef.current = null
    rotationStartRef.current = null
  }
  
  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {children}
      
      {/* Selection indicator - outline effect */}
      {isSelected && isTransformEnabled && (
        <mesh position={[0, 0.1, 0]}>
          <ringGeometry args={[15, 17, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
