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
      // Allow values outside range for input flexibility
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
    <div className={cn("flex items-center gap-3", className)}>
      <ShadcnSlider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleSliderChange}
        className="flex-1"
      />
      {showInput ? (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            min={min}
            max={max}
            step={step}
            className="w-16 h-8 text-sm text-right px-2"
          />
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
      ) : (
        <span className="text-sm w-14 text-right tabular-nums">{value}{unit}</span>
      )}
    </div>
  )
}
