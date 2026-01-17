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
  position: { x: number, y: number, z: number } // 3D coordinates
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
  
  // Material settings
  plateColor: string
  textColor: string
  roughness: number
  metalness: number
  
  // Display options
  showShadows: boolean
  
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
  
  // View control
  viewPreset: string | null
  setViewPreset: (preset: string | null) => void
}

// Font groups for categorized selection
export const FONT_GROUPS = {
  chinese: {
    label: '中文字体',
    fonts: [
      { value: '/fonts/连筋字体.json', label: '连筋字体 (中英文)' },
      { value: '/fonts/条形码字体.json', label: '条形码字体' },
    ]
  },
  english: {
    label: '英文字体',
    fonts: [
      { value: '/fonts/连筋英文_01.json', label: '连筋英文_01' },
      { value: '/fonts/连筋英文_02.json', label: '连筋英文_02' },
      { value: '/fonts/连筋英文_03.json', label: '连筋英文_03' },
      { value: '/fonts/连筋英文_04.json', label: '连筋英文_04' },
      { value: '/fonts/连筋英文_05.json', label: '连筋英文_05' },
      { value: '/fonts/连筋英文_06.json', label: '连筋英文_06' },
      { value: '/fonts/连筋英文_07.json', label: '连筋英文_07' },
      { value: '/fonts/连筋英文_08.json', label: '连筋英文_08' },
      { value: '/fonts/连筋英文_09.json', label: '连筋英文_09' },
      { value: '/fonts/连筋英文_10.json', label: '连筋英文_10' },
      { value: '/fonts/连筋英文_11.json', label: '连筋英文_11' },
      { value: '/fonts/连筋英文_12.json', label: '连筋英文_12' },
      { value: '/fonts/helvetiker_bold.json', label: 'Helvetiker Bold' },
      { value: '/fonts/helvetiker_regular.json', label: 'Helvetiker Regular' },
      { value: '/fonts/optimer_bold.json', label: 'Optimer Bold' },
      { value: '/fonts/optimer_regular.json', label: 'Optimer Regular' },
      { value: '/fonts/gentilis_bold.json', label: 'Gentilis Bold' },
      { value: '/fonts/gentilis_regular.json', label: 'Gentilis Regular' },
      { value: '/fonts/droid_sans_bold.json', label: 'Droid Sans Bold' },
      { value: '/fonts/droid_sans_regular.json', label: 'Droid Sans Regular' },
      { value: '/fonts/droid_serif_bold.json', label: 'Droid Serif Bold' },
      { value: '/fonts/droid_serif_regular.json', label: 'Droid Serif Regular' },
    ]
  }
}

// Flat list of all fonts for compatibility
export const ALL_FONTS = [
  ...FONT_GROUPS.chinese.fonts,
  ...FONT_GROUPS.english.fonts,
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
  fontUrl: '/fonts/helvetiker_bold.json',
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
      fontUrl: '/fonts/helvetiker_bold.json',
      position: { x: 0, y: 0, z: 0 },
      rotation: 0
    }
  ],

  baseThickness: 2,
  hasBase: false,
  
  // Material defaults
  plateColor: '#0ea5e9',
  textColor: '#e2e8f0',
  roughness: 0.3,
  metalness: 0.1,
  
  showShadows: false,
  exportTrigger: 0,
}

export const useModelStore = create<ModelStore>((set) => ({
  currentMode: 'basic',
  setMode: (mode) => set({ currentMode: mode }),
  
  viewPreset: null,
  setViewPreset: (preset) => set({ viewPreset: preset }),
  
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
          fontUrl: '/fonts/helvetiker_bold.json',
          position: { x: 0, y: (state.parameters.textItems.length * 15) % 30 - 15, z: 0 },
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
