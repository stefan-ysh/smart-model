import * as THREE from "three";
import { PlateShape, HoleItem } from "@/lib/store";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";

/**
 * Sanitize geometry:
 * 1. Ensure non-indexed triangles
 * 2. Remove degenerate triangles by area
 * 3. Fix NaN normals/positions
 */
function prepareCSGGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const posAttr = geometry.attributes.position;
  if (!posAttr || !posAttr.array) {
    return new THREE.BufferGeometry();
  }

  const prepared = geometry.clone();

  if (!prepared.index) {
    const vertexCount = prepared.attributes.position.count;
    const indices = new Uint32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) {
      indices[i] = i;
    }
    prepared.setIndex(new THREE.BufferAttribute(indices, 1));
  }

  if (!prepared.attributes.normal) {
    prepared.computeVertexNormals();
  }

  if (!prepared.attributes.uv) {
    const uv = new Float32Array(prepared.attributes.position.count * 2);
    prepared.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  }

  const positions = prepared.attributes.position.array as Float32Array;
  for (let i = 0; i < positions.length; i++) {
    if (Number.isNaN(positions[i])) positions[i] = 0;
  }

  const normals = prepared.attributes.normal.array as Float32Array;
  for (let i = 0; i < normals.length; i++) {
    if (Number.isNaN(normals[i])) normals[i] = 0;
  }

  return prepared;
}

function hasValidPosition(geometry: THREE.BufferGeometry): boolean {
  const pos = geometry.attributes.position;
  return !!(pos && pos.array && pos.count >= 3);
}

function hasValidIndex(geometry: THREE.BufferGeometry): boolean {
  const idx = geometry.index as THREE.BufferAttribute | null;
  return !!(idx && idx.array && idx.count >= 3);
}

function hasValidCSGData(geometry: THREE.BufferGeometry): boolean {
  return hasValidPosition(geometry) && hasValidIndex(geometry);
}

function getSubtractionGeometries(
  holes: HoleItem[] | undefined,
  extraCutters: THREE.BufferGeometry[] | undefined,
  thickness: number,
  xOffset: number = 0,
  yOffset: number = 0
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];
  
  // Add holes
  if (holes && holes.length > 0) {
    // Make holes deep enough to cut through
    const holeDepth = thickness; 
    holes.forEach(hole => {
      const cyl = new THREE.CylinderGeometry(hole.radius, hole.radius, holeDepth, 32);
      cyl.rotateX(Math.PI / 2);
      cyl.translate(hole.x + xOffset, -hole.y + yOffset, 0); 
      const prepared = prepareCSGGeometry(cyl);
      geometries.push(prepared);
      cyl.dispose();
    });
  }
  
  // Add extra cutters (like text)
  if (extraCutters && extraCutters.length > 0) {
    extraCutters.forEach(cutter => {
      const prepared = prepareCSGGeometry(cutter);
      geometries.push(prepared);
    });
  }
  
  return geometries;
}

function subtractGeometries(
  base: THREE.BufferGeometry,
  cutters: THREE.BufferGeometry[]
): THREE.BufferGeometry {
  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  evaluator.attributes = ['position', 'normal'];
  let current = prepareCSGGeometry(base);
  if (!hasValidCSGData(current)) {
    return current;
  }
  if (current !== base) base.dispose();

  for (const cutter of cutters) {
    const preparedCutter = prepareCSGGeometry(cutter);
    if (!hasValidCSGData(preparedCutter)) {
      preparedCutter.dispose();
      continue;
    }
    let result;
    try {
      result = evaluator.evaluate(
        new Brush(current),
        new Brush(preparedCutter),
        SUBTRACTION
      );
    } catch (err) {
      console.error("CSG evaluate error:", err);
      preparedCutter.dispose();
      continue;
    }

    preparedCutter.dispose();
    current.dispose();

    current = prepareCSGGeometry(result.geometry);
    if (!hasValidCSGData(current)) {
      break;
    }
  }

  return current;
}


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

export function createPlateShape2D(
  shape: PlateShape,
  size: number,
  width: number,
  height: number,
  cornerRadius: number = 0,
  modelResolution: number = 3
): THREE.Shape | null {
  const baseSegments = 32 * Math.max(1, Math.min(5, modelResolution));
  void baseSegments;

  switch (shape) {
    case "rectangle": {
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
      return rectShape;
    }

    case "rounded": {
      const r = Math.min(Math.min(width, height) / 5, 15);
      const rectShape = new THREE.Shape();
      const halfW = width / 2;
      const halfH = height / 2;

      rectShape.moveTo(-halfW + r, -halfH);
      rectShape.lineTo(halfW - r, -halfH);
      rectShape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
      rectShape.lineTo(halfW, halfH - r);
      rectShape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
      rectShape.lineTo(-halfW + r, halfH);
      rectShape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
      rectShape.lineTo(-halfW, -halfH + r);
      rectShape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);
      return rectShape;
    }

    case "circle": {
      const circleShape = new THREE.Shape();
      circleShape.absarc(0, 0, size / 2, 0, Math.PI * 2, false);
      return circleShape;
    }

    case "oval": {
      const ovalShape = new THREE.Shape();
      ovalShape.ellipse(0, 0, size / 2, size / 3, 0, Math.PI * 2, false, 0);
      return ovalShape;
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
      return hexShape;
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
      return pentShape;
    }

    case "diamond": {
      const diamondShape = new THREE.Shape();
      const half = size / 2;
      diamondShape.moveTo(0, half);
      diamondShape.lineTo(half, 0);
      diamondShape.lineTo(0, -half);
      diamondShape.lineTo(-half, 0);
      diamondShape.closePath();
      return diamondShape;
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
      return starShape;
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
      return crossShape;
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
      return cloudShape;
    }

    case "shield": {
      const shieldShape = new THREE.Shape();
      const s = size / 2;
      shieldShape.moveTo(0, -s * 0.9);
      shieldShape.bezierCurveTo(s * 0.3, -s * 0.7, s * 0.6, -s * 0.4, s * 0.7, 0);
      shieldShape.bezierCurveTo(s * 0.7, s * 0.4, s * 0.5, s * 0.7, 0, s * 0.9);
      shieldShape.bezierCurveTo(-s * 0.5, s * 0.7, -s * 0.7, s * 0.4, -s * 0.7, 0);
      shieldShape.bezierCurveTo(-s * 0.6, -s * 0.4, -s * 0.3, -s * 0.7, 0, -s * 0.9);
      return shieldShape;
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
      return badgeShape;
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
      return waveShape;
    }

    case "heart": {
      const heartShape = new THREE.Shape();
      const s = size / 2;

      heartShape.moveTo(0, -s * 0.7);
      heartShape.bezierCurveTo(-s * 0.1, -s * 0.4, -s * 0.7, -s * 0.4, -s * 0.7, s * 0.1);
      heartShape.bezierCurveTo(-s * 0.7, s * 0.5, -s * 0.35, s * 0.7, 0, s * 0.4);
      heartShape.bezierCurveTo(s * 0.35, s * 0.7, s * 0.7, s * 0.5, s * 0.7, s * 0.1);
      heartShape.bezierCurveTo(s * 0.7, -s * 0.4, s * 0.1, -s * 0.4, 0, -s * 0.7);
      return heartShape;
    }

    case "nameplate": {
      const npShape = new THREE.Shape();
      const w = size * 0.8;
      const h = size * 0.35;
      const r = h / 3;
      
      npShape.moveTo(-w + r, -h);
      npShape.lineTo(w - r, -h);
      npShape.quadraticCurveTo(w, -h, w, -h + r);
      npShape.lineTo(w, h - r);
      npShape.quadraticCurveTo(w, h, w - r, h);
      npShape.lineTo(-w + r, h);
      npShape.quadraticCurveTo(-w, h, -w, h - r);
      npShape.lineTo(-w, -h + r);
      npShape.quadraticCurveTo(-w, -h, -w + r, -h);
      return npShape;
    }

    case "keychain": {
      const kcShape = new THREE.Shape();
      const mainR = size / 2;
      kcShape.ellipse(0, 0, mainR, mainR, 0, Math.PI * 2, false, 0);
      return kcShape;
    }

    case "tag": {
      const tagShape = new THREE.Shape();
      const tw = size * 0.4;
      const th = size * 0.6;
      const tipH = size * 0.15;
      const tr = size * 0.05;
      
      tagShape.moveTo(-tw + tr, -th);
      tagShape.lineTo(tw - tr, -th);
      tagShape.quadraticCurveTo(tw, -th, tw, -th + tr);
      tagShape.lineTo(tw, th - tipH);
      tagShape.lineTo(0, th);
      tagShape.lineTo(-tw, th - tipH);
      tagShape.lineTo(-tw, -th + tr);
      tagShape.quadraticCurveTo(-tw, -th, -tw + tr, -th);
      return tagShape;
    }

    case "coaster": {
      const coasterShape = new THREE.Shape();
      const outerR = size / 2;
      coasterShape.ellipse(0, 0, outerR, outerR, 0, Math.PI * 2, false, 0);
      return coasterShape;
    }

    case "doorSign": {
      const dsShape = new THREE.Shape();
      const dw = size * 0.9;
      const dh = size * 0.4;
      const dr = dh / 4;
      
      dsShape.moveTo(-dw + dr, -dh);
      dsShape.lineTo(dw - dr, -dh);
      dsShape.quadraticCurveTo(dw, -dh, dw, -dh + dr);
      dsShape.lineTo(dw, dh - dr);
      dsShape.quadraticCurveTo(dw, dh, dw - dr, dh);
      dsShape.lineTo(-dw + dr, dh);
      dsShape.quadraticCurveTo(-dw, dh, -dw, dh - dr);
      dsShape.lineTo(-dw, -dh + dr);
      dsShape.quadraticCurveTo(-dw, -dh, -dw + dr, -dh);
      return dsShape;
    }

    case "petBone": {
      const boneShape = new THREE.Shape();
      const bw = size * 0.6;
      const bh = size * 0.25;
      const bulge = size * 0.15;
      
      boneShape.moveTo(bw, -bh);
      boneShape.bezierCurveTo(bw + bulge, -bh - bulge, bw + bulge * 2, 0, bw + bulge, bh + bulge);
      boneShape.bezierCurveTo(bw + bulge * 0.5, bh + bulge * 0.5, bw, bh, bw, bh);
      boneShape.lineTo(-bw, bh);
      boneShape.bezierCurveTo(-bw, bh, -bw - bulge * 0.5, bh + bulge * 0.5, -bw - bulge, bh + bulge);
      boneShape.bezierCurveTo(-bw - bulge * 2, 0, -bw - bulge, -bh - bulge, -bw, -bh);
      boneShape.lineTo(bw, -bh);
      return boneShape;
    }

    case "trophy": {
      const trophyShape = new THREE.Shape();
      const ts = size / 2;
      
      trophyShape.moveTo(-ts * 0.6, -ts * 0.8);
      trophyShape.lineTo(ts * 0.6, -ts * 0.8);
      trophyShape.lineTo(ts * 0.5, ts * 0.3);
      trophyShape.bezierCurveTo(ts * 0.5, ts * 0.6, ts * 0.3, ts * 0.8, 0, ts * 0.8);
      trophyShape.bezierCurveTo(-ts * 0.3, ts * 0.8, -ts * 0.5, ts * 0.6, -ts * 0.5, ts * 0.3);
      trophyShape.lineTo(-ts * 0.6, -ts * 0.8);
      return trophyShape;
    }

    case "frame": {
      const frameShape = new THREE.Shape();
      const fw = size * 0.6;
      const fh = size * 0.5;
      frameShape.moveTo(-fw, -fh);
      frameShape.lineTo(fw, -fh);
      frameShape.lineTo(fw, fh);
      frameShape.lineTo(-fw, fh);
      frameShape.lineTo(-fw, -fh);
      return frameShape;
    }

    case "tray":
    case "square":
    default: {
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
      return rectShape;
    }
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

    // ===== TEMPLATE-BASED SHAPES =====

    case "nameplate": {
      // Rounded rectangle nameplate with mounting hole
      const npShape = new THREE.Shape();
      const w = size * 0.8;
      const h = size * 0.35;
      const r = h / 3;
      
      npShape.moveTo(-w + r, -h);
      npShape.lineTo(w - r, -h);
      npShape.quadraticCurveTo(w, -h, w, -h + r);
      npShape.lineTo(w, h - r);
      npShape.quadraticCurveTo(w, h, w - r, h);
      npShape.lineTo(-w + r, h);
      npShape.quadraticCurveTo(-w, h, -w, h - r);
      npShape.lineTo(-w, -h + r);
      npShape.quadraticCurveTo(-w, -h, -w + r, -h);
      
      // Add mounting hole
      const holeRadius = h / 4;
      const hole = new THREE.Path();
      hole.ellipse(-w + r * 1.5, 0, holeRadius, holeRadius, 0, Math.PI * 2, true, 0);
      npShape.holes.push(hole);
      
      return new THREE.ExtrudeGeometry(npShape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 32,
      }).translate(0, 0, -thickness / 2);
    }

    case "keychain": {
      // Circle with keyring hole at top
      const kcShape = new THREE.Shape();
      const mainR = size / 2;
      kcShape.ellipse(0, 0, mainR, mainR, 0, Math.PI * 2, false, 0);
      
      // Keyring hole
      const holeR = mainR / 5;
      const hole = new THREE.Path();
      hole.ellipse(0, mainR - holeR * 1.5, holeR, holeR, 0, Math.PI * 2, true, 0);
      kcShape.holes.push(hole);
      
      return new THREE.ExtrudeGeometry(kcShape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 64,
      }).translate(0, 0, -thickness / 2);
    }

    case "tag": {
      // Gift tag shape - rectangle with pointed top and hole
      const tagShape = new THREE.Shape();
      const tw = size * 0.4;
      const th = size * 0.6;
      const tipH = size * 0.15;
      const tr = size * 0.05;
      
      // Start at bottom-left
      tagShape.moveTo(-tw + tr, -th);
      tagShape.lineTo(tw - tr, -th);
      tagShape.quadraticCurveTo(tw, -th, tw, -th + tr);
      tagShape.lineTo(tw, th - tipH);
      tagShape.lineTo(0, th); // tip
      tagShape.lineTo(-tw, th - tipH);
      tagShape.lineTo(-tw, -th + tr);
      tagShape.quadraticCurveTo(-tw, -th, -tw + tr, -th);
      
      // Hole at top
      const hole = new THREE.Path();
      hole.ellipse(0, th - tipH * 1.8, tipH / 2, tipH / 2, 0, Math.PI * 2, true, 0);
      tagShape.holes.push(hole);
      
      return new THREE.ExtrudeGeometry(tagShape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 32,
      }).translate(0, 0, -thickness / 2);
    }

    case "coaster": {
      // Decorative coaster - circle with inner ring pattern
      const coasterShape = new THREE.Shape();
      const outerR = size / 2;
      coasterShape.ellipse(0, 0, outerR, outerR, 0, Math.PI * 2, false, 0);
      
      return new THREE.ExtrudeGeometry(coasterShape, {
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: thickness / 4,
        bevelSize: size / 20,
        bevelSegments: 3,
        curveSegments: 64,
      }).translate(0, 0, -thickness / 2);
    }

    case "doorSign": {
      // Wide door sign plate
      const dsShape = new THREE.Shape();
      const dw = size * 0.9;
      const dh = size * 0.4;
      const dr = dh / 4;
      
      dsShape.moveTo(-dw + dr, -dh);
      dsShape.lineTo(dw - dr, -dh);
      dsShape.quadraticCurveTo(dw, -dh, dw, -dh + dr);
      dsShape.lineTo(dw, dh - dr);
      dsShape.quadraticCurveTo(dw, dh, dw - dr, dh);
      dsShape.lineTo(-dw + dr, dh);
      dsShape.quadraticCurveTo(-dw, dh, -dw, dh - dr);
      dsShape.lineTo(-dw, -dh + dr);
      dsShape.quadraticCurveTo(-dw, -dh, -dw + dr, -dh);
      
      // Two mounting holes
      const hR = dh / 5;
      const hole1 = new THREE.Path();
      hole1.ellipse(-dw + dr * 2, 0, hR, hR, 0, Math.PI * 2, true, 0);
      dsShape.holes.push(hole1);
      const hole2 = new THREE.Path();
      hole2.ellipse(dw - dr * 2, 0, hR, hR, 0, Math.PI * 2, true, 0);
      dsShape.holes.push(hole2);
      
      return new THREE.ExtrudeGeometry(dsShape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 32,
      }).translate(0, 0, -thickness / 2);
    }

    case "petBone": {
      // Bone shape for pet tags
      const boneShape = new THREE.Shape();
      const bw = size * 0.6;
      const bh = size * 0.25;
      const bulge = size * 0.15;
      
      // Right bulges
      boneShape.moveTo(bw, -bh);
      boneShape.bezierCurveTo(bw + bulge, -bh - bulge, bw + bulge * 2, 0, bw + bulge, bh + bulge);
      boneShape.bezierCurveTo(bw + bulge * 0.5, bh + bulge * 0.5, bw, bh, bw, bh);
      
      // Top edge
      boneShape.lineTo(-bw, bh);
      
      // Left bulges
      boneShape.bezierCurveTo(-bw, bh, -bw - bulge * 0.5, bh + bulge * 0.5, -bw - bulge, bh + bulge);
      boneShape.bezierCurveTo(-bw - bulge * 2, 0, -bw - bulge, -bh - bulge, -bw, -bh);
      
      // Bottom edge
      boneShape.lineTo(bw, -bh);
      
      // Center hole
      const hole = new THREE.Path();
      hole.ellipse(0, 0, bh / 2, bh / 2, 0, Math.PI * 2, true, 0);
      boneShape.holes.push(hole);
      
      return new THREE.ExtrudeGeometry(boneShape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 32,
      }).translate(0, 0, -thickness / 2);
    }

    case "trophy": {
      // Trophy/award base shape
      const trophyShape = new THREE.Shape();
      const ts = size / 2;
      
      // Cup shape
      trophyShape.moveTo(-ts * 0.6, -ts * 0.8);
      trophyShape.lineTo(ts * 0.6, -ts * 0.8);
      trophyShape.lineTo(ts * 0.5, ts * 0.3);
      trophyShape.bezierCurveTo(ts * 0.5, ts * 0.6, ts * 0.3, ts * 0.8, 0, ts * 0.8);
      trophyShape.bezierCurveTo(-ts * 0.3, ts * 0.8, -ts * 0.5, ts * 0.6, -ts * 0.5, ts * 0.3);
      trophyShape.lineTo(-ts * 0.6, -ts * 0.8);
      
      return new THREE.ExtrudeGeometry(trophyShape, {
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: thickness / 3,
        bevelSize: size / 30,
        bevelSegments: 2,
        curveSegments: 32,
      }).translate(0, 0, -thickness / 2);
    }

    case "frame": {
      // Picture frame shape - rectangle with rectangular hole
      const frameShape = new THREE.Shape();
      const fw = size * 0.6;
      const fh = size * 0.5;
      const border = size * 0.08;
      
      // Outer rectangle
      frameShape.moveTo(-fw, -fh);
      frameShape.lineTo(fw, -fh);
      frameShape.lineTo(fw, fh);
      frameShape.lineTo(-fw, fh);
      frameShape.lineTo(-fw, -fh);
      
      // Inner hole (picture area)
      const hole = new THREE.Path();
      hole.moveTo(-fw + border, -fh + border);
      hole.lineTo(-fw + border, fh - border);
      hole.lineTo(fw - border, fh - border);
      hole.lineTo(fw - border, -fh + border);
      hole.lineTo(-fw + border, -fh + border);
      frameShape.holes.push(hole);
      
      return new THREE.ExtrudeGeometry(frameShape, {
        depth: thickness,
        bevelEnabled: false,
      }).translate(0, 0, -thickness / 2);
    }

    case "tray": {
      // TRAY: Single Pass CSG Strategy
      // 1. Create solid block (Outer)
      // 2. Create internal cavity
      // 3. Merge internal cavity + Holes + Text
      // 4. Subtract everything at once
      
      const borderW = Math.min(trayBorderWidth, Math.min(width, height) / 4);
      const borderH = Math.max(trayBorderHeight, 0.5);
      const totalHeight = thickness + borderH;
      
      // 1. Outer Solid
      const outerGeo = new THREE.BoxGeometry(width, height, totalHeight);
      outerGeo.translate(0, 0, (totalHeight - thickness) / 2);
      
      // 2. Inner Cavity
      const innerWidth = Math.max(1, width - 2 * borderW);
      const innerDepth = Math.max(1, height - 2 * borderW);
      const cavityHeight = borderH + 2;
      const innerGeo = new THREE.BoxGeometry(innerWidth, innerDepth, cavityHeight);
      innerGeo.translate(0, 0, thickness / 2 + cavityHeight / 2 - 0.1); 
      
      // 3. Subtract cavity first, then holes/text (avoids self-intersecting cutters)
      const cutters = getSubtractionGeometries(holes, extraCutters, totalHeight + 50); 

      let base = subtractGeometries(outerGeo, [innerGeo]);
      if (cutters.length > 0) {
        base = subtractGeometries(base, cutters);
      }

      return base;
    }




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
