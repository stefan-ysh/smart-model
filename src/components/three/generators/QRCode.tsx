import { useMemo } from "react"
import { useModelStore } from "@/lib/store"
import * as THREE from "three"
import QRCode from "qrcode"
import { mergeBufferGeometries } from "three-stdlib"

// Helper to create a rounded rectangle shape
function createRoundedRectShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2
  const w = width
  const h = height
  
  // Clamp radius
  const r = Math.min(radius, Math.min(w, h) / 2)
  
  // CCW Winding for Outer Shape
  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  
  return shape
}

export function QRCodeGenerator() {
  const { parameters } = useModelStore()
  const { 
    qrText, qrSize, qrDepth, qrInvert, qrMargin, qrIsThrough,
    baseThickness, plateColor, roughness, metalness, plateCornerRadius
  } = parameters

  // Generate QR Matrix
  const qrMatrix = useMemo(() => {
    if (!qrText) return []

    const qr = QRCode.create(qrText, { 
      errorCorrectionLevel: 'M', 
      margin: 0 
    } as any)
    
    const modules = qr.modules.data
    const size = qr.modules.size
    
    // Convert flat Uint8Array to 2D array
    const matrix: number[][] = []
    for (let i = 0; i < size; i++) {
        const row: number[] = []
        for (let j = 0; j < size; j++) {
            row.push(modules[i * size + j])
        }
        matrix.push(row)
    }
    return matrix

  }, [qrText]) 

  const geometry = useMemo(() => {
    if (qrMatrix.length === 0) return null

    const moduleCount = qrMatrix.length
    const blockSize = qrSize / moduleCount
    const halfSize = qrSize / 2
    
    // Overall plate dimensions (Content + Padding)
    // qrMargin parameter is now treated as "Physical Padding (mm)"
    const padding = Math.max(0, qrMargin)
    const plateSize = qrSize + padding * 2
    
    // 1. Create Base Geometry
    // Needs base if (Relief) OR (Hollow AND NOT Through)
    const needsBase = !qrInvert || !qrIsThrough
    
    let baseGeometry: THREE.BufferGeometry | null = null
    
    if (needsBase) {
        const shape = createRoundedRectShape(plateSize, plateSize, plateCornerRadius)
        const extrudeSettings = {
            depth: baseThickness,
            bevelEnabled: false
        }
        baseGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    }
    
    // 2. Create QR Layer (Blocks)
    const blocks: THREE.BufferGeometry[] = []
    
    // Layer Z pos and Thickness
    // If Hollow+Through: Starts at 0, thickness=baseThickness (to fill the void)
    // If Hollow+Indent: Starts at baseThickness, thickness=qrDepth (to add on top)
    // If Relief: Starts at baseThickness, thickness=qrDepth
    
    const layerThickness = (qrInvert && qrIsThrough) ? baseThickness : qrDepth
    const zStart = (qrInvert && qrIsThrough) ? 0 : baseThickness
    
    // Reusable block geometry
    const blockGeo = new THREE.BoxGeometry(blockSize, blockSize, layerThickness)
    
    // Optimization: Create merged geometry for blocks directly
    // Instead of cloning hundreds of geometries, we can use instanced mesh?
    // But we need to export STL, so we need BufferGeometry.
    // 'mergeBufferGeometries' is fast enough for ~1000 blocks if they are simple.
    // The issue with CSG was boolean operations on thousands of faces.
    
    for (let y = 0; y < moduleCount; y++) {
      for (let x = 0; x < moduleCount; x++) {
         const isBlack = !!qrMatrix[y][x]
         
         // Relief: Render Black. Hollow: Render White.
         const shouldRender = qrInvert ? !isBlack : isBlack
         
         if (shouldRender) {
             const instance = blockGeo.clone()
             const xPos = x * blockSize - halfSize + blockSize/2
             // QR scan Y is down, 3D Y is up. Flip Y.
             const yPos = (moduleCount - 1 - y) * blockSize - halfSize + blockSize/2
             
             instance.translate(xPos, yPos, zStart + layerThickness/2)
             blocks.push(instance)
         }
      }
    }
    
    // 3. Create Border (For Hollow mode only)
    // The border fills the padding area.
    let borderGeometry: THREE.BufferGeometry | null = null
    
    if (qrInvert && padding > 0.01) {
       const outerShape = createRoundedRectShape(plateSize, plateSize, plateCornerRadius)
       const innerHole = new THREE.Path()
       const w = qrSize
       const h = qrSize
       
       // Inner rect hole (CW winding for holes)
       // Top-Left -> Top-Right -> Bottom-Right -> Bottom-Left
       innerHole.moveTo(-w/2, h/2)
       innerHole.lineTo(w/2, h/2)
       innerHole.lineTo(w/2, -h/2)
       innerHole.lineTo(-w/2, -h/2)
       innerHole.closePath()
       
       outerShape.holes.push(innerHole)
       
       borderGeometry = new THREE.ExtrudeGeometry(outerShape, {
           depth: layerThickness,
           bevelEnabled: false
       })
       borderGeometry.translate(0, 0, zStart)
    }

    // Merge QR blocks
    let qrGeometry: THREE.BufferGeometry | null = null
    if (blocks.length > 0) {
        // Ensure all geometries have consistent attributes
        const compatibleBlocks = blocks.map(b => b.index ? b.toNonIndexed() : b)
        qrGeometry = mergeBufferGeometries(compatibleBlocks)
    }
    
    return { baseGeometry, qrGeometry, borderGeometry }

  }, [qrMatrix, qrSize, qrDepth, qrInvert, qrIsThrough, baseThickness, qrMargin, plateCornerRadius])

  if (!geometry) return null

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
       {/* Base Mesh */}
       {geometry.baseGeometry && (
         <mesh geometry={geometry.baseGeometry}>
            <meshStandardMaterial 
              color={plateColor}
              roughness={roughness} 
              metalness={metalness}
            />
         </mesh>
       )}
       
       {/* QR Mesh */}
       {geometry.qrGeometry && (
         <mesh geometry={geometry.qrGeometry}>
            <meshStandardMaterial 
              color={parameters.textColor} 
              roughness={roughness} 
              metalness={metalness}
            />
         </mesh>
       )}
       
       {/* Border Mesh - Keep consistent with QR Mesh */}
       {geometry.borderGeometry && (
         <mesh geometry={geometry.borderGeometry}>
            <meshStandardMaterial 
              color={parameters.textColor} 
              roughness={roughness} 
              metalness={metalness}
            />
         </mesh>
       )}
    </group>
  )
}
