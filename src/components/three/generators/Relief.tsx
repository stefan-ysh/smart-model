"use client";

import * as THREE from "three";
import { useMemo, Suspense } from "react";
import { useLoader } from "@react-three/fiber";
import { TextGeometry, Font } from "three-stdlib";
import { useModelStore, PlateShape, HoleItem } from "@/lib/store";
import { createPlateGeometry, createPlateShape2D } from "./plateShapes";
import { mergeBufferGeometries } from "three-stdlib";
import polygonClipping from "polygon-clipping";
import { UniversalFontLoader } from "@/utils/fontLoaderUtils";
import { toShapeXY } from "@/components/three/utils/coords";
import { LRUCache } from "@/components/three/utils/lru";

// Create plate geometry based on shape type (same as Stencil)
// Now imported from ./plateShapes

// Global caches for expensive geometries
const plateCache = new LRUCache<string, THREE.BufferGeometry>(20)
const textGeoCache = new LRUCache<string, THREE.BufferGeometry>(100)

function createReliefPlateGeometry2D(
  plateShape: PlateShape,
  size: number,
  plateWidth: number,
  plateHeight: number,
  baseThickness: number,
  plateCornerRadius: number,
  trayBorderWidth: number,
  trayBorderHeight: number,
  modelResolution: number,
  holes: HoleItem[] | undefined
): THREE.BufferGeometry | null {
  const curveSegments = 32 * Math.max(1, Math.min(5, modelResolution))

  type Pair = [number, number]

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
      const shapeXY = toShapeXY({ x: hole.x, y: hole.y })
      hShape.absarc(shapeXY.x, shapeXY.y, hole.radius, 0, Math.PI * 2, false)
      holePolys.push(shapeToPolygon(hShape))
    })
  }
  const holesUnion = holePolys.length > 0
    ? holePolys.reduce((acc, val) => polygonClipping.union(acc, val) as MultiPoly, [] as MultiPoly)
    : null

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

    const outerPoly: MultiPoly = [shapeToPolygon(outer)]
    const innerPoly: MultiPoly = [shapeToPolygon(inner)]

    let basePoly = outerPoly
    if (holesUnion) basePoly = polygonClipping.difference(basePoly, holesUnion) as MultiPoly

    let ringPoly = polygonClipping.difference(outerPoly, innerPoly) as MultiPoly
    if (holesUnion) ringPoly = polygonClipping.difference(ringPoly, holesUnion) as MultiPoly

    const baseGeos: THREE.BufferGeometry[] = []
    for (const poly of basePoly) {
      const shape = buildShapeFromPolygon(poly)
      if (!shape) continue
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: baseThickness,
        bevelEnabled: false,
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
        bevelEnabled: false,
        curveSegments
      }).translate(0, 0, baseThickness / 2)
      ringGeos.push(geo)
    }

    const mergedBase = baseGeos.length === 1 ? baseGeos[0] : mergeBufferGeometries(baseGeos)
    const mergedRing = ringGeos.length === 1 ? ringGeos[0] : mergeBufferGeometries(ringGeos)
    const merged = mergeBufferGeometries([mergedBase, mergedRing].filter(Boolean) as THREE.BufferGeometry[])
    return merged || mergedBase || mergedRing || null
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

  let platePoly: MultiPoly = [shapeToPolygon(shape2D)]
  if (holesUnion) {
    platePoly = polygonClipping.difference(platePoly, holesUnion) as MultiPoly
  }

  const geos: THREE.BufferGeometry[] = []
  for (const poly of platePoly) {
    const shape = buildShapeFromPolygon(poly)
    if (!shape) continue
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: baseThickness,
      bevelEnabled: false,
      curveSegments
    }).translate(0, 0, -baseThickness / 2)
    geos.push(geo)
  }
  return geos.length === 1 ? geos[0] : mergeBufferGeometries(geos)
}

function ReliefMesh() {
  const { parameters } = useModelStore();
  const setSelectedLayer = useModelStore(state => state.setSelectedLayer)
  const isTransformEnabled = useModelStore(state => state.isTransformEnabled)
  const {
    size,
    baseThickness,
    textItems,
    plateShape,
    plateWidth,
    plateHeight,
    platePosition,
    plateRotation,
    plateCornerRadius,
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
  } = parameters;


  // Load all unique fonts needed
  const fontUrls = useMemo(() => 
    [...new Set(textItems.map((item) => item.fontUrl))],
    [textItems]
  );
  
  // Use UniversalFontLoader to share cache with Stencil
  const fonts = useLoader(UniversalFontLoader, fontUrls);

  // Create font map
  const fontMap = useMemo(() => {
    const map: Record<string, Font> = {};
    fontUrls.forEach((url, i) => {
      map[url] = fonts[i] as Font;
    });
    return map;
  }, [fonts, fontUrls]);

  // Create text meshes - each with its own reliefHeight
  const textMeshes = useMemo(() => {
    if (Object.keys(fontMap).length === 0) return [];

    return textItems
      .map((item) => {
        const font = fontMap[item.fontUrl];
        if (!font) return null;

        const cacheKey = JSON.stringify({
          content: item.content,
          fontUrl: item.fontUrl,
          fontSize: item.fontSize,
          reliefHeight: item.reliefHeight,
        })

        let textGeo: THREE.BufferGeometry
        const cached = textGeoCache.get(cacheKey)
        if (cached) {
          textGeo = cached
        } else {
          try {
            textGeo = new TextGeometry(item.content || " ", {
              font: font,
              size: item.fontSize,
              height: item.reliefHeight,
              curveSegments: 4,
              bevelEnabled: false,
            });

            // Center the text
            textGeo.computeBoundingBox();
            if (textGeo.boundingBox) {
              const centerX =
                (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x) / 2;
              const centerY =
                (textGeo.boundingBox.max.y - textGeo.boundingBox.min.y) / 2;
              textGeo.translate(-centerX, -centerY, 0);
            }

            textGeoCache.set(cacheKey, textGeo)
          } catch (e) {
            console.error("Error creating text geometry:", e);
            return null;
          }
        }

        return {
          geometry: textGeo,
          position: item.position,
          rotation: item.rotation,
          reliefHeight: item.reliefHeight,
          id: item.id,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [fontMap, textItems]);

  // Create plate geometry
  const plateGeo = useMemo(() => {
    const cacheKey = JSON.stringify({
      plateShape, size, plateWidth, plateHeight, baseThickness, plateCornerRadius, trayBorderWidth, trayBorderHeight, edgeBevelEnabled, edgeBevelType, edgeBevelSize, modelResolution, holes
    })

    const cached = plateCache.get(cacheKey)
    if (cached) return cached

    const geo = createReliefPlateGeometry2D(
      plateShape,
      size,
      plateWidth,
      plateHeight,
      baseThickness,
      plateCornerRadius,
      trayBorderWidth,
      trayBorderHeight,
      modelResolution,
      holes
    ) || createPlateGeometry(
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
    );


    if (geo) {
      plateCache.set(cacheKey, geo)
    }

    return geo
  }, [plateShape, size, plateWidth, plateHeight, baseThickness, plateCornerRadius, trayBorderWidth, trayBorderHeight, edgeBevelEnabled, edgeBevelType, edgeBevelSize, modelResolution, holes]);

  return (
    <>
      {/* Base Plate - independent transform */}
      <group
        rotation={[-Math.PI / 2, 0, (plateRotation * Math.PI) / 180]}
        position={[platePosition.x, baseThickness / 2, platePosition.y]}
      >
        {plateGeo && (
          <mesh
            geometry={plateGeo}
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
            />
          </mesh>
        )}
      </group>

      {/* Text Items - independent transforms */}
      {textMeshes.map((item: { id: string; rotation: number; position: { x: number; y: number }; geometry: THREE.BufferGeometry }) => (
        <group
          key={item.id}
          rotation={[-Math.PI / 2, 0, (item.rotation * Math.PI) / 180]}
          position={[item.position.x, baseThickness, item.position.y]}
        >
          <mesh geometry={item.geometry}>
            <meshStandardMaterial
              color={textColor}
              roughness={roughness}
              metalness={metalness}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function ReliefGenerator() {
  return (
    <Suspense
      fallback={
        <mesh>
          <boxGeometry args={[20, 20, 2]} />
          <meshStandardMaterial color="gray" transparent opacity={0.5} />
        </mesh>
      }
    >
      <ReliefMesh />
    </Suspense>
  );
}
