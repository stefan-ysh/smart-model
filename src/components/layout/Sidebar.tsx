"use client"

import * as React from "react"
import { Box, Type, Image as ImageIcon, Grid3x3, Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import { useModelStore, GeneratorMode } from "@/lib/store"

interface SidebarItemProps {
  icon: any // Relax type to avoid conflicts between Lucide and other icon libraries
  label: string
  isActive: boolean
  onClick: () => void
}

const SidebarItem = ({ icon: Icon, label, isActive, onClick }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 w-full transition-colors rounded-xl mb-4",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-6 w-6 mb-2" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

export function Sidebar() {
  const { currentMode, setMode } = useModelStore()

  const items: { mode: GeneratorMode; icon: React.ElementType; label: string }[] = [
    { mode: 'basic', icon: Box, label: '基础' },
    { mode: 'text', icon: Type, label: '3D文本' },
    { mode: 'relief', icon: ImageIcon, label: '浮雕板' },
    { mode: 'hollow', icon: Grid3x3, label: '镂空板' },
    { mode: 'template', icon: Folder, label: '模板库' },
  ]

  return (
    <aside className="w-24 h-full bg-card border-r border-border flex flex-col items-center py-6">
      <div className="flex-1 w-full px-2">
        {items.map((item) => (
          <SidebarItem
            key={item.mode}
            icon={item.icon}
            label={item.label}
            isActive={currentMode === item.mode}
            onClick={() => setMode(item.mode)}
          />
        ))}
      </div>
    </aside>
  )
}
