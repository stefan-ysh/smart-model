"use client"

import { Download } from "lucide-react"
import { useModelStore } from "@/lib/store"

export function Header() {
  const { triggerExport } = useModelStore()

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
          S
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
          Smart Model
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button 
            onClick={triggerExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span className="text-sm font-medium">导出 STL</span>
        </button>
      </div>
    </header>
  )
}
