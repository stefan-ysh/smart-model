"use client";

import * as THREE from "three";
import { useMemo, Suspense } from "react";
import { useLoader } from "@react-three/fiber";
import { FontLoader, TextGeometry } from "three-stdlib";
import { useModelStore, PlateShape, TextItem } from "@/lib/store";

// Create plate geometry based on shape type (same as Stencil)
function createPlateGeometry(
  shape: PlateShape,
  size: number,
  width: number,
  height: number,
  thickness: number,
  cornerRadius: number = 0,
): THREE.BufferGeometry {
  switch (shape) {
    case "rectangle": {
      // Use rounded rectangle if cornerRadius > 0
      if (cornerRadius > 0) {
        const maxRadius = Math.min(width, height) / 2 - 1;
        const r = Math.min(cornerRadius, maxRadius);
        const rectShape = new THREE.Shape();
        const w = width / 2;
        const h = height / 2;
        
        rectShape.moveTo(-w + r, -h);
        rectShape.lineTo(w - r, -h);
        rectShape.quadraticCurveTo(w, -h, w, -h + r);
        rectShape.lineTo(w, h - r);
        rectShape.quadraticCurveTo(w, h, w - r, h);
        rectShape.lineTo(-w + r, h);
        rectShape.quadraticCurveTo(-w, h, -w, h - r);
        rectShape.lineTo(-w, -h + r);
        rectShape.quadraticCurveTo(-w, -h, -w + r, -h);
        
        return new THREE.ExtrudeGeometry(rectShape, {
          depth: thickness,
          bevelEnabled: false,
        }).translate(0, 0, -thickness / 2);
      }
      return new THREE.BoxGeometry(width, height, thickness);
    }

    case "circle":
      return new THREE.CylinderGeometry(
        size / 2,
        size / 2,
        thickness,
        64,
      ).rotateX(Math.PI / 2);


    case "diamond": {
      const diamondShape = new THREE.Shape();
      const half = size / 2;
      // Simple diamond shape - bevel will round the corners
      diamondShape.moveTo(0, half);
      diamondShape.lineTo(half, 0);
      diamondShape.lineTo(0, -half);
      diamondShape.lineTo(-half, 0);
      diamondShape.closePath();
      
      const bevelRadius = cornerRadius / 2;
      return new THREE.ExtrudeGeometry(diamondShape, {
        depth: thickness,
        bevelEnabled: cornerRadius > 0,
        bevelThickness: bevelRadius,
        bevelSize: bevelRadius,
        bevelSegments: 4,
      }).translate(0, 0, -thickness / 2 - (cornerRadius > 0 ? bevelRadius : 0));
    }

    case "star": {
      const starShape = new THREE.Shape();
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      const points = 5;
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
      }
      starShape.closePath();
      return new THREE.ExtrudeGeometry(starShape, {
        depth: thickness,
        bevelEnabled: cornerRadius > 0,
        bevelThickness: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSize: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSegments: cornerRadius > 0 ? 3 : 1,
      }).translate(0, 0, -thickness / 2);
    }

    case "wave": {
      // Smooth rounded rectangle with wavy sides
      const waveShape = new THREE.Shape();
      const w = size * 0.8;
      const h = size * 0.5;
      const waveAmp = size * 0.08; // Wave amplitude

      // Start bottom-left, go clockwise
      waveShape.moveTo(-w / 2, -h / 2);

      // Bottom edge (straight)
      waveShape.lineTo(w / 2, -h / 2);

      // Right edge (wavy)
      waveShape.bezierCurveTo(
        w / 2 + waveAmp,
        -h / 4,
        w / 2 - waveAmp,
        h / 4,
        w / 2,
        h / 2,
      );

      // Top edge (straight)
      waveShape.lineTo(-w / 2, h / 2);

      // Left edge (wavy - mirrored)
      waveShape.bezierCurveTo(
        -w / 2 - waveAmp,
        h / 4,
        -w / 2 + waveAmp,
        -h / 4,
        -w / 2,
        -h / 2,
      );

      return new THREE.ExtrudeGeometry(waveShape, {
        depth: thickness,
        bevelEnabled: cornerRadius > 0,
        bevelThickness: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSize: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSegments: cornerRadius > 0 ? 3 : 1,
        curveSegments: 32,
      }).translate(0, 0, -thickness / 2);
    }

    case "heart": {
      // Proper heart shape with smooth curves
      const heartShape = new THREE.Shape();
      const s = size / 2;

      // Start at bottom point
      heartShape.moveTo(0, -s * 0.7);

      // Left curve going up
      heartShape.bezierCurveTo(
        -s * 0.1,
        -s * 0.4, // control 1
        -s * 0.7,
        -s * 0.4, // control 2
        -s * 0.7,
        s * 0.1, // end point (left bump bottom)
      );

      // Left top bump
      heartShape.bezierCurveTo(
        -s * 0.7,
        s * 0.5, // control 1
        -s * 0.35,
        s * 0.7, // control 2
        0,
        s * 0.4, // top center dip
      );

      // Right top bump (mirror)
      heartShape.bezierCurveTo(
        s * 0.35,
        s * 0.7, // control 1
        s * 0.7,
        s * 0.5, // control 2
        s * 0.7,
        s * 0.1, // end point (right bump bottom)
      );

      // Right curve going down
      heartShape.bezierCurveTo(
        s * 0.7,
        -s * 0.4, // control 1
        s * 0.1,
        -s * 0.4, // control 2
        0,
        -s * 0.7, // back to bottom point
      );

      return new THREE.ExtrudeGeometry(heartShape, {
        depth: thickness,
        bevelEnabled: cornerRadius > 0,
        bevelThickness: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSize: cornerRadius > 0 ? cornerRadius / 3 : 0,
        bevelSegments: cornerRadius > 0 ? 3 : 1,
        curveSegments: 32,
      }).translate(0, 0, -thickness / 2);
    }

    case "square":
    default: {
      // Use rounded square if cornerRadius > 0
      if (cornerRadius > 0) {
        const maxRadius = size / 2 - 1;
        const r = Math.min(cornerRadius, maxRadius);
        const rectShape = new THREE.Shape();
        const half = size / 2;
        
        rectShape.moveTo(-half + r, -half);
        rectShape.lineTo(half - r, -half);
        rectShape.quadraticCurveTo(half, -half, half, -half + r);
        rectShape.lineTo(half, half - r);
        rectShape.quadraticCurveTo(half, half, half - r, half);
        rectShape.lineTo(-half + r, half);
        rectShape.quadraticCurveTo(-half, half, -half, half - r);
        rectShape.lineTo(-half, -half + r);
        rectShape.quadraticCurveTo(-half, -half, -half + r, -half);
        
        return new THREE.ExtrudeGeometry(rectShape, {
          depth: thickness,
          bevelEnabled: false,
        }).translate(0, 0, -thickness / 2);
      }
      return new THREE.BoxGeometry(size, size, thickness);
    }
  }
}

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
  const fontUrls = [...new Set(textItems.map((item) => item.fontUrl))];
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

        try {
          const textGeo = new TextGeometry(item.content || " ", {
            font: font,
            size: item.fontSize,
            height: item.reliefHeight, // Use per-item reliefHeight
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

          return {
            geometry: textGeo,
            position: item.position,
            rotation: item.rotation,
            reliefHeight: item.reliefHeight,
            id: item.id,
          };
        } catch (e) {
          console.error("Error creating text geometry:", e);
          return null;
        }
      })
      .filter(Boolean);
  }, [fontMap, textItems]);

  // Create plate geometry
  const plateGeo = useMemo(() => {
    return createPlateGeometry(
      plateShape,
      size,
      plateWidth,
      plateHeight,
      baseThickness,
      plateCornerRadius,
    );
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
