"use client"

import { type HoleItem, type ModelParams } from "@/lib/store"
import { HolesControl } from "@/components/controls/HolesControl"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { LayoutSectionPanel } from "./LayoutSectionPanel"
import { ColorInput, PanelChoiceButton, PanelSection, PanelSlider } from "./shared"

function LabelWithHint({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <Label className="text-sm font-medium text-foreground">{children}</Label>
      {hint && <span className="text-xs text-muted-foreground ml-2">{hint}</span>}
    </div>
  )
}

export function QrPanel({
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
  return (
    <div className="p-5 space-y-5">
      <div className="pb-3 border-b border-border/50">
        <h2 className="text-base font-semibold bg-linear-to-r from-foreground to-secondary/70 bg-clip-text text-transparent">
          二维码参数
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">生成可Print的 3D 二维码</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <LabelWithHint hint="输入链接或文本生成二维码">链接/内容</LabelWithHint>
          <Input
            value={parameters.qrText}
            onChange={(e) => updateParam("qrText", e.target.value)}
            placeholder="https://example.com"
            className="mt-1.5"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">尺寸</Label>
          <PanelSlider value={parameters.qrSize} min={20} max={200} step={1} onChange={(val) => updateParam("qrSize", val)} compact />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">深度</Label>
          <PanelSlider value={parameters.qrDepth} min={0.5} max={10} step={0.5} onChange={(val) => updateParam("qrDepth", val)} compact />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">底板厚度</Label>
          <PanelSlider value={parameters.baseThickness} min={1} max={10} step={0.5} onChange={(val) => updateParam("baseThickness", val)} compact />
        </div>

        <div className="col-span-2 bg-muted/30 p-3 rounded-lg space-y-3">
          <Label className="text-[10px] text-muted-foreground">生成模式</Label>
          <div className="flex gap-2">
            <PanelChoiceButton
              onClick={() => updateParam("qrInvert", false)}
              selected={!parameters.qrInvert}
              className="flex-1 py-1.5 px-3 text-xs font-medium transition-colors"
              selectedClassName="bg-primary text-primary-foreground border-primary"
              unselectedClassName="bg-transparent text-muted-foreground border-border hover:bg-muted"
            >
              浮雕 (凸)
            </PanelChoiceButton>
            <PanelChoiceButton
              onClick={() => updateParam("qrInvert", true)}
              selected={parameters.qrInvert}
              className="flex-1 py-1.5 px-3 text-xs font-medium transition-colors"
              selectedClassName="bg-primary text-primary-foreground border-primary"
              unselectedClassName="bg-transparent text-muted-foreground border-border hover:bg-muted"
            >
              凹雕 (凹)
            </PanelChoiceButton>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {parameters.qrInvert ? "适合作为模具或内嵌图案 (挖空)" : "适合作为铭牌或印章 (凸起)"}
          </p>

          {parameters.qrInvert && (
            <div className="flex items-center gap-3 pt-3 mt-1 border-t border-border/50">
              <Switch id="qr-through" checked={parameters.qrIsThrough} onCheckedChange={(val) => updateParam("qrIsThrough", val)} />
              <Label htmlFor="qr-through" className="mb-0 text-xs font-medium cursor-pointer">
                贯穿底板 (镂空)
              </Label>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">底板圆角</Label>
          <PanelSlider
            value={parameters.plateCornerRadius}
            min={0}
            max={parameters.qrSize / 2}
            step={1}
            onChange={(val) => updateParam("plateCornerRadius", val)}
            compact
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">边距</Label>
          <PanelSlider value={parameters.qrMargin} min={0} max={20} step={0.5} onChange={(val) => updateParam("qrMargin", val)} compact />
        </div>
      </div>

      <PanelSection title="材质设置">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">底板颜色</Label>
            <ColorInput value={parameters.plateColor} onChange={(val) => updateParam("plateColor", val)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">二维码颜色</Label>
            <ColorInput value={parameters.textColor} onChange={(val) => updateParam("textColor", val)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">粗糙度</Label>
            <PanelSlider value={parameters.roughness} min={0} max={1} step={0.05} onChange={(val) => updateParam("roughness", val)} compact />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">金属度</Label>
            <PanelSlider value={parameters.metalness} min={0} max={1} step={0.05} onChange={(val) => updateParam("metalness", val)} compact />
          </div>
        </div>
      </PanelSection>

      <div className="pt-2">
        <HolesControl holes={holes} addHole={addHole} removeHole={removeHole} updateHole={updateHole} />
      </div>
      <LayoutSectionPanel currentMode="qr" parameters={parameters} updateParam={updateParam} />
    </div>
  )
}
