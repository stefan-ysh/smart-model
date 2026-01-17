"use client"

import { useEffect, useTransition } from "react"
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

export function FontSelect({ value, onChange, className }: FontSelectProps) {
  // Find current font label for display
  const currentFont = ALL_FONTS.find(f => f.value === value)
  const { setLoadingFont } = useModelStore()
  
  // Handle font change with loading state
  const handleFontChange = (newValue: string) => {
    if (newValue !== value) {
      setLoadingFont(true)
      onChange(newValue)
      // Clear loading after a delay (font will load in Suspense)
      setTimeout(() => setLoadingFont(false), 2000)
    }
  }
  
  return (
    <Select value={value} onValueChange={handleFontChange}>
      <SelectTrigger className={className || "w-full"}>
        <SelectValue placeholder="选择字体">
          {currentFont?.label || "选择字体"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{FONT_GROUPS.chinese.label}</SelectLabel>
          {FONT_GROUPS.chinese.fonts.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              {font.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>{FONT_GROUPS.stencil.label}</SelectLabel>
          {FONT_GROUPS.stencil.fonts.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              {font.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>{FONT_GROUPS.decorative.label}</SelectLabel>
          {FONT_GROUPS.decorative.fonts.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              {font.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>{FONT_GROUPS.english.label}</SelectLabel>
          {FONT_GROUPS.english.fonts.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              {font.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
