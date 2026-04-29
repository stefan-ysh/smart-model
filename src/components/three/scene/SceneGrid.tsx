"use client"

import { Grid } from "@react-three/drei"
import { THEME_COLORS } from "@/lib/theme-colors"

export function SceneGrid({ showGrid }: { showGrid: boolean }) {
  if (!showGrid) return null

  return (
    <Grid
      args={[500, 500]}
      cellSize={5}
      cellThickness={0.5}
      cellColor={THEME_COLORS.gridCell}
      sectionSize={25}
      sectionThickness={1}
      sectionColor={THEME_COLORS.gridSection}
      fadeDistance={500}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid={true}
      position={[0, -0.01, 0]}
    />
  )
}
