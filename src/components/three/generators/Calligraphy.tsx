"use client"

import * as THREE from "three"
import { useEffect, useState, useMemo } from "react"
import { useModelStore } from "@/lib/store"
import { createPlateGeometry } from "./plateShapes"
import { mergeBufferGeometries } from "three-stdlib"

// Helper to load image
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "Anonymous"
    img.src = url
    img.onload = () => resolve(img)
    img.onerror = reject
  })
}

export function CalligraphyGenerator() {
  const { parameters } = useModelStore()
  const [mergedGeometry, setMergedGeometry] = useState<THREE.BufferGeometry | null>(null)
  
  const { 
    calligraphyImageUrl, 
    calligraphyThreshold, 
    calligraphySize, 
    calligraphyThickness, 
    calligraphyInvert,
    calligraphySmoothing,
    
    // Plate params
    plateShape,
    plateWidth,
    plateHeight,
    baseThickness,
    size, // Used for plate size if not rectangle
    plateColor,
    textColor,
    roughness,
    metalness
  } = parameters

  // 1. Generate Base Geometry
  const baseGeo = useMemo(() => {
    return createPlateGeometry(
        plateShape, 
        size, 
        plateWidth, 
        plateHeight, 
        2 // corner radius default
    )
  }, [plateShape, size, plateWidth, plateHeight, baseThickness])

  // 2. Process Image and Merge
  useEffect(() => {
    if (!calligraphyImageUrl || !baseGeo) return

    let mounted = true
    
    const process = async () => {
      try {
        const img = await loadImage(calligraphyImageUrl)
        if (!mounted) return
        
        // Calculate Aspect Ratio
        const aspect = img.naturalWidth / img.naturalHeight
        // We use calligraphySize as the WIDTH. Height is derived.
        const effectiveWidth = calligraphySize
        const effectiveHeight = calligraphySize / aspect

        // Use user resolution, but cap for safety if needed
        const resultRes = Math.min(parameters.calligraphyResolution || 150, 512)
        
        const canvas = document.createElement('canvas')
        canvas.width = resultRes
        canvas.height = resultRes
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        ctx.fillStyle = calligraphyInvert ? '#000000' : '#ffffff' 
        ctx.fillRect(0,0, resultRes, resultRes)
        
        if (calligraphySmoothing > 0) {
            ctx.filter = `blur(${calligraphySmoothing * 0.5}px)`
        }
        
        ctx.imageSmoothingEnabled = true
        // Squashing image into square canvas for processing simplicity
        ctx.drawImage(img, 0, 0, resultRes, resultRes)
        
        const imgData = ctx.getImageData(0, 0, resultRes, resultRes)
        const data = imgData.data
        
        const getB = (x: number, y: number) => {
            x = Math.max(0, Math.min(x, resultRes-1))
            y = Math.max(0, Math.min(y, resultRes-1))
            const idx = (y * resultRes + x) * 4
            const r = data[idx]
            const v = (r + data[idx+1] + data[idx+2]) / 3
            return calligraphyInvert ? v : (255 - v)
        }
        
        // --- GEOMETRY GENERATION ---
        let textGeo: THREE.BufferGeometry
        
        if (parameters.calligraphyStyle === 'smooth') {
             // SMOOTH MODE: Displaced Plane
             const positions: number[] = []
             const normals: number[] = []
             const uvs: number[] = []
             
             // Step size
             const stepX = effectiveWidth / resultRes
             const stepY = effectiveHeight / resultRes
             
             // Offset to center
             const offsetX = -effectiveWidth / 2
             const offsetY = effectiveHeight / 2 
             
             const pushTri = (
                 x1:number, y1:number, z1:number,
                 x2:number, y2:number, z2:number,
                 x3:number, y3:number, z3:number,
                 u1:number, v1:number, 
                 u2:number, v2:number, 
                 u3:number, v3:number
             ) => {
                 positions.push(x1, y1, z1); uvs.push(u1, v1);
                 positions.push(x2, y2, z2); uvs.push(u2, v2);
                 positions.push(x3, y3, z3); uvs.push(u3, v3);
                 
                 // Compute face normal
                 const ax = x2-x1, ay = y2-y1, az = z2-z1
                 const bx = x3-x1, by = y3-y1, bz = z3-z1
                 let nx = ay*bz - az*by
                 let ny = az*bx - ax*bz
                 let nz = ax*by - ay*bx
                 const len = Math.sqrt(nx*nx + ny*ny + nz*nz)
                 if (len > 0) { nx/=len; ny/=len; nz/=len }
                 
                 normals.push(nx, ny, nz)
                 normals.push(nx, ny, nz)
                 normals.push(nx, ny, nz)
             }
             
             for(let y=0; y<resultRes; y++) {
                 for(let x=0; x<resultRes; x++) {
                     // Get heights
                     const hTL = (getB(x, y) / 255) * calligraphyThickness
                     const hTR = (getB(x+1, y) / 255) * calligraphyThickness
                     const hBL = (getB(x, y+1) / 255) * calligraphyThickness
                     const hBR = (getB(x+1, y+1) / 255) * calligraphyThickness
                     
                     const t = calligraphyThreshold / 255 * calligraphyThickness
                     if (hTL < t && hTR < t && hBL < t && hBR < t) continue
                     
                     // Coords mapping to physical space (restoring aspect ratio)
                     const x0 = offsetX + x * stepX
                     const x1 = offsetX + (x+1) * stepX
                     
                     const y0 = offsetY - y * stepY
                     const y1 = offsetY - (y+1) * stepY
                     
                     const zBase = baseThickness
                     
                     // Tri 1
                     pushTri(
                         x0, y0, zBase + Math.max(0, hTL),
                         x0, y1, zBase + Math.max(0, hBL),
                         x1, y0, zBase + Math.max(0, hTR),
                         x/resultRes, 1-y/resultRes,
                         x/resultRes, 1-(y+1)/resultRes,
                         (x+1)/resultRes, 1-y/resultRes
                     )
                     // Tri 2
                     pushTri(
                         x0, y1, zBase + Math.max(0, hBL),
                         x1, y1, zBase + Math.max(0, hBR),
                         x1, y0, zBase + Math.max(0, hTR),
                         x/resultRes, 1-(y+1)/resultRes,
                         (x+1)/resultRes, 1-(y+1)/resultRes,
                         (x+1)/resultRes, 1-y/resultRes
                     )
                 }
             }
             
             textGeo = new THREE.BufferGeometry()
             textGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
             textGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
             textGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
             textGeo.computeVertexNormals()
             
        } else {
             // VOXEL MODE
             const positions: number[] = []
             const normals: number[] = []
             const uvs: number[] = []
             
             const stepX = effectiveWidth / resultRes
             const stepY = effectiveHeight / resultRes
             const halfStepX = stepX / 2
             const halfStepY = stepY / 2
             
             const pushFace = (
                x1:number, y1:number, z1:number,
                x2:number, y2:number, z2:number,
                x3:number, y3:number, z3:number,
                x4:number, y4:number, z4:number,
                nx:number, ny:number, nz:number,
                u1:number, v1:number, u2:number, v2:number,
                u3:number, v3:number, u4:number, v4:number
            ) => {
                positions.push(x1, y1, z1); normals.push(nx, ny, nz); uvs.push(u1, v1);
                positions.push(x3, y3, z3); normals.push(nx, ny, nz); uvs.push(u3, v3);
                positions.push(x2, y2, z2); normals.push(nx, ny, nz); uvs.push(u2, v2);

                positions.push(x3, y3, z3); normals.push(nx, ny, nz); uvs.push(u3, v3);
                positions.push(x4, y4, z4); normals.push(nx, ny, nz); uvs.push(u4, v4);
                positions.push(x2, y2, z2); normals.push(nx, ny, nz); uvs.push(u2, v2);
            }
            
            for (let y = 0; y < resultRes; y++) {
                for (let x = 0; x < resultRes; x++) {
                    const val = getB(x, y)
                    if (val < calligraphyThreshold) continue
                    
                    const hScale = (val / 255)
                    const h = hScale * calligraphyThickness
                    if (h <= 0.01) continue
                    
                    // Center based on rectangular dimensions
                    const cx = (x / resultRes - 0.5) * effectiveWidth + halfStepX
                    const cy = (0.5 - y / resultRes) * effectiveHeight - halfStepY
                    
                    const minX = cx - halfStepX
                    const maxX = cx + halfStepX
                    const minY = cy - halfStepY
                    const maxY = cy + halfStepY
                    const minZ = baseThickness
                    const maxZ = baseThickness + h
                    
                    const u = x / resultRes
                    const v = 1 - y / resultRes
                    
                    pushFace(minX, maxY, maxZ, maxX, maxY, maxZ, minX, minY, maxZ, maxX, minY, maxZ, 0, 0, 1, 
                            u, v, u, v, u, v, u, v)
                    pushFace(minX, minY, minZ, maxX, minY, minZ, minX, maxY, minZ, maxX, maxY, minZ, 0, 0, -1, 
                            u, v, u, v, u, v, u, v)
                    pushFace(minX, minY, maxZ, maxX, minY, maxZ, minX, minY, minZ, maxX, minY, minZ, 0, -1, 0, 
                            u, v, u, v, u, v, u, v)
                    pushFace(maxX, maxY, maxZ, minX, maxY, maxZ, maxX, maxY, minZ, minX, maxY, minZ, 0, 1, 0, 
                            u, v, u, v, u, v, u, v)
                    pushFace(minX, maxY, maxZ, minX, minY, maxZ, minX, maxY, minZ, minX, minY, minZ, -1, 0, 0, 
                            u, v, u, v, u, v, u, v)
                    pushFace(maxX, minY, maxZ, maxX, maxY, maxZ, maxX, minY, minZ, maxX, maxY, minZ, 1, 0, 0, 
                            u, v, u, v, u, v, u, v)
                }
            }
            textGeo = new THREE.BufferGeometry()
            textGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
            textGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
            textGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
        }

        // Merge!
        const geometriesToMerge = [textGeo]
        
        // Prepare Base if enabled
        if (parameters.hasBase) {
            let baseReady = baseGeo.clone()
            baseReady.translate(0, 0, baseThickness/2)
            
            // Ensure base is non-indexed for compatibility
            if (baseReady.index) {
                baseReady = baseReady.toNonIndexed()
            }
            geometriesToMerge.push(baseReady)
        }
        
        // Merge
        const merged = mergeBufferGeometries(geometriesToMerge, true)
        
        if (mounted) setMergedGeometry(merged)
        
      } catch (err) {
        console.error("Failed to merge calligraphy geometry:", err)
      }
    }

    process()
    
    return () => {
      mounted = false
    }
  }, [
      calligraphyImageUrl, 
      baseGeo, // Re-run if base changes
      calligraphyThreshold, 
      calligraphySize, 
      calligraphyThickness, 
      calligraphyInvert, 
      calligraphySmoothing,
      baseThickness,
      parameters.calligraphyStyle,
      parameters.calligraphyResolution
  ])

  if (!mergedGeometry) return null
  
  const plateMaterial = new THREE.MeshStandardMaterial({
      color: plateColor,
      roughness: roughness, // Use param
      metalness: metalness  // Use param
  })
  
  const textMaterial = new THREE.MeshStandardMaterial({
      color: textColor,
      roughness: roughness, // Use param
      metalness: metalness  // Use param
  })

  // Material logic:
  // mergeBufferGeometries with useGroups=true creates groups based on input order.
  // If hasBase=true: [Text, Base] or [Base, Text]?
  // In code above: geometriesToMerge = [textGeo]. If base: push(base).
  // So order is [Text, Base].
  // Material array should be [textMaterial, plateMaterial].
  
  // Previous code had: merge([base, text]). Order: Base, Text.
  // Previous material: [plate, text].
  
  // My new code: geometriesToMerge = [textGeo]; if(base) push. -> [Text, Base].
  // So I should swap material order to [text, plate].
  
  // Wait, let's keep consistent with valid groups.
  const materials = parameters.hasBase 
    ? [textMaterial, plateMaterial] // Text is 0, Base is 1
    : [textMaterial]
    
  return (
    <group rotation={[-Math.PI/2, 0, 0]}>
        <mesh 
            geometry={mergedGeometry}
            material={materials}
        />
    </group>
  )
}
