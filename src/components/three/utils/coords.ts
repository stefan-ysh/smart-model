export type Vec2 = { x: number; y: number }

export function toPlateLocal(world: Vec2, platePos: Vec2): Vec2 {
  return { x: world.x - platePos.x, y: world.y - platePos.y }
}

// Convert plate-local XZ (x,y) into shape XY (x,-y) before -90deg X rotation
export function toShapeXY(local: Vec2): Vec2 {
  return { x: local.x, y: -local.y }
}

export function rotate2D(p: Vec2, deg: number): Vec2 {
  if (!deg) return p
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos }
}
