"use client"

import * as THREE from 'three'
import { useMemo, Suspense } from "react"
import { useLoader } from "@react-three/fiber"
import { FontLoader, TextGeometry } from "three-stdlib"
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg"
import { useModelStore, TextItem } from "@/lib/store"
import { createPlateGeometry } from "./plateShapes"
// Plate geometry imported from ./plateShapes

// Create text geometry with proper attributes
function createTextGeometry(
  font: any, 
  item: TextItem, 
  thickness: number
): THREE.BufferGeometry | null {
  try {
    const textGeo = new TextGeometry(item.content || ' ', {
      font: font,
      size: item.fontSize,
      height: thickness * 2,
      curveSegments: 4,
      bevelEnabled: false,
    })
    
    // Center the text first
    textGeo.computeBoundingBox()
    if (textGeo.boundingBox) {
      const centerX = (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x) / 2
      const centerY = (textGeo.boundingBox.max.y - textGeo.boundingBox.min.y) / 2
      textGeo.translate(-centerX, -centerY, -thickness)
    }
    
    // Apply rotation around Z axis
    if (item.rotation !== 0) {
      const rotationMatrix = new THREE.Matrix4().makeRotationZ((item.rotation * Math.PI) / 180)
      textGeo.applyMatrix4(rotationMatrix)
    }
    
    // Then apply position offset
    textGeo.translate(item.position.x, item.position.y, 0)
    
    textGeo.computeVertexNormals()
    
    // Add UV if missing
    if (!textGeo.attributes.uv) {
      const positions = textGeo.attributes.position
      const uvs = new Float32Array(positions.count * 2)
      textGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    }
    
    return textGeo
  } catch (e) {
    console.error('Error creating text geometry:', e)
    return null
  }
}

// Global cache for expensive CSG geometries
const geometryCache = new Map<string, THREE.BufferGeometry>()

// Replace standard FontLoader with our UniversalFontLoader
import { UniversalFontLoader, universalFontLoader } from "@/utils/fontLoaderUtils"

function StencilMesh() {
  const { parameters } = useModelStore()
  const { 
    size, baseThickness, textItems, 
    plateShape, plateWidth, plateHeight,
    platePosition, plateRotation, plateCornerRadius,
    plateColor, roughness, metalness
  } = parameters

  // Load all unique fonts needed
  // Memoize the URL array to prevent useLoader from seeing a new key every render
  // This fixes the "Cannot update a component while rendering" error
  // Extract dependency to simple variable for lint compliance
  const fontUrlsHash = JSON.stringify(textItems.map(item => item.fontUrl))
  const fontUrls = useMemo(() => {
    return [...new Set(textItems.map(item => item.fontUrl))].sort()
  }, [fontUrlsHash])

  // Use UniversalFontLoader to support both JSON and TTF
  const fonts = useLoader(UniversalFontLoader, fontUrls)
  const fontMap = Object.fromEntries(fontUrls.map((url, i) => [url, fonts[i]]))

  const resultGeometry = useMemo(() => {
    if (Object.keys(fontMap).length === 0) return null

    // Create a unique key based on parameters that affect the geometry
    const cacheKey = JSON.stringify({
      size, baseThickness, textItems, 
      plateShape, plateWidth, plateHeight,
      platePosition, plateRotation, plateCornerRadius
    })

    if (geometryCache.has(cacheKey)) {
      return geometryCache.get(cacheKey)!
    }

    try {
      // Create plate brush
      const plateGeo = createPlateGeometry(plateShape, size, plateWidth, plateHeight, baseThickness, plateCornerRadius)
      const plateBrush = new Brush(plateGeo)
      
      const evaluator = new Evaluator()
      evaluator.useGroups = false
      
      // Calculate inverse plate transform to keep text holes in world coordinates
      const plateRotRad = (plateRotation * Math.PI) / 180
      const cosR = Math.cos(-plateRotRad) // Inverse rotation
      const sinR = Math.sin(-plateRotRad)
      
      // Subtract each text from plate
      for (const item of textItems) {
        const font = fontMap[item.fontUrl]
        if (!font) continue
        
        // Transform text world position to plate-local position
        const localX = item.position.x - platePosition.x
        const localY = item.position.y + platePosition.y
        
        // Then rotate by inverse plate rotation
        const rotatedX = localX * cosR - localY * sinR
        const rotatedY = localX * sinR + localY * cosR
        
        // Create modified text item with local position
        const localItem = {
          ...item,
          position: { ...item.position, x: rotatedX, y: rotatedY },
          rotation: item.rotation - plateRotation
        }
        
        const textGeo = createTextGeometry(font, localItem, baseThickness)
        if (!textGeo) continue
        
        const textBrush = new Brush(textGeo)
        
        try {
          evaluator.evaluate(plateBrush, textBrush, SUBTRACTION, plateBrush)
        } catch (err) {
          console.warn('CSG subtraction failed for text:', item.content, err)
        }
        
        textGeo.dispose()
      }
      
      plateGeo.dispose()
      
      const result = plateBrush.geometry
      
      // Store in cache
      geometryCache.set(cacheKey, result)
      
      // Limit cache size to avoid memory leaks
      if (geometryCache.size > 20) {
        const firstKey = geometryCache.keys().next().value
        if (firstKey) {
          const oldGeo = geometryCache.get(firstKey)
          if (oldGeo) oldGeo.dispose()
          geometryCache.delete(firstKey)
        }
      }

      return result
    } catch (error) {
      console.error('CSG Error:', error)
      return createPlateGeometry(plateShape, size, plateWidth, plateHeight, baseThickness, plateCornerRadius)
    }
  }, [fontMap, size, baseThickness, textItems, plateShape, plateWidth, plateHeight, platePosition, plateRotation, plateCornerRadius])

  if (!resultGeometry) return null
  
  return (
    <group 
      rotation={[-Math.PI / 2, 0, (plateRotation * Math.PI) / 180]} 
      position={[platePosition.x, baseThickness / 2, platePosition.y]}
    >
      <mesh geometry={resultGeometry}>
        <meshStandardMaterial 
          color={plateColor} 
          roughness={roughness}
          metalness={metalness}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

export function StencilGenerator() {
  return (
    <Suspense fallback={
      <mesh>
        <boxGeometry args={[20, 20, 2]} />
        <meshStandardMaterial color="gray" transparent opacity={0.5} />
      </mesh>
    }>
      <StencilMesh />
    </Suspense>
  )
}
