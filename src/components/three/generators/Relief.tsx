"use client";

import * as THREE from "three";
import { useMemo, Suspense } from "react";
import { useLoader } from "@react-three/fiber";
import { FontLoader, TextGeometry } from "three-stdlib";
import { useModelStore, TextItem } from "@/lib/store";
import { createPlateGeometry } from "./plateShapes";

// Create plate geometry based on shape type (same as Stencil)
// Now imported from ./plateShapes

// Global caches for expensive geometries
const plateCache = new Map<string, THREE.BufferGeometry>()
const textGeoCache = new Map<string, THREE.BufferGeometry>()

function ReliefMesh() {
  const { parameters } = useModelStore();
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
  
  const fonts = useLoader(FontLoader, fontUrls);

  // Create font map
  const fontMap = useMemo(() => {
    const map: Record<string, any> = {};
    fontUrls.forEach((url, i) => {
      map[url] = fonts[i];
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
        if (textGeoCache.has(cacheKey)) {
          textGeo = textGeoCache.get(cacheKey)!
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
            
            // Limit cache size
            if (textGeoCache.size > 100) {
              const firstKey = textGeoCache.keys().next().value
              if (firstKey) {
                const oldGeo = textGeoCache.get(firstKey)
                if (oldGeo) oldGeo.dispose()
                textGeoCache.delete(firstKey)
              }
            }
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
      .filter(Boolean);
  }, [fontMap, textItems]);

  // Create plate geometry
  const plateGeo = useMemo(() => {
    const cacheKey = JSON.stringify({
      plateShape, size, plateWidth, plateHeight, baseThickness, plateCornerRadius
    })

    if (plateCache.has(cacheKey)) {
      return plateCache.get(cacheKey)!
    }

    const geo = createPlateGeometry(
      plateShape,
      size,
      plateWidth,
      plateHeight,
      baseThickness,
      plateCornerRadius,
    );

    plateCache.set(cacheKey, geo)
    
    // Limit cache size
    if (plateCache.size > 20) {
      const firstKey = plateCache.keys().next().value
      if (firstKey) {
        const oldGeo = plateCache.get(firstKey)
        if (oldGeo) oldGeo.dispose()
        plateCache.delete(firstKey)
      }
    }

    return geo
  }, [plateShape, size, plateWidth, plateHeight, baseThickness, plateCornerRadius]);

  return (
    <>
      {/* Base Plate - independent transform */}
      <group
        rotation={[-Math.PI / 2, 0, (plateRotation * Math.PI) / 180]}
        position={[platePosition.x, baseThickness / 2, platePosition.y]}
      >
        <mesh geometry={plateGeo}>
          <meshStandardMaterial
            color={plateColor}
            roughness={roughness}
            metalness={metalness}
          />
        </mesh>
      </group>

      {/* Text Items - independent transforms */}
      {textMeshes.map((item: any) => (
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
