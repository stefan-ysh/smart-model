"use client"

import { useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useModelStore } from "@/lib/store"
import { ArrayLayout } from "@/components/three/ArrayLayout"
import { BasicShape } from "@/components/three/generators/BasicShape"
import { Text3DGenerator } from "@/components/three/generators/Text3D"
import { ReliefGenerator } from "@/components/three/generators/Relief"
import { StencilGenerator } from "@/components/three/generators/Stencil"
import { QRCodeGenerator } from "@/components/three/generators/QRCode"
import { ImageReliefGenerator } from "@/components/three/generators/ImageRelief"
import { DraggableHole } from "@/components/three/DraggableHole"
import { DraggableText } from "@/components/three/DraggableText"
import { DraggableAnchor } from "@/components/three/DraggableAnchor"

function AnimatedModelWrapper({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const progressRef = useRef(0)
  const invalidate = useThree((state) => state.invalidate)

  useFrame((_, delta) => {
    if (progressRef.current < 1) {
      progressRef.current = Math.min(1, progressRef.current + delta * 2)
      invalidate()
    }

    if (groupRef.current) {
      const t = progressRef.current
      const elastic =
        t < 1
          ? 1 - Math.pow(2, -10 * t) * Math.cos((t * 10 - 0.75) * ((2 * Math.PI) / 3))
          : 1
      groupRef.current.scale.setScalar(elastic)
    }
  })

  return <group ref={groupRef} scale={0}>{children}</group>
}

export function ModelTransformGroup({ children }: { children: React.ReactNode }) {
  const currentMode = useModelStore((state) => state.currentMode)
  const groupRotation = useModelStore((state) => state.parameters.groupRotation)

  const isGrouped = ["relief", "hollow", "image", "qr"].includes(currentMode)
  if (!isGrouped) return <>{children}</>

  return <group rotation={[0, (groupRotation * Math.PI) / 180, 0]}>{children}</group>
}

export function CurrentModel() {
  const currentMode = useModelStore((state) => state.currentMode)
  const model = useMemo(() => {
    if (currentMode === "basic") return <BasicShape />
    if (currentMode === "text") return <Text3DGenerator />
    if (currentMode === "relief") return <ReliefGenerator />
    if (currentMode === "hollow") return <StencilGenerator />
    if (currentMode === "qr") return <QRCodeGenerator />
    if (currentMode === "image") return <ImageReliefGenerator />
    return null
  }, [currentMode])

  return (
    <AnimatedModelWrapper key={currentMode}>
      <ArrayLayout>
        <ModelTransformGroup>{model}</ModelTransformGroup>
      </ArrayLayout>
    </AnimatedModelWrapper>
  )
}

export function HoleMarkers() {
  const currentMode = useModelStore((state) => state.currentMode)
  const holes = useModelStore((state) => state.parameters.holes)
  const baseThickness = useModelStore((state) => state.parameters.baseThickness)
  const updateHole = useModelStore((state) => state.updateHole)

  if (!["hollow", "relief", "image", "qr"].includes(currentMode)) return null
  if (!holes || holes.length === 0) return null

  return (
    <group userData={{ noExport: true }}>
      {holes.map((hole) => (
        <DraggableHole
          key={hole.id}
          hole={hole}
          baseThickness={baseThickness}
          onPositionChange={(x, y) => updateHole(hole.id, { x, y })}
        />
      ))}
    </group>
  )
}

export function TextMarkers() {
  const currentMode = useModelStore((state) => state.currentMode)
  const textItems = useModelStore((state) => state.parameters.textItems)
  const baseThickness = useModelStore((state) => state.parameters.baseThickness)
  const plateRotation = useModelStore((state) => state.parameters.plateRotation)
  const updateTextItem = useModelStore((state) => state.updateTextItem)

  if (!["relief", "hollow"].includes(currentMode)) return null
  if (!textItems || textItems.length === 0) return null

  return (
    <group userData={{ noExport: true }}>
      {textItems.map((item) => (
        <DraggableText
          key={item.id}
          item={item}
          baseThickness={baseThickness}
          plateRotation={plateRotation}
          onPositionChange={(x, y) =>
            updateTextItem(item.id, { position: { x, y, z: item.position.z } })
          }
        />
      ))}
    </group>
  )
}

export function PlateMarker() {
  const currentMode = useModelStore((state) => state.currentMode)
  const platePosition = useModelStore((state) => state.parameters.platePosition)
  const baseThickness = useModelStore((state) => state.parameters.baseThickness)
  const updateParam = useModelStore((state) => state.updateParam)

  if (!["relief", "hollow", "image"].includes(currentMode)) return null

  return (
    <group userData={{ noExport: true }}>
      <DraggableAnchor
        id="base"
        position={platePosition}
        baseThickness={baseThickness}
        size={10}
        onPositionChange={(x, y) => updateParam("platePosition", { x, y })}
      />
    </group>
  )
}

export function TextPositionMarker() {
  const currentMode = useModelStore((state) => state.currentMode)
  const textPosition = useModelStore((state) => state.parameters.textPosition)
  const baseThickness = useModelStore((state) => state.parameters.baseThickness)
  const updateParam = useModelStore((state) => state.updateParam)

  if (!["image", "text"].includes(currentMode)) return null

  return (
    <group userData={{ noExport: true }}>
      <DraggableAnchor
        id="text-position"
        position={textPosition}
        baseThickness={baseThickness}
        size={8}
        onPositionChange={(x, y) => updateParam("textPosition", { x, y })}
      />
    </group>
  )
}
