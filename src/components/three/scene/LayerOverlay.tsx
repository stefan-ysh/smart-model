"use client"

import { useMemo, useState } from "react"
import { useModelStore } from "@/lib/store"

export function LayerOverlay() {
  const currentMode = useModelStore((state) => state.currentMode)
  const parameters = useModelStore((state) => state.parameters)
  const selectedLayerId = useModelStore((state) => state.selectedLayerId)
  const setSelectedLayer = useModelStore((state) => state.setSelectedLayer)
  const setFocusTarget = useModelStore((state) => state.setFocusTarget)
  const normalizeLayerPositions = useModelStore((state) => state.normalizeLayerPositions)
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
          label: `孔位 ${index + 1}`,
        })),
      ]
    }
    if (currentMode === "relief" || currentMode === "hollow") {
      return [
        { id: "base", label: "底板" },
        ...parameters.textItems.map((item, index) => ({
          id: `text-${item.id}`,
          label: `文字 ${index + 1}`,
        })),
        ...parameters.holes.map((hole, index) => ({
          id: `hole-${hole.id}`,
          label: `孔位 ${index + 1}`,
        })),
      ]
    }
    if (currentMode === "qr") {
      return [
        { id: "base", label: "底板" },
        ...parameters.holes.map((hole, index) => ({
          id: `hole-${hole.id}`,
          label: `孔位 ${index + 1}`,
        })),
      ]
    }
    return []
  }, [currentMode, parameters.holes, parameters.textItems])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return layers
    return layers.filter((l) => l.label.toLowerCase().includes(q))
  }, [layers, query])

  const focusLayer = (id: string | null) => {
    if (!id) return
    if (id === "base") {
      setFocusTarget({ x: parameters.platePosition.x, y: 0, z: parameters.platePosition.y })
      return
    }
    if (id === "text-position") {
      setFocusTarget({
        x: parameters.textPosition.x,
        y: 0,
        z: parameters.textPosition.y,
      })
      return
    }
    if (id.startsWith("text-")) {
      const match = parameters.textItems.find((item) => `text-${item.id}` === id)
      if (match) {
        setFocusTarget({
          x: match.position.x,
          y: 0,
          z: match.position.y,
        })
      }
      return
    }
    if (id.startsWith("hole-")) {
      const match = parameters.holes.find((hole) => `hole-${hole.id}` === id)
      if (match) {
        setFocusTarget({
          x: match.x,
          y: 0,
          z: match.y,
        })
      }
    }
  }

  if (layers.length === 0) return null

  return (
    <div className="absolute top-4 right-24 z-10 w-56 bg-background/80 backdrop-blur-xl rounded-xl p-2 border border-border/70 shadow-xl">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">图层</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => normalizeLayerPositions()}
            className="text-[10px] text-muted-foreground hover:text-foreground/80"
            title="修正旧坐标导致的错位"
          >
            修正
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[10px] text-muted-foreground hover:text-foreground/80"
          >
            {collapsed ? "展开" : "收起"}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索图层..."
            className="mt-2 w-full h-7 px-2 text-xs rounded-md bg-card/40 border border-border/70 text-foreground/80 placeholder:text-muted-foreground/80 focus:outline-none"
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
                    ? "border-primary bg-primary/10 text-primary-foreground"
                    : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground/80 hover:border-border/80"
                }`}
                title={layer.label}
              >
                {layer.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-[10px] text-muted-foreground/80 py-2 text-center border border-dashed border-border/70 rounded">
                无匹配图层
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
