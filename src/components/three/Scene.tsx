"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid, Stage, Center } from "@react-three/drei"
import { Suspense } from "react"
import { useModelStore } from "@/lib/store"

import { BasicShape } from "@/components/three/generators/BasicShape"
import { Text3DGenerator } from "@/components/three/generators/Text3D"
import { ReliefGenerator } from "@/components/three/generators/Relief"
import { StencilGenerator } from "@/components/three/generators/Stencil"

import { ExportHandler } from "@/components/three/ExportHandler"

// Placeholder for different generators
function CurrentModel() {
  const { currentMode } = useModelStore()

  if (currentMode === 'basic') {
    return <BasicShape />
  }
  
  if (currentMode === 'text') {
    return <Text3DGenerator />
  }

  if (currentMode === 'relief') {
    return <ReliefGenerator />
  }

  if (currentMode === 'hollow') {
     return <StencilGenerator />
  }

  return null
}

export function Scene() {
  return (
    <Canvas shadows camera={{ position: [5, 5, 5], fov: 45 }}>
      <Suspense fallback={null}>
        <Stage intensity={0.5} environment="city" adjustCamera={false}>
            <group name="export-target">
               <CurrentModel />
            </group>
        </Stage>
        <Grid 
            infiniteGrid 
            fadeDistance={30} 
            sectionColor="#666" 
            cellColor="#ccc" 
            sectionSize={1} 
            cellSize={0.1}
            position={[0, -0.01, 0]} 
        />
        <ExportHandler />
      </Suspense>
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
    </Canvas>
  )
}
