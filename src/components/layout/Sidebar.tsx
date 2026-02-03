"use client"

import * as React from "react"
import { Box, Type, Image as ImageIcon, Grid3x3, QrCode, Brush } from "lucide-react"
import { cn } from "@/lib/utils"
import { useModelStore, GeneratorMode } from "@/lib/store"
interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive: boolean
  onClick: () => void
}

const SidebarItem = ({ icon: Icon, label, isActive, onClick }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center p-3 w-full transition-all duration-500 rounded-2xl mb-3",
        "hover:bg-white/5",
        isActive
          ? "text-white"
          : "text-zinc-500 hover:text-zinc-200"
      )}
    >
      {/* Active Highlight Background */}
      {isActive && (
        <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 shadow-[0_0_20px_rgba(59,130,246,0.5)] z-0" />
      )}
      
      {/* Icon with potential glow */}
      <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
        <Icon className={cn(
          "h-6 w-6 transition-all duration-500",
          isActive ? "scale-110 drop-shadow-[0_0_8px_white]" : "group-hover:text-white"
        )} />
      </div>
      
      {/* Label */}
      <span className={cn(
        "relative z-10 text-[10px] font-bold mt-2 uppercase tracking-widest transition-opacity duration-500",
        isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"
      )}>
        {label}
      </span>
      
      {/* Border indicator for inactive hover */}
      {!isActive && (
        <div className="absolute inset-x-3 bottom-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  )
}

export function Sidebar() {
  const { currentMode, setMode } = useModelStore()

  const items: { mode: GeneratorMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { mode: 'basic', icon: Box, label: '基础' },
    { mode: 'text', icon: Type, label: '文字' },
    { mode: 'relief', icon: ImageIcon, label: '浮雕' },
    { mode: 'hollow', icon: Grid3x3, label: '镂空' },
    { mode: 'qr', icon: QrCode, label: '二维码' },
    { mode: 'image', icon: Brush, label: '图片浮雕' },
  ]

  return (
    <aside className="w-24 h-full bg-zinc-950 border-r border-white/5 flex flex-col items-center py-6 relative z-50">
      {/* Navigation */}
      <nav className="flex-1 w-full px-3 space-y-1">
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
      
      {/* Bottom Visual Element */}
      <div className="w-12 h-1 rounded-full bg-zinc-900 overflow-hidden">
        <div className="h-full w-1/2 bg-blue-500" />
      </div>
    </aside>
  )
}
