"use client"

import * as React from "react"
import { useDebouncedCallback } from "use-debounce"
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
  className,
  compact = false
}: SliderWithInputProps & { compact?: boolean }) {
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
  
  // Debounce store updates to prevent excessive re-renders during dragging
  // Visual feedback (inputValue) is immediate, but expensive store updates are throttled
  const debouncedOnChange = useDebouncedCallback(onChange, 50)
  
  const handleSliderChange = (values: number[]) => {
    if (values[0] !== undefined) {
      setInputValue(values[0].toString()) // Immediate visual feedback
      debouncedOnChange(values[0])        // Debounced store update
    }
  }
  
  return (
    <div className={cn(
      "flex flex-col rounded-2xl border border-white/5 hover:border-white/10 transition-all group",
      compact ? "p-2.5 gap-1.5" : "p-3.5 gap-2.5 bg-white/3",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        {showInput ? (
          <div className={cn(
            "flex-1 flex items-center gap-1.5 bg-zinc-950 border border-white/10 rounded-lg shadow-inner transition-colors group-hover:border-white/20",
            compact ? "px-2 py-1" : "px-3 py-1.5"
          )}>
            <Input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              min={min}
              max={max}
              step={step}
              className={cn(
                "border-0 bg-transparent p-0 flex-1 tabular-nums focus-visible:ring-0 shadow-none text-blue-400 font-bold",
                compact ? "text-xs" : "text-sm",
                "text-left"
              )}
            />
            {unit && <span className="text-[10px] text-zinc-600 font-bold shrink-0">{unit}</span>}
          </div>
        ) : (
          <span className="text-xs font-bold tabular-nums text-blue-400 w-full text-right">{value}{unit}</span>
        )}
      </div>
      
      <div className={compact ? "px-0.5" : "px-1 py-1"}>
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
