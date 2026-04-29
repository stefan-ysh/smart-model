"use client"

import { AlertTriangle } from "lucide-react"

import { type GeneratorMode, type ModelParams } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { PanelChoiceButton, PanelSlider } from "./shared"

export function LayoutSectionPanel({
  currentMode,
  parameters,
  updateParam,
}: {
  currentMode: GeneratorMode
  parameters: ModelParams
  updateParam: (key: keyof ModelParams, value: unknown) => void
}) {
  const isExpensiveMode = currentMode === "hollow" || currentMode === "relief"
  const isLargeArray =
    parameters.arrayType !== "none" &&
    ((parameters.arrayType === "rectangular" && parameters.arrayCountX * parameters.arrayCountY > 9) ||
      (parameters.arrayType === "circular" && parameters.arrayCircularCount > 8))

  return (
    <div className="space-y-3 border-b border-border/50 pb-4 last:border-0">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <span className="h-px flex-1 bg-linear-to-r from-primary/50 to-transparent" />
        排列布局
        <span className="h-px flex-1 bg-linear-to-l from-primary/50 to-transparent" />
      </h3>

      <div className="space-y-4">
        <div>
          <Label className="text-[10px] text-muted-foreground mb-2 block">排列类型</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "none", label: "单个" },
              { value: "rectangular", label: "矩形阵列" },
              { value: "circular", label: "环形阵列" },
            ].map((opt) => (
              <PanelChoiceButton
                key={opt.value}
                onClick={() => updateParam("arrayType", opt.value)}
                selected={parameters.arrayType === opt.value}
              >
                {opt.label}
              </PanelChoiceButton>
            ))}
          </div>
        </div>

        {parameters.arrayType === "rectangular" && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">X轴数量</Label>
              <PanelSlider
                value={parameters.arrayCountX}
                min={1}
                max={10}
                step={1}
                onChange={(val) => updateParam("arrayCountX", val)}
                compact
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Y轴数量</Label>
              <PanelSlider
                value={parameters.arrayCountY}
                min={1}
                max={10}
                step={1}
                onChange={(val) => updateParam("arrayCountY", val)}
                compact
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">X轴间距</Label>
              <PanelSlider
                value={parameters.arraySpacingX}
                min={10}
                max={200}
                step={1}
                onChange={(val) => updateParam("arraySpacingX", val)}
                compact
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Y轴间距</Label>
              <PanelSlider
                value={parameters.arraySpacingY}
                min={10}
                max={200}
                step={1}
                onChange={(val) => updateParam("arraySpacingY", val)}
                compact
              />
            </div>
          </div>
        )}

        {parameters.arrayType === "circular" && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">环形数量</Label>
              <PanelSlider
                value={parameters.arrayCircularCount}
                min={2}
                max={20}
                step={1}
                onChange={(val) => updateParam("arrayCircularCount", val)}
                compact
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">阵列半径</Label>
              <PanelSlider
                value={parameters.arrayCircularRadius}
                min={10}
                max={200}
                step={1}
                onChange={(val) => updateParam("arrayCircularRadius", val)}
                compact
              />
            </div>
          </div>
        )}

        {isExpensiveMode && parameters.arrayType !== "none" && (
          <div
            className={cn(
              "p-2 rounded-lg border flex items-start gap-2 text-[10px] leading-tight transition-all",
              isLargeArray
                ? "bg-accent/15 border-accent/40 text-accent-foreground/80"
                : "bg-primary/10 border-primary/20 text-primary-foreground/80",
            )}
          >
            <AlertTriangle
              className={cn("h-3 w-3 mt-0.5 shrink-0", isLargeArray ? "text-accent" : "text-primary")}
            />
            <p>
              {isLargeArray
                ? "由于镂空/浮雕计算量大，当前阵列规模较大，调整参数可能会有明显延迟。已开启几何缓存加速。"
                : "已针对镂空/浮雕模式开启阵列性能优化（几何缓存）。"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
