"use client"

import { Text3D as DreiText3D, Center } from "@react-three/drei"
import { useModelStore } from "@/lib/store"

export function Text3DGenerator() {
  const { parameters } = useModelStore()
  const { textContent, fontSize, thickness, fontUrl } = parameters

  return (
    <Center top>
      <DreiText3D
        font={fontUrl}
        size={fontSize}
        height={thickness}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02 * fontSize} 
        bevelSize={0.01 * fontSize}
        bevelOffset={0}
        bevelSegments={3}
      >
        {textContent || "Text"}
        <meshStandardMaterial color="#ec4899" roughness={0.3} />
      </DreiText3D>
    </Center>
  )
}
