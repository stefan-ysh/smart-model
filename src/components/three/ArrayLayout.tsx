"use client"

import * as React from "react"
import { useModelStore } from "@/lib/store"

interface ArrayLayoutProps {
  children: React.ReactNode
}

export function ArrayLayout({ children }: ArrayLayoutProps) {
  const parameters = useModelStore(state => state.parameters)
  const { 
    arrayType, 
    arrayCountX, arrayCountY, 
    arraySpacingX, arraySpacingY,
    arrayCircularCount, arrayCircularRadius
  } = parameters

  if (arrayType === 'none') {
    return <>{children}</>
  }

  if (arrayType === 'rectangular') {
    const instances = []
    const offsetX = ((arrayCountX - 1) * arraySpacingX) / 2
    const offsetY = ((arrayCountY - 1) * arraySpacingY) / 2

    for (let x = 0; x < arrayCountX; x++) {
      for (let y = 0; y < arrayCountY; y++) {
        instances.push(
          <group 
            key={`rect-${x}-${y}`} 
            position={[x * arraySpacingX - offsetX, 0, y * arraySpacingY - offsetY]}
          >
            {children}
          </group>
        )
      }
    }
    return <group>{instances}</group>
  }

  if (arrayType === 'circular') {
    const instances = []
    for (let i = 0; i < arrayCircularCount; i++) {
      const angle = (i / arrayCircularCount) * Math.PI * 2
      const x = Math.cos(angle) * arrayCircularRadius
      const z = Math.sin(angle) * arrayCircularRadius
      
      instances.push(
        <group 
          key={`circ-${i}`} 
          position={[x, 0, z]}
          rotation={[0, -angle, 0]} // Optional: rotate to face center or maintain orientation
        >
          {children}
        </group>
      )
    }
    return <group>{instances}</group>
  }

  return <>{children}</>
}
