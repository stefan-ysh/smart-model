"use client"

import * as THREE from 'three'
import { useMemo, Suspense } from "react"
import { useLoader } from "@react-three/fiber"
import { FontLoader, TextGeometry } from "three-stdlib"
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg"
import { useModelStore, PlateShape, TextItem } from "@/lib/store"

// Create plate geometry based on shape type
function createPlateGeometry(shape: PlateShape, size: number, width: number, height: number, thickness: number, cornerRadius: number = 0): THREE.BufferGeometry {
  switch (shape) {
    case 'rectangle': {
      // Use rounded rectangle if cornerRadius > 0
      if (cornerRadius > 0) {
        const maxRadius = Math.min(width, height) / 2 - 1
        const r = Math.min(cornerRadius, maxRadius)
        const rectShape = new THREE.Shape()
        const w = width / 2
        const h = height / 2
        
        rectShape.moveTo(-w + r, -h)
        rectShape.lineTo(w - r, -h)
        rectShape.quadraticCurveTo(w, -h, w, -h + r)
        rectShape.lineTo(w, h - r)
        rectShape.quadraticCurveTo(w, h, w - r, h)
        rectShape.lineTo(-w + r, h)
        rectShape.quadraticCurveTo(-w, h, -w, h - r)
        rectShape.lineTo(-w, -h + r)
        rectShape.quadraticCurveTo(-w, -h, -w + r, -h)
        
        return new THREE.ExtrudeGeometry(rectShape, {
          depth: thickness,
          bevelEnabled: false,
        }).translate(0, 0, -thickness / 2)
      }
      return new THREE.BoxGeometry(width, height, thickness)
    }
    
    case 'circle':
      return new THREE.CylinderGeometry(size / 2, size / 2, thickness, 64)
        .rotateX(Math.PI / 2)
    
    case 'diamond': {
      const diamondShape = new THREE.Shape()
      const half = size / 2
      // Simple diamond shape - bevel will round the corners
      diamondShape.moveTo(0, half)
      diamondShape.lineTo(half, 0)
      diamondShape.lineTo(0, -half)
      diamondShape.lineTo(-half, 0)
      diamondShape.closePath()
      
      const bevelRadius = cornerRadius / 2
      return new THREE.ExtrudeGeometry(diamondShape, { 
        depth: thickness, 
        bevelEnabled: cornerRadius > 0,
        bevelThickness: bevelRadius,
        bevelSize: bevelRadius,
        bevelSegments: 4,
      }).translate(0, 0, -thickness / 2 - (cornerRadius > 0 ? bevelRadius : 0))
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
      return new THREE.ExtrudeGeometry(starShape, { 
        depth: thickness, 
        bevelEnabled: cornerRadius > 0,
        bevelThickness: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSize: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSegments: cornerRadius > 0 ? 3 : 1,
      }).translate(0, 0, -thickness / 2)
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
        bevelEnabled: cornerRadius > 0,
        bevelThickness: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSize: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSegments: cornerRadius > 0 ? 3 : 1,
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
        bevelEnabled: cornerRadius > 0,
        bevelThickness: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSize: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSegments: cornerRadius > 0 ? 3 : 1,
        curveSegments: 32
      }).translate(0, 0, -thickness / 2)
    }
    
    case 'square':
    default: {
      // Use rounded square if cornerRadius > 0
      if (cornerRadius > 0) {
        const maxRadius = size / 2 - 1
        const r = Math.min(cornerRadius, maxRadius)
        const rectShape = new THREE.Shape()
        const half = size / 2
        
        rectShape.moveTo(-half + r, -half)
        rectShape.lineTo(half - r, -half)
        rectShape.quadraticCurveTo(half, -half, half, -half + r)
        rectShape.lineTo(half, half - r)
        rectShape.quadraticCurveTo(half, half, half - r, half)
        rectShape.lineTo(-half + r, half)
        rectShape.quadraticCurveTo(-half, half, -half, half - r)
        rectShape.lineTo(-half, -half + r)
        rectShape.quadraticCurveTo(-half, -half, -half + r, -half)
        
        return new THREE.ExtrudeGeometry(rectShape, {
          depth: thickness,
          bevelEnabled: false,
        }).translate(0, 0, -thickness / 2)
      }
      return new THREE.BoxGeometry(size, size, thickness)
    }
  }
}

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

function StencilMesh() {
  const { parameters } = useModelStore()
  const { 
    size, baseThickness, textItems, 
    plateShape, plateWidth, plateHeight,
    platePosition, plateRotation, plateCornerRadius,
    plateColor, roughness, metalness
  } = parameters

  // Load all unique fonts needed
  const fontUrls = [...new Set(textItems.map(item => item.fontUrl))]
  const fonts = useLoader(FontLoader, fontUrls)
  const fontMap = Object.fromEntries(fontUrls.map((url, i) => [url, fonts[i]]))

  const resultGeometry = useMemo(() => {
    if (Object.keys(fontMap).length === 0) return null

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
        // First, offset by inverse plate position
        const localX = item.position.x - platePosition.x
        const localY = item.position.y - platePosition.y
        
        // Then rotate by inverse plate rotation
        const rotatedX = localX * cosR - localY * sinR
        const rotatedY = localX * sinR + localY * cosR
        
        // Create modified text item with local position
        const localItem = {
          ...item,
          position: { ...item.position, x: rotatedX, y: rotatedY },
          rotation: item.rotation - plateRotation // Also compensate text rotation
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
      
      return plateBrush.geometry
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
