import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { FontLoader, TextGeometry } from 'three-stdlib'
import { useModelStore } from '@/lib/store'
import { useMemo } from 'react'
import { useDebounce } from '@/components/hooks/useDebounce'

export function SafeTextGeometry({ debounced = false }: { debounced?: boolean }) {
  const { parameters } = useModelStore()
  
  const rawTextContent = parameters.textContent
  const rawFontSize = parameters.fontSize
  const rawBaseThickness = parameters.baseThickness
  const rawFontUrl = parameters.fontUrl
  const rawPosition = parameters.textPosition

  const textContent = useDebounce(rawTextContent, debounced ? 500 : 0)
  const fontSize = useDebounce(rawFontSize, debounced ? 500 : 0)
  const baseThickness = useDebounce(rawBaseThickness, debounced ? 500 : 0)
  const fontUrl = useDebounce(rawFontUrl, debounced ? 500 : 0)
  const textPosition = useDebounce(rawPosition, debounced ? 500 : 0)

  // Use useLoader for caching and suspense support
  const font = useLoader(FontLoader, fontUrl)

  const geometry = useMemo(() => {
    if (!font) return null
    try {
        const geo = new TextGeometry(textContent || ' ', {
          font: font,
          size: fontSize,
          height: baseThickness * 3, 
          curveSegments: 2, // Minimum segments for performance
          bevelEnabled: false,
        })
        
        geo.center()
        
        // Skip mergeVertices for now as it causes issues with some environments/versions
        // Just ensure normals are there
        geo.computeVertexNormals()
        
        // Apply position offset manually
        geo.translate(textPosition.x, textPosition.y, 0) // Centered on Z is handled by Subtraction usually, but let's be explicit
        // The plate is usually at 0,0,0. BaseThickness/2 up, BaseThickness/2 down.
        // We want to punch through.
        
        return geo
    } catch (e) {
        console.error("Error creating SafeTextGeometry:", e)
        // Return a dummy fallback geometry
        return new THREE.BoxGeometry(1, 1, 1)
    }
  }, [font, textContent, fontSize, baseThickness, textPosition])

  if (!geometry) {
      // Return a dummy invisible mesh to prevent CSG errors
      return (
          <mesh>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
          </mesh>
      )
  }

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="red" />
    </mesh>
  )
}
