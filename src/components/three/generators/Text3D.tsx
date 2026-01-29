"use client"

import { Text3D as DreiText3D, Center } from "@react-three/drei"
import { useModelStore } from "@/lib/store"
import { useLoader } from "@react-three/fiber"
import { FontLoader } from "three-stdlib"
import { useMemo } from "react"

// Filter text to only include characters that exist in the font
function filterSupportedChars(text: string, font: { data?: { glyphs?: Record<string, unknown> } }): string {
  if (!font?.data?.glyphs) return text
  
  const glyphs = font.data.glyphs
  return text.split('').filter(char => {
    // Space is always supported
    if (char === ' ') return true
    // Check if glyph exists in font
    return !!glyphs[char]
  }).join('')
}

export function Text3DGenerator() {
  const { parameters } = useModelStore()
  const { textContent, fontSize, thickness, fontUrl } = parameters
  
  // Load font to check available glyphs
  const font = useLoader(FontLoader, fontUrl)
  
  // Filter text to only include supported characters
  const safeText = useMemo(() => {
    return filterSupportedChars(textContent || "Text", font)
  }, [textContent, font])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, thickness / 2, 0]}>
      <Center>
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
          {safeText}
          <meshStandardMaterial color="#ec4899" roughness={0.3} />
        </DreiText3D>
      </Center>
    </group>
  )
}
