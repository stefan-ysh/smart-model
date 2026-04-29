"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { FontSelect } from "@/components/controls/FontSelect"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { type ModelParams, type PlateShape, type TextItem } from "@/lib/store"
import { cn } from "@/lib/utils"
import {
  ADVANCED_PLATE_SHAPES,
  ColorInput,
  EdgeBevelControl,
  PanelSlider,
  PlateShapeButton,
} from "./shared"

type UpdateParam = (key: keyof ModelParams, value: unknown) => void

export function PlateSettingsSection({
  parameters,
  updateParam,
  title = "底板形状",
  shapeOptions = ADVANCED_PLATE_SHAPES,
  showPlateRotation = false,
  showPlatePosition = false,
  showGroupRotation = false,
  thicknessMax = 10,
}: {
  parameters: ModelParams
  updateParam: UpdateParam
  title?: string
  shapeOptions?: ReadonlyArray<{ value: PlateShape; label: string }>
  showPlateRotation?: boolean
  showPlatePosition?: boolean
  showGroupRotation?: boolean
  thicknessMax?: number
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const hasAdvancedOptions =
    parameters.plateShape === "tray" ||
    ["rectangle", "rounded", "tray"].includes(parameters.plateShape) ||
    showPlateRotation ||
    showPlatePosition ||
    showGroupRotation

  return (
    <div className="space-y-4 border-b border-border/50 pb-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>

      <div className="grid grid-cols-4 gap-2">
        {shapeOptions.map((shape) => (
          <PlateShapeButton
            key={shape.value}
            shape={shape.value}
            label={shape.label}
            selected={parameters.plateShape === shape.value}
            onClick={() => updateParam("plateShape", shape.value)}
          />
        ))}
      </div>

      {parameters.plateShape === "rectangle" ? (
        <div className="grid grid-cols-2 gap-3">
          <FieldSlider label="宽度" value={parameters.plateWidth} min={20} max={300} step={1} onChange={(val) => updateParam("plateWidth", val)} />
          <FieldSlider label="高度" value={parameters.plateHeight} min={20} max={300} step={1} onChange={(val) => updateParam("plateHeight", val)} />
          <div className="col-span-2">
            <FieldSlider label="圆角半径" value={parameters.plateCornerRadius} min={0} max={30} step={1} onChange={(val) => updateParam("plateCornerRadius", val)} />
          </div>
        </div>
      ) : ["rounded", "tray"].includes(parameters.plateShape) ? (
        <div className="grid grid-cols-2 gap-3">
          <FieldSlider label="宽度" value={parameters.plateWidth} min={20} max={300} step={1} onChange={(val) => updateParam("plateWidth", val)} />
          <FieldSlider label="长度" value={parameters.plateHeight} min={20} max={300} step={1} onChange={(val) => updateParam("plateHeight", val)} />
        </div>
      ) : (
        <FieldSlider label="尺寸" value={parameters.size} min={20} max={300} step={1} onChange={(val) => updateParam("size", val)} />
      )}

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="col-span-2">
          <FieldSlider label="厚度" value={parameters.baseThickness} min={1} max={thicknessMax} step={0.5} onChange={(val) => updateParam("baseThickness", val)} />
        </div>
      </div>

      {hasAdvancedOptions && (
        <DisclosureSection
          title="高级底板设置"
          description="倒角、托盘边框、旋转、位置和精度"
          open={showAdvanced}
          onToggle={() => setShowAdvanced((prev) => !prev)}
        >
          {parameters.plateShape !== "rectangle" &&
            parameters.plateShape !== "circle" &&
            parameters.plateShape !== "tray" && (
              <FieldSlider label="圆角半径" value={parameters.plateCornerRadius} min={0} max={30} step={1} onChange={(val) => updateParam("plateCornerRadius", val)} />
            )}

          {parameters.plateShape === "tray" && (
            <div className="grid grid-cols-2 gap-3">
              <FieldSlider label="边框宽度" value={parameters.trayBorderWidth} min={2} max={30} step={1} onChange={(val) => updateParam("trayBorderWidth", val)} />
              <FieldSlider label="边框高度" value={parameters.trayBorderHeight} min={1} max={30} step={0.5} onChange={(val) => updateParam("trayBorderHeight", val)} />
            </div>
          )}

          {["rectangle", "rounded", "tray"].includes(parameters.plateShape) && (
            <EdgeBevelControl
              id="shared-edge-bevel"
              enabled={parameters.edgeBevelEnabled}
              bevelType={parameters.edgeBevelType}
              bevelSize={parameters.edgeBevelSize}
              onEnabledChange={(checked) => updateParam("edgeBevelEnabled", checked)}
              onTypeChange={(type) => updateParam("edgeBevelType", type)}
              onSizeChange={(val) => updateParam("edgeBevelSize", val)}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            {showPlateRotation && (
              <div className="col-span-2">
                <FieldSlider label="底板角度 (°)" value={parameters.plateRotation} min={-180} max={180} step={1} onChange={(val) => updateParam("plateRotation", val)} />
              </div>
            )}

            {showGroupRotation && (
              <div className="col-span-2">
                <FieldSlider label="整体旋转 (°)" value={parameters.groupRotation} min={-180} max={180} step={1} onChange={(val) => updateParam("groupRotation", val)} />
              </div>
            )}

            {showPlatePosition && (
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">底板位置</Label>
                <div className="grid grid-cols-2 gap-3">
                  <FieldSlider
                    label="横向 (X)"
                    value={parameters.platePosition.x}
                    min={-300}
                    max={300}
                    step={1}
                    onChange={(val) => updateParam("platePosition", { ...parameters.platePosition, x: val })}
                  />
                  <FieldSlider
                    label="纵向 (Y)"
                    value={parameters.platePosition.y}
                    min={-300}
                    max={300}
                    step={1}
                    onChange={(val) => updateParam("platePosition", { ...parameters.platePosition, y: val })}
                  />
                </div>
              </div>
            )}

            <div className="col-span-2 space-y-1.5 pt-2 border-t border-border/50">
              <Label className="text-[10px] text-muted-foreground flex justify-between">
                <span>模型精度 (影响平滑度)</span>
                <span className="text-muted-foreground/80">{parameters.modelResolution || 3}级</span>
              </Label>
              <PanelSlider
                value={parameters.modelResolution || 3}
                min={1}
                max={5}
                step={1}
                onChange={(val) => updateParam("modelResolution", val)}
                compact
              />
            </div>
          </div>
        </DisclosureSection>
      )}
    </div>
  )
}

export function TextItemsSection({
  textItems,
  addTextItem,
  removeTextItem,
  updateTextItem,
  showReliefHeight = false,
}: {
  textItems: TextItem[]
  addTextItem: () => void
  removeTextItem: (id: string) => void
  updateTextItem: (id: string, updates: Partial<TextItem>) => void
  showReliefHeight?: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">文字列表</h3>
        <button onClick={() => addTextItem()} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          + 添加文字
        </button>
      </div>

      {textItems.map((item, index) => (
        <div key={item.id} className="p-3 bg-secondary/50 rounded-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">文字 #{index + 1}</span>
            {textItems.length > 1 && (
              <button onClick={() => removeTextItem(item.id)} className="text-xs text-destructive hover:underline">
                删除
              </button>
            )}
          </div>

          <Input type="text" value={item.content} onChange={(e) => updateTextItem(item.id, { content: e.target.value })} placeholder="输入文字..." />

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">字体</Label>
              <FontSelect value={item.fontUrl} onChange={(val) => updateTextItem(item.id, { fontUrl: val })} />
            </div>

            <FieldSlider label="字号" value={item.fontSize} min={5} max={100} step={1} onChange={(val) => updateTextItem(item.id, { fontSize: val })} />

            {showReliefHeight && (
              <div className="col-span-2">
                <FieldSlider label="长度" value={item.reliefHeight} min={1} max={20} step={0.5} onChange={(val) => updateTextItem(item.id, { reliefHeight: val })} />
              </div>
            )}

            <div className={showReliefHeight ? "col-span-2" : "space-y-1.5"}>
              <FieldSlider label="角度 (°)" value={item.rotation} min={-180} max={180} step={1} onChange={(val) => updateTextItem(item.id, { rotation: val })} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">位置</Label>
              <div className="grid grid-cols-2 gap-3">
                <FieldSlider
                  label="横向 (X)"
                  value={item.position.x}
                  min={-300}
                  max={300}
                  step={1}
                  onChange={(val) => updateTextItem(item.id, { position: { ...item.position, x: val } })}
                />
                <FieldSlider
                  label="纵向 (Y)"
                  value={item.position.y}
                  min={-300}
                  max={300}
                  step={1}
                  onChange={(val) => updateTextItem(item.id, { position: { ...item.position, y: val } })}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function MaterialSection({
  parameters,
  updateParam,
  textColorLabel = "文字颜色",
  showTextColor = true,
}: {
  parameters: ModelParams
  updateParam: UpdateParam
  textColorLabel?: string
  showTextColor?: boolean
}) {
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">材质设置</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">底板颜色</Label>
          <ColorInput value={parameters.plateColor} onChange={(val) => updateParam("plateColor", val)} />
        </div>

        {showTextColor && (
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">{textColorLabel}</Label>
            <ColorInput value={parameters.textColor} onChange={(val) => updateParam("textColor", val)} />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">粗糙度</Label>
          <PanelSlider value={parameters.roughness} min={0} max={1} step={0.05} onChange={(val) => updateParam("roughness", val)} compact />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">金属度</Label>
          <PanelSlider value={parameters.metalness} min={0} max={1} step={0.05} onChange={(val) => updateParam("metalness", val)} compact />
        </div>
      </div>
    </div>
  )
}

function FieldSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (val: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <PanelSlider value={value} min={min} max={max} step={step} onChange={onChange} compact />
    </div>
  )
}

export function DisclosureSection({
  title,
  description,
  open,
  onToggle,
  children,
}: {
  title: string
  description?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <div className="text-xs font-semibold text-foreground">{title}</div>
          {description && <div className="mt-1 text-[10px] text-muted-foreground">{description}</div>}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-4 border-t border-border/50 px-4 py-4">{children}</div>}
    </div>
  )
}
