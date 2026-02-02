"use client"

import { HoleItem, useModelStore } from "@/lib/store"
import * as THREE from "three"
import { DraggableGizmo } from "@/components/three/DraggableGizmo"

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
  const holeLayerId = `hole-${hole.id}`
  const isSelected = useModelStore(state => state.selectedLayerId) === holeLayerId

  return (
    <DraggableGizmo
      id={holeLayerId}
      position={{ x: hole.x, y: hole.y }}
      baseThickness={baseThickness}
      onPositionChange={onPositionChange}
    >
      <mesh userData={{ noExport: true }}>
        <cylinderGeometry args={[hole.radius, hole.radius, 1, 32]} />
        <meshStandardMaterial 
          color={isSelected ? "#3b82f6" : "#ef4444"}
          transparent 
          opacity={0.6}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noExport: true }}>
          <ringGeometry args={[hole.radius + 1, hole.radius + 2, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </DraggableGizmo>
  )
}
