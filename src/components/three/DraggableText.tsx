"use client"

import { useModelStore, TextItem } from "@/lib/store"
import * as THREE from "three"
import { DraggableGizmo } from "@/components/three/DraggableGizmo"
import { THEME_COLORS } from "@/lib/theme-colors"

interface DraggableTextProps {
  item: TextItem
  onPositionChange: (x: number, y: number) => void
  baseThickness: number
  plateRotation: number
}

export function DraggableText({
  item,
  onPositionChange,
  baseThickness,
  plateRotation
}: DraggableTextProps) {
  const layerId = `text-${item.id}`
  const isSelected = useModelStore(state => state.selectedLayerId) === layerId

  // Convert plate rotation to radians for local transform
  const plateRotRad = (plateRotation * Math.PI) / 180

  return (
    <DraggableGizmo
      id={layerId}
      position={{ x: item.position.x, y: item.position.y }}
      baseThickness={baseThickness}
      yOffset={1}
      gizmoRotation={[0, plateRotRad, 0]}
      onPositionChange={onPositionChange}
    >
      <mesh userData={{ noExport: true }} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry
          args={[
            item.fontSize * (item.content?.length || 1) * 0.6 + 5,
            item.fontSize + 5
          ]}
        />
        <meshBasicMaterial
          color={isSelected ? THEME_COLORS.primary : THEME_COLORS.accent}
          transparent
          opacity={isSelected ? 0.3 : 0.12}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
    </DraggableGizmo>
  )
}
