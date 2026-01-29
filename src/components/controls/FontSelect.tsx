"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FONT_GROUPS, ALL_FONTS, useModelStore } from "@/lib/store"

interface FontSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

// Font category icons for visual distinction
const CATEGORY_ICONS: Record<string, string> = {
  chinese: '中',
  stencil: 'A',
  decorative: '★',
  english: 'Aa',
}

// Get preview sample text based on font category
function getPreviewText(fontValue: string): string {
  if (fontValue.includes('连筋中文') || fontValue.includes('连筋字体')) return '预览'
  if (fontValue.includes('连筋英文')) return 'ABC'
  if (fontValue.includes('条形码')) return '123'
  return 'Abc'
}

export function FontSelect({ value, onChange, className }: FontSelectProps) {
  const currentFont = ALL_FONTS.find(f => f.value === value)
  const { setLoadingFont } = useModelStore()
  
  const handleFontChange = (newValue: string) => {
    if (newValue !== value) {
      setLoadingFont(true)
      onChange(newValue)
      setTimeout(() => setLoadingFont(false), 2000)
    }
  }
  
  // Render a styled font item with icon
  const renderFontItem = (font: { value: string, label: string }, categoryKey: string) => (
    <SelectItem 
      key={font.value} 
      value={font.value}
      className="flex items-center gap-2 py-2"
    >
      <div className="flex items-center gap-2 w-full">
        <span className="w-6 h-6 rounded bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold shrink-0">
          {CATEGORY_ICONS[categoryKey] || 'A'}
        </span>
        <span className="flex-1 truncate">{font.label}</span>
        <span className="text-[10px] text-muted-foreground opacity-60 ml-auto">
          {getPreviewText(font.value)}
        </span>
      </div>
    </SelectItem>
  )
  
  return (
    <Select value={value} onValueChange={handleFontChange}>
      <SelectTrigger className={className || "w-full"}>
        <SelectValue placeholder="选择字体">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-primary/10 text-primary text-[9px] flex items-center justify-center font-bold">
              字
            </span>
            <span className="truncate">{currentFont?.label || "选择字体"}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 text-primary">
            <span className="text-sm">{CATEGORY_ICONS.chinese}</span>
            {FONT_GROUPS.chinese.label}
          </SelectLabel>
          {FONT_GROUPS.chinese.fonts.map((font) => renderFontItem(font, 'chinese'))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 text-primary">
            <span className="text-sm">{CATEGORY_ICONS.stencil}</span>
            {FONT_GROUPS.stencil.label}
          </SelectLabel>
          {FONT_GROUPS.stencil.fonts.map((font) => renderFontItem(font, 'stencil'))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 text-primary">
            <span className="text-sm">{CATEGORY_ICONS.decorative}</span>
            {FONT_GROUPS.decorative.label}
          </SelectLabel>
          {FONT_GROUPS.decorative.fonts.map((font) => renderFontItem(font, 'decorative'))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 text-primary">
            <span className="text-sm">{CATEGORY_ICONS.english}</span>
            {FONT_GROUPS.english.label}
          </SelectLabel>
          {FONT_GROUPS.english.fonts.map((font) => renderFontItem(font, 'english'))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
