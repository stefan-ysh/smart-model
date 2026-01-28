"use client"

import { Sparkles, Zap } from "lucide-react"
import { useModelStore } from "@/lib/store"

export function Header() {
  const { triggerExport } = useModelStore()

  return (
    <header className="h-14 border-b border-white/5 bg-zinc-950/50 backdrop-blur-2xl flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Background Subtle Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
      
      {/* Logo & Title */}
      <div className="flex items-center gap-4 group cursor-default">
        <div className="relative">
          <div className="h-9 w-9 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-2xl shadow-blue-500/20 transition-transform duration-500 group-hover:rotate-360">
            <Zap className="h-5 w-5 fill-white" />
          </div>
          <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            Smart Model <span className="text-[10px] font-mono text-blue-500/50 ml-1 align-top">v0.1</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Intelligent 3D Engine
            </span>
            <div className="h-1 w-1 rounded-full bg-blue-500/50" />
            <span className="text-[9px] font-medium text-zinc-600">智能模型生成</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="h-8 w-px bg-white/5 mx-2" />
        
        {/* Export Button */}
        <button 
          onClick={triggerExport}
          className="group relative flex items-center gap-2.5 px-5 py-2 bg-white text-zinc-950 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sparkles className="h-4 w-4 relative z-10 transition-transform group-hover:rotate-12 group-hover:scale-110" />
          <span className="relative z-10">导出 STL 模型</span>
          
          {/* Shine effect */}
          <div className="absolute -inset-full h-[300%] w-[300%] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] -translate-x-full animate-[shimmer_3s_infinite] transition-transform group-hover:duration-1000" />
        </button>
      </div>
    </header>
  )
}
