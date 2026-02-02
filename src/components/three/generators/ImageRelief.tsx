"use client"

import * as THREE from "three"
import { useEffect, useState, useMemo } from "react"
import { useModelStore } from "@/lib/store"
import { createPlateGeometry, createPlateShape2D } from "./plateShapes"
import polygonClipping from "polygon-clipping"
import { mergeBufferGeometries } from "three-stdlib"
import { rotate2D, toShapeXY } from "@/components/three/utils/coords"
import { useDebounce } from "@/components/hooks/useDebounce"

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

export function ImageReliefGenerator() {
  const { parameters } = useModelStore()
  const setSelectedLayer = useModelStore(state => state.setSelectedLayer)
  const isTransformEnabled = useModelStore(state => state.isTransformEnabled)
  const [mergedGeometry, setMergedGeometry] = useState<THREE.BufferGeometry | null>(null)
  
  const { 
    imageUrl: calligraphyImageUrl, // Alias for backward compatibility if needed, using generic imageUrl
    imageThreshold: calligraphyThreshold, 
    imageSize: calligraphySize, 
    imageThickness: calligraphyThickness, 
    imageInvert: calligraphyInvert,
    imageSmoothing: calligraphySmoothing,
    imageStyle: calligraphyStyle,
    imageResolution: calligraphyResolution,
    
    // Plate params
    plateShape,
    plateWidth,
    plateHeight,
    baseThickness,
    size, // Used for plate size if not rectangle
    trayBorderWidth,
    trayBorderHeight,
    edgeBevelEnabled,
    edgeBevelType,
    edgeBevelSize,
    modelResolution,
    holes,
    plateColor,
    textColor,
    roughness,
    metalness,
    plateRotation,
    platePosition,
    textPosition,
    imageRotation,
  } = parameters

  const debouncedTextPosition = useDebounce(textPosition, 150)
  const debouncedImageRotation = useDebounce(imageRotation, 150)


  // Alias internally to avoid rewriting all logic below right now
  // Or actually, cleaner to just use new names?
  // I will use aliases above to keep the rest of the file logic working with minimal diffs.
  // Note: I am aliasing `image*` props to `calligraphy*` variables.

  // 1. Generate Base Geometry
  const baseGeo = useMemo(() => {
    const curveSegments = 32 * Math.max(1, Math.min(5, modelResolution))
    const plateCornerRadius = parameters.plateCornerRadius || 0
    type Pair = [number, number]
    
    // Close the ring if not closed
    const closeRing = (ring: Pair[]): Pair[] => {
      if (ring.length === 0) return ring
      const [x0, y0] = ring[0]
      const [xl, yl] = ring[ring.length - 1]
      if (x0 !== xl || y0 !== yl) ring.push([x0, y0])
      return ring
    }

    const pointsToRing = (pts: THREE.Vector2[]): Pair[] =>
      closeRing(pts.map(p => [p.x, p.y] as Pair))

    const ringArea = (ring: Pair[]) => {
      let sum = 0
      for (let i = 0; i < ring.length - 1; i++) {
        const [x1, y1] = ring[i]
        const [x2, y2] = ring[i + 1]
        sum += (x1 * y2 - x2 * y1)
      }
      return sum / 2
    }

    const shapeToPolygon = (shape: THREE.Shape): Pair[][] => {
      const outer = pointsToRing(shape.getPoints(curveSegments))
      const holesRings = shape.holes.map(h => pointsToRing(h.getPoints(curveSegments)))
      return [outer, ...holesRings]
    }

    const buildShapeFromPolygon = (poly: Pair[][]) => {
      if (!poly || poly.length === 0) return null
      const outer = poly[0].slice(0, -1)
      if (outer.length < 3) return null
      const outerPts = outer.map(([x, y]) => new THREE.Vector2(x, y))
      if (ringArea(poly[0]) < 0) outerPts.reverse()
      const shape = new THREE.Shape(outerPts)
      for (let i = 1; i < poly.length; i++) {
        const hole = poly[i].slice(0, -1)
        if (hole.length < 3) continue
        const holePts = hole.map(([x, y]) => new THREE.Vector2(x, y))
        if (ringArea(poly[i]) > 0) holePts.reverse()
        const path = new THREE.Path(holePts)
        shape.holes.push(path)
      }
      return shape
    }

    type Poly = Pair[][]
    type MultiPoly = Poly[]
    const holePolys: Poly[] = []
    if (holes && holes.length > 0) {
      holes.forEach(hole => {
        const hShape = new THREE.Shape()
        // Convert world-space hole to plate-local space
        const shapeXY = toShapeXY({ x: hole.x, y: hole.y })
        const rotated = rotate2D(shapeXY, -plateRotation)
        const hx = rotated.x
        const hy = rotated.y
        hShape.absarc(hx, hy, hole.radius, 0, Math.PI * 2, false)
        holePolys.push(shapeToPolygon(hShape))
      })
    }
    const holesUnion = holePolys.length > 0
      ? holePolys.reduce((acc, val) => polygonClipping.union(acc, val) as MultiPoly, [] as MultiPoly)
      : null

    const buildExtrude = (polys: Pair[][][], depth: number, zOffset: number) => {
      const geos: THREE.BufferGeometry[] = []
      for (const poly of polys) {
        const shape = buildShapeFromPolygon(poly)
        if (!shape) continue
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: false,
          curveSegments
        }).translate(0, 0, zOffset)
        geos.push(geo)
      }
      if (geos.length === 0) return null
      return geos.length === 1 ? geos[0] : mergeBufferGeometries(geos)
    }

    const buildPlate2D = () => {
      if (plateShape === "tray") {
        const outer = createPlateShape2D(
          "square",
          size,
          plateWidth,
          plateHeight,
          plateCornerRadius,
          modelResolution
        )
        if (!outer) return null
        const borderW = Math.min(trayBorderWidth, Math.min(plateWidth, plateHeight) / 4)
        const innerWidth = Math.max(1, plateWidth - 2 * borderW)
        const innerHeight = Math.max(1, plateHeight - 2 * borderW)
        const inner = createPlateShape2D(
          "square",
          size,
          innerWidth,
          innerHeight,
          0,
          modelResolution
        )
        if (!inner) return null

        const outerPoly: Pair[][][] = [shapeToPolygon(outer)]
        const innerPoly: Pair[][][] = [shapeToPolygon(inner)]

        let basePoly = outerPoly
        if (holesUnion) basePoly = polygonClipping.difference(basePoly, holesUnion) as MultiPoly

        let ringPoly = polygonClipping.difference(outerPoly, innerPoly) as MultiPoly
        if (holesUnion) ringPoly = polygonClipping.difference(ringPoly, holesUnion) as MultiPoly

        const baseGeo = buildExtrude(basePoly, baseThickness, -baseThickness / 2)
        const ringGeo = buildExtrude(ringPoly, trayBorderHeight, baseThickness / 2)
        if (baseGeo && ringGeo) {
          return mergeBufferGeometries([baseGeo, ringGeo]) || baseGeo
        }
        return baseGeo || ringGeo
      }

      const shape2D = createPlateShape2D(
        plateShape,
        size,
        plateWidth,
        plateHeight,
        plateCornerRadius,
        modelResolution
      )
      if (!shape2D) return null
      let platePoly: Pair[][][] = [shapeToPolygon(shape2D)]
      if (holesUnion) {
        platePoly = polygonClipping.difference(platePoly, holesUnion) as MultiPoly
      }
      return buildExtrude(platePoly, baseThickness, -baseThickness / 2)
    }

    const plate2D = buildPlate2D()
    if (plate2D) return plate2D

    // Fallback to CSG if 2D fails
    return createPlateGeometry(
      plateShape,
      size,
      plateWidth,
      plateHeight,
      baseThickness,
      plateCornerRadius,
      trayBorderWidth,
      trayBorderHeight,
      edgeBevelEnabled,
      edgeBevelType,
      edgeBevelSize,
      modelResolution,
      holes
    )
  }, [
    plateShape,
    size,
    plateWidth,
    plateHeight,
    baseThickness,
    parameters.plateCornerRadius,
    trayBorderWidth,
    trayBorderHeight,
    edgeBevelEnabled,
    edgeBevelType,
    edgeBevelSize,
    modelResolution,
    holes,
    plateRotation
  ])


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
        const resultRes = Math.min(calligraphyResolution || 150, 512)
        
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
        
        if (calligraphyStyle === 'smooth') {
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
                     
                     const zBase = parameters.hasBase ? baseThickness / 2 : 0
                     
                     // Helper to push a quad (2 triangles)
                     const pushQuad = (
                        x1:number, y1:number, z1:number,
                        x2:number, y2:number, z2:number,
                        x3:number, y3:number, z3:number,
                        x4:number, y4:number, z4:number,
                        nx:number, ny:number, nz:number
                     ) => {
                         // Tri 1: 1-2-4
                         positions.push(x1, y1, z1); uvs.push(0,0); normals.push(nx,ny,nz);
                         positions.push(x2, y2, z2); uvs.push(1,0); normals.push(nx,ny,nz);
                         positions.push(x4, y4, z4); uvs.push(0,1); normals.push(nx,ny,nz);
                         
                         // Tri 2: 2-3-4
                         positions.push(x2, y2, z2); uvs.push(1,0); normals.push(nx,ny,nz);
                         positions.push(x3, y3, z3); uvs.push(1,1); normals.push(nx,ny,nz);
                         positions.push(x4, y4, z4); uvs.push(0,1); normals.push(nx,ny,nz);
                     }

                     // Tri 1 (Top Surface)
                     pushTri(
                         x0, y0, zBase + Math.max(0, hTL),
                         x0, y1, zBase + Math.max(0, hBL),
                         x1, y0, zBase + Math.max(0, hTR),
                         x/resultRes, 1-y/resultRes,
                         x/resultRes, 1-(y+1)/resultRes,
                         (x+1)/resultRes, 1-y/resultRes
                     )
                     // Tri 2 (Top Surface)
                     pushTri(
                         x0, y1, zBase + Math.max(0, hBL),
                         x1, y1, zBase + Math.max(0, hBR),
                         x1, y0, zBase + Math.max(0, hTR),
                         x/resultRes, 1-(y+1)/resultRes,
                         (x+1)/resultRes, 1-(y+1)/resultRes,
                         (x+1)/resultRes, 1-y/resultRes
                     )
                     
                     // Bottom Surface (Facing Down)
                     // v1(x0,y0), v2(x1,y0), v3(x1,y1), v4(x0,y1) at zBase
                     // Clockwise for down: 1-4-2, 4-3-2?
                     // Normal: 0, 0, -1
                     pushTri(
                        x0, y0, zBase,
                        x1, y0, zBase,
                        x0, y1, zBase,
                        0,0, 1,0, 0,1 // UVs dummy
                     )
                     pushTri(
                        x0, y1, zBase,
                        x1, y0, zBase,
                        x1, y1, zBase,
                        0,1, 1,0, 1,1
                     )

                     // --- Side Wall Generation (Watertight) ---
                     
                     // Helper to check if a neighbor quad is visible (exists)
                     const isVisible = (nx: number, ny: number) => {
                        if (nx < 0 || nx >= resultRes || ny < 0 || ny >= resultRes) return false
                        const val1 = getB(nx, ny)
                        const val2 = getB(nx+1, ny)
                        const val3 = getB(nx, ny+1)
                        const val4 = getB(nx+1, ny+1)
                        // If all corners are below threshold, the quad is skipped (invisible)
                        return Math.max(val1, val2, val3, val4) >= calligraphyThreshold
                     }

                     // Top Edge (Neighbor at y-1 is empty/out)
                     if (!isVisible(x, y-1)) {
                         pushQuad(
                             x0, y0, zBase,                // Bottom Left
                             x0, y0, zBase + hTL,          // Top Left
                             x1, y0, zBase + hTR,          // Top Right
                             x1, y0, zBase,                // Bottom Right
                             0, 1, 0
                         )
                     }
                     
                     // Bottom Edge (Neighbor at y+1 is empty/out)
                     if (!isVisible(x, y+1)) {
                         pushQuad(
                             x0, y1, zBase + hBL,
                             x0, y1, zBase,
                             x1, y1, zBase,
                             x1, y1, zBase + hBR,
                             0, -1, 0
                         )
                     }

                     // Left Edge (Neighbor at x-1 is empty/out)
                     if (!isVisible(x-1, y)) {
                         pushQuad(
                             x0, y1, zBase,              // Bottom Front (low y)
                             x0, y1, zBase + hBL,        // Top Front
                             x0, y0, zBase + hTL,        // Top Back
                             x0, y0, zBase,              // Bottom Back (high y)
                             -1, 0, 0
                         )
                     }

                     // Right Edge (Neighbor at x+1 is empty/out)
                     if (!isVisible(x+1, y)) {
                         pushQuad(
                             x1, y0, zBase,
                             x1, y0, zBase + hTR,
                             x1, y1, zBase + hBR,
                             x1, y1, zBase,
                             1, 0, 0
                         )
                     }
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
            textGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
        }

        // --- TRANSFORMATIONS ---
        
        // 1. Text/Image Geometry: Apply standalone rotation and position
        if (textGeo) {
            // Rotate around Z (up axis in our logic before flipping X)
            if (debouncedImageRotation) {
                textGeo.rotateZ((debouncedImageRotation * Math.PI) / 180)
            }
            
            // Translate offset
            if (debouncedTextPosition && (debouncedTextPosition.x !== 0 || debouncedTextPosition.y !== 0)) {
                const shapeXY = toShapeXY({ x: debouncedTextPosition.x, y: debouncedTextPosition.y })
                textGeo.translate(shapeXY.x, shapeXY.y, 0)
            }
        }

        // 2. Base Geometry: Apply local rotation
        let baseReady = parameters.hasBase ? baseGeo.clone() : null
        
        if (baseReady) {
             // Apply plate rotation
             if (plateRotation) {
                 baseReady.rotateZ((plateRotation * Math.PI) / 180)
             }
             
             baseReady.translate(0, 0, baseThickness/2)
             
             // Ensure base is non-indexed for compatibility
             if (baseReady.index) {
                 baseReady = baseReady.toNonIndexed()
             }
        }

        // Merge!
        const geometriesToMerge: THREE.BufferGeometry[] = []
        if (textGeo) geometriesToMerge.push(textGeo)
        if (baseReady) geometriesToMerge.push(baseReady) // Base is already cloned and transformed
        
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
      calligraphyStyle, // using destructured alias
      calligraphyResolution, // using destructured alias
      parameters.hasBase,
      // New dependencies
      debouncedImageRotation,
      debouncedTextPosition,
      plateRotation,
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
    <group 
      rotation={[-Math.PI/2, 0, 0]}
      position={[platePosition.x, baseThickness/2, platePosition.y]}
    >
        <mesh 
            geometry={mergedGeometry}
            material={materials}
            onPointerDown={(e) => {
              if (!isTransformEnabled) return
              e.stopPropagation()
              setSelectedLayer("base")
            }}
        />
    </group>
  )
}
