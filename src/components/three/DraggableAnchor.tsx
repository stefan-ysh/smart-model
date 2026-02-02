"use client"

import { useRef, useEffect } from "react"
import { useThree, ThreeEvent } from "@react-three/fiber"
import { TransformControls } from "@react-three/drei"
import { useModelStore } from "@/lib/store"
import * as THREE from "three"

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
  const groupRef = useRef<THREE.Group>(null!)
  const transformRef = useRef<any>(null)

  const { selectedLayerId, setSelectedLayer } = useModelStore()
  const isSelected = selectedLayerId === id

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setSelectedLayer(id)
  }

  const defaultControls = useThree((state) => state.controls) as unknown as { enabled: boolean } | null

  useEffect(() => {
    const controls = transformRef.current
    if (controls && defaultControls) {
      const callback = (event: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(defaultControls as any).enabled = !event.value
      }
      controls.addEventListener("dragging-changed", callback)
      return () => controls.removeEventListener("dragging-changed", callback)
    }
  }, [defaultControls])

  return (
    <>
      <group
        ref={groupRef}
        position={[position.x, baseThickness / 2 + 0.5, position.y]}
        onClick={handleClick}
        userData={{ noExport: true }}
      >
        <mesh userData={{ noExport: true }}>
          <sphereGeometry args={[Math.max(1, size * 0.12), 16, 16]} />
          <meshStandardMaterial
            color={isSelected ? "#3b82f6" : "#10b981"}
            transparent
            opacity={isSelected ? 0.75 : 0.25}
          />
        </mesh>
        {isSelected && (
          <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noExport: true }}>
            <ringGeometry args={[size * 0.6, size * 0.8, 32]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>

      {isSelected && (
        <TransformControls
          ref={transformRef}
          object={groupRef}
          mode="translate"
          showY={false}
          translationSnap={1}
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
