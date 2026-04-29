"use client"

import { type ModelParams } from "@/lib/store"
import { FontSelect } from "@/components/controls/FontSelect"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { LayoutSectionPanel } from "./LayoutSectionPanel"
import { PanelSlider } from "./shared"

export function TextPanel({
  parameters,
  updateParam,
}: {
  parameters: ModelParams
  updateParam: (key: keyof ModelParams, value: unknown) => void
}) {
  return (
    <div className="p-5 space-y-5">
      <div className="pb-3 border-b border-border/50">
        <h2 className="text-base font-semibold bg-linear-to-r from-foreground to-accent/60 bg-clip-text text-transparent">
          文字3D参数
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">输入文字并调整大小与厚度</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">字体</Label>
            <FontSelect value={parameters.fontUrl} onChange={(val) => updateParam("fontUrl", val)} />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">文字内容</Label>
            <Input
              type="text"
              value={parameters.textContent}
              onChange={(e) => updateParam("textContent", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">文字大小</Label>
            <PanelSlider
              value={parameters.fontSize}
              min={10}
              max={100}
              step={1}
              onChange={(val) => updateParam("fontSize", val)}
              compact
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">厚度</Label>
            <PanelSlider
              value={parameters.thickness}
              min={1}
              max={50}
              step={0.5}
              onChange={(val) => updateParam("thickness", val)}
              compact
            />
          </div>
        </div>
      </div>

      <LayoutSectionPanel currentMode="text" parameters={parameters} updateParam={updateParam} />
    </div>
  )
}
