"use client"

import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { OrbitControls, Grid, Html, useProgress, Environment, ContactShadows } from "@react-three/drei"
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { Suspense, useRef, useEffect, useState } from "react"
import { useModelStore } from "@/lib/store"
import * as THREE from "three"

import { BasicShape } from "@/components/three/generators/BasicShape"
import { Text3DGenerator } from "@/components/three/generators/Text3D"
import { ReliefGenerator } from "@/components/three/generators/Relief"
import { StencilGenerator } from "@/components/three/generators/Stencil"
import { QRCodeGenerator } from "@/components/three/generators/QRCode"

import { ExportHandler } from "@/components/three/ExportHandler"
import { ModelToolbar } from "@/components/three/ModelToolbar"
import { ScreenshotHandler } from "@/components/hooks/useScreenshot"
import { ArrayLayout } from "@/components/three/ArrayLayout"
import { ImageReliefGenerator } from "@/components/three/generators/ImageRelief"

// Loading indicator component
function Loader() {
  const { progress, active } = useProgress()
  if (!active) return null
  
  return (
    <Html center>
      <div className="relative flex flex-col items-center justify-center pointer-events-none select-none">
        {/* Outer Glow */}
        <div className="absolute h-40 w-40 animate-pulse rounded-full bg-blue-500/10 blur-[60px]" />
        
        {/* Progress Container */}
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/40 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent rounded-3xl" />
          
          {/* SVG Progress Circle */}
          <svg className="h-20 w-20 -rotate-90 transform">
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              className="text-white/5"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={213.6}
              strokeDashoffset={213.6 - (213.6 * progress) / 100}
              className="text-blue-500 transition-all duration-500 ease-out"
              strokeLinecap="round"
            />
          </svg>
          
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-bold text-white tabular-nums tracking-tighter">
              {progress.toFixed(0)}<span className="text-[10px] ml-0.5 opacity-50">%</span>
            </span>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-blue-500 animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
              Initializing Engine
            </span>
          </div>
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest">
            Loading 3D Assets & Resources
          </span>
        </div>
      </div>
    </Html>
  )
}

// Camera controller for view presets and reset
function CameraController({ 
  controlsRef 
}: { 
  controlsRef: React.RefObject<any> 
}) {
  const { camera } = useThree()
  const viewPreset = useModelStore(state => state.viewPreset)
  const setViewPreset = useModelStore(state => state.setViewPreset)
  const resetViewTrigger = useModelStore(state => state.resetViewTrigger)
  
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
  
  // Handle reset view trigger
  useEffect(() => {
    if (resetViewTrigger > 0 && controlsRef.current) {
      camera.position.set(80, 80, 80)
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }, [resetViewTrigger, camera, controlsRef])
  
  return null
}

// Model entrance animation wrapper
function AnimatedModelWrapper({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  
  useFrame((_, delta) => {
    if (animationProgress < 1) {
      setAnimationProgress(prev => Math.min(1, prev + delta * 2))
    }
    
    if (groupRef.current) {
      // Elastic easing for bouncy effect
      const t = animationProgress
      const elastic = t < 1 
        ? 1 - Math.pow(2, -10 * t) * Math.cos((t * 10 - 0.75) * ((2 * Math.PI) / 3))
        : 1
      
      groupRef.current.scale.setScalar(elastic)
    }
  })
  
  return (
    <group ref={groupRef} scale={0}>
      {children}
    </group>
  )
}

// Current model renderer
function CurrentModel() {
  const currentMode = useModelStore(state => state.currentMode)
  const [key, setKey] = useState(0)
  
  // Reset animation when mode changes
  useEffect(() => {
    setKey(prev => prev + 1)
  }, [currentMode])

  const renderModel = () => {
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

    if (currentMode === 'image') {
       return <ImageReliefGenerator />
    }

    return null
  }

  return (
    <AnimatedModelWrapper key={key}>
      <ArrayLayout>
        {renderModel()}
      </ArrayLayout>
    </AnimatedModelWrapper>
  )
}

// Post-processing effects
function Effects() {
  const bloomEnabled = useModelStore(state => state.bloomEnabled)
  
  return (
    <EffectComposer enabled={true}>
      <Bloom 
        intensity={bloomEnabled ? 0.4 : 0} 
        luminanceThreshold={0.7} 
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.1} darkness={bloomEnabled ? 0.5 : 0} />
    </EffectComposer>
  )
}

// Ground shadows
function GroundEffects() {
  const contactShadowsEnabled = useModelStore(state => state.contactShadowsEnabled)
  
  if (!contactShadowsEnabled) return null
  
  return (
    <ContactShadows 
      position={[0, -0.5, 0]}
      opacity={0.5}
      scale={150}
      blur={2.5}
      far={50}
      color="#000000"
    />
  )
}

export function Scene() {
  const controlsRef = useRef<any>(null)
  const showShadows = useModelStore(state => state.parameters.showShadows)
  const isLoadingFont = useModelStore(state => state.isLoadingFont)
  const autoRotate = useModelStore(state => state.autoRotate)
  const showGrid = useModelStore(state => state.showGrid)
  
  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {isLoadingFont && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-md">
          <div className="relative flex flex-col items-center justify-center">
            <div className="absolute h-40 w-40 animate-pulse rounded-full bg-purple-500/10 blur-[60px]" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/40 backdrop-blur-xl shadow-2xl">
              <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent rounded-3xl" />
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />
            </div>
            <div className="mt-6 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-purple-500 animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                  Global Typography
                </span>
              </div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest">
                Optimizing Visual Assets
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* View preset buttons */}
      <ViewControls />
      
      {/* Model Toolbar */}
      <ModelToolbar />
      
      <Canvas 
        shadows={showShadows}
        camera={{ position: [80, 80, 80], fov: 45, near: 0.1, far: 10000 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={<Loader />}>
          {/* Environment for reflections */}
          <Environment preset="city" background={false} />
          
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[50, 100, 50]} 
            intensity={1.2} 
            castShadow={showShadows}
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight 
            position={[-30, 50, -30]} 
            intensity={0.3} 
          />
          
          {/* Ground effects */}
          <GroundEffects />
          
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
          {showGrid && (
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
          )}
          
          <ExportHandler />
          <ScreenshotHandler />
          <CameraController controlsRef={controlsRef} />
          
          {/* Post-processing effects */}
          <Effects />
        </Suspense>
        
        {/* Controls with zoom limits and auto-rotate */}
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          minDistance={20}
          maxDistance={500}
          minPolarAngle={0}
          maxPolarAngle={Math.PI * 0.9}
          enableDamping={false}
          target={[0, 0, 0]}
          autoRotate={autoRotate}
          autoRotateSpeed={2}
        />
      </Canvas>
    </div>
  )
}

// View controls overlay
function ViewControls() {
  const setViewPreset = useModelStore(state => state.setViewPreset)
  
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
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-background/80 backdrop-blur-xl rounded-xl p-1.5 border border-white/10 shadow-xl">
      {views.map(v => (
        <button
          key={v.key}
          onClick={() => setViewPreset(v.key)}
          className="px-2.5 py-1.5 text-xs hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          title={v.label}
        >
          <span className="w-4 text-center">{v.icon}</span>
          <span>{v.label}</span>
        </button>
      ))}
    </div>
  )
}
