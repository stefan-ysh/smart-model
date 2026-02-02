import { useMemo, useEffect, useRef } from "react"
import { useModelStore } from "@/lib/store"
import * as THREE from "three"
import QRCode from "qrcode"
import { toShapeXY } from "@/components/three/utils/coords"
import { useDebounce } from "@/components/hooks/useDebounce"
// (mergeBufferGeometries removed; instanced preview handles blocks)

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
  // Optimized: Subscribe only to QR-related parameters
  const qrTextRaw = useModelStore(state => state.parameters.qrText)
  const qrSizeRaw = useModelStore(state => state.parameters.qrSize)
  const qrDepthRaw = useModelStore(state => state.parameters.qrDepth)
  const qrInvert = useModelStore(state => state.parameters.qrInvert)
  const qrMarginRaw = useModelStore(state => state.parameters.qrMargin)
  const qrIsThrough = useModelStore(state => state.parameters.qrIsThrough)
  const baseThickness = useModelStore(state => state.parameters.baseThickness)
  const holes = useModelStore(state => state.parameters.holes)
  const platePosition = useModelStore(state => state.parameters.platePosition)
  const groupRotation = useModelStore(state => state.parameters.groupRotation)
  const plateColor = useModelStore(state => state.parameters.plateColor)
  const textColor = useModelStore(state => state.parameters.textColor)
  const roughness = useModelStore(state => state.parameters.roughness)
  const metalness = useModelStore(state => state.parameters.metalness)
  const plateCornerRadius = useModelStore(state => state.parameters.plateCornerRadius)

  const qrText = useDebounce(qrTextRaw, 200)
  const qrSize = useDebounce(qrSizeRaw, 200)
  const qrDepth = useDebounce(qrDepthRaw, 200)
  const qrMargin = useDebounce(qrMarginRaw, 200)

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
    
    const addHoles = (shape: THREE.Shape) => {
      if (!holes || holes.length === 0) return
      holes.forEach(hole => {
        const h = new THREE.Path()
        const shapeXY = toShapeXY({ x: hole.x, y: hole.y })
        h.absarc(shapeXY.x, shapeXY.y, hole.radius, 0, Math.PI * 2, false)
        shape.holes.push(h)
      })
    }

    // 1. Create Base Geometry
    // Needs base if (Relief) OR (Hollow AND NOT Through)
    const needsBase = !qrInvert || !qrIsThrough
    
    let baseGeometry: THREE.BufferGeometry | null = null
    
    if (needsBase) {
        const shape = createRoundedRectShape(plateSize, plateSize, plateCornerRadius)
        addHoles(shape)
        const extrudeSettings = {
            depth: baseThickness,
            bevelEnabled: false
        }
        baseGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    }
    
    const isInHole = (x: number, y: number) => {
      if (!holes || holes.length === 0) return false
      for (const hole of holes) {
        const shapeXY = toShapeXY({ x: hole.x, y: hole.y })
        const dx = x - shapeXY.x
        const dy = y - shapeXY.y
        if (dx * dx + dy * dy <= hole.radius * hole.radius) return true
      }
      return false
    }

    // 2. Create QR Layer (Blocks)
    const instanceMatrices: THREE.Matrix4[] = []
    
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
             const xPos = x * blockSize - halfSize + blockSize/2
             // QR scan Y is down, 3D Y is up. Flip Y.
             const yPos = (moduleCount - 1 - y) * blockSize - halfSize + blockSize/2
            
             if (!isInHole(xPos, yPos)) {
               const m = new THREE.Matrix4()
               m.setPosition(xPos, yPos, zStart + layerThickness/2)
               instanceMatrices.push(m)
             }
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
       addHoles(outerShape)
       
       borderGeometry = new THREE.ExtrudeGeometry(outerShape, {
           depth: layerThickness,
           bevelEnabled: false
       })
       borderGeometry.translate(0, 0, zStart)
    }

    return { baseGeometry, borderGeometry, blockGeo, instanceMatrices }

  }, [qrMatrix, qrSize, qrDepth, qrInvert, qrIsThrough, baseThickness, qrMargin, plateCornerRadius, holes])

  if (!geometry) return null
  const instancedRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    if (!instancedRef.current) return
    const mesh = instancedRef.current
    const count = geometry.instanceMatrices.length
    mesh.count = count
    for (let i = 0; i < count; i++) {
      mesh.setMatrixAt(i, geometry.instanceMatrices[i])
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [geometry])

  return (
    <group rotation={[0, (groupRotation * Math.PI) / 180, 0]}>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[platePosition.x, baseThickness / 2, platePosition.y]}>
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
        
        {/* QR Mesh (Instanced) */}
        {geometry.instanceMatrices.length > 0 && (
          <instancedMesh
            ref={instancedRef}
            args={[geometry.blockGeo, null as unknown as THREE.Material, geometry.instanceMatrices.length]}
          >
            <meshStandardMaterial 
              color={textColor} 
              roughness={roughness} 
              metalness={metalness}
            />
          </instancedMesh>
        )}
        
        {/* Border Mesh - Keep consistent with QR Mesh */}
        {geometry.borderGeometry && (
          <mesh geometry={geometry.borderGeometry}>
            <meshStandardMaterial 
              color={textColor} 
              roughness={roughness} 
              metalness={metalness}
            />
          </mesh>
        )}
      </group>
    </group>
  )
}
