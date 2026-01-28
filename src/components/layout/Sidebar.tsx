"use client"

import * as React from "react"
import { Box, Type, Image as ImageIcon, Grid3x3, Folder, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { useModelStore, GeneratorMode } from "@/lib/store"

interface SidebarItemProps {
  icon: any
  label: string
  isActive: boolean
  onClick: () => void
}

const SidebarItem = ({ icon: Icon, label, isActive, onClick }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center p-3 w-full transition-all duration-300 rounded-xl mb-2",
        "hover:scale-105 hover:-translate-y-0.5",
        isActive
          ? "bg-gradient-to-br from-primary/90 to-purple-600/90 text-primary-foreground shadow-lg shadow-primary/25"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
    >
      {/* Glow effect for active state */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 blur-xl -z-10" />
      )}
      
      <Icon className={cn(
        "h-5 w-5 mb-1.5 transition-transform duration-300",
        "group-hover:scale-110",
        isActive && "drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
      )} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
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
    { mode: 'qr', icon: QrCode, label: '二维码' },
  ]

  return (
    <aside className="w-20 h-full bg-sidebar/80 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-4">
      {/* Logo */}
      <div className="mb-6 p-2">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg ">
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 w-full px-2 space-y-1">
        {items.map((item) => (
          <SidebarItem
            key={item.mode}
            icon={item.icon}
            label={item.label}
            isActive={currentMode === item.mode}
            onClick={() => setMode(item.mode)}
          />
        ))}
      </nav>
      
      {/* Bottom indicator */}
      <div className="px-3 pb-2 w-full">
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-primary/50 via-purple-500/50 to-cyan-500/50" />
      </div>
    </aside>
  )
}
