import * as THREE from "three";
import { HoleItem } from "@/lib/store";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";

/**
 * Sanitize geometry:
 * 1. Ensure non-indexed triangles
 * 2. Remove degenerate triangles by area
 * 3. Fix NaN normals/positions
 */
export function prepareCSGGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
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

export function getSubtractionGeometries(
  holes: HoleItem[] | undefined,
  extraCutters: THREE.BufferGeometry[] | undefined,
  thickness: number,
  xOffset: number = 0,
  yOffset: number = 0
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  if (holes && holes.length > 0) {
    const holeDepth = thickness;
    holes.forEach((hole) => {
      const cyl = new THREE.CylinderGeometry(hole.radius, hole.radius, holeDepth, 32);
      cyl.rotateX(Math.PI / 2);
      cyl.translate(hole.x + xOffset, -hole.y + yOffset, 0);
      const prepared = prepareCSGGeometry(cyl);
      geometries.push(prepared);
      cyl.dispose();
    });
  }

  if (extraCutters && extraCutters.length > 0) {
    extraCutters.forEach((cutter) => {
      const prepared = prepareCSGGeometry(cutter);
      geometries.push(prepared);
    });
  }

  return geometries;
}

export function subtractGeometries(
  base: THREE.BufferGeometry,
  cutters: THREE.BufferGeometry[]
): THREE.BufferGeometry {
  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  evaluator.attributes = ["position", "normal"];
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
