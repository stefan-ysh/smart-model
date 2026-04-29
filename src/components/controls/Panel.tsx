"use client"

import { useModelStore } from "@/lib/store"
import { BasicPanel } from "./panels/BasicPanel"
import { HollowPanel } from "./panels/HollowPanel"
import { ImagePanel } from "./panels/ImagePanel"
import { QrPanel } from "./panels/QrPanel"
import { ReliefPanel } from "./panels/ReliefPanel"
import { TemplatePanel } from "./panels/TemplatePanel"
import { TextPanel } from "./panels/TextPanel"

function PanelContent() {
  const {
    currentMode,
    parameters,
    updateParam,
    addHole,
    removeHole,
    updateHole,
    addTextItem,
    removeTextItem,
    updateTextItem,
  } = useModelStore()

  if (currentMode === "basic") {
    return <BasicPanel parameters={parameters} updateParam={updateParam} />
  }

  if (currentMode === "text") {
    return <TextPanel parameters={parameters} updateParam={updateParam} />
  }

  if (currentMode === "relief") {
    return (
      <ReliefPanel
        parameters={parameters}
        updateParam={updateParam}
        addHole={addHole}
        removeHole={removeHole}
        updateHole={updateHole}
        addTextItem={addTextItem}
        removeTextItem={removeTextItem}
        updateTextItem={updateTextItem}
      />
    )
  }

  if (currentMode === "image") {
    return (
      <ImagePanel
        parameters={parameters}
        updateParam={updateParam}
        holes={parameters.holes}
        addHole={addHole}
        removeHole={removeHole}
        updateHole={updateHole}
      />
    )
  }

  if (currentMode === "hollow") {
    return (
      <HollowPanel
        parameters={parameters}
        updateParam={updateParam}
        addHole={addHole}
        removeHole={removeHole}
        updateHole={updateHole}
        addTextItem={addTextItem}
        removeTextItem={removeTextItem}
        updateTextItem={updateTextItem}
      />
    )
  }

  if (currentMode === "qr") {
    return (
      <QrPanel
        parameters={parameters}
        updateParam={updateParam}
        holes={parameters.holes}
        addHole={addHole}
        removeHole={removeHole}
        updateHole={updateHole}
      />
    )
  }

  if (currentMode === "template") {
    return <TemplatePanel updateParam={updateParam} />
  }

  return <div className="p-6 flex items-center justify-center text-muted-foreground text-sm">此模式参数面板尚未实现</div>
}

export function Panel() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <PanelContent />
      </div>
    </div>
  )
}
