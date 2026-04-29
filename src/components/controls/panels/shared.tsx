"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { SliderWithInput } from "@/components/controls/SliderWithInput"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const ADVANCED_PLATE_SHAPES = [
  { value: "rectangle", label: "矩形" },
  { value: "rounded", label: "圆角" },
  { value: "circle", label: "圆形" },
  { value: "oval", label: "椭圆" },
  { value: "diamond", label: "菱形" },
  { value: "hexagon", label: "六边" },
  { value: "pentagon", label: "五边" },
  { value: "star", label: "五星" },
  { value: "heart", label: "爱心" },
  { value: "shield", label: "盾牌" },
  { value: "badge", label: "徽章" },
  { value: "cloud", label: "云朵" },
  { value: "cross", label: "十字" },
  { value: "wave", label: "波浪" },
  { value: "nameplate", label: "姓名牌" },
  { value: "keychain", label: "钥匙扣" },
  { value: "tag", label: "吊牌" },
  { value: "coaster", label: "杯垫" },
  { value: "doorSign", label: "门牌" },
  { value: "petBone", label: "宠物牌" },
  { value: "trophy", label: "奖杯" },
  { value: "frame", label: "相框" },
  { value: "tray", label: "托盘" },
] as const

export function ColorInput({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div className="flex items-center gap-3 bg-card/40 p-2 rounded-xl border border-border/50 transition-all hover:border-border/70 group">
      <div className="relative h-10 w-10 shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <div className="h-full w-full rounded-lg border border-border/70 shadow-inner" style={{ backgroundColor: value }} />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest group-hover:text-muted-foreground transition-colors">
          HEX Code
        </span>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 border-0 bg-transparent p-0 font-mono text-sm focus-visible:ring-0 focus-visible:border-0 shadow-none text-foreground/90 placeholder:text-muted-foreground/60"
          placeholder="#RRGGBB"
        />
      </div>
    </div>
  )
}

export function PlateShapeButton({
  shape,
  selected,
  onClick,
  label,
}: {
  shape: string
  selected: boolean
  onClick: () => void
  label: string
}) {
  const icons: Record<string, string> = {
    square: "▢",
    rectangle: "▭",
    circle: "○",
    diamond: "◇",
    star: "☆",
    wave: "〰",
    heart: "♡",
    hexagon: "⬡",
    pentagon: "⬠",
    oval: "⬭",
    cross: "✚",
    cloud: "☁",
    shield: "🛡",
    badge: "⬢",
    rounded: "▢",
    nameplate: "🏷️",
    keychain: "🔑",
    tag: "🎁",
    coaster: "☕",
    doorSign: "🚪",
    petBone: "🐾",
    trophy: "🏆",
    frame: "🖼️",
    tray: "⬚",
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-300 min-w-[64px] min-h-[64px]",
        selected
          ? "border-primary bg-primary/10 text-primary-foreground shadow-md"
          : "border-border/50 bg-card/40 text-muted-foreground/80 hover:border-border/80 hover:text-foreground/80",
      )}
    >
      {selected && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary shadow-sm" />}
      <span className={cn("text-2xl transition-transform duration-300", selected ? "scale-110" : "group-hover:scale-110")}>
        {icons[shape] || "□"}
      </span>
      <span className="text-[9px] font-bold mt-2 uppercase tracking-tighter opacity-70">{label}</span>
    </button>
  )
}

export function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-b border-border/50 pb-4 last:border-0">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <span className="h-px flex-1 bg-linear-to-r from-primary/50 to-transparent" />
        {title}
        <span className="h-px flex-1 bg-linear-to-l from-primary/50 to-transparent" />
      </h3>
      {children}
    </div>
  )
}

export function PanelSimpleSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (val: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue>{options.find((o) => o.value === value)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function PanelSlider({
  value,
  min,
  max,
  step,
  onChange,
  unit = "",
  showInput = false,
  compact = false,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (val: number) => void
  unit?: string
  showInput?: boolean
  compact?: boolean
}) {
  return (
    <SliderWithInput
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      unit={unit}
      showInput={showInput}
      compact={compact}
    />
  )
}

export function PanelChoiceButton({
  selected,
  onClick,
  children,
  className,
  selectedClassName = "bg-primary/20 border-primary text-primary",
  unselectedClassName = "border-border/50 bg-card/40 text-muted-foreground hover:bg-card/60",
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
  selectedClassName?: string
  unselectedClassName?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-1.5 text-[10px] rounded-lg border transition-all",
        selected ? selectedClassName : unselectedClassName,
        className,
      )}
    >
      {children}
    </button>
  )
}

export function EdgeBevelControl({
  id,
  enabled,
  bevelType,
  bevelSize,
  onEnabledChange,
  onTypeChange,
  onSizeChange,
}: {
  id: string
  enabled: boolean
  bevelType: "round" | "chamfer"
  bevelSize: number
  onEnabledChange: (enabled: boolean) => void
  onTypeChange: (type: "round" | "chamfer") => void
  onSizeChange: (size: number) => void
}) {
  return (
    <div className="space-y-2 pt-2 border-t border-border/50 mt-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-[10px] text-muted-foreground cursor-pointer">
          底板边缘倒角
        </Label>
        <Switch id={id} checked={enabled} onCheckedChange={onEnabledChange} />
      </div>
      {enabled && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={cn(
                "px-2 py-1 text-[10px] rounded",
                bevelType === "round" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/90",
              )}
              onClick={() => onTypeChange("round")}
            >
              圆角
            </button>
            <button
              className={cn(
                "px-2 py-1 text-[10px] rounded",
                bevelType === "chamfer" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/90",
              )}
              onClick={() => onTypeChange("chamfer")}
            >
              斜角
            </button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">倒角大小</Label>
            <PanelSlider value={bevelSize} min={0.5} max={10} step={0.5} onChange={onSizeChange} compact />
          </div>
        </>
      )}
    </div>
  )
}
