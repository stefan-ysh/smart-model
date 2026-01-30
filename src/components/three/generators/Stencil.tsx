"use client"

import * as THREE from 'three'
import { useMemo, Suspense } from "react"
import { useLoader } from "@react-three/fiber"
import { mergeBufferGeometries } from "three-stdlib"
import polygonClipping from "polygon-clipping"
import { useModelStore, TextItem } from "@/lib/store"
import { createPlateGeometry, createPlateShape2D } from "./plateShapes"

// Create text geometry with proper attributes
function createTextGeometry(
  font: any, 
  item: TextItem, 
  thickness: number,
  trayBorderHeight: number = 0
): THREE.BufferGeometry | null {
  try {
    // Calculate the total height needed to cut through everything
    // For tray shapes, we need to cut through base + frame
    const cutHeight = thickness + trayBorderHeight + 10 // Extra margin for safety
    const shapes = font.generateShapes(item.content || ' ', item.fontSize)
    if (!shapes || shapes.length === 0) return null
    
    const textGeo = new THREE.ExtrudeGeometry(shapes, {
      depth: cutHeight,
      bevelEnabled: false,
      curveSegments: 12,
    })
    
    // Center the text first
    textGeo.computeBoundingBox()
    if (textGeo.boundingBox) {
      const centerX = (textGeo.boundingBox.max.x + textGeo.boundingBox.min.x) / 2
      const centerY = (textGeo.boundingBox.max.y + textGeo.boundingBox.min.y) / 2
      // Position Z so the cutter starts below the plate and extends above
      // Plate is centered at Z=0, so cutter should go from -thickness to +trayBorderHeight+margin
      textGeo.translate(-centerX, -centerY, -thickness - 2)
    }
    
    // Apply rotation around Z axis
    if (item.rotation !== 0) {
      const rotationMatrix = new THREE.Matrix4().makeRotationZ((item.rotation * Math.PI) / 180)
      textGeo.applyMatrix4(rotationMatrix)
    }
    
    // Then apply position offset
    textGeo.translate(item.position.x, item.position.y, 0)
    
    textGeo.computeVertexNormals()
    
    return textGeo
  } catch (e) {
    console.error('Error creating text geometry:', e)
    return null
  }
}

// Global cache for expensive CSG geometries
const geometryCache = new Map<string, THREE.BufferGeometry>()

// Replace standard FontLoader with our UniversalFontLoader
import { UniversalFontLoader } from "@/utils/fontLoaderUtils"

function StencilMesh() {
  const { parameters } = useModelStore()
  const { 
    size, baseThickness, textItems, 
    plateShape, plateWidth, plateHeight,
    platePosition, plateRotation, plateCornerRadius,
    trayBorderWidth, trayBorderHeight,
    edgeBevelEnabled, edgeBevelType, edgeBevelSize,
    modelResolution,
    holes,
    plateColor, roughness, metalness
  } = parameters

  // Load all unique fonts needed
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
      platePosition, plateRotation, plateCornerRadius,
      trayBorderWidth, trayBorderHeight,
      edgeBevelEnabled, edgeBevelType, edgeBevelSize,
      modelResolution,
      holes
    })

    if (geometryCache.has(cacheKey)) {
      return geometryCache.get(cacheKey)!
    }

    try {
      // Calculate inverse plate transform
      const plateRotRad = (plateRotation * Math.PI) / 180
      const cosR = Math.cos(-plateRotRad)
      const sinR = Math.sin(-plateRotRad)
      const toPlateLocal = (x: number, y: number) => {
        const dx = x - platePosition.x
        const dy = y - platePosition.y
        return {
          x: dx * cosR - dy * sinR,
          y: dx * sinR + dy * cosR
        }
      }
      
      // (Dead code removed: textGeos prep loop was unused as we use polygonClipping below)

      let result: THREE.BufferGeometry | null = null

      if (plateShape === "tray") {
        const curveSegments = 32 * Math.max(1, Math.min(5, modelResolution))

        const ringArea = (ring: number[][]) => {
          let sum = 0
          for (let i = 0; i < ring.length - 1; i++) {
            const [x1, y1] = ring[i]
            const [x2, y2] = ring[i + 1]
            sum += (x1 * y2 - x2 * y1)
          }
          return sum / 2
        }

        const closeRing = (ring: number[][]) => {
          if (ring.length === 0) return ring
          const [x0, y0] = ring[0]
          const [xl, yl] = ring[ring.length - 1]
          if (x0 !== xl || y0 !== yl) ring.push([x0, y0])
          return ring
        }

        const pointsToRing = (pts: THREE.Vector2[]) =>
          closeRing(pts.map(p => [p.x, p.y]))

        const shapeToPolygon = (shape: THREE.Shape): number[][][] => {
          const outer = pointsToRing(shape.getPoints(curveSegments))
          const holesRings = shape.holes.map(h => pointsToRing(h.getPoints(curveSegments)))
          return [outer, ...holesRings]
        }

        const buildShapeFromPolygon = (poly: number[][][]) => {
          if (!poly || poly.length === 0) return null
          const outer = poly[0].slice(0, -1)
          if (outer.length < 3) return null
          const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)))
          if (ringArea(poly[0]) < 0) shape.reverse()

          for (let i = 1; i < poly.length; i++) {
            const hole = poly[i].slice(0, -1)
            if (hole.length < 3) continue
            const path = new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y)))
            if (ringArea(poly[i]) > 0) path.reverse()
            shape.holes.push(path)
          }
          return shape
        }

        const outerShape = createPlateShape2D(
          "square",
          size,
          plateWidth,
          plateHeight,
          plateCornerRadius,
          modelResolution
        )

        const innerSize = Math.max(1, size - 2 * Math.min(trayBorderWidth, size / 4))
        const innerShape = createPlateShape2D(
          "square",
          innerSize,
          innerSize,
          innerSize,
          0,
          modelResolution
        )

        if (outerShape && innerShape) {
          const outerPoly: number[][][][] = [shapeToPolygon(outerShape)]
          const innerPoly: number[][][][] = [shapeToPolygon(innerShape)]

          const clipPolys: number[][][][] = []

          if (holes && holes.length > 0) {
            holes.forEach(hole => {
              const hShape = new THREE.Shape()
              // Holes stay in world space; convert to plate-local so plate rotation doesn't affect them
              const dx = hole.x - platePosition.x
              const dy = hole.y - platePosition.y
              const hx = dx * cosR - dy * sinR
              const hy = dx * sinR + dy * cosR
              hShape.absarc(hx, hy, hole.radius, 0, Math.PI * 2, false)
              clipPolys.push([shapeToPolygon(hShape)])
            })
          }

          for (const item of textItems) {
            const font = fontMap[item.fontUrl]
            if (!font) continue

            // Keep text in world space; convert to plate-local so plate rotation doesn't affect it
            const localX = item.position.x - platePosition.x
            const localY = item.position.y - platePosition.y
            const rotatedX = localX * cosR - localY * sinR
            const rotatedY = localX * sinR + localY * cosR
            const localItem = {
              ...item,
              position: { ...item.position, x: rotatedX, y: rotatedY },
              rotation: item.rotation - plateRotation
            }

            const shapes = font.generateShapes(localItem.content || ' ', localItem.fontSize)
            if (!shapes || shapes.length === 0) continue

            const textGeo = new THREE.ShapeGeometry(shapes)
            textGeo.computeBoundingBox()
            const bbox = textGeo.boundingBox
            let centerX = 0
            let centerY = 0
            if (bbox) {
              centerX = (bbox.max.x + bbox.min.x) / 2
              centerY = (bbox.max.y + bbox.min.y) / 2
            }
            textGeo.dispose()

            const rad = (localItem.rotation * Math.PI) / 180
            const cos = Math.cos(rad)
            const sin = Math.sin(rad)

            const transformPoints = (pts: THREE.Vector2[]) => {
              return pts.map(p => {
                const lx = p.x - centerX
                const ly = p.y - centerY
                const rx = lx * cos - ly * sin + localItem.position.x
                const ry = lx * sin + ly * cos + localItem.position.y
                return new THREE.Vector2(rx, ry)
              })
            }

            const shapeToPolygonWithTransform = (shape: THREE.Shape): number[][][] => {
              const outerPts = transformPoints(shape.getPoints(curveSegments))
              const outer = pointsToRing(outerPts)
              const holesRings = shape.holes.map(h => pointsToRing(transformPoints(h.getPoints(curveSegments))))
              return [outer, ...holesRings]
            }

            shapes.forEach(s => {
              const poly = shapeToPolygonWithTransform(s)
              clipPolys.push([poly])
            })
          }

          const holesUnion = clipPolys.length > 0 ? polygonClipping.union(...clipPolys) : null

          let basePoly = outerPoly
          if (holesUnion) {
            basePoly = polygonClipping.difference(basePoly, holesUnion)
          }

          let ringPoly = polygonClipping.difference(outerPoly, innerPoly)
          if (holesUnion) {
            ringPoly = polygonClipping.difference(ringPoly, holesUnion)
          }

          const baseGeos: THREE.BufferGeometry[] = []
          for (const poly of basePoly) {
            const shape = buildShapeFromPolygon(poly)
            if (!shape) continue
            const geo = new THREE.ExtrudeGeometry(shape, {
              depth: baseThickness,
              bevelEnabled: edgeBevelEnabled,
              bevelThickness: edgeBevelSize,
              bevelSize: edgeBevelSize,
              bevelSegments: edgeBevelType === 'round' ? 4 : 1,
              curveSegments
            }).translate(0, 0, -baseThickness / 2)
            baseGeos.push(geo)
          }

          const ringGeos: THREE.BufferGeometry[] = []
          for (const poly of ringPoly) {
            const shape = buildShapeFromPolygon(poly)
            if (!shape) continue
            const geo = new THREE.ExtrudeGeometry(shape, {
              depth: trayBorderHeight,
              bevelEnabled: edgeBevelEnabled,
              bevelThickness: edgeBevelSize,
              bevelSize: edgeBevelSize,
              bevelSegments: edgeBevelType === 'round' ? 4 : 1,
              curveSegments
            }).translate(0, 0, baseThickness / 2)
            ringGeos.push(geo)
          }

          const mergedBase = baseGeos.length === 1 ? baseGeos[0] : mergeBufferGeometries(baseGeos)
          const mergedRing = ringGeos.length === 1 ? ringGeos[0] : mergeBufferGeometries(ringGeos)
          const merged = mergeBufferGeometries([mergedBase, mergedRing].filter(Boolean) as THREE.BufferGeometry[])

          result = merged || mergedBase || mergedRing || null
        }
      } else {
        const curveSegments = 32 * Math.max(1, Math.min(5, modelResolution))

        const ringArea = (ring: number[][]) => {
          let sum = 0
          for (let i = 0; i < ring.length - 1; i++) {
            const [x1, y1] = ring[i]
            const [x2, y2] = ring[i + 1]
            sum += (x1 * y2 - x2 * y1)
          }
          return sum / 2
        }

        const closeRing = (ring: number[][]) => {
          if (ring.length === 0) return ring
          const [x0, y0] = ring[0]
          const [xl, yl] = ring[ring.length - 1]
          if (x0 !== xl || y0 !== yl) ring.push([x0, y0])
          return ring
        }

        const pointsToRing = (pts: THREE.Vector2[]) =>
          closeRing(pts.map(p => [p.x, p.y]))

        const shapeToPolygon = (shape: THREE.Shape): number[][][] => {
          const outer = pointsToRing(shape.getPoints(curveSegments))
          const holesRings = shape.holes.map(h => pointsToRing(h.getPoints(curveSegments)))
          return [outer, ...holesRings]
        }

        const buildShapeFromPolygon = (poly: number[][][]) => {
          if (!poly || poly.length === 0) return null
          const outer = poly[0].slice(0, -1)
          if (outer.length < 3) return null
          const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)))
          if (ringArea(poly[0]) < 0) shape.reverse()

          for (let i = 1; i < poly.length; i++) {
            const hole = poly[i].slice(0, -1)
            if (hole.length < 3) continue
            const path = new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y)))
            if (ringArea(poly[i]) > 0) path.reverse()
            shape.holes.push(path)
          }
          return shape
        }

        const plateShape2D = createPlateShape2D(
          plateShape,
          size,
          plateWidth,
          plateHeight,
          plateCornerRadius,
          modelResolution
        )

        if (plateShape2D) {
          let platePoly: number[][][][] = [shapeToPolygon(plateShape2D)]
          const clipPolys: number[][][][] = []

          if (holes && holes.length > 0) {
            holes.forEach(hole => {
              const hShape = new THREE.Shape()
              // Holes stay in world space; convert to plate-local so plate rotation doesn't affect them
              const dx = hole.x - platePosition.x
              const dy = hole.y - platePosition.y
              const hx = dx * cosR - dy * sinR
              const hy = dx * sinR + dy * cosR
              hShape.absarc(hx, hy, hole.radius, 0, Math.PI * 2, false)
              clipPolys.push([shapeToPolygon(hShape)])
            })
          }

          for (const item of textItems) {
            const font = fontMap[item.fontUrl]
            if (!font) continue

            const localX = item.position.x - platePosition.x
            const localY = item.position.y - platePosition.y
            const rotatedX = localX * cosR - localY * sinR
            const rotatedY = localX * sinR + localY * cosR
            const localItem = {
              ...item,
              position: { ...item.position, x: rotatedX, y: rotatedY },
              rotation: item.rotation - plateRotation
            }

            const shapes = font.generateShapes(localItem.content || ' ', localItem.fontSize)
            if (!shapes || shapes.length === 0) continue

            const textGeo = new THREE.ShapeGeometry(shapes)
            textGeo.computeBoundingBox()
            const bbox = textGeo.boundingBox
            let centerX = 0
            let centerY = 0
            if (bbox) {
              centerX = (bbox.max.x + bbox.min.x) / 2
              centerY = (bbox.max.y + bbox.min.y) / 2
            }
            textGeo.dispose()

            const rad = (localItem.rotation * Math.PI) / 180
            const cos = Math.cos(rad)
            const sin = Math.sin(rad)

            const transformPoints = (pts: THREE.Vector2[]) => {
              return pts.map(p => {
                const lx = p.x - centerX
                const ly = p.y - centerY
                const rx = lx * cos - ly * sin + localItem.position.x
                const ry = lx * sin + ly * cos + localItem.position.y
                return new THREE.Vector2(rx, ry)
              })
            }

            const shapeToPolygonWithTransform = (shape: THREE.Shape): number[][][] => {
              const outerPts = transformPoints(shape.getPoints(curveSegments))
              const outer = pointsToRing(outerPts)
              const holesRings = shape.holes.map(h => pointsToRing(transformPoints(h.getPoints(curveSegments))))
              return [outer, ...holesRings]
            }

            shapes.forEach(s => {
              const poly = shapeToPolygonWithTransform(s)
              clipPolys.push([poly])
            })
          }

          if (clipPolys.length > 0) {
            const clipUnion = polygonClipping.union(...clipPolys)
            platePoly = polygonClipping.difference(platePoly, clipUnion)
          }

          const extruded: THREE.BufferGeometry[] = []
          for (const poly of platePoly) {
            const shape = buildShapeFromPolygon(poly)
            if (!shape) continue
            const geo = new THREE.ExtrudeGeometry(shape, {
              depth: baseThickness,
              bevelEnabled: edgeBevelEnabled,
              bevelThickness: edgeBevelSize,
              bevelSize: edgeBevelSize,
              bevelSegments: edgeBevelType === 'round' ? 4 : 1,
              curveSegments
            }).translate(0, 0, -baseThickness / 2)
            extruded.push(geo)
          }

          result = extruded.length === 1 ? extruded[0] : mergeBufferGeometries(extruded)
        }
      }

      // Cleanup
      // Cleanup
      // textGeos was removed
      
      const finalGeo = result || new THREE.BufferGeometry()
      
      geometryCache.set(cacheKey, finalGeo)
      
      // Limit cache size
      if (geometryCache.size > 20) {
         const firstKey = geometryCache.keys().next().value
         if (firstKey) geometryCache.delete(firstKey)
      }
      
      return finalGeo

    } catch (error) {
      console.error('CSG Error:', error)
      return createPlateGeometry(
        plateShape, size, plateWidth, plateHeight, baseThickness, 
        plateCornerRadius, trayBorderWidth, trayBorderHeight, 
        edgeBevelEnabled, edgeBevelType, edgeBevelSize, 
        modelResolution, holes
      )
    }
  }, [fontMap, size, baseThickness, textItems, plateShape, plateWidth, plateHeight, 
      platePosition, plateRotation, plateCornerRadius, trayBorderWidth, trayBorderHeight, 
      edgeBevelEnabled, edgeBevelType, edgeBevelSize, modelResolution, holes])

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
