"use client"

import { useModelStore } from "@/lib/store"
import * as THREE from "three"
import { DraggableGizmo } from "@/components/three/DraggableGizmo"
import { THEME_COLORS } from "@/lib/theme-colors"

interface DraggableAnchorProps {
  id: string
  position: { x: number; y: number }
  baseThickness: number
  size?: number
  onPositionChange: (x: number, y: number) => void
}

export function DraggableAnchor({
  id,
  position,
  baseThickness,
  size = 6,
  onPositionChange
}: DraggableAnchorProps) {
  const isSelected = useModelStore(state => state.selectedLayerId) === id

  return (
    <DraggableGizmo
      id={id}
      position={position}
      baseThickness={baseThickness}
      onPositionChange={onPositionChange}
    >
      <mesh userData={{ noExport: true }}>
        <sphereGeometry args={[Math.max(1, size * 0.12), 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? THEME_COLORS.primary : THEME_COLORS.accent}
          transparent
          opacity={isSelected ? 0.75 : 0.25}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noExport: true }}>
          <ringGeometry args={[size * 0.6, size * 0.8, 32]} />
          <meshBasicMaterial color={THEME_COLORS.primary} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </DraggableGizmo>
  )
}
