import * as THREE from "three";
import { PlateShape, HoleItem } from "@/lib/store";
import { getSubtractionGeometries, subtractGeometries } from "./plateShapes.csg";
import { createTemplatePlateGeometry } from "./plateShapes.template";
import { createTrayGeometry } from "./plateShapes.tray";
export { createPlateShape2D } from "./plateShapes.2d";


/**
 * Create plate geometry based on shape type
 * Used by Relief, ImageRelief and Stencil generators
 * 
 * For Relief and ImageRelief: holes are applied here via CSG
 * For Stencil: pass empty holes array since Stencil handles holes+text together
 */
export function createPlateGeometry(
  shape: PlateShape,
  size: number,
  width: number,
  height: number,
  thickness: number,
  cornerRadius: number = 0,
  trayBorderWidth: number = 5,
  trayBorderHeight: number = 5,
  edgeBevelEnabled: boolean = false,
  edgeBevelType: 'round' | 'chamfer' = 'round',
  edgeBevelSize: number = 0,
  modelResolution: number = 3,
  holes: HoleItem[] = [],
  extraCutters: THREE.BufferGeometry[] = []
): THREE.BufferGeometry | null {
  try {
    const geo = createPlateGeometryInternal(
      shape, size, width, height, thickness, 
      cornerRadius, trayBorderWidth, trayBorderHeight, 
      edgeBevelEnabled, edgeBevelType, edgeBevelSize, 
      modelResolution, holes, extraCutters
    );
    
    // If it's a tray, it's already sanitized and subtractive
    if (shape === 'tray' || !geo) return geo;
    
    // For other shapes, we need to apply holes and extra cutters here
    // Verify if we have anything to cut
    if ((holes && holes.length > 0) || (extraCutters && extraCutters.length > 0)) {
       const cutters = getSubtractionGeometries(holes, extraCutters, thickness + 40);
       if (cutters.length > 0) {
          return subtractGeometries(geo, cutters);
       }
    }
    
    return geo;
  } catch (err) {
    console.error("Plate generation error:", err);
    return null;
  }
}


function createPlateGeometryInternal(
  shape: PlateShape,
  size: number,
  width: number,
  height: number,
  thickness: number,
  cornerRadius: number,
  trayBorderWidth: number,
  trayBorderHeight: number,
  edgeBevelEnabled: boolean,
  edgeBevelType: 'round' | 'chamfer',
  edgeBevelSize: number,
  modelResolution: number,
  holes: HoleItem[],
  extraCutters: THREE.BufferGeometry[]
): THREE.BufferGeometry | null {
  // Calculate segments based on resolution (1-5)
  // Low (1): 32 segments, Medium (3): 64 segments, High (5): 128 segments
  const baseSegments = 32 * Math.max(1, Math.min(5, modelResolution));
  // Bevel segments: Low (1): 1-2, Medium (3): 3-4, High (5): 5-8
  const bevelSegs = edgeBevelType === 'round' ? Math.max(2, modelResolution * 2) : 1;
  const cornerBevelSegs = Math.max(2, modelResolution);


  // Calculate bevel settings based on edge bevel params
  const getBevelSettings = () => {
    if (!edgeBevelEnabled) {
      return {
        bevelEnabled: false,
        bevelThickness: 0,
        bevelSize: 0,
        bevelSegments: 1,
        curveSegments: baseSegments,
      };
    }
    // Round type uses more segments for smooth curves
    // Chamfer type uses 1 segment for sharp angled edge
    // curveSegments affects the smoothness of curved outlines (circles, arcs)
    return {
      bevelEnabled: true,
      bevelThickness: edgeBevelSize,
      bevelSize: edgeBevelSize,
      bevelSegments: bevelSegs,
      curveSegments: baseSegments,
    };
  };

  const extrudeSettings = (bevel: boolean = false) => ({
    depth: thickness,
    bevelEnabled: bevel && cornerRadius > 0,
    bevelThickness: cornerRadius > 0 ? cornerRadius / 3 : 0,
    bevelSize: cornerRadius > 0 ? cornerRadius / 3 : 0,
    bevelSegments: cornerBevelSegs,
    curveSegments: baseSegments,
  });

  const applyHoles = (shape: THREE.Shape) => {
    if (!holes || holes.length === 0) return;
    holes.forEach((hole) => {
      const holePath = new THREE.Path();
      holePath.absarc(hole.x, hole.y, hole.radius, 0, Math.PI * 2, false);
      shape.holes.push(holePath);
    });
  };

  switch (shape) {
    case "rectangle": {
      const bevelSettings = getBevelSettings();
      const maxRadius = cornerRadius > 0 ? Math.min(width, height) / 2 - 1 : 0;
      const r = Math.min(cornerRadius, maxRadius);
      const rectShape = new THREE.Shape();
      const w = width / 2;
      const h = height / 2;

      if (r > 0) {
        rectShape.moveTo(-w + r, -h);
        rectShape.lineTo(w - r, -h);
        rectShape.quadraticCurveTo(w, -h, w, -h + r);
        rectShape.lineTo(w, h - r);
        rectShape.quadraticCurveTo(w, h, w - r, h);
        rectShape.lineTo(-w + r, h);
        rectShape.quadraticCurveTo(-w, h, -w, h - r);
        rectShape.lineTo(-w, -h + r);
        rectShape.quadraticCurveTo(-w, -h, -w + r, -h);
      } else {
        rectShape.moveTo(-w, -h);
        rectShape.lineTo(w, -h);
        rectShape.lineTo(w, h);
        rectShape.lineTo(-w, h);
        rectShape.lineTo(-w, -h);
      }
      applyHoles(rectShape);

      const zOffset = bevelSettings.bevelEnabled ? bevelSettings.bevelThickness : 0;
      return new THREE.ExtrudeGeometry(rectShape, {
        depth: thickness,
        ...bevelSettings,
      }).translate(0, 0, -thickness / 2 - zOffset);
    }

    case "rounded": {
      const bevelSettings = getBevelSettings();
      const r = Math.min(size / 5, 15);
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
      
      applyHoles(rectShape);

      const zOffset = bevelSettings.bevelEnabled ? bevelSettings.bevelThickness : 0;
      return new THREE.ExtrudeGeometry(rectShape, {
        depth: thickness,
        ...bevelSettings,
      }).translate(0, 0, -thickness / 2 - zOffset);
    }

    case "circle": {
      const bevelSettings = getBevelSettings();
      const circleShape = new THREE.Shape();
      circleShape.absarc(0, 0, size / 2, 0, Math.PI * 2, false);
      applyHoles(circleShape);

      const zOffset = bevelSettings.bevelEnabled ? bevelSettings.bevelThickness : 0;
      return new THREE.ExtrudeGeometry(circleShape, {
        depth: thickness,
        ...bevelSettings,
      }).translate(0, 0, -thickness / 2 - zOffset);
    }

    case "oval": {
      const ovalShape = new THREE.Shape();
      ovalShape.ellipse(0, 0, size / 2, size / 3, 0, Math.PI * 2, false, 0);
      applyHoles(ovalShape);

      return new THREE.ExtrudeGeometry(ovalShape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: baseSegments,
      }).translate(0, 0, -thickness / 2);
    }

    case "hexagon": {
      const hexShape = new THREE.Shape();
      const r = size / 2;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) hexShape.moveTo(x, y);
        else hexShape.lineTo(x, y);
      }
      hexShape.closePath();
      applyHoles(hexShape);
      return new THREE.ExtrudeGeometry(hexShape, extrudeSettings(true)).translate(
        0,
        0,
        -thickness / 2
      );
    }

    case "pentagon": {
      const pentShape = new THREE.Shape();
      const r = size / 2;
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) pentShape.moveTo(x, y);
        else pentShape.lineTo(x, y);
      }
      pentShape.closePath();
      applyHoles(pentShape);
      return new THREE.ExtrudeGeometry(pentShape, extrudeSettings(true)).translate(
        0,
        0,
        -thickness / 2
      );
    }

    case "diamond": {
      const diamondShape = new THREE.Shape();
      const half = size / 2;
      diamondShape.moveTo(0, half);
      diamondShape.lineTo(half, 0);
      diamondShape.lineTo(0, -half);
      diamondShape.lineTo(-half, 0);
      diamondShape.closePath();
      
      applyHoles(diamondShape);

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
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
      }
      starShape.closePath();
      return new THREE.ExtrudeGeometry(starShape, extrudeSettings(true)).translate(
        0,
        0,
        -thickness / 2
      );
    }

    case "cross": {
      const crossShape = new THREE.Shape();
      const arm = size / 2;
      const w = size / 4;
      crossShape.moveTo(-w, arm);
      crossShape.lineTo(w, arm);
      crossShape.lineTo(w, w);
      crossShape.lineTo(arm, w);
      crossShape.lineTo(arm, -w);
      crossShape.lineTo(w, -w);
      crossShape.lineTo(w, -arm);
      crossShape.lineTo(-w, -arm);
      crossShape.lineTo(-w, -w);
      crossShape.lineTo(-arm, -w);
      crossShape.lineTo(-arm, w);
      crossShape.lineTo(-w, w);
      crossShape.closePath();
      return new THREE.ExtrudeGeometry(crossShape, extrudeSettings(true)).translate(
        0,
        0,
        -thickness / 2
      );
    }

    case "cloud": {
      const cloudShape = new THREE.Shape();
      const s = size / 2;
      cloudShape.moveTo(-s * 0.6, -s * 0.2);
      cloudShape.bezierCurveTo(-s * 0.8, -s * 0.4, -s * 0.6, -s * 0.6, -s * 0.3, -s * 0.5);
      cloudShape.bezierCurveTo(-s * 0.1, -s * 0.7, s * 0.2, -s * 0.6, s * 0.4, -s * 0.4);
      cloudShape.bezierCurveTo(s * 0.7, -s * 0.5, s * 0.8, -s * 0.2, s * 0.7, 0);
      cloudShape.bezierCurveTo(s * 0.9, s * 0.2, s * 0.7, s * 0.5, s * 0.4, s * 0.4);
      cloudShape.bezierCurveTo(s * 0.2, s * 0.6, -s * 0.1, s * 0.5, -s * 0.3, s * 0.3);
      cloudShape.bezierCurveTo(-s * 0.6, s * 0.5, -s * 0.8, s * 0.2, -s * 0.7, -s * 0.1);
      cloudShape.bezierCurveTo(-s * 0.9, -s * 0.2, -s * 0.8, -s * 0.3, -s * 0.6, -s * 0.2);
      return new THREE.ExtrudeGeometry(cloudShape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 32,
      }).translate(0, 0, -thickness / 2);
    }

    case "shield": {
      const shieldShape = new THREE.Shape();
      const s = size / 2;
      shieldShape.moveTo(0, -s * 0.9);
      shieldShape.bezierCurveTo(s * 0.3, -s * 0.7, s * 0.6, -s * 0.4, s * 0.7, 0);
      shieldShape.bezierCurveTo(s * 0.7, s * 0.4, s * 0.5, s * 0.7, 0, s * 0.9);
      shieldShape.bezierCurveTo(-s * 0.5, s * 0.7, -s * 0.7, s * 0.4, -s * 0.7, 0);
      shieldShape.bezierCurveTo(-s * 0.6, -s * 0.4, -s * 0.3, -s * 0.7, 0, -s * 0.9);
      return new THREE.ExtrudeGeometry(shieldShape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 32,
      }).translate(0, 0, -thickness / 2);
    }

    case "badge": {
      const badgeShape = new THREE.Shape();
      const outer = size / 2;
      const inner = size / 2.5;
      for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI) / 8 - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) badgeShape.moveTo(x, y);
        else badgeShape.lineTo(x, y);
      }
      badgeShape.closePath();
      return new THREE.ExtrudeGeometry(badgeShape, extrudeSettings(true)).translate(
        0,
        0,
        -thickness / 2
      );
    }

    case "wave": {
      const waveShape = new THREE.Shape();
      const w = size * 0.8;
      const h = size * 0.5;
      const waveAmp = size * 0.08;

      waveShape.moveTo(-w / 2, -h / 2);
      waveShape.lineTo(w / 2, -h / 2);
      waveShape.bezierCurveTo(w / 2 + waveAmp, -h / 4, w / 2 - waveAmp, h / 4, w / 2, h / 2);
      waveShape.lineTo(-w / 2, h / 2);
      waveShape.bezierCurveTo(-w / 2 - waveAmp, h / 4, -w / 2 + waveAmp, -h / 4, -w / 2, -h / 2);

      return new THREE.ExtrudeGeometry(waveShape, extrudeSettings(true)).translate(
        0,
        0,
        -thickness / 2
      );
    }

    case "heart": {
      const heartShape = new THREE.Shape();
      const s = size / 2;

      heartShape.moveTo(0, -s * 0.7);
      heartShape.bezierCurveTo(-s * 0.1, -s * 0.4, -s * 0.7, -s * 0.4, -s * 0.7, s * 0.1);
      heartShape.bezierCurveTo(-s * 0.7, s * 0.5, -s * 0.35, s * 0.7, 0, s * 0.4);
      heartShape.bezierCurveTo(s * 0.35, s * 0.7, s * 0.7, s * 0.5, s * 0.7, s * 0.1);
      heartShape.bezierCurveTo(s * 0.7, -s * 0.4, s * 0.1, -s * 0.4, 0, -s * 0.7);

      return new THREE.ExtrudeGeometry(heartShape, extrudeSettings(true)).translate(
        0,
        0,
        -thickness / 2
      );
    }

    case "nameplate":
    case "keychain":
    case "tag":
    case "coaster":
    case "doorSign":
    case "petBone":
    case "trophy":
    case "frame":
      return createTemplatePlateGeometry(shape, size, thickness);

    case "tray":
      return createTrayGeometry(
        width,
        height,
        thickness,
        trayBorderWidth,
        trayBorderHeight,
        holes,
        extraCutters
      );




    case "square":
    default: {
      const bevelSettings = getBevelSettings();
      const maxRadius = cornerRadius > 0 ? Math.min(width, height) / 2 - 1 : 0;
      const r = Math.min(cornerRadius, maxRadius);
      const rectShape = new THREE.Shape();
      const halfW = width / 2;
      const halfH = height / 2;

      if (r > 0) {
        rectShape.moveTo(-halfW + r, -halfH);
        rectShape.lineTo(halfW - r, -halfH);
        rectShape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
        rectShape.lineTo(halfW, halfH - r);
        rectShape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
        rectShape.lineTo(-halfW + r, halfH);
        rectShape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
        rectShape.lineTo(-halfW, -halfH + r);
        rectShape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);
      } else {
        rectShape.moveTo(-halfW, -halfH);
        rectShape.lineTo(halfW, -halfH);
        rectShape.lineTo(halfW, halfH);
        rectShape.lineTo(-halfW, halfH);
        rectShape.lineTo(-halfW, -halfH);
      }
      applyHoles(rectShape);

      const zOffset = bevelSettings.bevelEnabled ? bevelSettings.bevelThickness : 0;
      return new THREE.ExtrudeGeometry(rectShape, {
        depth: thickness,
        ...bevelSettings,
      }).translate(0, 0, -thickness / 2 - zOffset);
    }
  }
}
