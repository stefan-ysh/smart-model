"use client"

import { useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { OrbitControlsLike } from "./types"

export function SceneControls({
  controlsRef,
  autoRotate,
}: {
  controlsRef: React.RefObject<OrbitControlsLike | null>
  autoRotate: boolean
}) {
  const invalidate = useThree((state) => state.invalidate)

  return (
    <OrbitControls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={controlsRef as any}
      makeDefault
      minDistance={20}
      maxDistance={500}
      minPolarAngle={0}
      maxPolarAngle={Math.PI * 0.9}
      enableDamping={false}
      target={[0, 0, 0]}
      autoRotate={autoRotate}
      autoRotateSpeed={2}
      onChange={() => invalidate()}
    />
  )
}
