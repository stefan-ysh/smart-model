"use client"

import { useEffect, useState } from "react"
import { Moon, Sparkles, Sun, Zap } from "lucide-react"
import { useModelStore, ExportFormat } from "@/lib/store"
import { sanitizeImportedParams } from "@/lib/import-config"

type ImportNotice = {
  tone: "success" | "error"
  message: string
}

export function Header() {
  const { triggerExport, parameters, setParameters, isExporting } = useModelStore()
  const [importNotice, setImportNotice] = useState<ImportNotice | null>(null)

  useEffect(() => {
    if (!importNotice) return
    const timer = window.setTimeout(() => setImportNotice(null), 4000)
    return () => window.clearTimeout(timer)
  }, [importNotice])

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
            const parsed = JSON.parse(result)
            const sanitized = sanitizeImportedParams(parsed)

            if (!sanitized.ok) {
              setImportNotice({ tone: "error", message: sanitized.error })
              return
            }

            setParameters(sanitized.params)
            setImportNotice({
              tone: "success",
              message: sanitized.warnings.length > 0 ? `导入完成，已忽略 ${sanitized.warnings.length} 个无效字段` : "配置导入成功",
            })
            
            // Reset value so same file can be loaded again if needed
            e.target.value = ''
        } catch (err) {
            console.error("Failed to parse config", err)
            setImportNotice({ tone: "error", message: "配置文件格式错误，请检查 JSON 内容" })
            e.target.value = ''
        }
    }
    reader.readAsText(file)
  }

  const toggleTheme = () => {
    const root = document.documentElement
    const isDark = root.classList.contains("dark")
    const nextIsDark = !isDark
    root.classList.toggle("dark", nextIsDark)
    window.localStorage.setItem("theme", nextIsDark ? "dark" : "light")
  }

  return (
    <header className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-2xl flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Background Subtle Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
      
      {/* Logo & Title */}
      <div className="flex items-center gap-4 group cursor-default">
        <div className="relative">
          <div className="h-9 w-9 bg-linear-to-br from-primary to-accent rounded-xl flex items-center justify-center text-primary-foreground font-black text-lg shadow-2xl transition-transform duration-500 group-hover:rotate-360">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-foreground via-secondary/70 to-accent/60 bg-clip-text text-transparent">
            Smart Model <span className="text-[10px] font-mono text-primary/50 ml-1 align-top">v0.1</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
              Intelligent 3D Engine
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center h-10 w-10 rounded-lg border border-border/70 bg-card/40 text-muted-foreground hover:bg-card/60 hover:text-foreground transition-colors"
          title="切换主题"
        >
          <Sun className="h-4 w-4 hidden dark:block" />
          <Moon className="h-4 w-4 block dark:hidden" />
        </button>

        {/* Config Actions */}
        <div className="flex items-center gap-2 mr-2">
            <button
               onClick={handleExportConfig}
               className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-border/70 bg-card/40 text-[10px] font-medium hover:bg-card/60 transition-colors text-muted-foreground hover:text-foreground/80"
               title="保存参数"
            >
               <span className="text-xs">💾</span> <span>保存参数</span>
            </button>
            <div className="relative">
               <button
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-border/70 bg-card/40 text-[10px] font-medium hover:bg-card/60 transition-colors text-muted-foreground hover:text-foreground/80"
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

        {importNotice && (
          <div
            className={`max-w-56 rounded-lg border px-3 py-2 text-[10px] leading-snug ${
              importNotice.tone === "success"
                ? "border-primary/30 bg-primary/10 text-foreground"
                : "border-destructive/30 bg-destructive/10 text-foreground"
            }`}
          >
            {importNotice.message}
          </div>
        )}

        <div className="h-8 w-px bg-card/40 mx-2" />
        
        {/* Export Format Selector */}
        <select
          value={parameters.exportFormat}
          onChange={(e) => setParameters({ exportFormat: e.target.value as ExportFormat })}
          className="h-10 px-3 bg-muted text-foreground/80 rounded-lg border border-border text-sm font-medium cursor-pointer hover:border-ring/60 transition-colors"
        >
          <option value="stl">STL</option>
          <option value="obj">OBJ</option>
          <option value="gltf">GLTF</option>
          <option value="glb">GLB</option>
        </select>
        
        {/* Export Button */}
        <button 
          onClick={triggerExport}
          disabled={isExporting}
          className="group relative flex items-center gap-2.5 px-5 py-2 bg-card text-foreground rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-95 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="absolute inset-0 bg-linear-to-r from-secondary/40 to-card opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sparkles className="h-4 w-4 relative z-10 transition-transform group-hover:rotate-12 group-hover:scale-110" />
          <span className="relative z-10">{isExporting ? "正在导出..." : `导出 ${parameters.exportFormat.toUpperCase()}`}</span>
          
          {/* Shine effect */}
          <div className="absolute -inset-full h-[300%] w-[300%] bg-linear-to-r from-transparent via-foreground/25 to-transparent -translate-x-full transition-transform group-hover:duration-1000" />
        </button>
      </div>
    </header>
  )
}
