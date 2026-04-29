import * as THREE from "three";
import { HoleItem } from "@/lib/store";
import { getSubtractionGeometries, subtractGeometries } from "./plateShapes.csg";

export function createTrayGeometry(
  width: number,
  height: number,
  thickness: number,
  trayBorderWidth: number,
  trayBorderHeight: number,
  holes: HoleItem[],
  extraCutters: THREE.BufferGeometry[]
): THREE.BufferGeometry {
  const borderW = Math.min(trayBorderWidth, Math.min(width, height) / 4);
  const borderH = Math.max(trayBorderHeight, 0.5);
  const totalHeight = thickness + borderH;

  const outerGeo = new THREE.BoxGeometry(width, height, totalHeight);
  outerGeo.translate(0, 0, (totalHeight - thickness) / 2);

  const innerWidth = Math.max(1, width - 2 * borderW);
  const innerDepth = Math.max(1, height - 2 * borderW);
  const cavityHeight = borderH + 2;
  const innerGeo = new THREE.BoxGeometry(innerWidth, innerDepth, cavityHeight);
  innerGeo.translate(0, 0, thickness / 2 + cavityHeight / 2 - 0.1);

  const cutters = getSubtractionGeometries(holes, extraCutters, totalHeight + 50);

  let base = subtractGeometries(outerGeo, [innerGeo]);
  if (cutters.length > 0) {
    base = subtractGeometries(base, cutters);
  }

  return base;
}
