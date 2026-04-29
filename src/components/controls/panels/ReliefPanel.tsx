"use client"

import { type HoleItem, type ModelParams, type TextItem } from "@/lib/store"
import { HolesControl } from "@/components/controls/HolesControl"
import { LayoutSectionPanel } from "./LayoutSectionPanel"
import { MaterialSection, PlateSettingsSection, TextItemsSection } from "./common"

export function ReliefPanel({
  parameters,
  updateParam,
  addHole,
  removeHole,
  updateHole,
  addTextItem,
  removeTextItem,
  updateTextItem,
}: {
  parameters: ModelParams
  updateParam: (key: keyof ModelParams, value: unknown) => void
  addHole: () => void
  removeHole: (id: string) => void
  updateHole: (id: string, updates: Partial<HoleItem>) => void
  addTextItem: () => void
  removeTextItem: (id: string) => void
  updateTextItem: (id: string, updates: Partial<TextItem>) => void
}) {
  return (
    <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-100px)]">
      <div className="pb-3 border-b border-border/50">
        <h2 className="text-base font-semibold bg-linear-to-r from-foreground to-secondary/70 bg-clip-text text-transparent">浮雕板</h2>
        <p className="text-xs text-muted-foreground mt-0.5">选择板形并添加多个凸起文字</p>
      </div>

      <PlateSettingsSection
        parameters={parameters}
        updateParam={updateParam}
        showPlateRotation
        showPlatePosition
        showGroupRotation
      />

      <div className="col-span-2">
        <HolesControl holes={parameters.holes} addHole={addHole} removeHole={removeHole} updateHole={updateHole} />
      </div>

      <TextItemsSection
        textItems={parameters.textItems}
        addTextItem={addTextItem}
        removeTextItem={removeTextItem}
        updateTextItem={updateTextItem}
        showReliefHeight
      />

      <MaterialSection parameters={parameters} updateParam={updateParam} />
      <LayoutSectionPanel currentMode="relief" parameters={parameters} updateParam={updateParam} />
    </div>
  )
}
