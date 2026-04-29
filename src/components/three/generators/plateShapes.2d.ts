import * as THREE from "three";
import { PlateShape } from "@/lib/store";

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
