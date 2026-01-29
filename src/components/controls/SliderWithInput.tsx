"use client"

import * as React from "react"
import { Slider as ShadcnSlider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SliderWithInputProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  unit?: string
  showInput?: boolean
  className?: string
}

export function SliderWithInput({
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
  showInput = true,
  className
}: SliderWithInputProps) {
  const [inputValue, setInputValue] = React.useState(value.toString())
  
  // Sync input when value changes externally
  React.useEffect(() => {
    setInputValue(value.toString())
  }, [value])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }
  
  const handleInputBlur = () => {
    const num = parseFloat(inputValue)
    if (!isNaN(num)) {
      onChange(num)
    } else {
      setInputValue(value.toString())
    }
  }
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    }
  }
  
  const handleSliderChange = (values: number[]) => {
    if (values[0] !== undefined) {
      onChange(values[0])
      setInputValue(values[0].toString())
    }
  }
  
  return (
    <div className={cn("flex flex-col gap-2.5 p-3.5 bg-white/3 rounded-2xl border border-white/5 hover:border-white/10 transition-all group", className)}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400 transition-colors"></label>
        {showInput ? (
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-white/10 rounded-lg px-2 py-0.5 shadow-inner transition-colors group-hover:border-white/20">
            <Input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              min={min}
              max={max}
              step={step}
              className="w-12 h-6 border-0 bg-transparent p-0 text-xs text-right tabular-nums focus-visible:ring-0 shadow-none text-blue-400 font-black"
            />
            {unit && <span className="text-[10px] text-zinc-600 font-bold">{unit}</span>}
          </div>
        ) : (
          <span className="text-xs font-bold tabular-nums text-blue-400">{value}{unit}</span>
        )}
      </div>
      
      <div className="px-1 py-1">
        <ShadcnSlider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={handleSliderChange}
          className="flex-1"
        />
      </div>
    </div>
  )
}
