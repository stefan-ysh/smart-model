"use client"

import { useModelStore } from "@/lib/store"

export function ViewControls() {
  const setViewPreset = useModelStore((state) => state.setViewPreset)

  const views = [
    { key: "iso", label: "等轴", icon: "◢" },
    { key: "front", label: "前", icon: "▣" },
    { key: "back", label: "后", icon: "▣" },
    { key: "left", label: "左", icon: "◧" },
    { key: "right", label: "右", icon: "◨" },
    { key: "top", label: "上", icon: "△" },
    { key: "bottom", label: "下", icon: "▽" },
  ]

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-background/80 backdrop-blur-xl rounded-xl p-1.5 border border-border/70 shadow-xl">
      {views.map((v) => (
        <button
          key={v.key}
          onClick={() => setViewPreset(v.key)}
          className="px-2.5 py-1.5 text-xs hover:bg-card/60 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          title={v.label}
        >
          <span className="w-4 text-center">{v.icon}</span>
          <span>{v.label}</span>
        </button>
      ))}
    </div>
  )
}
