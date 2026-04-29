import type { ArrayType, ExportFormat, ModelParams, PlateShape, ShapeType, TextItem, HoleItem } from "@/lib/store"

const SHAPE_TYPES: ShapeType[] = [
  "cube",
  "sphere",
  "cylinder",
  "cone",
  "torus",
  "octahedron",
  "dodecahedron",
  "icosahedron",
  "tetrahedron",
  "torusKnot",
  "capsule",
  "ring",
]

const PLATE_SHAPES: PlateShape[] = [
  "rectangle",
  "circle",
  "diamond",
  "star",
  "wave",
  "heart",
  "hexagon",
  "pentagon",
  "oval",
  "cross",
  "cloud",
  "shield",
  "badge",
  "rounded",
  "nameplate",
  "keychain",
  "tag",
  "coaster",
  "doorSign",
  "petBone",
  "trophy",
  "frame",
  "tray",
  "square",
]

const ARRAY_TYPES: ArrayType[] = ["none", "rectangular", "circular"]
const EXPORT_FORMATS: ExportFormat[] = ["stl", "obj", "gltf", "glb"]

type ImportResult =
  | { ok: true; params: Partial<ModelParams>; warnings: string[] }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function asNumber(value: unknown, min?: number, max?: number): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined
  if (typeof min === "number" && value < min) return min
  if (typeof max === "number" && value > max) return max
  return value
}

function asString<T extends string>(value: unknown, allowed?: readonly T[]): T | undefined {
  if (typeof value !== "string") return undefined
  if (allowed && !allowed.includes(value as T)) return undefined
  return value as T
}

function sanitizeTextItems(value: unknown): TextItem[] | undefined {
  if (!Array.isArray(value)) return undefined

  const items = value
    .map((item, index) => {
      if (!isRecord(item)) return null
      const position = isRecord(item.position) ? item.position : {}
      const content = typeof item.content === "string" ? item.content : ""
      const fontSize = asNumber(item.fontSize, 1, 300)
      const fontUrl = typeof item.fontUrl === "string" ? item.fontUrl : "/fonts/helvetiker_bold.json"
      const rotation = asNumber(item.rotation, -180, 180)
      const reliefHeight = asNumber(item.reliefHeight, 0.1, 100)

      if (fontSize === undefined || rotation === undefined || reliefHeight === undefined) {
        return null
      }

      return {
        id: typeof item.id === "string" ? item.id : `imported-text-${index}`,
        content,
        fontSize,
        fontUrl,
        rotation,
        reliefHeight,
        position: {
          x: asNumber(position.x, -1000, 1000) ?? 0,
          y: asNumber(position.y, -1000, 1000) ?? 0,
          z: asNumber(position.z, -1000, 1000) ?? 0,
        },
      }
    })
    .filter((item): item is TextItem => item !== null)

  return items.length > 0 ? items : undefined
}

function sanitizeHoles(value: unknown): HoleItem[] | undefined {
  if (!Array.isArray(value)) return undefined

  const holes = value
    .map((item, index) => {
      if (!isRecord(item)) return null
      const x = asNumber(item.x, -1000, 1000)
      const y = asNumber(item.y, -1000, 1000)
      const radius = asNumber(item.radius, 0.1, 200)
      if (x === undefined || y === undefined || radius === undefined) return null

      return {
        id: typeof item.id === "string" ? item.id : `imported-hole-${index}`,
        x,
        y,
        radius,
      }
    })
    .filter((item): item is HoleItem => item !== null)

  return holes
}

export function sanitizeImportedParams(input: unknown): ImportResult {
  const source = isRecord(input) && isRecord(input.parameters) ? input.parameters : input
  if (!isRecord(source)) {
    return { ok: false, error: "配置文件不是有效的 JSON 对象" }
  }

  const params: Partial<ModelParams> = {}
  const mutableParams = params as Record<string, unknown>
  const warnings: string[] = []

  const assignString = <T extends string>(key: keyof ModelParams, allowed?: readonly T[]) => {
    const next = asString(source[key], allowed)
    if (next !== undefined) mutableParams[key] = next
    else if (key in source) warnings.push(`已忽略无效字段 ${String(key)}`)
  }

  const assignNumber = (key: keyof ModelParams, min?: number, max?: number) => {
    const next = asNumber(source[key], min, max)
    if (next !== undefined) mutableParams[key] = next
    else if (key in source) warnings.push(`已忽略无效字段 ${String(key)}`)
  }

  const assignBoolean = (key: keyof ModelParams) => {
    if (typeof source[key] === "boolean") mutableParams[key] = source[key]
    else if (key in source) warnings.push(`已忽略无效字段 ${String(key)}`)
  }

  assignString("shapeType", SHAPE_TYPES)
  assignNumber("size", 1, 500)
  assignNumber("height", 1, 500)
  assignNumber("segments", 3, 256)
  assignString("textContent")
  assignNumber("fontSize", 1, 300)
  assignNumber("thickness", 0.1, 100)
  assignString("fontUrl")
  assignNumber("reliefHeight", 0.1, 100)
  assignString("plateShape", PLATE_SHAPES)
  assignNumber("plateWidth", 1, 500)
  assignNumber("plateHeight", 1, 500)
  assignNumber("plateRotation", -180, 180)
  assignNumber("groupRotation", -180, 180)
  assignNumber("plateCornerRadius", 0, 100)
  assignNumber("baseThickness", 0.1, 100)
  assignString("plateColor")
  assignString("textColor")
  assignBoolean("showShadows")
  assignString("qrText")
  assignNumber("qrSize", 1, 500)
  assignNumber("qrDepth", 0.1, 100)
  assignBoolean("qrInvert")
  assignNumber("qrMargin", 0, 100)
  assignBoolean("qrIsThrough")
  assignString("imageUrl")
  assignNumber("imageThreshold", 0, 255)
  assignNumber("imageSize", 1, 500)
  assignNumber("imageThickness", 0.1, 100)
  assignBoolean("imageInvert")
  assignNumber("imageSmoothing", 0, 10)
  assignString("imageStyle", ["voxel", "smooth"])
  assignNumber("imageResolution", 16, 512)
  assignNumber("imageRotation", -180, 180)
  assignNumber("roughness", 0, 1)
  assignNumber("metalness", 0, 1)
  assignBoolean("hasBase")
  assignNumber("trayBorderWidth", 0.1, 100)
  assignNumber("trayBorderHeight", 0.1, 100)
  assignBoolean("edgeBevelEnabled")
  assignString("edgeBevelType", ["round", "chamfer"])
  assignNumber("edgeBevelSize", 0, 50)
  assignNumber("modelResolution", 1, 5)
  assignString("arrayType", ARRAY_TYPES)
  assignNumber("arrayCountX", 1, 50)
  assignNumber("arrayCountY", 1, 50)
  assignNumber("arraySpacingX", 1, 1000)
  assignNumber("arraySpacingY", 1, 1000)
  assignNumber("arrayCircularCount", 1, 100)
  assignNumber("arrayCircularRadius", 1, 1000)
  assignString("exportFormat", EXPORT_FORMATS)
  assignNumber("layerCoordsVersion", 1, 10)

  if (isRecord(source.textPosition)) {
    params.textPosition = {
      x: asNumber(source.textPosition.x, -1000, 1000) ?? 0,
      y: asNumber(source.textPosition.y, -1000, 1000) ?? 0,
    }
  }

  if (isRecord(source.platePosition)) {
    params.platePosition = {
      x: asNumber(source.platePosition.x, -1000, 1000) ?? 0,
      y: asNumber(source.platePosition.y, -1000, 1000) ?? 0,
    }
  }

  const textItems = sanitizeTextItems(source.textItems)
  if (textItems) params.textItems = textItems

  const holes = sanitizeHoles(source.holes)
  if (holes) params.holes = holes

  if (Object.keys(params).length === 0) {
    return { ok: false, error: "未识别到可导入的参数字段" }
  }

  if (!("layerCoordsVersion" in params)) {
    params.layerCoordsVersion = 1
  }

  return { ok: true, params, warnings }
}
