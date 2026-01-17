"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Grid, Center, Html, useProgress } from "@react-three/drei"
import { Suspense, useRef, useEffect, useState } from "react"
import { useModelStore } from "@/lib/store"
import * as THREE from "three"

import { BasicShape } from "@/components/three/generators/BasicShape"
import { Text3DGenerator } from "@/components/three/generators/Text3D"
import { ReliefGenerator } from "@/components/three/generators/Relief"
import { StencilGenerator } from "@/components/three/generators/Stencil"
import { QRCodeGenerator } from "@/components/three/generators/QRCode"

import { ExportHandler } from "@/components/three/ExportHandler"
import { Spinner } from "@/components/ui/spinner"

// Loading indicator component
function Loader() {
  const { progress, active } = useProgress()
  if (!active) return null
  
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg border border-border">
        <Spinner size="lg" />
        <span className="text-sm text-muted-foreground mt-3">
          加载中... {progress.toFixed(0)}%
        </span>
      </div>
    </Html>
  )
}

// Camera controller for view presets
function CameraController({ 
  controlsRef 
}: { 
  controlsRef: React.RefObject<any> 
}) {
  const { camera } = useThree()
  const { viewPreset, setViewPreset } = useModelStore()
  
  useEffect(() => {
    if (!viewPreset || !controlsRef.current) return
    
    const distance = 120
    const positions: Record<string, [number, number, number]> = {
      front: [0, 0, distance],
      back: [0, 0, -distance],
      left: [-distance, 0, 0],
      right: [distance, 0, 0],
      top: [0, distance, 0.01],
      bottom: [0, -distance, 0.01],
      iso: [distance * 0.7, distance * 0.7, distance * 0.7],
    }
    
    const pos = positions[viewPreset]
    if (pos) {
      camera.position.set(...pos)
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
    
    // Reset preset after applying
    setViewPreset(null)
  }, [viewPreset, camera, controlsRef, setViewPreset])
  
  return null
}

// Current model renderer
function CurrentModel() {
  const { currentMode, parameters } = useModelStore()
  const { showShadows } = parameters

  const shadowProps = showShadows ? { castShadow: true, receiveShadow: true } : {}

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

  if (currentMode === 'qr') {
     return <QRCodeGenerator />
  }

  return null
}

export function Scene() {
  const controlsRef = useRef<any>(null)
  const { parameters, isLoadingFont } = useModelStore()
  
  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {isLoadingFont && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-background/90 px-8 py-6 rounded-lg shadow-lg border border-border">
            <Spinner size="md" />
            <span className="text-sm text-muted-foreground">加载字体中...</span>
          </div>
        </div>
      )}
      
      {/* View preset buttons */}
      <ViewControls />
      
      <Canvas 
        shadows={parameters.showShadows}
        camera={{ position: [80, 80, 80], fov: 45, near: 0.1, far: 10000 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={<Loader />}>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[50, 100, 50]} 
            intensity={1} 
            castShadow={parameters.showShadows}
            shadow-mapSize={[1024, 1024]}
          />
          
          {/* Model - positioned so it sits on the grid */}
          <group 
            name="export-target"
            onClick={(e) => {
              // Click on empty space to deselect
              const { setSelectedLayer, isTransformEnabled } = useModelStore.getState()
              if (isTransformEnabled && e.eventObject === e.object) {
                setSelectedLayer(null)
              }
            }}
          >
            <CurrentModel />
          </group>
          
          {/* Grid - infinite and filling the view */}
          <Grid 
            args={[500, 500]}
            cellSize={5}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={25}
            sectionThickness={1}
            sectionColor="#374151"
            fadeDistance={500}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={true}
            position={[0, -0.01, 0]}
          />
          
          <ExportHandler />
          <CameraController controlsRef={controlsRef} />
        </Suspense>
        
        {/* Controls with zoom limits */}
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          minDistance={20}
          maxDistance={500}
          minPolarAngle={0}
          maxPolarAngle={Math.PI * 0.9}
          enableDamping
          dampingFactor={0.05}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}

// View controls overlay
function ViewControls() {
  const { setViewPreset } = useModelStore()
  
  const views = [
    { key: 'iso', label: '等轴', icon: '◢' },
    { key: 'front', label: '前', icon: '▣' },
    { key: 'back', label: '后', icon: '▣' },
    { key: 'left', label: '左', icon: '◧' },
    { key: 'right', label: '右', icon: '◨' },
    { key: 'top', label: '上', icon: '△' },
    { key: 'bottom', label: '下', icon: '▽' },
  ]
  
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 border border-border shadow-lg">
      {views.map(v => (
        <button
          key={v.key}
          onClick={() => setViewPreset(v.key)}
          className="px-2 py-1 text-xs hover:bg-secondary rounded transition-colors flex items-center gap-1"
          title={v.label}
        >
          <span className="w-4 text-center">{v.icon}</span>
          <span>{v.label}</span>
        </button>
      ))}
    </div>
  )
}
