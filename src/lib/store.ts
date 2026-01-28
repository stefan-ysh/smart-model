import { create } from 'zustand'

export type GeneratorMode = 'basic' | 'text' | 'relief' | 'hollow' | 'template' | 'qr'
export type ShapeType = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'octahedron' | 'dodecahedron' | 'icosahedron' | 'tetrahedron' | 'torusKnot' | 'capsule' | 'ring'
export type PlateShape = 'square' | 'rectangle' | 'circle' | 'diamond' | 'star' | 'wave' | 'heart' | 'hexagon' | 'pentagon' | 'oval' | 'cross' | 'cloud' | 'shield' | 'badge' | 'rounded' | 'nameplate' | 'keychain' | 'tag' | 'coaster' | 'doorSign' | 'petBone' | 'trophy' | 'frame'
export type ArrayType = 'none' | 'rectangular' | 'circular'

// Text item for multi-text support
export interface TextItem {
  id: string
  content: string
  fontSize: number
  fontUrl: string
  position: { x: number, y: number, z: number } // 3D coordinates
  rotation: number // Rotation in degrees
  reliefHeight: number // Height of the relief/extrusion
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
  
  // QR Code params
  qrText: string
  qrSize: number
  qrDepth: number
  qrInvert: boolean // false: relief (raised), true: hollow (sunken)
  qrMargin: number
  qrIsThrough: boolean
  
  // Hollow/Stencil plate params
  plateShape: PlateShape
  plateWidth: number  // For rectangle
  plateHeight: number // For rectangle
  platePosition: { x: number, y: number }  // Plate XY offset
  plateRotation: number  // Plate rotation in degrees
  plateCornerRadius: number  // Corner radius for rounded corners
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
  
  // Array/Pattern settings
  arrayType: ArrayType
  arrayCountX: number
  arrayCountY: number
  arraySpacingX: number
  arraySpacingY: number
  arrayCircularCount: number
  arrayCircularRadius: number
  
  // System
  exportTrigger: number
}

export type TransformMode = 'translate' | 'rotate' | 'scale'
export type MaterialPreset = 'default' | 'gold' | 'chrome' | 'matte' | 'glass' | 'neon'

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
  
  // Transform controls
  transformMode: TransformMode
  setTransformMode: (mode: TransformMode) => void
  isTransformEnabled: boolean
  setTransformEnabled: (enabled: boolean) => void
  
  // Layer selection (for Relief/Hollow modes)
  selectedLayerId: string | null  // 'base' for base plate, or textItem.id
  setSelectedLayer: (id: string | null) => void
  
  // Font loading state
  isLoadingFont: boolean
  setLoadingFont: (loading: boolean) => void
  
  // Toolbar controls
  autoRotate: boolean
  setAutoRotate: (enabled: boolean) => void
  wireframeMode: boolean
  setWireframeMode: (enabled: boolean) => void
  materialPreset: MaterialPreset
  setMaterialPreset: (preset: MaterialPreset) => void
  screenshotTrigger: number
  triggerScreenshot: () => void
  resetViewTrigger: number
  triggerResetView: () => void
  
  // Effects
  bloomEnabled: boolean
  setBloomEnabled: (enabled: boolean) => void
  contactShadowsEnabled: boolean
  setContactShadowsEnabled: (enabled: boolean) => void
  
  // Scene settings
  showGrid: boolean
  setShowGrid: (enabled: boolean) => void
}

// Font groups for categorized selection
export const FONT_GROUPS = {
  chinese: {
    label: '中文字体',
    fonts: [
      { value: '/fonts/连筋字体.json', label: '连筋字体 (中英文)' },
      { value: '/fonts/连筋中文.json', label: '连筋中文' },
      { value: '/fonts/条形码字体.json', label: '条形码字体' },
      { value: '/fonts/Rampart One_Regular.json', label: 'Rampart One' },
    ]
  },
  stencil: {
    label: '连筋英文',
    fonts: [
      { value: '/fonts/连筋英文_01.json', label: '连筋英文 01' },
      { value: '/fonts/连筋英文_02.json', label: '连筋英文 02' },
      { value: '/fonts/连筋英文_03.json', label: '连筋英文 03' },
      { value: '/fonts/连筋英文_04.json', label: '连筋英文 04' },
      { value: '/fonts/连筋英文_05.json', label: '连筋英文 05' },
      { value: '/fonts/连筋英文_06.json', label: '连筋英文 06' },
      { value: '/fonts/连筋英文_07.json', label: '连筋英文 07' },
      { value: '/fonts/连筋英文_08.json', label: '连筋英文 08' },
      { value: '/fonts/连筋英文_09.json', label: '连筋英文 09' },
      { value: '/fonts/连筋英文_10.json', label: '连筋英文 10' },
      { value: '/fonts/连筋英文_11.json', label: '连筋英文 11' },
      { value: '/fonts/连筋英文_12.json', label: '连筋英文 12' },
    ]
  },
  decorative: {
    label: '装饰字体',
    fonts: [
      { value: '/fonts/Bungee Shade_Regular.json', label: 'Bungee Shade' },
      { value: '/fonts/Doto Black_Regular.json', label: 'Doto Black' },
      { value: '/fonts/Eater_Regular.json', label: 'Eater' },
      { value: '/fonts/Flavors_Regular.json', label: 'Flavors' },
      { value: '/fonts/Frijole_Regular.json', label: 'Frijole' },
      { value: '/fonts/Hanalei_Regular.json', label: 'Hanalei' },
      { value: '/fonts/Henny Penny_Regular.json', label: 'Henny Penny' },
      { value: '/fonts/Honk_Regular.json', label: 'Honk' },
      { value: '/fonts/Kablammo_Regular.json', label: 'Kablammo' },
      { value: '/fonts/Macondo_Regular.json', label: 'Macondo' },
      { value: '/fonts/Raleway Dots_Regular.json', label: 'Raleway Dots' },
      { value: '/fonts/Rubik Bubbles_Regular.json', label: 'Rubik Bubbles' },
      { value: '/fonts/Rubik Iso_Regular.json', label: 'Rubik Iso' },
      { value: '/fonts/Rubik Wet Paint_Regular.json', label: 'Rubik Wet Paint' },
      { value: '/fonts/Gravitas One_Regular.json', label: 'Gravitas One' },
    ]
  },
  english: {
    label: '经典英文',
    fonts: [
      { value: '/fonts/Moirai One_Regular.json', label: 'Moirai One' },
      { value: '/fonts/Monoton_Regular.json', label: 'Monoton' },
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
  ...FONT_GROUPS.stencil.fonts,
  ...FONT_GROUPS.decorative.fonts,
  ...FONT_GROUPS.english.fonts,
]

const generateId = () => Math.random().toString(36).substring(2, 9)

const defaultParams: ModelParams = {
  shapeType: 'cube',
  size: 40,
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
  platePosition: { x: 0, y: 0 },
  plateRotation: 0,
  plateCornerRadius: 0,
  textItems: [
    {
      id: generateId(),
      content: 'Hello',
      fontSize: 12,
      fontUrl: '/fonts/helvetiker_bold.json',
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      reliefHeight: 5
    }
  ],
  
  // QR Code defaults
  qrText: 'https://github.com/StartPoly/smart-model',
  qrSize: 50,
  qrDepth: 2,
  qrInvert: false,
  qrMargin: 1,
  qrIsThrough: false,

  baseThickness: 2,
  hasBase: false,
  
  // Material defaults
  plateColor: '#0ea5e9',
  textColor: '#e2e8f0',
  roughness: 0.3,
  metalness: 0.1,
  
  showShadows: false,
  
  // Array defaults
  arrayType: 'none',
  arrayCountX: 3,
  arrayCountY: 1,
  arraySpacingX: 60,
  arraySpacingY: 60,
  arrayCircularCount: 6,
  arrayCircularRadius: 60,
  
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
          rotation: 0,
          reliefHeight: 5
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
  
  // Transform controls
  transformMode: 'translate',
  setTransformMode: (mode) => set({ transformMode: mode }),
  isTransformEnabled: false,
  setTransformEnabled: (enabled) => set({ isTransformEnabled: enabled }),
  
  // Layer selection
  selectedLayerId: null,
  setSelectedLayer: (id) => set({ selectedLayerId: id }),
  
  // Font loading  
  isLoadingFont: false,
  setLoadingFont: (loading) => set({ isLoadingFont: loading }),
  
  // Toolbar controls
  autoRotate: false,
  setAutoRotate: (enabled) => set({ autoRotate: enabled }),
  wireframeMode: false,
  setWireframeMode: (enabled) => set({ wireframeMode: enabled }),
  materialPreset: 'default',
  setMaterialPreset: (preset) => set({ materialPreset: preset }),
  screenshotTrigger: 0,
  triggerScreenshot: () => set((state) => ({ screenshotTrigger: state.screenshotTrigger + 1 })),
  resetViewTrigger: 0,
  triggerResetView: () => set((state) => ({ resetViewTrigger: state.resetViewTrigger + 1 })),
  
  // Effects
  bloomEnabled: true,
  setBloomEnabled: (enabled: boolean) => set({ bloomEnabled: enabled }),
  contactShadowsEnabled: true,
  setContactShadowsEnabled: (enabled: boolean) => set({ contactShadowsEnabled: enabled }),
  
  // Scene settings
  showGrid: true,
  setShowGrid: (enabled: boolean) => set({ showGrid: enabled }),
}))
