import { create } from 'zustand'

export type GeneratorMode = 'basic' | 'text' | 'relief' | 'hollow' | 'template'
export type ShapeType = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'octahedron'
export type PlateShape = 'square' | 'rectangle' | 'circle' | 'diamond' | 'star' | 'wave' | 'heart'

// Text item for multi-text support
export interface TextItem {
  id: string
  content: string
  fontSize: number
  fontUrl: string
  position: { x: number, y: number }
  rotation: number // Rotation in degrees
}

export interface ModelParams {
  // Basic Shape Params
  shapeType: ShapeType
  size: number
  height: number
  segments: number
  
  // Text Params (for simple text mode)
  textContent: string
  fontSize: number
  thickness: number
  fontUrl: string
  textPosition: { x: number, y: number }
  
  // Relief params
  imageUrl: string | null
  invert: boolean
  reliefHeight: number
  
  // Hollow/Stencil plate params
  plateShape: PlateShape
  plateWidth: number  // For rectangle
  plateHeight: number // For rectangle
  textItems: TextItem[]
  
  // Common
  baseThickness: number
  hasBase: boolean
  
  // System
  exportTrigger: number
}

interface ModelStore {
  currentMode: GeneratorMode
  setMode: (mode: GeneratorMode) => void
  
  parameters: ModelParams
  updateParam: (key: keyof ModelParams, value: any) => void
  triggerExport: () => void
  
  // Text items management
  addTextItem: () => void
  removeTextItem: (id: string) => void
  updateTextItem: (id: string, updates: Partial<TextItem>) => void
}

// Stencil fonts (fonts with connected strokes for 3D printing)
export const STENCIL_FONTS = [
  { 
    value: 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', 
    label: 'Helvetiker Bold (推荐)' 
  },
  { 
    value: 'https://threejs.org/examples/fonts/optimer_bold.typeface.json', 
    label: 'Optimer Bold' 
  },
  { 
    value: 'https://threejs.org/examples/fonts/gentilis_bold.typeface.json', 
    label: 'Gentilis Bold' 
  },
]

// All available fonts
export const ALL_FONTS = [
  { value: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', label: 'Helvetiker Regular' },
  { value: 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', label: 'Helvetiker Bold' },
  { value: 'https://threejs.org/examples/fonts/optimer_regular.typeface.json', label: 'Optimer Regular' },
  { value: 'https://threejs.org/examples/fonts/optimer_bold.typeface.json', label: 'Optimer Bold' },
  { value: 'https://threejs.org/examples/fonts/gentilis_regular.typeface.json', label: 'Gentilis Regular' },
  { value: 'https://threejs.org/examples/fonts/gentilis_bold.typeface.json', label: 'Gentilis Bold' },
  { value: 'https://threejs.org/examples/fonts/droid/droid_sans_regular.typeface.json', label: 'Droid Sans' },
  { value: 'https://threejs.org/examples/fonts/droid/droid_sans_bold.typeface.json', label: 'Droid Sans Bold' },
  { value: 'https://threejs.org/examples/fonts/droid/droid_serif_regular.typeface.json', label: 'Droid Serif' },
  { value: 'https://threejs.org/examples/fonts/droid/droid_serif_bold.typeface.json', label: 'Droid Serif Bold' },
]

const generateId = () => Math.random().toString(36).substring(2, 9)

const defaultParams: ModelParams = {
  shapeType: 'cube',
  size: 50,
  height: 50,
  segments: 32,
  textContent: 'Hello',
  fontSize: 20,
  thickness: 5,
  fontUrl: 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
  textPosition: { x: 0, y: 0 },
  
  imageUrl: null,
  invert: false,
  reliefHeight: 2,
  
  // Hollow plate defaults
  plateShape: 'square',
  plateWidth: 80,
  plateHeight: 50,
  textItems: [
    {
      id: generateId(),
      content: 'Hello',
      fontSize: 12,
      fontUrl: 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
      position: { x: 0, y: 0 },
      rotation: 0
    }
  ],

  baseThickness: 2,
  hasBase: false,
  exportTrigger: 0,
}

export const useModelStore = create<ModelStore>((set) => ({
  currentMode: 'basic',
  setMode: (mode) => set({ currentMode: mode }),
  
  parameters: defaultParams,
  updateParam: (key, value) => 
    set((state) => ({ 
      parameters: { ...state.parameters, [key]: value } 
    })),
  triggerExport: () => set((state) => ({ 
      parameters: { ...state.parameters, exportTrigger: state.parameters.exportTrigger + 1 } 
  })),
  
  // Multi-text management
  addTextItem: () => set((state) => ({
    parameters: {
      ...state.parameters,
      textItems: [
        ...state.parameters.textItems,
        {
          id: generateId(),
          content: 'Text',
          fontSize: 12,
          fontUrl: 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
          position: { x: 0, y: (state.parameters.textItems.length * 15) % 30 - 15 },
          rotation: 0
        }
      ]
    }
  })),
  
  removeTextItem: (id) => set((state) => ({
    parameters: {
      ...state.parameters,
      textItems: state.parameters.textItems.filter(item => item.id !== id)
    }
  })),
  
  updateTextItem: (id, updates) => set((state) => ({
    parameters: {
      ...state.parameters,
      textItems: state.parameters.textItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    }
  })),
}))
