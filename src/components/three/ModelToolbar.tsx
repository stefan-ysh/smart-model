"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { 
  RotateCw, Camera, Palette, Grid3X3, Maximize, Home, 
  Sparkles, X, ChevronUp, Grid2X2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useModelStore, MaterialPreset } from "@/lib/store"

interface ToolbarButtonProps {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
  className?: string
}

const ToolbarButton = ({ icon: Icon, label, active, onClick, className }: ToolbarButtonProps) => (
  <button
    onClick={onClick}
    title={label}
    className={cn(
      "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
      "hover:scale-110 hover:bg-white/10",
      "active:scale-95",
      active 
        ? "bg-primary/20 text-primary shadow-lg shadow-primary/20" 
        : "text-muted-foreground hover:text-foreground",
      className
    )}
  >
    <Icon className={cn(
      "h-5 w-5 transition-transform",
      active ? "drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" : undefined
    )} />
    {active && (
      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
    )}
  </button>
)

const MATERIAL_PRESETS: { value: MaterialPreset; label: string; color: string }[] = [
  { value: 'default', label: '默认', color: 'bg-sky-500' },
  { value: 'gold', label: '黄金', color: 'bg-yellow-500' },
  { value: 'chrome', label: '镀铬', color: 'bg-slate-400' },
  { value: 'matte', label: '哑光', color: 'bg-stone-500' },
  { value: 'glass', label: '玻璃', color: 'bg-cyan-300' },
  { value: 'neon', label: '霓虹', color: 'bg-fuchsia-500' },
]

export function ModelToolbar() {
  const [showMaterialPicker, setShowMaterialPicker] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const {
    autoRotate, setAutoRotate,
    wireframeMode, setWireframeMode,
    materialPreset, setMaterialPreset,
    triggerScreenshot,
    triggerResetView,
    bloomEnabled, setBloomEnabled,
    showGrid, setShowGrid,
  } = useModelStore()

  const handleFullscreen = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        canvas.requestFullscreen()
      }
    }
  }

  if (isCollapsed) {
    return (
      <div className="absolute bottom-4 left-4 z-20">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-background/80 backdrop-blur-xl border border-white/10 text-muted-foreground hover:text-foreground transition-all hover:scale-105 shadow-xl"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
      {/* Material Picker Popup */}
      {showMaterialPicker && (
        <div className="mb-2 p-3 bg-background/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">材质预设</span>
            <button 
              onClick={() => setShowMaterialPicker(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MATERIAL_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => {
                  setMaterialPreset(preset.value)
                  setShowMaterialPicker(false)
                }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                  "hover:bg-white/10",
                  materialPreset === preset.value && "bg-primary/20 ring-1 ring-primary"
                )}
              >
                <div className={cn("w-6 h-6 rounded-full", preset.color)} />
                <span className="text-[10px] text-muted-foreground">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Toolbar */}
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl">
        <ToolbarButton 
          icon={RotateCw} 
          label="自动旋转" 
          active={autoRotate}
          onClick={() => setAutoRotate(!autoRotate)}
        />
        <ToolbarButton 
          icon={Camera} 
          label="截图" 
          onClick={triggerScreenshot}
        />
        <ToolbarButton 
          icon={Palette} 
          label="材质预设" 
          active={showMaterialPicker}
          onClick={() => setShowMaterialPicker(!showMaterialPicker)}
        />
        <ToolbarButton 
          icon={Grid3X3} 
          label="线框模式" 
          active={wireframeMode}
          onClick={() => setWireframeMode(!wireframeMode)}
        />
        
        <div className="w-px h-6 bg-white/10 mx-1" />
        
        <ToolbarButton 
          icon={Sparkles} 
          label="辉光效果" 
          active={bloomEnabled}
          onClick={() => setBloomEnabled(!bloomEnabled)}
        />
        <ToolbarButton 
          icon={Grid2X2} 
          label="显示网格" 
          active={showGrid}
          onClick={() => setShowGrid(!showGrid)}
        />
        
        <div className="w-px h-6 bg-white/10 mx-1" />
        
        <ToolbarButton 
          icon={Home} 
          label="重置视角" 
          onClick={triggerResetView}
        />
        <ToolbarButton 
          icon={Maximize} 
          label="全屏" 
          onClick={handleFullscreen}
        />
        
        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="ml-1 flex items-center justify-center w-6 h-6 rounded-lg text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          title="收起工具栏"
        >
          <ChevronUp className="h-3.5 w-3.5 rotate-180" />
        </button>
      </div>
    </div>
  )
}
