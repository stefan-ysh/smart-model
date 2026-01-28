import * as THREE from "three";
import { PlateShape } from "@/lib/store";

/**
 * Create plate geometry based on shape type
 * Used by Relief and Stencil generators
 */
export function createPlateGeometry(
  shape: PlateShape,
  size: number,
  width: number,
  height: number,
  thickness: number,
  cornerRadius: number = 0
): THREE.BufferGeometry {
  const extrudeSettings = (bevel: boolean = false) => ({
    depth: thickness,
    bevelEnabled: bevel && cornerRadius > 0,
    bevelThickness: cornerRadius > 0 ? cornerRadius / 3 : 0,
    bevelSize: cornerRadius > 0 ? cornerRadius / 3 : 0,
    bevelSegments: 3,
    curveSegments: 32,
  });

  switch (shape) {
    case "rectangle": {
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

    case "rounded": {
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

      return new THREE.ExtrudeGeometry(rectShape, {
        depth: thickness,
        bevelEnabled: false,
      }).translate(0, 0, -thickness / 2);
    }

    case "circle":
      return new THREE.CylinderGeometry(size / 2, size / 2, thickness, 64).rotateX(
        Math.PI / 2
      );

    case "oval": {
      const ovalShape = new THREE.Shape();
      ovalShape.ellipse(0, 0, size / 2, size / 3, 0, Math.PI * 2, false, 0);
      return new THREE.ExtrudeGeometry(ovalShape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 64,
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
      hole.ellipse(-w + r * 1.5, 0, holeRadius, holeRadius, 0, Math.PI * 2, false, 0);
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
      hole.ellipse(0, mainR - holeR * 1.5, holeR, holeR, 0, Math.PI * 2, false, 0);
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
      hole.ellipse(0, th - tipH * 1.8, tipH / 2, tipH / 2, 0, Math.PI * 2, false, 0);
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
      hole1.ellipse(-dw + dr * 2, 0, hR, hR, 0, Math.PI * 2, false, 0);
      dsShape.holes.push(hole1);
      const hole2 = new THREE.Path();
      hole2.ellipse(dw - dr * 2, 0, hR, hR, 0, Math.PI * 2, false, 0);
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
      hole.ellipse(0, 0, bh / 2, bh / 2, 0, Math.PI * 2, false, 0);
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

    case "square":
    default: {
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
