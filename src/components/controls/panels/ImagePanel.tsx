"use client"

import { useState } from "react"
import { type HoleItem, type ModelParams } from "@/lib/store"
import { FileUpload } from "@/components/ui/file-upload"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SliderWithInput } from "@/components/controls/SliderWithInput"
import { HolesControl } from "@/components/controls/HolesControl"
import { LayoutSectionPanel } from "./LayoutSectionPanel"
import { PanelSection, PanelSimpleSelect } from "./shared"
import { DisclosureSection, MaterialSection, PlateSettingsSection } from "./common"

const IMAGE_PLATE_SHAPES = [
  { value: "rectangle", label: "矩形" },
  { value: "circle", label: "圆形" },
  { value: "rounded", label: "圆角" },
  { value: "tray", label: "托盘" },
] as const

export function ImagePanel({
  parameters,
  updateParam,
  holes,
  addHole,
  removeHole,
  updateHole,
}: {
  parameters: ModelParams
  updateParam: (key: keyof ModelParams, value: unknown) => void
  holes: HoleItem[]
  addHole: () => void
  removeHole: (id: string) => void
  updateHole: (id: string, updates: Partial<HoleItem>) => void
}) {
  const [showAdvancedImageSettings, setShowAdvancedImageSettings] = useState(false)

  return (
    <div className="p-5 space-y-5">
      <div className="space-y-4">
        <div>
          <div className="mt-2 w-full">
            <FileUpload
              onChange={(files) => {
                const file = files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    if (typeof event.target?.result === "string") {
                      const img = new Image()
                      img.onload = () => {
                        const MAX_SIZE = 512
                        let w = img.width
                        let h = img.height

                        if (w > MAX_SIZE || h > MAX_SIZE) {
                          const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h)
                          w = Math.floor(w * ratio)
                          h = Math.floor(h * ratio)
                        }

                        const canvas = document.createElement("canvas")
                        canvas.width = w
                        canvas.height = h
                        const ctx = canvas.getContext("2d")
                        if (ctx) {
                          ctx.drawImage(img, 0, 0, w, h)
                          updateParam("imageUrl", canvas.toDataURL("image/png"))
                        }
                      }
                      img.src = event.target.result
                    }
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
            <p className="text-[10px] text-muted-foreground mt-2 opacity-70">支持 PNG, JPG 等格式。建议使用高对比度图片。</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">尺寸 (Size)</Label>
            <SliderWithInput
              value={parameters.imageSize}
              min={10}
              max={300}
              step={1}
              onChange={(val) => updateParam("imageSize", val)}
              compact
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">厚度</Label>
            <SliderWithInput
              value={parameters.imageThickness}
              min={1}
              max={50}
              step={0.5}
              onChange={(val) => updateParam("imageThickness", val)}
              compact
            />
          </div>

          <div className="col-span-2">
            <DisclosureSection
              title="高级图像设置"
              description="阈值、平滑、采样精度和图案变换"
              open={showAdvancedImageSettings}
              onToggle={() => setShowAdvancedImageSettings((prev) => !prev)}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">阈值</Label>
                  <SliderWithInput
                    value={parameters.imageThreshold}
                    min={1}
                    max={254}
                    step={1}
                    onChange={(val) => updateParam("imageThreshold", val)}
                    compact
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">平滑度</Label>
                  <SliderWithInput
                    value={parameters.imageSmoothing}
                    min={0}
                    max={5}
                    step={1}
                    onChange={(val) => updateParam("imageSmoothing", val)}
                    compact
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">精度 (Resolution)</Label>
                  <SliderWithInput
                    value={parameters.imageResolution}
                    min={32}
                    max={300}
                    step={16}
                    onChange={(val) => updateParam("imageResolution", val)}
                    compact
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">图案角度 (Image Rotation)</Label>
                  <SliderWithInput
                    value={parameters.imageRotation}
                    min={-180}
                    max={180}
                    step={1}
                    onChange={(val) => updateParam("imageRotation", val)}
                    compact
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">图案位置 X</Label>
                  <SliderWithInput
                    value={parameters.textPosition.x}
                    min={-300}
                    max={300}
                    step={1}
                    onChange={(val) => updateParam("textPosition", { ...parameters.textPosition, x: val })}
                    compact
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">图案位置 Y</Label>
                  <SliderWithInput
                    value={parameters.textPosition.y}
                    min={-300}
                    max={300}
                    step={1}
                    onChange={(val) => updateParam("textPosition", { ...parameters.textPosition, y: val })}
                    compact
                  />
                </div>
              </div>
            </DisclosureSection>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">风格</Label>
            <PanelSimpleSelect
              value={parameters.imageStyle}
              options={[
                { value: "voxel", label: "体素" },
                { value: "smooth", label: "平滑" },
              ]}
              onChange={(val) => updateParam("imageStyle", val)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 bg-card/40 p-3 rounded-xl border border-border/50">
          <Switch id="invert-mode" checked={parameters.imageInvert} onCheckedChange={(val) => updateParam("imageInvert", val)} />
          <Label htmlFor="invert-mode" className="mb-0 text-xs font-medium cursor-pointer">
            反转颜色 (Invert)
          </Label>
        </div>
      </div>

      <PanelSection title="底板设置">
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-card/40 p-3 rounded-xl border border-border/50 mb-2">
            <Switch id="has-base-mode" checked={parameters.hasBase} onCheckedChange={(val) => updateParam("hasBase", val)} />
            <Label htmlFor="has-base-mode" className="mb-0 text-xs font-medium cursor-pointer">
              显示底板
            </Label>
          </div>

          {parameters.hasBase && (
            <>
              <PlateSettingsSection
                parameters={parameters}
                updateParam={updateParam}
                title="底板形状"
                shapeOptions={IMAGE_PLATE_SHAPES}
                thicknessMax={20}
              />
              <MaterialSection parameters={parameters} updateParam={updateParam} textColorLabel="文字/图案颜色" />
              <div className="col-span-2">
                <HolesControl holes={holes} addHole={addHole} removeHole={removeHole} updateHole={updateHole} />
              </div>
            </>
          )}
        </div>
      </PanelSection>

      <LayoutSectionPanel currentMode="image" parameters={parameters} updateParam={updateParam} />
    </div>
  )
}
