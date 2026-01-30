import { create } from "zustand";

export type GeneratorMode =
  | "basic"
  | "text"
  | "relief"
  | "hollow"
  | "template"
  | "qr"
  | "image";
export type ShapeType =
  | "cube"
  | "sphere"
  | "cylinder"
  | "cone"
  | "torus"
  | "octahedron"
  | "dodecahedron"
  | "icosahedron"
  | "tetrahedron"
  | "torusKnot"
  | "capsule"
  | "ring";
export type PlateShape =
  | "square"
  | "rectangle"
  | "circle"
  | "diamond"
  | "star"
  | "wave"
  | "heart"
  | "hexagon"
  | "pentagon"
  | "oval"
  | "cross"
  | "cloud"
  | "shield"
  | "badge"
  | "rounded"
  | "nameplate"
  | "keychain"
  | "tag"
  | "coaster"
  | "doorSign"
  | "petBone"
  | "trophy"
  | "frame"
  | "tray";
export type ArrayType = "none" | "rectangular" | "circular";
export type ExportFormat = "stl" | "obj" | "gltf" | "glb";

// Text item for multi-text support
export interface TextItem {
  id: string;
  content: string;
  fontSize: number;
  fontUrl: string;
  position: { x: number; y: number; z: number }; // 3D coordinates
  rotation: number; // Rotation in degrees
  reliefHeight: number; // Height of the relief/extrusion
}

export interface HoleItem {
  id: string;
  x: number; // relative to center
  y: number; // relative to center
  radius: number; // hole radius
}

export interface ModelParams {
  // Basic Shape Params
  shapeType: ShapeType;
  size: number;
  height: number;
  segments: number;

  // Text Params (for simple text mode)
  textContent: string;
  fontSize: number;
  thickness: number;
  fontUrl: string;
  textPosition: { x: number; y: number };

  // Relief params (Text based)
  // Removed imageUrl from here as it is specific to Image Relief now
  reliefHeight: number;

  // Hollow/Stencil plate params
  plateShape: PlateShape;
  plateWidth: number; // For rectangle
  plateHeight: number; // For rectangle
  platePosition: { x: number; y: number }; // Plate XY offset
  plateRotation: number; // Plate rotation in degrees
  plateCornerRadius: number; // Corner radius for rounded corners
  textItems: TextItem[];
  holes: HoleItem[]; // Holes in base plate

  // Common
  baseThickness: number;

  // Material settings
  plateColor: string;
  textColor: string;

  // Display options
  showShadows: boolean;

  // QR Code params
  qrText: string;
  qrSize: number;
  qrDepth: number;
  qrInvert: boolean; // false: relief (raised), true: hollow (sunken)
  qrMargin: number;
  qrIsThrough: boolean;

  // Image Relief params
  imageUrl: string | null;
  imageThreshold: number; // 0-255
  imageSize: number;
  imageThickness: number;
  imageInvert: boolean;
  imageSmoothing: number; // 0-5 for smoothing steps
  imageStyle: "voxel" | "smooth";
  imageResolution: number; // 32-512
  imageRotation: number; // Rotation in degrees for the image pattern

  // Generic
  roughness: number;
  metalness: number;

  // Base Plate
  hasBase: boolean; // Global toggle for base plate

  // Tray plate params (raised border with recessed center)
  trayBorderWidth: number; // Width of the raised border
  trayBorderHeight: number; // Height of the raised border above base

  // Edge bevel/chamfer params
  edgeBevelEnabled: boolean; // Enable edge bevel
  edgeBevelType: 'round' | 'chamfer'; // Type of edge bevel
  edgeBevelSize: number; // Size of the bevel (1-10mm)
  
  // Model Resolution (1-5)
  // 1: Low (32 segments)
  // 3: Medium (64 segments) 
  // 5: High (128 segments)
  modelResolution: number;

  // Advanced Pattern
  arrayType: "none" | "rectangular" | "circular";
  arrayCountX: number;
  arrayCountY: number;
  arraySpacingX: number;
  arraySpacingY: number;
  arrayCircularCount: number;
  arrayCircularRadius: number;

  // System
  exportTrigger: number;
  exportFormat: ExportFormat;
}

export type TransformMode = "translate" | "rotate" | "scale";
export type MaterialPreset =
  | "default"
  | "gold"
  | "chrome"
  | "matte"
  | "glass"
  | "neon";

interface ModelStore {
  currentMode: GeneratorMode;
  setMode: (mode: GeneratorMode) => void;

  parameters: ModelParams;
  updateParam: (key: keyof ModelParams, value: any) => void;
  setParameters: (params: Partial<ModelParams>) => void;
  triggerExport: () => void;

  // Text items management
  addTextItem: () => void;
  removeTextItem: (id: string) => void;
  updateTextItem: (id: string, updates: Partial<TextItem>) => void;

  // Hole management
  addHole: () => void;
  removeHole: (id: string) => void;
  updateHole: (id: string, updates: Partial<HoleItem>) => void;

  // View control
  viewPreset: string | null;
  setViewPreset: (preset: string | null) => void;

  // Transform controls
  transformMode: TransformMode;
  setTransformMode: (mode: TransformMode) => void;
  isTransformEnabled: boolean;
  setTransformEnabled: (enabled: boolean) => void;

  // Layer selection (for Relief/Hollow modes)
  selectedLayerId: string | null; // 'base' for base plate, or textItem.id
  setSelectedLayer: (id: string | null) => void;

  // Font loading state
  isLoadingFont: boolean;
  setLoadingFont: (loading: boolean) => void;

  // Toolbar controls
  autoRotate: boolean;
  setAutoRotate: (enabled: boolean) => void;
  wireframeMode: boolean;
  setWireframeMode: (enabled: boolean) => void;
  materialPreset: MaterialPreset;
  setMaterialPreset: (preset: MaterialPreset) => void;
  screenshotTrigger: number;
  triggerScreenshot: () => void;
  resetViewTrigger: number;
  triggerResetView: () => void;

  // Effects
  bloomEnabled: boolean;
  setBloomEnabled: (enabled: boolean) => void;
  contactShadowsEnabled: boolean;
  setContactShadowsEnabled: (enabled: boolean) => void;

  // Scene settings
  showGrid: boolean;
  setShowGrid: (enabled: boolean) => void;
}

// Font groups for categorized selection
export const FONT_GROUPS = {
  chinese: {
    label: "中文字体",
    fonts: [
      { value: "/fonts/连筋字体.json", label: "连筋字体 (中英文)" },
      { value: "/fonts/连筋中文.json", label: "连筋中文" },
      { value: "/fonts/条形码字体.json", label: "条形码字体" },
      { value: "/fonts/Rampart One_Regular.json", label: "Rampart One" },
      // New Chinese fonts
      { value: "/fonts/AaHouDiHei_Regular.json", label: "Aa厚底黑" },
      { value: "/fonts/DOUYU Font_Regular.json", label: "斗鱼字体" },
      {
        value: "/fonts/LogoSC Unbounded Sans_Regular.json",
        label: "LogoSC 无界黑",
      },
      { value: "/fonts/MaokenAssortedSans_Regular.json", label: "猫啃什锦黑" },
      { value: "/fonts/Nishiki-teki_Regular.json", label: "锦的字体" },
      {
        value: "/fonts/Pangmenzhengdaoqingsongti_Regular.json",
        label: "庞门正道轻松体",
      },
      {
        value: "/fonts/Swei Dart Sans CJK JP_Black.json",
        label: "狮尾镖刺黑体",
      },
      { value: "/fonts/XianErTi_Regular.json", label: "仙儿体" },
      { value: "/fonts/baotuxiaobaiti_Regular.json", label: "包图小白体" },
      { value: "/fonts/k8x12S_Regular.json", label: "K8像素字体" },
      {
        value: "/fonts/pingfangzhangyalinheifang_常规.json",
        label: "平方张雅霖黑方",
      },
      { value: "/fonts/zihunbiantaoti_Regular.json", label: "字魂扁桃体" },
      { value: "/fonts/周字宋体ZhouZiSongTi_Regular.json", label: "周字宋体" },
      { value: "/fonts/字体圈伟君黑 W3_Regular.json", label: "字体圈伟君黑" },
      {
        value: "/fonts/字库江湖古风体 常规_Regular.json",
        label: "字库江湖古风体",
      },
      { value: "/fonts/峄山碑篆体_Regular.json", label: "峄山碑篆体" },
    ],
  },
  stencil: {
    label: "连筋英文",
    fonts: [
      { value: "/fonts/连筋英文_01.json", label: "连筋英文 01" },
      { value: "/fonts/连筋英文_02.json", label: "连筋英文 02" },
      { value: "/fonts/连筋英文_03.json", label: "连筋英文 03" },
      { value: "/fonts/连筋英文_04.json", label: "连筋英文 04" },
      { value: "/fonts/连筋英文_05.json", label: "连筋英文 05" },
      { value: "/fonts/连筋英文_06.json", label: "连筋英文 06" },
      { value: "/fonts/连筋英文_07.json", label: "连筋英文 07" },
      { value: "/fonts/连筋英文_08.json", label: "连筋英文 08" },
      { value: "/fonts/连筋英文_09.json", label: "连筋英文 09" },
      { value: "/fonts/连筋英文_10.json", label: "连筋英文 10" },
      { value: "/fonts/连筋英文_11.json", label: "连筋英文 11" },
      { value: "/fonts/连筋英文_12.json", label: "连筋英文 12" },
    ],
  },
  decorative: {
    label: "装饰字体",
    fonts: [
      { value: "/fonts/Bungee Shade_Regular.json", label: "Bungee Shade" },
      { value: "/fonts/Doto Black_Regular.json", label: "Doto Black" },
      { value: "/fonts/Eater_Regular.json", label: "Eater" },
      { value: "/fonts/Flavors_Regular.json", label: "Flavors" },
      { value: "/fonts/Frijole_Regular.json", label: "Frijole" },
      { value: "/fonts/Hanalei_Regular.json", label: "Hanalei" },
      { value: "/fonts/Henny Penny_Regular.json", label: "Henny Penny" },
      { value: "/fonts/Honk_Regular.json", label: "Honk" },
      { value: "/fonts/Kablammo_Regular.json", label: "Kablammo" },
      { value: "/fonts/Macondo_Regular.json", label: "Macondo" },
      { value: "/fonts/Raleway Dots_Regular.json", label: "Raleway Dots" },
      { value: "/fonts/Rubik Bubbles_Regular.json", label: "Rubik Bubbles" },
      { value: "/fonts/Rubik Iso_Regular.json", label: "Rubik Iso" },
      {
        value: "/fonts/Rubik Wet Paint_Regular.json",
        label: "Rubik Wet Paint",
      },
      { value: "/fonts/Gravitas One_Regular.json", label: "Gravitas One" },
    ],
  },
  english: {
    label: "经典英文",
    fonts: [
      { value: "/fonts/Moirai One_Regular.json", label: "Moirai One" },
      { value: "/fonts/Monoton_Regular.json", label: "Monoton" },
      { value: "/fonts/helvetiker_bold.json", label: "Helvetiker Bold" },
      { value: "/fonts/helvetiker_regular.json", label: "Helvetiker Regular" },
      { value: "/fonts/optimer_bold.json", label: "Optimer Bold" },
      { value: "/fonts/optimer_regular.json", label: "Optimer Regular" },
      { value: "/fonts/gentilis_bold.json", label: "Gentilis Bold" },
      { value: "/fonts/gentilis_regular.json", label: "Gentilis Regular" },
      { value: "/fonts/droid_sans_bold.json", label: "Droid Sans Bold" },
      { value: "/fonts/droid_sans_regular.json", label: "Droid Sans Regular" },
      { value: "/fonts/droid_serif_bold.json", label: "Droid Serif Bold" },
      {
        value: "/fonts/droid_serif_regular.json",
        label: "Droid Serif Regular",
      },
    ],
  },
};

// Flat list of all fonts for compatibility
export const ALL_FONTS = [
  ...FONT_GROUPS.chinese.fonts,
  ...FONT_GROUPS.stencil.fonts,
  ...FONT_GROUPS.decorative.fonts,
  ...FONT_GROUPS.english.fonts,
];

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultParams: ModelParams = {
  shapeType: "cube",
  size: 40,
  height: 50,
  segments: 32,
  textContent: "Hello",
  fontSize: 20,
  thickness: 5,
  fontUrl: "/fonts/helvetiker_bold.json",
  textPosition: { x: 0, y: 0 },

  reliefHeight: 2,

  // Hollow plate defaults
  plateShape: "square",
  plateWidth: 80,
  plateHeight: 50,
  platePosition: { x: 0, y: 0 },
  plateRotation: 0,
  plateCornerRadius: 0,
  textItems: [
    {
      id: generateId(),
      content: "Hello",
      fontSize: 12,
      fontUrl: "/fonts/helvetiker_bold.json",
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      reliefHeight: 5,
    },
  ],

  // QR Code defaults
  qrText: "https://www.cosmorigin.com",
  qrSize: 50,
  qrDepth: 2,
  qrInvert: false,
  qrMargin: 1,
  qrIsThrough: false,

  // Image Relief defaults
  imageUrl: null,
  imageThreshold: 128,
  imageSize: 100,
  imageThickness: 5,
  imageInvert: false,
  imageSmoothing: 1,
  imageStyle: "voxel",
  imageResolution: 150,
  imageRotation: 0,

  baseThickness: 2,
  hasBase: false,

  // Tray plate defaults
  trayBorderWidth: 5,
  trayBorderHeight: 5,

  // Edge bevel defaults
  edgeBevelEnabled: false,
  edgeBevelType: 'round',
  edgeBevelSize: 2,
  
  modelResolution: 3,

  // Material defaults
  plateColor: "#0ea5e9",
  textColor: "#e2e8f0",
  roughness: 0.3,
  metalness: 0.1,

  showShadows: false,

  // Holes
  holes: [],

  // Array defaults
  arrayType: "none",
  arrayCountX: 3,
  arrayCountY: 1,
  arraySpacingX: 60,
  arraySpacingY: 60,
  arrayCircularCount: 6,
  arrayCircularRadius: 60,

  exportTrigger: 0,
  exportFormat: "stl",
};

export const useModelStore = create<ModelStore>((set) => ({
  currentMode: "basic",
  setMode: (mode) => set({ currentMode: mode }),

  viewPreset: null,
  setViewPreset: (preset) => set({ viewPreset: preset }),

  parameters: defaultParams,
  updateParam: (key, value) =>
    set((state) => ({
      parameters: { ...state.parameters, [key]: value },
    })),
  setParameters: (params) =>
    set((state) => ({
      parameters: { ...state.parameters, ...params },
    })),
  triggerExport: () =>
    set((state) => ({
      parameters: {
        ...state.parameters,
        exportTrigger: state.parameters.exportTrigger + 1,
      },
    })),

  // Multi-text management
  addTextItem: () =>
    set((state) => ({
      parameters: {
        ...state.parameters,
        textItems: [
          ...state.parameters.textItems,
          {
            id: generateId(),
            content: "Text",
            fontSize: 12,
            fontUrl: "/fonts/helvetiker_bold.json",
            position: {
              x: 0,
              y: ((state.parameters.textItems.length * 15) % 30) - 15,
              z: 0,
            },
            rotation: 0,
            reliefHeight: 5,
          },
        ],
      },
    })),

  removeTextItem: (id) =>
    set((state) => ({
      parameters: {
        ...state.parameters,
        textItems: state.parameters.textItems.filter((item) => item.id !== id),
      },
    })),

  updateTextItem: (id, updates) =>
    set((state) => ({
      parameters: {
        ...state.parameters,
        textItems: state.parameters.textItems.map((item) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      },
    })),

  // Hole management
  addHole: () =>
    set((state) => ({
      parameters: {
        ...state.parameters,
        holes: [
          ...state.parameters.holes || [],
          {
            id: generateId(),
            x: 0,
            y: 0,
            radius: 5,
          },
        ],
      },
    })),

  removeHole: (id) =>
    set((state) => ({
      parameters: {
        ...state.parameters,
        holes: state.parameters.holes.filter((h) => h.id !== id),
      },
    })),

  updateHole: (id, updates) =>
    set((state) => ({
      parameters: {
        ...state.parameters,
        holes: state.parameters.holes.map((h) =>
          h.id === id ? { ...h, ...updates } : h,
        ),
      },
    })),

  // Transform controls
  transformMode: "translate",
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
  materialPreset: "default",
  setMaterialPreset: (preset) => set({ materialPreset: preset }),
  screenshotTrigger: 0,
  triggerScreenshot: () =>
    set((state) => ({ screenshotTrigger: state.screenshotTrigger + 1 })),
  resetViewTrigger: 0,
  triggerResetView: () =>
    set((state) => ({ resetViewTrigger: state.resetViewTrigger + 1 })),

  // Effects
  bloomEnabled: true,
  setBloomEnabled: (enabled: boolean) => set({ bloomEnabled: enabled }),
  contactShadowsEnabled: true,
  setContactShadowsEnabled: (enabled: boolean) =>
    set({ contactShadowsEnabled: enabled }),

  // Scene settings
  showGrid: true,
  setShowGrid: (enabled: boolean) => set({ showGrid: enabled }),
}));
