"use client"

import { useModelStore, type ModelParams } from "@/lib/store"

type TemplateMode = "basic" | "relief" | "hollow" | "qr"

type TemplateItem = {
  id: string
  name: string
  icon: string
  description: string
  mode: TemplateMode
  params: Partial<ModelParams>
}

const TEMPLATES: TemplateItem[] = [
  {
    id: "nameplate",
    name: "姓名牌",
    icon: "🏷️",
    description: "个性化姓名标牌",
    mode: "relief",
    params: { plateShape: "rounded", size: 80, baseThickness: 3 },
  },
  {
    id: "keychain",
    name: "钥匙扣",
    icon: "🔑",
    description: "带孔钥匙挂件",
    mode: "hollow",
    params: { plateShape: "circle", size: 40, baseThickness: 4 },
  },
  {
    id: "logo",
    name: "LOGO 板",
    icon: "✨",
    description: "品牌标识展示",
    mode: "relief",
    params: { plateShape: "rectangle", plateWidth: 100, plateHeight: 100, baseThickness: 5 },
  },
  {
    id: "qr-badge",
    name: "二维码徽章",
    icon: "📱",
    description: "扫码名片/链接",
    mode: "qr",
    params: { qrSize: 60, baseThickness: 3, plateCornerRadius: 5 },
  },
  {
    id: "gift-tag",
    name: "礼品吊牌",
    icon: "🎁",
    description: "节日礼品标签",
    mode: "relief",
    params: { plateShape: "heart", size: 50, baseThickness: 2 },
  },
  {
    id: "pet-tag",
    name: "宠物牌",
    icon: "🐾",
    description: "宠物身份标识",
    mode: "hollow",
    params: { plateShape: "hexagon", size: 35, baseThickness: 3 },
  },
  {
    id: "door-sign",
    name: "门牌号",
    icon: "🚪",
    description: "门牌/房间号",
    mode: "relief",
    params: { plateShape: "rectangle", plateWidth: 120, plateHeight: 60, baseThickness: 4 },
  },
  {
    id: "coaster",
    name: "杯垫",
    icon: "☕",
    description: "个性化杯垫",
    mode: "relief",
    params: { plateShape: "circle", size: 90, baseThickness: 4 },
  },
  {
    id: "phone-stand",
    name: "手机支架",
    icon: "📲",
    description: "桌面手机支架",
    mode: "basic",
    params: { shapeType: "cube", size: 60, height: 80 },
  },
  {
    id: "trophy",
    name: "迷你奖杯",
    icon: "🏆",
    description: "桌面装饰奖杯",
    mode: "basic",
    params: { shapeType: "torusKnot", size: 50 },
  },
  {
    id: "geometric",
    name: "几何艺术",
    icon: "💎",
    description: "装饰几何体",
    mode: "basic",
    params: { shapeType: "icosahedron", size: 60 },
  },
  {
    id: "card-holder",
    name: "名片座",
    icon: "💼",
    description: "桌面名片架",
    mode: "relief",
    params: { plateShape: "wave", size: 100, baseThickness: 8 },
  },
]

export function TemplatePanel({
  updateParam,
}: {
  updateParam: (key: keyof ModelParams, value: unknown) => void
}) {
  const setMode = useModelStore((state) => state.setMode)

  const handleApplyTemplate = (template: TemplateItem) => {
    setMode(template.mode)
    Object.entries(template.params).forEach(([key, value]) => {
      updateParam(key as keyof ModelParams, value)
    })
  }

  return (
    <div className="p-5 space-y-5">
      <div className="pb-3 border-b border-border/50">
        <h2 className="text-base font-semibold bg-linear-to-r from-foreground to-secondary/70 bg-clip-text text-transparent">
          模板库
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">选择预设模板快速开始</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => handleApplyTemplate(template)}
            className="group flex flex-col items-center p-4 rounded-xl border border-border/50 bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{template.icon}</span>
            <span className="text-sm font-medium text-foreground">{template.name}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{template.description}</span>
          </button>
        ))}
      </div>

      <div className="pt-3 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground text-center">点击模板后可继续调整参数</p>
      </div>
    </div>
  )
}

