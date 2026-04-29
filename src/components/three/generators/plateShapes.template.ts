import * as THREE from "three";
import { PlateShape } from "@/lib/store";

export function createTemplatePlateGeometry(
  shape: PlateShape,
  size: number,
  thickness: number
): THREE.BufferGeometry | null {
  switch (shape) {
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
      const kcShape = new THREE.Shape();
      const mainR = size / 2;
      kcShape.ellipse(0, 0, mainR, mainR, 0, Math.PI * 2, false, 0);

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
      const trophyShape = new THREE.Shape();
      const ts = size / 2;

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
      const frameShape = new THREE.Shape();
      const fw = size * 0.6;
      const fh = size * 0.5;
      const border = size * 0.08;

      frameShape.moveTo(-fw, -fh);
      frameShape.lineTo(fw, -fh);
      frameShape.lineTo(fw, fh);
      frameShape.lineTo(-fw, fh);
      frameShape.lineTo(-fw, -fh);

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

    default:
      return null;
  }
}
