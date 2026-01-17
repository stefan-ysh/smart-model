"use client"

import { Download, Sparkles } from "lucide-react"
import { useModelStore } from "@/lib/store"

export function Header() {
  const { triggerExport } = useModelStore()

  return (
    <header className="h-14 border-b border-white/5 bg-card/50 backdrop-blur-xl flex items-center justify-between px-6">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-8 w-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
            S
          </div>
          <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-purple-600/30 rounded-lg blur-md -z-10" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
            Smart Model
          </h1>
          <span className="text-[10px] text-muted-foreground -mt-0.5">3D 模型生成器</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Export Button */}
        <button 
          onClick={triggerExport}
          className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-lg font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-100"
        >
          <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
          <span>导出 STL</span>
          
          {/* Hover glow */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/50 to-purple-600/50 blur-lg opacity-0 group-hover:opacity-50 transition-opacity -z-10" />
        </button>
      </div>
    </header>
  )
}
