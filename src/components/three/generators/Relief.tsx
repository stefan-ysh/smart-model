"use client"

import * as THREE from 'three'
import { useMemo, Suspense } from "react"
import { useLoader } from "@react-three/fiber"
import { FontLoader, TextGeometry } from "three-stdlib"
import { useModelStore, PlateShape, TextItem } from "@/lib/store"

// Create plate geometry based on shape type (same as Stencil)
function createPlateGeometry(shape: PlateShape, size: number, width: number, height: number, thickness: number): THREE.BufferGeometry {
  switch (shape) {
    case 'rectangle':
      return new THREE.BoxGeometry(width, height, thickness)
    
    case 'circle':
      return new THREE.CylinderGeometry(size / 2, size / 2, thickness, 64)
        .rotateX(Math.PI / 2)
    
    case 'diamond': {
      const diamondShape = new THREE.Shape()
      const half = size / 2
      diamondShape.moveTo(0, half)
      diamondShape.lineTo(half, 0)
      diamondShape.lineTo(0, -half)
      diamondShape.lineTo(-half, 0)
      diamondShape.closePath()
      return new THREE.ExtrudeGeometry(diamondShape, { depth: thickness, bevelEnabled: false })
        .translate(0, 0, -thickness / 2)
    }
    
    case 'star': {
      const starShape = new THREE.Shape()
      const outerRadius = size / 2
      const innerRadius = size / 4
      const points = 5
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2
        const radius = i % 2 === 0 ? outerRadius : innerRadius
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        if (i === 0) starShape.moveTo(x, y)
        else starShape.lineTo(x, y)
      }
      starShape.closePath()
      return new THREE.ExtrudeGeometry(starShape, { depth: thickness, bevelEnabled: false })
        .translate(0, 0, -thickness / 2)
    }
    
    case 'wave': {
      // Smooth rounded rectangle with wavy sides
      const waveShape = new THREE.Shape()
      const w = size * 0.8
      const h = size * 0.5
      const waveAmp = size * 0.08 // Wave amplitude
      
      // Start bottom-left, go clockwise
      waveShape.moveTo(-w/2, -h/2)
      
      // Bottom edge (straight)
      waveShape.lineTo(w/2, -h/2)
      
      // Right edge (wavy)
      waveShape.bezierCurveTo(
        w/2 + waveAmp, -h/4,
        w/2 - waveAmp, h/4,
        w/2, h/2
      )
      
      // Top edge (straight)
      waveShape.lineTo(-w/2, h/2)
      
      // Left edge (wavy - mirrored)
      waveShape.bezierCurveTo(
        -w/2 - waveAmp, h/4,
        -w/2 + waveAmp, -h/4,
        -w/2, -h/2
      )
      
      return new THREE.ExtrudeGeometry(waveShape, { 
        depth: thickness, 
        bevelEnabled: false,
        curveSegments: 32
      }).translate(0, 0, -thickness / 2)
    }
    
    case 'heart': {
      // Proper heart shape with smooth curves
      const heartShape = new THREE.Shape()
      const s = size / 2
      
      // Start at bottom point
      heartShape.moveTo(0, -s * 0.7)
      
      // Left curve going up
      heartShape.bezierCurveTo(
        -s * 0.1, -s * 0.4,  // control 1
        -s * 0.7, -s * 0.4,  // control 2
        -s * 0.7, s * 0.1    // end point (left bump bottom)
      )
      
      // Left top bump
      heartShape.bezierCurveTo(
        -s * 0.7, s * 0.5,   // control 1
        -s * 0.35, s * 0.7,  // control 2
        0, s * 0.4           // top center dip
      )
      
      // Right top bump (mirror)
      heartShape.bezierCurveTo(
        s * 0.35, s * 0.7,   // control 1
        s * 0.7, s * 0.5,    // control 2
        s * 0.7, s * 0.1     // end point (right bump bottom)
      )
      
      // Right curve going down
      heartShape.bezierCurveTo(
        s * 0.7, -s * 0.4,   // control 1
        s * 0.1, -s * 0.4,   // control 2
        0, -s * 0.7          // back to bottom point
      )
      
      return new THREE.ExtrudeGeometry(heartShape, { 
        depth: thickness, 
        bevelEnabled: false,
        curveSegments: 32
      }).translate(0, 0, -thickness / 2)
    }
    
    case 'square':
    default:
      return new THREE.BoxGeometry(size, size, thickness)
  }
}

function ReliefMesh() {
  const { parameters } = useModelStore()
  const { 
    size, baseThickness, textItems, reliefHeight,
    plateShape, plateWidth, plateHeight 
  } = parameters

  // Load all unique fonts needed
  const fontUrls = [...new Set(textItems.map(item => item.fontUrl))]
  const fonts = useLoader(FontLoader, fontUrls)
  const fontMap = Object.fromEntries(fontUrls.map((url, i) => [url, fonts[i]]))

  // Create text meshes
  const textMeshes = useMemo(() => {
    if (Object.keys(fontMap).length === 0) return []

    return textItems.map((item) => {
      const font = fontMap[item.fontUrl]
      if (!font) return null

      try {
        const textGeo = new TextGeometry(item.content || ' ', {
          font: font,
          size: item.fontSize,
          height: reliefHeight,
          curveSegments: 8,
          bevelEnabled: false,
        })

        // Center the text
        textGeo.computeBoundingBox()
        if (textGeo.boundingBox) {
          const centerX = (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x) / 2
          const centerY = (textGeo.boundingBox.max.y - textGeo.boundingBox.min.y) / 2
          textGeo.translate(-centerX, -centerY, 0)
        }

        return {
          geometry: textGeo,
          position: item.position,
          rotation: item.rotation,
          id: item.id
        }
      } catch (e) {
        console.error('Error creating text geometry:', e)
        return null
      }
    }).filter(Boolean)
  }, [fontMap, textItems, reliefHeight])

  // Create plate geometry
  const plateGeo = useMemo(() => {
    return createPlateGeometry(plateShape, size, plateWidth, plateHeight, baseThickness)
  }, [plateShape, size, plateWidth, plateHeight, baseThickness])

  return (
    <group>
      {/* Base Plate */}
      <mesh geometry={plateGeo}>
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>

      {/* Embossed Text Items */}
      {textMeshes.map((item: any) => (
        <group 
          key={item.id}
          position={[item.position.x, item.position.y, baseThickness / 2]}
          rotation={[0, 0, (item.rotation * Math.PI) / 180]}
        >
          <mesh geometry={item.geometry}>
            <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function ReliefGenerator() {
  return (
    <Suspense fallback={
      <mesh>
        <boxGeometry args={[20, 20, 2]} />
        <meshStandardMaterial color="gray" transparent opacity={0.5} />
      </mesh>
    }>
      <ReliefMesh />
    </Suspense>
  )
}
