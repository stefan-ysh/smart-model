"use client"

import { useRef, useEffect } from "react"
import { useThree, ThreeEvent } from "@react-three/fiber"
import { TransformControls } from "@react-three/drei"
import { useModelStore } from "@/lib/store"
import * as THREE from "three"

interface DraggableGizmoProps {
  id: string
  position: { x: number; y: number }
  baseThickness: number
  yOffset?: number
  translationSnap?: number
  gizmoRotation?: [number, number, number]
  onPositionChange: (x: number, y: number) => void
  children: React.ReactNode
}

export function DraggableGizmo({
  id,
  position,
  baseThickness,
  yOffset = 0.5,
  translationSnap = 1,
  gizmoRotation,
  onPositionChange,
  children
}: DraggableGizmoProps) {
  const groupRef = useRef<THREE.Group>(null!)
  type DraggingChangedEvent = { value: boolean }
  type TransformControlsLike = {
    addEventListener: (type: string, listener: (event: DraggingChangedEvent) => void) => void
    removeEventListener: (type: string, listener: (event: DraggingChangedEvent) => void) => void
  }
  const transformRef = useRef<TransformControlsLike | null>(null)
  const { selectedLayerId, setSelectedLayer } = useModelStore()
  const isSelected = selectedLayerId === id
  const defaultControls = useThree((state) => state.controls) as unknown as { enabled: boolean } | null

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setSelectedLayer(id)
  }

  useEffect(() => {
    const controls = transformRef.current
    if (controls && defaultControls) {
      const callback = (event: DraggingChangedEvent) => {
        ;(defaultControls as { enabled: boolean }).enabled = !event.value
      }
      controls.addEventListener("dragging-changed", callback)
      return () => controls.removeEventListener("dragging-changed", callback)
    }
  }, [defaultControls])

  return (
    <>
      <group
        ref={groupRef}
        position={[position.x, baseThickness / 2 + yOffset, position.y]}
        onClick={handleClick}
        userData={{ noExport: true }}
      >
        {children}
      </group>

      {isSelected && (
        <TransformControls
          ref={transformRef}
          object={groupRef}
          mode="translate"
          showY={false}
          translationSnap={translationSnap}
          rotation={gizmoRotation}
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
