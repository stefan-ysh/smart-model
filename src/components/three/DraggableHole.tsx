"use client"

import { useRef, useEffect } from "react"
import { useThree, ThreeEvent } from "@react-three/fiber"
import { TransformControls } from "@react-three/drei"
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
  const groupRef = useRef<THREE.Group>(null!)
  
  const {
    selectedLayerId,
    setSelectedLayer
  } = useModelStore()
  
  const holeLayerId = `hole-${hole.id}`
  const isSelected = selectedLayerId === holeLayerId

  // Select on click
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setSelectedLayer(holeLayerId)
  }

  const transformRef = useRef<any>(null)
  const defaultControls = useThree((state) => state.controls) as unknown as { enabled: boolean } | null

  useEffect(() => {
    const controls = transformRef.current
    if (controls && defaultControls) {
       const callback = (event: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (defaultControls as any).enabled = !event.value
       }
       controls.addEventListener('dragging-changed', callback)
       return () => controls.removeEventListener('dragging-changed', callback)
    }
  }, [defaultControls])

  return (
    <>
      <group
        ref={groupRef}
        position={[hole.x, baseThickness / 2 + 0.5, hole.y]}
        onClick={handleClick}
        userData={{ noExport: true }}
      >
        {/* Hole marker - a visible cylinder */}
        <mesh userData={{ noExport: true }}>
          <cylinderGeometry args={[hole.radius, hole.radius, 1, 32]} />
          <meshStandardMaterial 
            color={isSelected ? "#3b82f6" : "#ef4444"} 
            transparent 
            opacity={0.6}
          />
        </mesh>
        
        {/* Selection ring */}
        {isSelected && (
          <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noExport: true }}>
            <ringGeometry args={[hole.radius + 1, hole.radius + 2, 32]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>

      {isSelected && (
        <TransformControls
          ref={transformRef}
          object={groupRef}
          mode="translate"
          showY={false} // Lock Y axis
          translationSnap={1} // Optional: snap to 1mm
          onChange={() => {
             if (groupRef.current) {
                onPositionChange(groupRef.current.position.x, groupRef.current.position.z)
             }
          }}
        />
      )}
    </>
  )
}
