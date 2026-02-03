"use client"

import * as THREE from 'three'
import { useMemo, Suspense } from "react"
import { useLoader } from "@react-three/fiber"
import { mergeBufferGeometries, Font } from "three-stdlib"
import polygonClipping from "polygon-clipping"
import { useModelStore } from "@/lib/store"
import { createPlateGeometry, createPlateShape2D } from "./plateShapes"
import { rotate2D, toPlateLocal, toShapeXY } from "@/components/three/utils/coords"
import { LRUCache } from "@/components/three/utils/lru"

// Create text geometry with proper attributes
// Global cache for expensive CSG geometries
const geometryCache = new LRUCache<string, THREE.BufferGeometry>(20)

// Replace standard FontLoader with our UniversalFontLoader
import { UniversalFontLoader } from "@/utils/fontLoaderUtils"

function StencilMesh() {
  const { parameters } = useModelStore()
  const setSelectedLayer = useModelStore(state => state.setSelectedLayer)
  const isTransformEnabled = useModelStore(state => state.isTransformEnabled)
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
  const fontUrls = useMemo(() => {
    return [...new Set(textItems.map(item => item.fontUrl))].sort()
  }, [textItems])

  // Use UniversalFontLoader to support both JSON and TTF
  const fonts = useLoader(UniversalFontLoader, fontUrls)
  const fontMap = Object.fromEntries(fontUrls.map((url, i) => [url, fonts[i] as Font])) as Record<string, Font>

  const resultGeometry = useMemo(() => {
    if (Object.keys(fontMap).length === 0) return null

    // Create a unique key based on parameters that affect the geometry
    const cacheKey = JSON.stringify({
      size, baseThickness, textItems, 
      plateShape, plateWidth, plateHeight,
      plateRotation, plateCornerRadius,
      trayBorderWidth, trayBorderHeight,
      edgeBevelEnabled, edgeBevelType, edgeBevelSize,
      modelResolution,
      holes,
      platePosition
    })

    const cached = geometryCache.get(cacheKey)
    if (cached) return cached

    const localHoles = holes
      ? holes.map((hole) => {
          const local = toPlateLocal({ x: hole.x, y: hole.y }, platePosition)
          return { ...hole, x: local.x, y: local.y }
        })
      : holes

    try {
      // Calculate inverse plate transform
      type Pair = [number, number]
      type Poly = Pair[][]
      type MultiPoly = Poly[]
      
      // (Dead code removed: textGeos prep loop was unused as we use polygonClipping below)

      let result: THREE.BufferGeometry | null = null

      if (plateShape === "tray") {
        const curveSegments = 32 * Math.max(1, Math.min(5, modelResolution))

        const ringArea = (ring: Pair[]) => {
          let sum = 0
          for (let i = 0; i < ring.length - 1; i++) {
            const [x1, y1] = ring[i]
            const [x2, y2] = ring[i + 1]
            sum += (x1 * y2 - x2 * y1)
          }
          return sum / 2
        }



        const closeRing = (ring: Pair[]): Pair[] => {
          if (ring.length === 0) return ring
          const [x0, y0] = ring[0]
          const [xl, yl] = ring[ring.length - 1]
          if (x0 !== xl || y0 !== yl) ring.push([x0, y0])
          return ring
        }

        const pointsToRing = (pts: THREE.Vector2[]): Pair[] =>
          closeRing(pts.map(p => [p.x, p.y] as Pair))

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

        const outerShape = createPlateShape2D(
          "square",
          size,
          plateWidth,
          plateHeight,
          plateCornerRadius,
          modelResolution
        )

        const borderW = Math.min(trayBorderWidth, Math.min(plateWidth, plateHeight) / 4)
        const innerWidth = Math.max(1, plateWidth - 2 * borderW)
        const innerHeight = Math.max(1, plateHeight - 2 * borderW)
        const innerShape = createPlateShape2D(
          "square",
          size,
          innerWidth,
          innerHeight,
          0,
          modelResolution
        )

        if (outerShape && innerShape) {
          const outerPoly: MultiPoly = [shapeToPolygon(outerShape)]
          const innerPoly: MultiPoly = [shapeToPolygon(innerShape)]

          const clipPolys: Poly[] = []

          if (holes && holes.length > 0) {
            holes.forEach(hole => {
              const hShape = new THREE.Shape()
              // Holes are in world space; convert to plate-local so plate transform doesn't move them
              const local = toPlateLocal({ x: hole.x, y: hole.y }, platePosition)
              const shapeXY = toShapeXY(local)
              const rotated = rotate2D(shapeXY, -plateRotation)
              const hx = rotated.x
              const hy = rotated.y
              hShape.absarc(hx, hy, hole.radius, 0, Math.PI * 2, false)
              clipPolys.push(shapeToPolygon(hShape))
            })
          }

          for (const item of textItems) {
            const font = fontMap[item.fontUrl]
            if (!font) continue

            // Keep text in world space; convert to plate-local so plate rotation doesn't affect it
            const local = toPlateLocal({ x: item.position.x, y: item.position.y }, platePosition)
            const shapeXY = toShapeXY(local)
            const rotated = rotate2D(shapeXY, -plateRotation)
            const localItem = {
              ...item,
              position: { ...item.position, x: rotated.x, y: rotated.y },
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

            const shapeToPolygonWithTransform = (shape: THREE.Shape): Pair[][] => {
              const outerPts = transformPoints(shape.getPoints(curveSegments))
              const outer = pointsToRing(outerPts)
              const holesRings = shape.holes.map(h => pointsToRing(transformPoints(h.getPoints(curveSegments))))
              return [outer, ...holesRings]
            }

            shapes.forEach((s) => {
              const poly = shapeToPolygonWithTransform(s)
              clipPolys.push(poly)
            })
          }

          const holesUnion = clipPolys.length > 0
            ? clipPolys.reduce((acc, val) => polygonClipping.union(acc, val) as MultiPoly, [] as MultiPoly)
            : null

          let basePoly = outerPoly
          if (holesUnion) {
            basePoly = polygonClipping.difference(basePoly, holesUnion) as MultiPoly
          }

          let ringPoly = polygonClipping.difference(outerPoly, innerPoly) as MultiPoly
          if (holesUnion) {
            ringPoly = polygonClipping.difference(ringPoly, holesUnion) as MultiPoly
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

        const ringArea = (ring: Pair[]) => {
          let sum = 0
          for (let i = 0; i < ring.length - 1; i++) {
            const [x1, y1] = ring[i]
            const [x2, y2] = ring[i + 1]
            sum += (x1 * y2 - x2 * y1)
          }
          return sum / 2
        }

        const closeRing = (ring: Pair[]): Pair[] => {
          if (ring.length === 0) return ring
          const [x0, y0] = ring[0]
          const [xl, yl] = ring[ring.length - 1]
          if (x0 !== xl || y0 !== yl) ring.push([x0, y0])
          return ring
        }

        const pointsToRing = (pts: THREE.Vector2[]): Pair[] =>
          closeRing(pts.map(p => [p.x, p.y] as Pair))

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
            const path = new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y)))
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
          let platePoly: MultiPoly = [shapeToPolygon(plateShape2D)]
          const clipPolys: Poly[] = []

          if (holes && holes.length > 0) {
            holes.forEach(hole => {
              const hShape = new THREE.Shape()
              const local = toPlateLocal({ x: hole.x, y: hole.y }, platePosition)
              const shapeXY = toShapeXY(local)
              const rotated = rotate2D(shapeXY, -plateRotation)
              const hx = rotated.x
              const hy = rotated.y
              hShape.absarc(hx, hy, hole.radius, 0, Math.PI * 2, false)
              clipPolys.push(shapeToPolygon(hShape))
            })
          }

          for (const item of textItems) {
            const font = fontMap[item.fontUrl]
            if (!font) continue

            const local = toPlateLocal({ x: item.position.x, y: item.position.y }, platePosition)
            const shapeXY = toShapeXY(local)
            const rotated = rotate2D(shapeXY, -plateRotation)
            const localItem = {
              ...item,
              position: { ...item.position, x: rotated.x, y: rotated.y },
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

            const shapeToPolygonWithTransform = (shape: THREE.Shape): Pair[][] => {
              const outerPts = transformPoints(shape.getPoints(curveSegments))
              const outer = pointsToRing(outerPts)
              const holesRings = shape.holes.map(h => pointsToRing(transformPoints(h.getPoints(curveSegments))))
              return [outer, ...holesRings]
            }

            shapes.forEach((s) => {
              const poly = shapeToPolygonWithTransform(s)
              clipPolys.push(poly)
            })
          }

          if (clipPolys.length > 0) {
            const clipUnion = clipPolys.reduce((acc, val) => polygonClipping.union(acc, val) as MultiPoly, [] as MultiPoly)
            platePoly = polygonClipping.difference(platePoly, clipUnion) as MultiPoly
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
      
      return finalGeo

    } catch (error) {
      console.error('CSG Error:', error)
      return createPlateGeometry(
        plateShape, size, plateWidth, plateHeight, baseThickness, 
        plateCornerRadius, trayBorderWidth, trayBorderHeight, 
        edgeBevelEnabled, edgeBevelType, edgeBevelSize, 
        modelResolution, localHoles
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
      <mesh
        geometry={resultGeometry}
        onPointerDown={(e) => {
          if (!isTransformEnabled) return
          e.stopPropagation()
          setSelectedLayer("base")
        }}
      >
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
