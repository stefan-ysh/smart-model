"use client"

import { Sparkles, Zap } from "lucide-react"
import { useModelStore, ExportFormat } from "@/lib/store"

export function Header() {
  const { triggerExport, parameters, setParameters } = useModelStore()

  // Save/Load Configuration
  const handleExportConfig = () => {
    const config = JSON.stringify(parameters, null, 2)
    const blob = new Blob([config], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smart-model-config-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
        try {
            const result = event.target?.result as string
            const importedParams = JSON.parse(result)
            if (!("layerCoordsVersion" in importedParams)) {
              importedParams.layerCoordsVersion = 1
            }
            
            // Exclude triggers from import to avoid side effects
            if ('exportTrigger' in importedParams) delete importedParams.exportTrigger
            if ('screenshotTrigger' in importedParams) delete importedParams.screenshotTrigger
            if ('resetViewTrigger' in importedParams) delete importedParams.resetViewTrigger
            
            // Atomic update
            setParameters(importedParams)
            
            // Reset value so same file can be loaded again if needed
            e.target.value = ''
        } catch (err) {
            console.error("Failed to parse config", err)
            alert("配置文件格式错误")
        }
    }
    reader.readAsText(file)
  }

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
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Config Actions */}
        <div className="flex items-center gap-2 mr-2">
            <button
               onClick={handleExportConfig}
               className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-white/10 bg-white/5 text-[10px] font-medium hover:bg-white/10 transition-colors text-zinc-400 hover:text-zinc-200"
               title="保存参数"
            >
               <span className="text-xs">💾</span> <span>保存参数</span>
            </button>
            <div className="relative">
               <button
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-white/10 bg-white/5 text-[10px] font-medium hover:bg-white/10 transition-colors text-zinc-400 hover:text-zinc-200"
                  title="导入参数"
               >
                  <span className="text-xs">📂</span> <span>导入参数</span>
               </button>
               <input 
                 type="file"
                 accept=".json"
                 onChange={handleImportConfig}
                 className="absolute inset-0 opacity-0 cursor-pointer"
               />
            </div>
        </div>

        <div className="h-8 w-px bg-white/5 mx-2" />
        
        {/* Export Format Selector */}
        <select
          value={parameters.exportFormat}
          onChange={(e) => setParameters({ exportFormat: e.target.value as ExportFormat })}
          className="h-10 px-3 bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-700 text-sm font-medium cursor-pointer hover:border-zinc-500 transition-colors"
        >
          <option value="stl">STL</option>
          <option value="obj">OBJ</option>
          <option value="gltf">GLTF</option>
          <option value="glb">GLB</option>
        </select>
        
        {/* Export Button */}
        <button 
          onClick={triggerExport}
          className="group relative flex items-center gap-2.5 px-5 py-2 bg-white text-zinc-950 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sparkles className="h-4 w-4 relative z-10 transition-transform group-hover:rotate-12 group-hover:scale-110" />
          <span className="relative z-10">导出 {parameters.exportFormat.toUpperCase()}</span>
          
          {/* Shine effect */}
          <div className="absolute -inset-full h-[300%] w-[300%] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] -translate-x-full animate-[shimmer_3s_infinite] transition-transform group-hover:duration-1000" />
        </button>
      </div>
    </header>
  )
}
