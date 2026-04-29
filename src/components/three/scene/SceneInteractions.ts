import { ThreeEvent } from "@react-three/fiber"
import { useModelStore } from "@/lib/store"

export function handleExportTargetClick(e: ThreeEvent<MouseEvent>) {
  const { setSelectedLayer, isTransformEnabled } = useModelStore.getState()
  if (isTransformEnabled && e.eventObject === e.object) {
    setSelectedLayer(null)
  }
}
