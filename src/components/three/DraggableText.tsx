"use client"

import { useRef, useEffect } from "react"
import { useThree, ThreeEvent } from "@react-three/fiber"
import { TransformControls } from "@react-three/drei"
import { useModelStore, TextItem } from "@/lib/store"
import * as THREE from "three"

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
  const groupRef = useRef<THREE.Group>(null!)
  const transformRef = useRef<any>(null)
  
  const {
    selectedLayerId,
    setSelectedLayer
  } = useModelStore()
  
  const layerId = `text-${item.id}`
  const isSelected = selectedLayerId === layerId

  // Select on click
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setSelectedLayer(layerId)
  }

  const defaultControls = useThree((state) => state.controls) as unknown as { enabled: boolean } | null

  // Disable OrbitControls while dragging
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
  }, [defaultControls, isSelected])

  // Convert plate rotation to radians for local transform
  const plateRotRad = (plateRotation * Math.PI) / 180

  return (
    <>
      <group
        ref={groupRef}
        // Position relative to the plate center
        position={[item.position.x, baseThickness / 2 + 1, item.position.y]}
        onClick={handleClick}
        userData={{ noExport: true }}
      >
        {/* Visual hit box for selection and dragging */}
        <mesh userData={{ noExport: true }} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry
            args={[
              item.fontSize * (item.content?.length || 1) * 0.6 + 5,
              item.fontSize + 5
            ]}
          />
          <meshBasicMaterial
            color={isSelected ? "#3b82f6" : "#10b981"}
            transparent
            opacity={isSelected ? 0.3 : 0.12}
            side={THREE.DoubleSide}
            depthTest={false}
          />
        </mesh>
      </group>

      {isSelected && (
        <TransformControls
          ref={transformRef}
          object={groupRef}
          mode="translate"
          showY={false} // Text moves on the surface (X/Z plane)
          translationSnap={1}
          rotation={[0, plateRotRad, 0]} // Align gizmo with plate if needed, or keep world aligned
          onChange={() => {
             if (groupRef.current) {
                // Update global position
                onPositionChange(groupRef.current.position.x, groupRef.current.position.z)
             }
          }}
        />
      )}
    </>
  )
}
