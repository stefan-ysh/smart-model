"use client"

import { useRef, useState, useCallback } from "react"
import { useThree, ThreeEvent } from "@react-three/fiber"
import { useModelStore, HoleItem } from "@/lib/store"
import * as THREE from "three"

interface DraggableHoleProps {
  hole: HoleItem
  onPositionChange: (x: number, y: number) => void
  baseThickness: number
}

export function DraggableHole({
  hole,
  onPositionChange,
  baseThickness
}: DraggableHoleProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera, size } = useThree()
  
  const {
    selectedLayerId,
    setSelectedLayer,
    isTransformEnabled
  } = useModelStore()
  
  const holeLayerId = `hole-${hole.id}`
  const isSelected = selectedLayerId === holeLayerId
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ worldX: number, worldY: number } | null>(null)
  
  // Convert screen coordinates to world XZ plane coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const ndcX = (screenX / size.width) * 2 - 1
    const ndcY = -(screenY / size.height) * 2 + 1
    
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
    
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const intersection = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, intersection)
    
    return { x: intersection.x, z: intersection.z }
  }, [camera, size])
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isTransformEnabled) return
    e.stopPropagation()
    setSelectedLayer(holeLayerId)
  }
  
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!isSelected || !isTransformEnabled) return
    e.stopPropagation()
    
    setIsDragging(true)
    
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.nativeEvent.pointerId)
    
    const worldPos = screenToWorld(e.nativeEvent.clientX, e.nativeEvent.clientY)
    dragStartRef.current = {
      worldX: worldPos.x - hole.x,
      worldY: worldPos.z - hole.y
    }
  }
  
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !isSelected || !dragStartRef.current) return
    
    const worldPos = screenToWorld(e.nativeEvent.clientX, e.nativeEvent.clientY)
    const newX = worldPos.x - dragStartRef.current.worldX
    const newY = worldPos.z - dragStartRef.current.worldY
    onPositionChange(newX, newY)
  }
  
  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    dragStartRef.current = null
  }
  
  return (
    <group
      ref={groupRef}
      position={[hole.x, baseThickness / 2 + 0.5, hole.y]}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Hole marker - a visible cylinder */}
      <mesh>
        <cylinderGeometry args={[hole.radius, hole.radius, 1, 32]} />
        <meshStandardMaterial 
          color={isSelected ? "#3b82f6" : "#ef4444"} 
          transparent 
          opacity={0.6}
        />
      </mesh>
      
      {/* Selection ring */}
      {isSelected && isTransformEnabled && (
        <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[hole.radius + 1, hole.radius + 2, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
