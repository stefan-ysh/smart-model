"use client"

import * as THREE from 'three'
import { useMemo, Suspense } from "react"
import { useLoader } from "@react-three/fiber"
import { FontLoader, TextGeometry } from "three-stdlib"
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg"
import { useModelStore, PlateShape, TextItem } from "@/lib/store"

// Create plate geometry based on shape type
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
      const waveShape = new THREE.Shape()
      const w = size
      const h = size * 0.6
      waveShape.moveTo(-w/2, -h/2)
      waveShape.lineTo(w/2, -h/2)
      waveShape.bezierCurveTo(w/2 + 5, 0, w/2 + 5, 0, w/2, h/2)
      waveShape.lineTo(-w/2, h/2)
      waveShape.bezierCurveTo(-w/2 - 5, 0, -w/2 - 5, 0, -w/2, -h/2)
      return new THREE.ExtrudeGeometry(waveShape, { depth: thickness, bevelEnabled: false })
        .translate(0, 0, -thickness / 2)
    }
    
    case 'heart': {
      const heartShape = new THREE.Shape()
      const s = size / 4
      heartShape.moveTo(0, -s * 2)
      heartShape.bezierCurveTo(-s * 2, -s * 2, -s * 2, s, 0, s * 2)
      heartShape.bezierCurveTo(s * 2, s, s * 2, -s * 2, 0, -s * 2)
      return new THREE.ExtrudeGeometry(heartShape, { depth: thickness, bevelEnabled: false })
        .translate(0, 0, -thickness / 2)
    }
    
    case 'square':
    default:
      return new THREE.BoxGeometry(size, size, thickness)
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
    plateShape, plateWidth, plateHeight 
  } = parameters

  // Load all unique fonts needed
  const fontUrls = [...new Set(textItems.map(item => item.fontUrl))]
  const fonts = useLoader(FontLoader, fontUrls)
  const fontMap = Object.fromEntries(fontUrls.map((url, i) => [url, fonts[i]]))

  const resultGeometry = useMemo(() => {
    if (Object.keys(fontMap).length === 0) return null

    try {
      // 1. Create plate geometry
      const plateGeo = createPlateGeometry(plateShape, size, plateWidth, plateHeight, baseThickness)
      
      // Add UV to plate if missing
      if (!plateGeo.attributes.uv) {
        const positions = plateGeo.attributes.position
        const uvs = new Float32Array(positions.count * 2)
        plateGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
      }
      
      let plateBrush = new Brush(plateGeo)
      plateBrush.updateMatrixWorld()
      
      const evaluator = new Evaluator()
      
      // 2. Subtract each text item
      for (const item of textItems) {
        const font = fontMap[item.fontUrl]
        if (!font) continue
        
        const textGeo = createTextGeometry(font, item, baseThickness)
        if (!textGeo) continue
        
        const textBrush = new Brush(textGeo)
        textBrush.updateMatrixWorld()
        
        const result = evaluator.evaluate(plateBrush, textBrush, SUBTRACTION)
        plateBrush = result
        
        textGeo.dispose()
      }
      
      plateGeo.dispose()
      
      return plateBrush.geometry
    } catch (error) {
      console.error('CSG Error:', error)
      return createPlateGeometry(plateShape, size, plateWidth, plateHeight, baseThickness)
    }
  }, [fontMap, size, baseThickness, textItems, plateShape, plateWidth, plateHeight])

  if (!resultGeometry) return null

  return (
    <mesh geometry={resultGeometry}>
      <meshStandardMaterial 
        color="#0ea5e9" 
        roughness={0.3} 
        side={THREE.DoubleSide}
      />
    </mesh>
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
