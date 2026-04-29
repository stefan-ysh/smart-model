"use client"

import { useRef, useEffect } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useModelStore } from "@/lib/store"
import { OrbitControlsLike } from "./types"

export function CameraController({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsLike | null>
}) {
  const { camera } = useThree()
  const viewPreset = useModelStore((state) => state.viewPreset)
  const setViewPreset = useModelStore((state) => state.setViewPreset)
  const resetViewTrigger = useModelStore((state) => state.resetViewTrigger)
  const focusTarget = useModelStore((state) => state.focusTarget)
  const setFocusTarget = useModelStore((state) => state.setFocusTarget)
  const focusAnimRef = useRef<{
    start: number
    duration: number
    fromTarget: THREE.Vector3
    toTarget: THREE.Vector3
    fromPos: THREE.Vector3
    toPos: THREE.Vector3
  } | null>(null)

  useEffect(() => {
    if (!viewPreset || !controlsRef.current) return

    const distance = 120
    const positions: Record<string, [number, number, number]> = {
      front: [0, 0, distance],
      back: [0, 0, -distance],
      left: [-distance, 0, 0],
      right: [distance, 0, 0],
      top: [0, distance, 0.01],
      bottom: [0, -distance, 0.01],
      iso: [distance * 0.7, distance * 0.7, distance * 0.7],
    }

    const pos = positions[viewPreset]
    if (pos) {
      camera.position.set(...pos)
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }

    setViewPreset(null)
  }, [viewPreset, camera, controlsRef, setViewPreset])

  useEffect(() => {
    if (resetViewTrigger > 0 && controlsRef.current) {
      camera.position.set(80, 80, 80)
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }, [resetViewTrigger, camera, controlsRef])

  useEffect(() => {
    if (!focusTarget || !controlsRef.current) return
    const target = controlsRef.current.target.clone()
    const offset = camera.position.clone().sub(target)
    const toTarget = new THREE.Vector3(focusTarget.x, focusTarget.y, focusTarget.z)
    const toPos = toTarget.clone().add(offset)
    focusAnimRef.current = {
      start: performance.now(),
      duration: 420,
      fromTarget: target,
      toTarget,
      fromPos: camera.position.clone(),
      toPos,
    }
    setFocusTarget(null)
  }, [focusTarget, camera, controlsRef, setFocusTarget])

  useFrame(() => {
    const anim = focusAnimRef.current
    if (!anim || !controlsRef.current) return
    const now = performance.now()
    const t = Math.min(1, (now - anim.start) / anim.duration)
    const ease = 1 - Math.pow(1 - t, 3)
    const nextTarget = anim.fromTarget.clone().lerp(anim.toTarget, ease)
    const nextPos = anim.fromPos.clone().lerp(anim.toPos, ease)
    controlsRef.current.target.copy(nextTarget)
    camera.position.copy(nextPos)
    controlsRef.current.update()
    if (t >= 1) focusAnimRef.current = null
  })

  return null
}
