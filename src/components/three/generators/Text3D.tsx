"use client"

import { Text3D as DreiText3D, Center } from "@react-three/drei"
import { useModelStore } from "@/lib/store"
import { useLoader } from "@react-three/fiber"
import { UniversalFontLoader } from "@/utils/fontLoaderUtils"
import { useMemo } from "react"
import { Font } from "three-stdlib"

// Filter text to only include characters that exist in the font
function filterSupportedChars(text: string, font: Font): string {
  const fontData = font as unknown as { data?: { glyphs?: Record<string, unknown> } }
  if (!fontData?.data?.glyphs) return text
  
  const glyphs = fontData.data.glyphs
  return text.split('').filter(char => {
    // Space is always supported
    if (char === ' ') return true
    // Check if glyph exists in font
    return !!glyphs[char]
  }).join('')
}

export function Text3DGenerator() {
  const { parameters } = useModelStore()
  const { textContent, fontSize, thickness, fontUrl, textPosition } = parameters
  
  // Load font using UniversalFontLoader - this is the ONLY load
  const font = useLoader(UniversalFontLoader, fontUrl) as Font
  
  // Filter text to only include supported characters
  const safeText = useMemo(() => {
    return filterSupportedChars(textContent || "Text", font)
  }, [textContent, font])

  return (
    <group
      rotation={[-Math.PI / 2, 0, 0]}
      position={[textPosition.x, thickness / 2, textPosition.y]}
    >
      <Center>
        <DreiText3D
          font={font.data as unknown as string}
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
