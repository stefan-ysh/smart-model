"use client"

import { Canvas } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import { Suspense, useRef } from "react"
import { useModelStore } from "@/lib/store"

import { ExportHandler } from "@/components/three/ExportHandler"
import { ModelToolbar } from "@/components/three/ModelToolbar"
import { ScreenshotHandler } from "@/components/hooks/useScreenshot"
import { CameraController } from "@/components/three/scene/CameraController"
import { ViewControls } from "@/components/three/scene/ViewControls"
import { LayerOverlay } from "@/components/three/scene/LayerOverlay"
import { OrbitControlsLike } from "@/components/three/scene/types"
import { Loader, FontLoadingOverlay } from "@/components/three/scene/SceneLoader"
import { SceneEffects } from "@/components/three/scene/SceneEffects"
import { SceneControls } from "@/components/three/scene/SceneControls"
import { StoreInvalidator } from "@/components/three/scene/StoreInvalidator"
import { SceneLighting } from "@/components/three/scene/SceneLighting"
import { SceneGrid } from "@/components/three/scene/SceneGrid"
import { SCENE_CAMERA, SCENE_DPR, SCENE_GL } from "@/components/three/scene/config"
import { handleExportTargetClick } from "@/components/three/scene/SceneInteractions"
import { useSceneNormalization } from "@/components/three/scene/useSceneNormalization"
import {
  CurrentModel,
  HoleMarkers,
  ModelTransformGroup,
  PlateMarker,
  TextMarkers,
  TextPositionMarker,
} from "@/components/three/scene/SceneModel"


export function Scene() {
  const controlsRef = useRef<OrbitControlsLike | null>(null)
  const showShadows = useModelStore(state => state.parameters.showShadows)
  const isLoadingFont = useModelStore(state => state.isLoadingFont)
  const isExporting = useModelStore(state => state.isExporting)
  const autoRotate = useModelStore(state => state.autoRotate)
  const showGrid = useModelStore(state => state.showGrid)

  useSceneNormalization()
  
  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {isLoadingFont && <FontLoadingOverlay />}
      {isExporting && <FontLoadingOverlay title="Preparing Export" subtitle="Optimizing geometry for download" />}
      
      {/* View preset buttons */}
      <ViewControls />
      <LayerOverlay />
      
      {/* Model Toolbar */}
      <ModelToolbar />
      
      <Canvas
        shadows={showShadows}
        camera={SCENE_CAMERA}
        gl={SCENE_GL}
        frameloop={autoRotate ? "always" : "demand"}
        dpr={SCENE_DPR}
      >
        <Suspense fallback={<Loader />}>
          {/* Environment for reflections */}
          <Environment preset="city" background={false} />
          
          <SceneLighting showShadows={showShadows} />
          
          {/* Model - positioned so it sits on the grid */}
          <group
            name="export-target"
            onClick={handleExportTargetClick}
          >
            <CurrentModel />
          </group>
          <ModelTransformGroup>
            <HoleMarkers />
            <TextMarkers />
            <TextPositionMarker />
          </ModelTransformGroup>
          <PlateMarker />
          
          <SceneGrid showGrid={showGrid} />
          
          <ExportHandler />
          <ScreenshotHandler />
          <StoreInvalidator />
          <CameraController controlsRef={controlsRef} />
          
          {/* Post-processing effects */}
          <SceneEffects />
        </Suspense>
        
        {/* Controls with zoom limits and auto-rotate */}
        <SceneControls controlsRef={controlsRef} autoRotate={autoRotate} />
      </Canvas>
    </div>
  )
}
