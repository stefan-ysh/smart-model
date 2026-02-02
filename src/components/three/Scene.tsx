"use client"

import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { OrbitControls, Grid, Html, useProgress, Environment, ContactShadows } from "@react-three/drei"
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { Suspense, useRef, useEffect, useState, useMemo } from "react"
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
import { DraggableHole } from "@/components/three/DraggableHole"
import { DraggableText } from "@/components/three/DraggableText"
import { DraggableAnchor } from "@/components/three/DraggableAnchor"

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
type OrbitControlsLike = {
  target: THREE.Vector3
  update: () => void
}

function CameraController({ 
  controlsRef 
}: { 
  controlsRef: React.RefObject<OrbitControlsLike | null> 
}) {
  const { camera } = useThree()
  const viewPreset = useModelStore(state => state.viewPreset)
  const setViewPreset = useModelStore(state => state.setViewPreset)
  const resetViewTrigger = useModelStore(state => state.resetViewTrigger)
  const focusTarget = useModelStore(state => state.focusTarget)
  const setFocusTarget = useModelStore(state => state.setFocusTarget)
  const focusAnimRef = useRef<{
    start: number
    duration: number
    fromTarget: THREE.Vector3
    toTarget: THREE.Vector3
    fromPos: THREE.Vector3
    toPos: THREE.Vector3
  } | null>(null)
  
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

  useEffect(() => {
    if (!focusTarget || !controlsRef.current) return
    const target = controlsRef.current.target.clone()
    const offset = camera.position.clone().sub(target)
    const toTarget = new THREE.Vector3(focusTarget.x, focusTarget.y, focusTarget.z)
    const toPos = toTarget.clone().add(offset)
    focusAnimRef.current = {
      start: performance.now(),
      duration: 420,
      fromTarget: target,
      toTarget,
      fromPos: camera.position.clone(),
      toPos
    }
    setFocusTarget(null)
  }, [focusTarget, camera, controlsRef, setFocusTarget])

  useFrame(() => {
    const anim = focusAnimRef.current
    if (!anim || !controlsRef.current) return
    const now = performance.now()
    const t = Math.min(1, (now - anim.start) / anim.duration)
    const ease = 1 - Math.pow(1 - t, 3)
    const nextTarget = anim.fromTarget.clone().lerp(anim.toTarget, ease)
    const nextPos = anim.fromPos.clone().lerp(anim.toPos, ease)
    controlsRef.current.target.copy(nextTarget)
    camera.position.copy(nextPos)
    controlsRef.current.update()
    if (t >= 1) focusAnimRef.current = null
  })
  
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
  const model = useMemo(() => {
    if (currentMode === 'basic') return <BasicShape />
    if (currentMode === 'text') return <Text3DGenerator />
    if (currentMode === 'relief') return <ReliefGenerator />
    if (currentMode === 'hollow') return <StencilGenerator />
    if (currentMode === 'qr') return <QRCodeGenerator />
    if (currentMode === 'image') return <ImageReliefGenerator />
    return null
  }, [currentMode])

  return (
    <AnimatedModelWrapper key={currentMode}>
      <ArrayLayout>
        {model}
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

// Hole markers for interactive positioning
function HoleMarkers() {
  const currentMode = useModelStore(state => state.currentMode)
  const holes = useModelStore(state => state.parameters.holes)
  const baseThickness = useModelStore(state => state.parameters.baseThickness)
  const platePosition = useModelStore(state => state.parameters.platePosition)
  const groupRotation = useModelStore(state => state.parameters.groupRotation)
  const updateHole = useModelStore(state => state.updateHole)
  
  // Only show markers in relevant modes
  if (!['hollow', 'relief', 'image', 'qr'].includes(currentMode)) return null
  if (!holes || holes.length === 0) return null
  
  return (
    <group
      rotation={[0, (groupRotation * Math.PI) / 180, 0]}
      userData={{ noExport: true }}
    >
      {holes.map(hole => (
        <DraggableHole
          key={hole.id}
          hole={{
            ...hole,
            x: hole.x + platePosition.x,
            y: hole.y + platePosition.y
          }}
          baseThickness={baseThickness}
          onPositionChange={(x, y) =>
            updateHole(hole.id, { x: x - platePosition.x, y: y - platePosition.y })
          }
        />
      ))}
    </group>
  )
}

function TextMarkers() {
  const currentMode = useModelStore(state => state.currentMode)
  const textItems = useModelStore(state => state.parameters.textItems)
  const baseThickness = useModelStore(state => state.parameters.baseThickness)
  const plateRotation = useModelStore(state => state.parameters.plateRotation)
  const groupRotation = useModelStore(state => state.parameters.groupRotation)
  const updateTextItem = useModelStore(state => state.updateTextItem)

  if (!["relief", "hollow"].includes(currentMode)) return null
  if (!textItems || textItems.length === 0) return null

  return (
    <group rotation={[0, (groupRotation * Math.PI) / 180, 0]} userData={{ noExport: true }}>
      {textItems.map(item => (
        <DraggableText
          key={item.id}
          item={item}
          baseThickness={baseThickness}
          plateRotation={plateRotation}
          onPositionChange={(x, y) =>
            updateTextItem(item.id, { position: { x, y, z: item.position.z } })
          }
        />
      ))}
    </group>
  )
}

function PlateMarker() {
  const currentMode = useModelStore(state => state.currentMode)
  const platePosition = useModelStore(state => state.parameters.platePosition)
  const baseThickness = useModelStore(state => state.parameters.baseThickness)
  const groupRotation = useModelStore(state => state.parameters.groupRotation)
  const updateParam = useModelStore(state => state.updateParam)

  if (!["relief", "hollow", "image"].includes(currentMode)) return null

  return (
    <group rotation={[0, (groupRotation * Math.PI) / 180, 0]} userData={{ noExport: true }}>
      <DraggableAnchor
        id="base"
        position={platePosition}
        baseThickness={baseThickness}
        size={10}
        onPositionChange={(x, y) => updateParam("platePosition", { x, y })}
      />
    </group>
  )
}

function TextPositionMarker() {
  const currentMode = useModelStore(state => state.currentMode)
  const textPosition = useModelStore(state => state.parameters.textPosition)
  const baseThickness = useModelStore(state => state.parameters.baseThickness)
  const groupRotation = useModelStore(state => state.parameters.groupRotation)
  const updateParam = useModelStore(state => state.updateParam)

  if (!["image", "text"].includes(currentMode)) return null

  return (
    <group rotation={[0, (groupRotation * Math.PI) / 180, 0]} userData={{ noExport: true }}>
      <DraggableAnchor
        id="text-position"
        position={textPosition}
        baseThickness={baseThickness}
        size={8}
        onPositionChange={(x, y) => updateParam("textPosition", { x, y })}
      />
    </group>
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
  const controlsRef = useRef<OrbitControlsLike | null>(null)
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
      <LayerOverlay />
      
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
          <HoleMarkers />
          <TextMarkers />
          <PlateMarker />
          <TextPositionMarker />
          
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

function LayerOverlay() {
  const currentMode = useModelStore(state => state.currentMode)
  const parameters = useModelStore(state => state.parameters)
  const selectedLayerId = useModelStore(state => state.selectedLayerId)
  const setSelectedLayer = useModelStore(state => state.setSelectedLayer)
  const setFocusTarget = useModelStore(state => state.setFocusTarget)
  const [collapsed, setCollapsed] = useState(true)
  const [query, setQuery] = useState("")

  const layers = useMemo(() => {
    if (currentMode === "text") {
      return [{ id: "text-position", label: "文字位置" }]
    }
    if (currentMode === "image") {
      return [
        { id: "base", label: "底板" },
        { id: "text-position", label: "图案位置" },
        ...parameters.holes.map((hole, index) => ({
          id: `hole-${hole.id}`,
          label: `孔位 ${index + 1}`
        }))
      ]
    }
    if (currentMode === "relief" || currentMode === "hollow" || currentMode === "qr") {
      return [
        { id: "base", label: "底板" },
        ...parameters.holes.map((hole, index) => ({
          id: `hole-${hole.id}`,
          label: `孔位 ${index + 1}`
        }))
      ]
    }
    return []
  }, [currentMode, parameters.holes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return layers
    return layers.filter(l => l.label.toLowerCase().includes(q))
  }, [layers, query])

  const focusLayer = (id: string | null) => {
    if (!id) return
    if (id === "base") {
      setFocusTarget({ x: parameters.platePosition.x, y: 0, z: parameters.platePosition.y })
      return
    }
    if (id === "text-position") {
      setFocusTarget({ x: parameters.textPosition.x, y: 0, z: parameters.textPosition.y })
      return
    }
    if (id.startsWith("text-")) {
      const match = parameters.textItems.find((item) => `text-${item.id}` === id)
      if (match) {
        setFocusTarget({ x: match.position.x, y: 0, z: match.position.y })
      }
      return
    }
    if (id.startsWith("hole-")) {
      const match = parameters.holes.find((hole) => `hole-${hole.id}` === id)
      if (match) {
        setFocusTarget({
          x: match.x + parameters.platePosition.x,
          y: 0,
          z: match.y + parameters.platePosition.y
        })
      }
    }
  }

  if (layers.length === 0) return null

  return (
    <div className="absolute top-4 right-24 z-10 w-56 bg-background/80 backdrop-blur-xl rounded-xl p-2 border border-white/10 shadow-xl">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">图层</span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[10px] text-zinc-400 hover:text-zinc-200"
        >
          {collapsed ? "展开" : "收起"}
        </button>
      </div>
      {!collapsed && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索图层..."
            className="mt-2 w-full h-7 px-2 text-xs rounded-md bg-white/5 border border-white/10 text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
          />
          <div className="mt-2 grid grid-cols-1 gap-2 max-h-56 overflow-auto pr-1">
            {filtered.map((layer) => (
              <button
                key={layer.id}
                onClick={() => {
                  setSelectedLayer(layer.id)
                  focusLayer(layer.id)
                }}
                className={`px-2 py-1.5 text-xs rounded-md border transition-colors ${
                  selectedLayerId === layer.id
                    ? "border-blue-500 bg-blue-500/10 text-blue-200"
                    : "border-white/5 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/15"
                }`}
                title={layer.label}
              >
                {layer.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-[10px] text-zinc-500 py-2 text-center border border-dashed border-white/10 rounded">
                无匹配图层
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
