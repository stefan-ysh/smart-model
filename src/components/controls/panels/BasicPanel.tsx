"use client"

import { type ModelParams, type ShapeType } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { LayoutSectionPanel } from "./LayoutSectionPanel"
import { PanelSimpleSelect, PanelSlider } from "./shared"

export function BasicPanel({
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
          基础模型参数
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">调整几何体的大小和形状</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-[10px] text-muted-foreground">形状类型</Label>
          <PanelSimpleSelect
            value={parameters.shapeType}
            options={[
              { value: "cube", label: "立方体" },
              { value: "sphere", label: "球体" },
              { value: "cylinder", label: "圆柱体" },
              { value: "cone", label: "圆锥体" },
              { value: "torus", label: "圆环体" },
              { value: "torusKnot", label: "扭结环" },
              { value: "capsule", label: "胶囊体" },
              { value: "ring", label: "圆环" },
              { value: "octahedron", label: "八面体" },
              { value: "dodecahedron", label: "十二面体" },
              { value: "icosahedron", label: "二十面体" },
              { value: "tetrahedron", label: "四面体" },
            ]}
            onChange={(val) => updateParam("shapeType", val as ShapeType)}
          />
        </div>

        <div
          className={cn(
            "space-y-1.5",
            (parameters.shapeType === "cube" ||
              parameters.shapeType === "capsule" ||
              parameters.shapeType === "ring" ||
              parameters.shapeType === "octahedron" ||
              parameters.shapeType === "dodecahedron" ||
              parameters.shapeType === "icosahedron" ||
              parameters.shapeType === "tetrahedron" ||
              parameters.shapeType === "torusKnot") &&
              "col-span-2",
          )}
        >
          <Label className="text-[10px] text-muted-foreground">尺寸</Label>
          <PanelSlider
            value={parameters.size}
            min={10}
            max={300}
            step={1}
            onChange={(val) => updateParam("size", val)}
            compact
          />
        </div>

        {(parameters.shapeType === "cylinder" || parameters.shapeType === "cone") && (
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">高度</Label>
            <PanelSlider
              value={parameters.height}
              min={10}
              max={300}
              step={1}
              onChange={(val) => updateParam("height", val)}
              compact
            />
          </div>
        )}

        {(parameters.shapeType === "sphere" ||
          parameters.shapeType === "cylinder" ||
          parameters.shapeType === "cone" ||
          parameters.shapeType === "torus") && (
          <div
            className={cn(
              "space-y-1.5",
              (parameters.shapeType === "cylinder" || parameters.shapeType === "cone") && "col-span-2",
            )}
          >
            <Label className="text-[10px] text-muted-foreground">分段数</Label>
            <PanelSlider
              value={parameters.segments}
              min={3}
              max={128}
              step={1}
              onChange={(val) => updateParam("segments", val)}
              compact
            />
          </div>
        )}
      </div>

      <LayoutSectionPanel currentMode="basic" parameters={parameters} updateParam={updateParam} />
    </div>
  )
}
