"use client"

import { useEffect, useRef } from "react"
import { useModelStore, type GeneratorMode, type MaterialPreset, type ModelParams } from "@/lib/store"

const STORAGE_KEY = "smart-model:workspace:v1"
const THEME_KEY = "theme"

type PersistedWorkspace = {
  version: 1
  currentMode?: GeneratorMode
  parameters?: Partial<ModelParams>
  materialPreset?: MaterialPreset
  wireframeMode?: boolean
  bloomEnabled?: boolean
  showGrid?: boolean
}

function sanitizeParameters(parameters: Partial<ModelParams>): Partial<ModelParams> {
  const nextParams = { ...parameters }
  delete nextParams.exportTrigger

  if (typeof nextParams.imageUrl === "string" && nextParams.imageUrl.length > 1_500_000) {
    nextParams.imageUrl = null
  }

  return nextParams
}

export function AppPersistence() {
  const currentMode = useModelStore((state) => state.currentMode)
  const parameters = useModelStore((state) => state.parameters)
  const hydrateWorkspace = useModelStore((state) => state.hydrateWorkspace)
  const materialPreset = useModelStore((state) => state.materialPreset)
  const wireframeMode = useModelStore((state) => state.wireframeMode)
  const bloomEnabled = useModelStore((state) => state.bloomEnabled)
  const showGrid = useModelStore((state) => state.showGrid)
  const canUndo = useModelStore((state) => state.canUndo)
  const canRedo = useModelStore((state) => state.canRedo)
  const undo = useModelStore((state) => state.undo)
  const redo = useModelStore((state) => state.redo)
  const hasRestoredRef = useRef(false)

  useEffect(() => {
    const theme = window.localStorage.getItem(THEME_KEY)
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark")
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        hasRestoredRef.current = true
        return
      }

      const parsed = JSON.parse(raw) as PersistedWorkspace
      hydrateWorkspace({
        currentMode: parsed.currentMode,
        parameters: parsed.parameters ? sanitizeParameters(parsed.parameters) : undefined,
        materialPreset: parsed.materialPreset,
        wireframeMode: parsed.wireframeMode,
        bloomEnabled: parsed.bloomEnabled,
        showGrid: parsed.showGrid,
      })
    } catch (error) {
      console.error("Failed to restore workspace", error)
    } finally {
      hasRestoredRef.current = true
    }
  }, [hydrateWorkspace])

  useEffect(() => {
    if (!hasRestoredRef.current) return

    const saveTimer = window.setTimeout(() => {
      try {
        const payload: PersistedWorkspace = {
          version: 1,
          currentMode,
          parameters: sanitizeParameters(parameters),
          materialPreset,
          wireframeMode,
          bloomEnabled,
          showGrid,
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch (error) {
        console.error("Failed to persist workspace", error)
      }
    }, 250)

    return () => window.clearTimeout(saveTimer)
  }, [bloomEnabled, currentMode, materialPreset, parameters, showGrid, wireframeMode])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const isModifierPressed = event.metaKey || event.ctrlKey
      if (!isModifierPressed || event.key.toLowerCase() !== "z") return

      const target = event.target as HTMLElement | null
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable

      if (isTyping) return

      event.preventDefault()
      if (event.shiftKey) {
        if (canRedo) redo()
        return
      }
      if (canUndo) undo()
    }

    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [canRedo, canUndo, redo, undo])

  return null
}
