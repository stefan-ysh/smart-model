"use client"

import type * as React from "react"
import { AlertTriangle } from "lucide-react"

import { useModelStore, ShapeType } from "@/lib/store"
import { cn } from "@/lib/utils"
import { FontSelect } from "./FontSelect"
import { SliderWithInput } from "./SliderWithInput"
import { HolesControl } from "./HolesControl"
import { FileUpload } from "@/components/ui/file-upload"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Helper wrapper for Label with hint
const LabelWithHint = ({ children, hint }: { children: React.ReactNode, hint?: string }) => (
  <div className="mb-2">
    <Label className="text-sm font-medium text-foreground">{children}</Label>
    {hint && <span className="text-xs text-muted-foreground ml-2">{hint}</span>}
  </div>
)

// Slider wrapper using our SliderWithInput
const Slider = ({ 
  value, min, max, step, onChange, unit = '', showInput = false, compact = false 
}: { 
  value: number, min: number, max: number, step: number, 
  onChange: (val: number) => void, unit?: string, showInput?: boolean, compact?: boolean
}) => (
  <SliderWithInput 
    value={value} 
    min={min} 
    max={max} 
    step={step} 
    onChange={onChange} 
    unit={unit} 
    showInput={showInput} 
    compact={compact}
  />
)


// Simple Select wrapper for compatibility
const SimpleSelect = ({ value, options, onChange }: { 
  value: string, 
  options: { value: string, label: string }[], 
  onChange: (val: string) => void 
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-full">
      <SelectValue>{options.find(o => o.value === value)?.label}</SelectValue>
    </SelectTrigger>
    <SelectContent>
      {options.map(opt => (
        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
)

// Plate shape icons with premium styling
const PlateShapeButton = ({ 
  shape, selected, onClick, label 
}: { 
  shape: string, selected: boolean, onClick: () => void, label: string 
}) => {
  const icons: Record<string, string> = {
    square: '▢', rectangle: '▭', circle: '○', 
    diamond: '◇', star: '☆', wave: '〰', heart: '♡',
    hexagon: '⬡', pentagon: '⬠', oval: '⬭', cross: '✚',
    cloud: '☁', shield: '🛡', badge: '⬢', rounded: '▢',
    nameplate: '🏷️', keychain: '🔑', tag: '🎁', coaster: '☕',
    doorSign: '🚪', petBone: '🐾', trophy: '🏆', frame: '🖼️',
    tray: '⬚'
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-300 min-w-[64px] min-h-[64px]",
        selected 
          ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
          : "border-white/5 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-200"
      )}
    >
      {selected && (
        <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
      )}
      <span className={cn(
        "text-2xl transition-transform duration-300",
        selected ? "scale-110" : "group-hover:scale-110"
      )}>
        {icons[shape] || '□'}
      </span>
      <span className="text-[9px] font-bold mt-2 uppercase tracking-tighter opacity-70">{label}</span>
    </button>
  )
}

// Color picker component with modern styling
const ColorInput = ({ value, onChange }: { value: string, onChange: (val: string) => void, label?: string }) => (
  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5 transition-all hover:border-white/10 group">
    <div className="relative h-10 w-10 shrink-0">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
      />
      <div 
        className="h-full w-full rounded-lg border border-white/10 shadow-inner" 
        style={{ backgroundColor: value }}
      />
    </div>
    <div className="flex flex-col flex-1">
      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">HEX Code</span>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 border-0 bg-transparent p-0 font-mono text-sm focus-visible:ring-0 focus-visible:border-0 shadow-none text-zinc-300 placeholder:text-zinc-700"
        placeholder="#000000"
      />
    </div>
  </div>
)

// Section component with modern styling
const Section = ({ title, children }: { title: string, children: React.ReactNode, collapsible?: boolean }) => (
  <div className="space-y-3 border-b border-white/5 pb-4 last:border-0">
    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
      <span className="h-px flex-1 bg-linear-to-r from-primary/50 to-transparent" />
      {title}
      <span className="h-px flex-1 bg-linear-to-l from-primary/50 to-transparent" />
    </h3>
    {children}
  </div>
)

// Layout options for array patterns
function LayoutSection() {
  const { currentMode, parameters, updateParam } = useModelStore()
  
  const isExpensiveMode = currentMode === 'hollow' || currentMode === 'relief'
  const isLargeArray = parameters.arrayType !== 'none' && (
    (parameters.arrayType === 'rectangular' && parameters.arrayCountX * parameters.arrayCountY > 9) ||
    (parameters.arrayType === 'circular' && parameters.arrayCircularCount > 8)
  )
  
  return (
    <Section title="排列布局">
      <div className="space-y-4">
        <div>
          <Label className="text-[10px] text-zinc-400 mb-2 block">排列类型</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'none', label: '单个' },
              { value: 'rectangular', label: '矩形阵列' },
              { value: 'circular', label: '环形阵列' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam('arrayType', opt.value)}
                className={cn(
                  "px-2 py-1.5 text-[10px] rounded-lg border transition-all",
                  parameters.arrayType === opt.value
                    ? "bg-primary/20 border-primary text-primary"
                    : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {parameters.arrayType === 'rectangular' && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-400">X轴数量</Label>
              <Slider 
                value={parameters.arrayCountX} 
                min={1} max={10} step={1}
                onChange={(val) => updateParam('arrayCountX', val)} 
                compact
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-400">Y轴数量</Label>
              <Slider 
                value={parameters.arrayCountY} 
                min={1} max={10} step={1}
                onChange={(val) => updateParam('arrayCountY', val)} 
                compact
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-400">X轴间距</Label>
              <Slider 
                value={parameters.arraySpacingX} 
                min={10} max={200} step={1}
                onChange={(val) => updateParam('arraySpacingX', val)} 
                compact
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-400">Y轴间距</Label>
              <Slider 
                value={parameters.arraySpacingY} 
                min={10} max={200} step={1}
                onChange={(val) => updateParam('arraySpacingY', val)} 
                compact
              />
            </div>
          </div>
        )}

        {parameters.arrayType === 'circular' && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-400">环形数量</Label>
              <Slider 
                value={parameters.arrayCircularCount} 
                min={2} max={20} step={1}
                onChange={(val) => updateParam('arrayCircularCount', val)} 
                compact
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-400">阵列半径</Label>
              <Slider 
                value={parameters.arrayCircularRadius} 
                min={10} max={200} step={1}
                onChange={(val) => updateParam('arrayCircularRadius', val)} 
                compact
              />
            </div>
          </div>
        )}

        {isExpensiveMode && parameters.arrayType !== 'none' && (
          <div className={cn(
            "p-2 rounded-lg border flex items-start gap-2 text-[10px] leading-tight transition-all",
            isLargeArray 
              ? "bg-amber-500/10 border-amber-500/20 text-amber-200/80"
              : "bg-blue-500/10 border-blue-500/20 text-blue-200/80"
          )}>
            <AlertTriangle className={cn("h-3 w-3 mt-0.5 shrink-0", isLargeArray ? "text-amber-400" : "text-blue-400")} />
            <p>
              {isLargeArray 
                ? "由于镂空/浮雕计算量大，当前阵列规模较大，调整参数可能会有明显延迟。已开启几何缓存加速。"
                : "已针对镂空/浮雕模式开启阵列性能优化（几何缓存）。"}
            </p>
          </div>
        )}
      </div>
    </Section>
  )
}

function PanelContent() {
  const { 
    currentMode, parameters, updateParam,
    addHole, removeHole, updateHole,
    addTextItem, removeTextItem, updateTextItem
  } = useModelStore()

  if (currentMode === 'basic') {
    return (
      <div className="p-5 space-y-5">
        <div className="pb-3 border-b border-white/5">
          <h2 className="text-base font-semibold bg-linear-to-r from-white to-purple-200 bg-clip-text text-transparent">基础模型参数</h2>
          <p className="text-xs text-muted-foreground mt-0.5">调整几何体的大小和形状</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[10px] text-zinc-400">形状类型</Label>
            <SimpleSelect
              value={parameters.shapeType}
              options={[
                { value: 'cube', label: '立方体' },
                { value: 'sphere', label: '球体' },
                { value: 'cylinder', label: '圆柱体' },
                { value: 'cone', label: '圆锥体' },
                { value: 'torus', label: '圆环体' },
                { value: 'torusKnot', label: '扭结环' },
                { value: 'capsule', label: '胶囊体' },
                { value: 'ring', label: '圆环' },
                { value: 'octahedron', label: '八面体' },
                { value: 'dodecahedron', label: '十二面体' },
                { value: 'icosahedron', label: '二十面体' },
                { value: 'tetrahedron', label: '四面体' },
              ]}
              onChange={(val) => updateParam('shapeType', val as ShapeType)}
            />
          </div>

          <div className={cn(
            "space-y-1.5",
            // Full width for shapes that only show Size (Cube, Polyhedrons), or odd ones
            (parameters.shapeType === 'cube' || 
             parameters.shapeType === 'capsule' || 
             parameters.shapeType === 'ring' || 
             parameters.shapeType === 'octahedron' || 
             parameters.shapeType === 'dodecahedron' || 
             parameters.shapeType === 'icosahedron' || 
             parameters.shapeType === 'tetrahedron' ||
             parameters.shapeType === 'torusKnot') && "col-span-2"
          )}>
            <Label className="text-[10px] text-zinc-400">尺寸</Label>
            <Slider
              value={parameters.size}
              min={10}
              max={300}
              step={1}
              onChange={(val) => updateParam('size', val)}
              compact
            />
          </div>

          {(parameters.shapeType === 'cylinder' || parameters.shapeType === 'cone') && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-400">高度</Label>
              <Slider
                value={parameters.height}
                min={10}
                max={300}
                step={1}
                onChange={(val) => updateParam('height', val)}
                compact
              />
            </div>
          )}

          {(parameters.shapeType === 'sphere' || parameters.shapeType === 'cylinder' || parameters.shapeType === 'cone' || parameters.shapeType === 'torus') && (
            <div className={cn(
               "space-y-1.5",
               // Full width for Segments if it's the last odd item (Cylinder, Cone have 3 items: Size, Height, Segments)
               (parameters.shapeType === 'cylinder' || parameters.shapeType === 'cone') && "col-span-2"
            )}>
              <Label className="text-[10px] text-zinc-400">分段数</Label>
              <Slider
                value={parameters.segments}
                min={3}
                max={128}
                step={1}
                onChange={(val) => updateParam('segments', val)}
                compact
              />
            </div>
          )}
        </div>

        <LayoutSection />
      </div>
    )
  }

  if (currentMode === 'text') {
    return (
      <div className="p-5 space-y-5">
        <div className="pb-3 border-b border-white/5">
           <h2 className="text-base font-semibold bg-linear-to-r from-white to-purple-200 bg-clip-text text-transparent">文字3D参数</h2>
           <p className="text-xs text-muted-foreground mt-0.5">输入文字并调整大小与厚度</p>
        </div>
        
        <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
           <div className="col-span-2 space-y-1.5">
              <Label className="text-[10px] text-zinc-400">字体</Label>
              <FontSelect
                value={parameters.fontUrl}
                onChange={(val) => updateParam('fontUrl', val)}
              />
           </div>
           
           <div className="col-span-2 space-y-1.5">
              <Label className="text-[10px] text-zinc-400">文字内容</Label>
              <Input 
                type="text" 
                value={parameters.textContent}
                onChange={(e) => updateParam('textContent', e.target.value)}
              />
           </div>
           
           <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-400">文字大小</Label>
              <Slider
                value={parameters.fontSize}
                min={10}
                max={100}
                step={1}
                onChange={(val) => updateParam('fontSize', val)}
                compact
              />
           </div>
           
           <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-400">厚度</Label>
              <Slider
                value={parameters.thickness}
                min={1}
                max={50}
                step={0.5}
                onChange={(val) => updateParam('thickness', val)}
                compact
              />
           </div>
        </div>
        </div>

        <LayoutSection />
      </div>
    )
  }
  
  if (currentMode === 'relief') {
    
    return (
      <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-100px)]">
        <div className="pb-3 border-b border-white/5">
           <h2 className="text-base font-semibold bg-linear-to-r from-white to-cyan-200 bg-clip-text text-transparent">浮雕板</h2>
           <p className="text-xs text-muted-foreground mt-0.5">选择板形并添加多个凸起文字</p>
        </div>
        
        {/* Plate Shape Section */}
        <div className="space-y-4 border-b border-white/5 pb-4">
           <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">底板形状</h3>
           
           <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'rectangle', label: '矩形' },
                { value: 'rounded', label: '圆角' },
                { value: 'circle', label: '圆形' },
                { value: 'oval', label: '椭圆' },
                { value: 'diamond', label: '菱形' },
                { value: 'hexagon', label: '六边' },
                { value: 'pentagon', label: '五边' },
                { value: 'star', label: '五星' },
                { value: 'heart', label: '爱心' },
                { value: 'shield', label: '盾牌' },
                { value: 'badge', label: '徽章' },
                { value: 'cloud', label: '云朵' },
                { value: 'cross', label: '十字' },
                { value: 'wave', label: '波浪' },
                { value: 'nameplate', label: '姓名牌' },
                { value: 'keychain', label: '钥匙扣' },
                { value: 'tag', label: '吐牌' },
                { value: 'coaster', label: '杯垫' },
                { value: 'doorSign', label: '门牌' },
                { value: 'petBone', label: '宠物牌' },
                { value: 'trophy', label: '奖杯' },
                { value: 'frame', label: '相框' },
                { value: 'tray', label: '托盘' },
              ].map(shape => (

                <PlateShapeButton
                  key={shape.value}
                  shape={shape.value}
                  label={shape.label}
                  selected={parameters.plateShape === shape.value}
                  onClick={() => updateParam('plateShape', shape.value)}
                />
              ))}
           </div>

           {parameters.plateShape === 'rectangle' ? (
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">宽度</Label>
                  <Slider value={parameters.plateWidth} min={20} max={300} step={1}
                    onChange={(val) => updateParam('plateWidth', val)} compact />
               </div>
               <div className="space-y-1.5">
                      <Label className="text-[10px] text-zinc-400">高度</Label>
                  <Slider value={parameters.plateHeight} min={20} max={300} step={1}
                    onChange={(val) => updateParam('plateHeight', val)} compact />
               </div>
               <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">圆角半径</Label>
                  <Slider value={parameters.plateCornerRadius} min={0} max={30} step={1}
                    onChange={(val) => updateParam('plateCornerRadius', val)} compact />
               </div>
             </div>
           ) : ['rounded', 'tray'].includes(parameters.plateShape) ? (
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">宽度</Label>
                  <Slider value={parameters.plateWidth} min={20} max={300} step={1}
                    onChange={(val) => updateParam('plateWidth', val)} compact />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">长度</Label>
                  <Slider value={parameters.plateHeight} min={20} max={300} step={1}
                    onChange={(val) => updateParam('plateHeight', val)} compact />
               </div>
             </div>
           ) : (
             <div className="space-y-1.5">
                <Label className="text-[10px] text-zinc-400">尺寸</Label>
                <Slider value={parameters.size} min={20} max={300} step={1}
                  onChange={(val) => updateParam('size', val)} compact />
             </div>
           )}

           {/* Corner radius for all non-circle shapes */}
           {parameters.plateShape !== 'rectangle' && parameters.plateShape !== 'circle' && parameters.plateShape !== 'tray' && (
             <div className="space-y-1.5">
                <Label className="text-[10px] text-zinc-400">圆角半径</Label>
                <Slider value={parameters.plateCornerRadius} min={0} max={30} step={1}
                  onChange={(val) => updateParam('plateCornerRadius', val)} compact />
             </div>
           )}

           {/* Tray-specific controls */}
           {parameters.plateShape === 'tray' && (
             <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 mt-2">
                <div className="space-y-1.5">
                   <Label className="text-[10px] text-zinc-400">边框宽度</Label>
                   <Slider value={parameters.trayBorderWidth} min={2} max={30} step={1}
                     onChange={(val) => updateParam('trayBorderWidth', val)} compact />
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[10px] text-zinc-400">边框高度</Label>
                   <Slider value={parameters.trayBorderHeight} min={1} max={30} step={0.5}
                     onChange={(val) => updateParam('trayBorderHeight', val)} compact />
                </div>
             </div>
           )}

           {/* Edge bevel controls - for rectangle, rounded, tray */}
           {['rectangle', 'rounded', 'tray'].includes(parameters.plateShape) && (
             <div className="space-y-2 pt-2 border-t border-white/5 mt-2">
                <div className="flex items-center justify-between">
                   <Label className="text-[10px] text-zinc-400">底板边缘倒角</Label>
                   <input
                     type="checkbox"
                     checked={parameters.edgeBevelEnabled}
                     onChange={(e) => updateParam('edgeBevelEnabled', e.target.checked)}
                     className="w-4 h-4 rounded border-zinc-600 bg-zinc-800"
                   />
                </div>
                {parameters.edgeBevelEnabled && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                       <button
                         className={`px-2 py-1 text-[10px] rounded ${parameters.edgeBevelType === 'round' ? 'bg-sky-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
                         onClick={() => updateParam('edgeBevelType', 'round')}
                       >圆角</button>
                       <button
                         className={`px-2 py-1 text-[10px] rounded ${parameters.edgeBevelType === 'chamfer' ? 'bg-sky-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
                         onClick={() => updateParam('edgeBevelType', 'chamfer')}
                       >斜角</button>
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] text-zinc-400">倒角大小</Label>
                       <Slider value={parameters.edgeBevelSize} min={0.5} max={10} step={0.5}
                         onChange={(val) => updateParam('edgeBevelSize', val)} compact />
                    </div>
                  </>
                )}
             </div>
           )}

           <div className="grid grid-cols-2 gap-3 mt-3">
             <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] text-zinc-400">底板厚度</Label>
                <Slider value={parameters.baseThickness} min={1} max={10} step={0.5}
                  onChange={(val) => updateParam('baseThickness', val)} compact />
             </div>
             
             <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] text-zinc-400">底板角度 (°)</Label>
                <Slider value={parameters.plateRotation} min={-180} max={180} step={1}
                  onChange={(val) => updateParam('plateRotation', val)} compact />
             </div>

             <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] text-zinc-400">整体旋转 (°)</Label>
                <Slider value={parameters.groupRotation} min={-180} max={180} step={1}
                  onChange={(val) => updateParam('groupRotation', val)} compact />
             </div>

             <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] text-zinc-400">底板位置</Label>
                <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                         <Label className="text-[10px] text-zinc-400">横向 (X)</Label>
                         <Slider value={parameters.platePosition.x} min={-300} max={300} step={1}
                           onChange={(val) => updateParam('platePosition', { ...parameters.platePosition, x: val })} compact />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] text-zinc-400">纵向 (Y)</Label>
                         <Slider value={parameters.platePosition.y} min={-300} max={300} step={1}
                           onChange={(val) => updateParam('platePosition', { ...parameters.platePosition, y: val })} compact />
                      </div>
                </div>
             </div>

             <div className="col-span-2 space-y-1.5 pt-2 border-t border-white/5">
                <Label className="text-[10px] text-zinc-400 flex justify-between">
                  <span>模型精度 (影响平滑度)</span>
                  <span className="text-zinc-500">{parameters.modelResolution || 3}级</span>
                </Label>
                <Slider value={parameters.modelResolution || 3} min={1} max={5} step={1}
                  onChange={(val) => updateParam('modelResolution', val)} compact />
             </div>
             <div className="col-span-2">
               <HolesControl 
                 holes={parameters.holes}
                 addHole={addHole}
                 removeHole={removeHole}
                 updateHole={updateHole}
               />
             </div>
           </div>
        </div>

        {/* Text Items Section */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">文字列表</h3>
              <button
                onClick={() => addTextItem()}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                + 添加文字
              </button>
           </div>
           
           {parameters.textItems.map((item, index) => (
             <div key={item.id} className="p-3 bg-secondary/50 rounded-md space-y-3">
                <div className="flex items-center justify-between">
                   <span className="text-xs font-medium">文字 #{index + 1}</span>
                   {parameters.textItems.length > 1 && (
                     <button
                       onClick={() => removeTextItem(item.id)}
                       className="text-xs text-destructive hover:underline"
                     >
                       删除
                     </button>
                   )}
                </div>
                
                <Input 
                  type="text" 
                  value={item.content}
                  onChange={(e) => updateTextItem(item.id, { content: e.target.value })}
                  placeholder="输入文字..."
                />
                
                <div className="grid grid-cols-2 gap-3">
                   <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-zinc-400">字体</Label>
                      <FontSelect
                        value={item.fontUrl}
                        onChange={(val) => updateTextItem(item.id, { fontUrl: val })}
                      />
                   </div>
                   
                   <div className="space-y-1.5">
                      <Label className="text-[10px] text-zinc-400">字号</Label>
                      <Slider value={item.fontSize} min={5} max={100} step={1}
                        onChange={(val) => updateTextItem(item.id, { fontSize: val })} compact />
                   </div>
                   
                   <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">长度</Label>
                      <Slider value={item.reliefHeight} min={1} max={20} step={0.5}
                        onChange={(val) => updateTextItem(item.id, { reliefHeight: val })} compact />
                   </div>
                   
                   <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-zinc-400">角度 (°)</Label>
                      <Slider value={item.rotation} min={-180} max={180} step={1}
                        onChange={(val) => updateTextItem(item.id, { rotation: val })} compact />
                   </div>
                   
                   <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-zinc-400">位置</Label>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                            <Label className="text-[10px] text-zinc-400">横向 (X)</Label>
                            <Slider value={item.position.x} min={-300} max={300} step={1}
                              onChange={(val) => updateTextItem(item.id, { position: { ...item.position, x: val } })} compact />
                         </div>
                         <div className="space-y-1.5">
                            <Label className="text-[10px] text-zinc-400">纵向 (Y)</Label>
                            <Slider value={item.position.y} min={-300} max={300} step={1}
                              onChange={(val) => updateTextItem(item.id, { position: { ...item.position, y: val } })} compact />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
        
        {/* Material Section */}
        <div className="space-y-4 border-t border-border pt-4">
           <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">材质设置</h3>
           
           <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                 <Label className="text-[10px] text-zinc-400">底板颜色</Label>
                 <ColorInput value={parameters.plateColor} onChange={(val) => updateParam('plateColor', val)} />
              </div>
              
              <div className="space-y-1.5">
                 <Label className="text-[10px] text-zinc-400">文字颜色</Label>
                 <ColorInput value={parameters.textColor} onChange={(val) => updateParam('textColor', val)} />
              </div>
              
              <div className="space-y-1.5">
                 <Label className="text-[10px] text-zinc-400">粗糙度</Label>
                 <Slider value={parameters.roughness} min={0} max={1} step={0.05}
                   onChange={(val) => updateParam('roughness', val)} compact />
              </div>
              
              <div className="space-y-1.5">
                 <Label className="text-[10px] text-zinc-400">金属度</Label>
                 <Slider value={parameters.metalness} min={0} max={1} step={0.05}
                   onChange={(val) => updateParam('metalness', val)} compact />
              </div>
           </div>
        </div>
        <LayoutSection />
      </div>
    )
  }

  if (currentMode === 'image') {
    return (
      <div className="p-5 space-y-5">
        <div className="space-y-4">
          <div>
            <div className="mt-2 w-full">
              <FileUpload
                onChange={(files) => {
                  const file = files[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      if (typeof event.target?.result === 'string') {
                         // Resize to avoid "Max payload size" error
                         const img = new Image()
                         img.onload = () => {
                            const MAX_SIZE = 512
                            let w = img.width
                            let h = img.height
                            
                            if (w > MAX_SIZE || h > MAX_SIZE) {
                               const ratio = Math.min(MAX_SIZE/w, MAX_SIZE/h)
                               w = Math.floor(w * ratio)
                               h = Math.floor(h * ratio)
                            }
                            
                            const canvas = document.createElement('canvas')
                            canvas.width = w
                            canvas.height = h
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                               ctx.drawImage(img, 0, 0, w, h)
                               // Store resized image
                               updateParam('imageUrl', canvas.toDataURL('image/png'))
                            }
                         }
                         img.src = event.target.result
                      }
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
              <p className="text-[10px] text-muted-foreground mt-2 opacity-70">支持 PNG, JPG 等格式。建议使用高对比度图片。</p>
            </div>
          </div>

          
          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
               <Label className="text-xs text-muted-foreground/50 uppercase tracking-wider font-bold mb-2 block">提取设置</Label>
            </div>
            
            <div className="space-y-1.5">
               <Label className="text-[10px] text-zinc-400">阈值</Label>
               <SliderWithInput
                 value={parameters.imageThreshold}
                 min={1}
                 max={254}
                 step={1}
                 onChange={(val) => updateParam('imageThreshold', val)}
                 compact
               />
            </div>

            <div className="space-y-1.5">
               <Label className="text-[10px] text-zinc-400">平滑度</Label>
               <SliderWithInput
                 value={parameters.imageSmoothing}
                 min={0}
                 max={5}
                 step={1}
                 onChange={(val) => updateParam('imageSmoothing', val)}
                 compact
               />
            </div>

            <div className="col-span-2 pt-2">
               <Label className="text-xs text-muted-foreground/50 uppercase tracking-wider font-bold mb-2 block">几何设置</Label>
            </div>

            <div className="space-y-1.5">
               <Label className="text-[10px] text-zinc-400">尺寸 (Size)</Label>
               <SliderWithInput
                 value={parameters.imageSize}
                 min={10}
                 max={300}
                 step={1}
                 onChange={(val) => updateParam('imageSize', val)}
                 compact
               />
            </div>

            <div className="space-y-1.5">
               <Label className="text-[10px] text-zinc-400">厚度</Label>
               <SliderWithInput
                 value={parameters.imageThickness}
                 min={1}
                 max={50}
                 step={0.5}
                 onChange={(val) => updateParam('imageThickness', val)}
                 compact
               />
            </div>
            
            <div className="space-y-1.5">
               <Label className="text-[10px] text-zinc-400">风格</Label>
               <SimpleSelect
                 value={parameters.imageStyle}
                 options={[
                   { value: 'voxel', label: '体素' },
                   { value: 'smooth', label: '平滑' },
                 ]}
                 onChange={(val) => updateParam('imageStyle', val)}
               />
            </div>

            <div className="space-y-1.5">
               <Label className="text-[10px] text-zinc-400">精度 (Resolution)</Label>
               <SliderWithInput
                 value={parameters.imageResolution}
                 min={32}
                 max={300}
                 step={16}
                 onChange={(val) => updateParam('imageResolution', val)}
                 compact
               />
            </div>
          </div>
         
         <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 mt-2">
            <div className="col-span-2 space-y-1.5">
               <Label className="text-[10px] text-zinc-400">图案角度 (Image Rotation)</Label>
               <SliderWithInput
                 value={parameters.imageRotation}
                 min={-180}
                 max={180}
                 step={1}
                 onChange={(val) => updateParam('imageRotation', val)}
                 compact
               />
            </div>
            
            <div className="space-y-1.5">
               <Label className="text-[10px] text-zinc-400">图案位置 X</Label>
               <SliderWithInput
                 value={parameters.textPosition.x}
                 min={-300}
                 max={300}
                 step={1}
                 onChange={(val) => updateParam('textPosition', { ...parameters.textPosition, x: val })}
                 compact
               />
            </div>
            
            <div className="space-y-1.5">
               <Label className="text-[10px] text-zinc-400">图案位置 Y</Label>
               <SliderWithInput
                 value={parameters.textPosition.y}
                 min={-300}
                 max={300}
                 step={1}
                 onChange={(val) => updateParam('textPosition', { ...parameters.textPosition, y: val })}
                 compact
               />
            </div>
         </div>

          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
             <Switch
               id="invert-mode"
               checked={parameters.imageInvert}
               onCheckedChange={(val) => updateParam('imageInvert', val)}
             />
             <Label htmlFor="invert-mode" className="mb-0 text-xs font-medium cursor-pointer">反转颜色 (Invert)</Label>
          </div>
        </div>

        {/* Plate Controls Reuse */}
        <Section title="底板设置">
          <div className="space-y-4">

             <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 mb-2">
                <Switch
                  id="has-base-mode"
                  checked={parameters.hasBase}
                  onCheckedChange={(val) => updateParam('hasBase', val)}
                />
                <Label htmlFor="has-base-mode" className="mb-0 text-xs font-medium cursor-pointer">显示底板</Label>
             </div>
             
             {parameters.hasBase && (
             <>
             <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'rectangle', label: '矩形' },
                  { value: 'circle', label: '圆形' },
                  { value: 'rounded', label: '圆角' },
                  { value: 'tray', label: '托盘' },
                ].map(shape => (

                 <PlateShapeButton
                    key={shape.value}
                    shape={shape.value}
                    label={shape.label}
                    selected={parameters.plateShape === shape.value}
                    onClick={() => updateParam('plateShape', shape.value)}
                 />
                ))}
             </div>
             
             {parameters.plateShape === 'tray' && (
               <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-zinc-400">边框宽度</Label>
                    <Slider value={parameters.trayBorderWidth} min={2} max={30} step={1}
                      onChange={(val) => updateParam('trayBorderWidth', val)} compact />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-zinc-400">边框高度</Label>
                    <Slider value={parameters.trayBorderHeight} min={1} max={30} step={0.5}
                      onChange={(val) => updateParam('trayBorderHeight', val)} compact />
                  </div>
               </div>
             )}

             {/* Edge bevel controls - for rectangle, rounded, tray */}
             {['rectangle', 'rounded', 'tray'].includes(parameters.plateShape) && (
               <div className="space-y-2 pt-2 border-t border-white/5 mt-2">
                  <div className="flex items-center justify-between">
                     <Label className="text-[10px] text-zinc-400">底板边缘倒角</Label>
                     <input
                       type="checkbox"
                       checked={parameters.edgeBevelEnabled}
                       onChange={(e) => updateParam('edgeBevelEnabled', e.target.checked)}
                       className="w-4 h-4 rounded border-zinc-600 bg-zinc-800"
                     />
                  </div>
                  {parameters.edgeBevelEnabled && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                         <button
                           className={`px-2 py-1 text-[10px] rounded ${parameters.edgeBevelType === 'round' ? 'bg-sky-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
                           onClick={() => updateParam('edgeBevelType', 'round')}
                         >圆角</button>
                         <button
                           className={`px-2 py-1 text-[10px] rounded ${parameters.edgeBevelType === 'chamfer' ? 'bg-sky-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
                           onClick={() => updateParam('edgeBevelType', 'chamfer')}
                         >斜角</button>
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] text-zinc-400">倒角大小</Label>
                         <Slider value={parameters.edgeBevelSize} min={0.5} max={10} step={0.5}
                           onChange={(val) => updateParam('edgeBevelSize', val)} compact />
                      </div>
                    </>
                  )}
               </div>
             )}
             
             {parameters.plateShape === 'rectangle' ? (
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5">
                    <Label className="text-[10px] text-zinc-400">宽度</Label>
                    <Slider value={parameters.plateWidth} min={20} max={300} step={1}
                      onChange={(val) => updateParam('plateWidth', val)} compact />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] text-zinc-400">高度</Label>
                    <Slider value={parameters.plateHeight} min={20} max={300} step={1}
                      onChange={(val) => updateParam('plateHeight', val)} compact />
                 </div>
               </div>
             ) : ['rounded', 'tray'].includes(parameters.plateShape) ? (
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5">
                    <Label className="text-[10px] text-zinc-400">宽度</Label>
                    <Slider value={parameters.plateWidth} min={20} max={300} step={1}
                      onChange={(val) => updateParam('plateWidth', val)} compact />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] text-zinc-400">高度</Label>
                    <Slider value={parameters.plateHeight} min={20} max={300} step={1}
                      onChange={(val) => updateParam('plateHeight', val)} compact />
                 </div>
               </div>
             ) : (
                <div className="space-y-1.5">
                   <Label className="text-[10px] text-zinc-400">底板尺寸 (Plate Size)</Label>
                   <Slider value={parameters.size} min={20} max={300} step={1}
                     onChange={(val) => updateParam('size', val)} compact />
                </div>
             )}

             <div className="grid grid-cols-2 gap-3 pb-2 mb-2 border-b border-white/5">
                <div className="space-y-1.5">
                   <Label className="text-[10px] text-zinc-400">底板厚度</Label>
                   <Slider value={parameters.baseThickness} min={1} max={20} step={0.5}
                     onChange={(val) => updateParam('baseThickness', val)} compact />
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[10px] text-zinc-400">底板颜色</Label>
                   <ColorInput value={parameters.plateColor} onChange={(val) => updateParam('plateColor', val)} />
                </div>
             </div>
             <div className="space-y-1.5">
                <Label className="text-[10px] text-zinc-400">文字/图案颜色</Label>
                <ColorInput value={parameters.textColor} onChange={(val) => updateParam('textColor', val)} />
             </div>

             <div className="space-y-1.5 pt-2 border-t border-white/5">
                <Label className="text-[10px] text-zinc-400 flex justify-between">
                  <span>模型精度 (影响平滑度)</span>
                  <span className="text-zinc-500">{parameters.modelResolution || 3}级</span>
                </Label>
                <Slider value={parameters.modelResolution || 3} min={1} max={5} step={1}
                  onChange={(val) => updateParam('modelResolution', val)} compact />
             </div>
             <div className="col-span-2">
               <HolesControl 
                 holes={parameters.holes}
                 addHole={addHole}
                 removeHole={removeHole}
                 updateHole={updateHole}
               />
             </div>

             </>
             )}
          </div>
        </Section>

        <LayoutSection />
      </div>
    )
  }

  if (currentMode === 'hollow') {
    
    return (
      <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-100px)]">
        <div className="pb-3 border-b border-white/5">
           <h2 className="text-base font-semibold bg-linear-to-r from-white to-emerald-200 bg-clip-text text-transparent">镂空板</h2>
           <p className="text-xs text-muted-foreground mt-0.5">选择板形并添加多个文字</p>
        </div>
        
        {/* Plate Shape Section */}
        <div className="space-y-4 border-b border-white/5 pb-4">
           <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">底板形状</h3>
           
           <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'rectangle', label: '矩形' },
                { value: 'rounded', label: '圆角' },
                { value: 'circle', label: '圆形' },
                { value: 'oval', label: '椭圆' },
                { value: 'diamond', label: '菱形' },
                { value: 'hexagon', label: '六边' },
                { value: 'pentagon', label: '五边' },
                { value: 'star', label: '五星' },
                { value: 'heart', label: '爱心' },
                { value: 'shield', label: '盾牌' },
                { value: 'badge', label: '徽章' },
                { value: 'cloud', label: '云朵' },
                { value: 'cross', label: '十字' },
                { value: 'wave', label: '波浪' },
                { value: 'nameplate', label: '姓名牌' },
                { value: 'keychain', label: '钥匙扣' },
                { value: 'tag', label: '吊牌' },
                { value: 'coaster', label: '杯垫' },
                { value: 'doorSign', label: '门牌' },
                { value: 'petBone', label: '宠物牌' },
                { value: 'trophy', label: '奖杯' },
                { value: 'frame', label: '相框' },
                { value: 'tray', label: '托盘' },
              ].map(shape => (

                <PlateShapeButton
                   key={shape.value}
                   shape={shape.value}
                   label={shape.label}
                   selected={parameters.plateShape === shape.value}
                   onClick={() => updateParam('plateShape', shape.value)}
                />
              ))}
           </div>

           {parameters.plateShape === 'rectangle' ? (
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">宽度</Label>
                  <Slider value={parameters.plateWidth} min={20} max={300} step={1}
                    onChange={(val) => updateParam('plateWidth', val)} compact />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">长度</Label>
                  <Slider value={parameters.plateHeight} min={20} max={300} step={1}
                    onChange={(val) => updateParam('plateHeight', val)} compact />
               </div>
               <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">圆角半径</Label>
                  <Slider value={parameters.plateCornerRadius} min={0} max={30} step={1}
                    onChange={(val) => updateParam('plateCornerRadius', val)} compact />
               </div>
             </div>
           ) : ['rounded', 'tray'].includes(parameters.plateShape) ? (
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">宽度</Label>
                  <Slider value={parameters.plateWidth} min={20} max={300} step={1}
                    onChange={(val) => updateParam('plateWidth', val)} compact />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">长度</Label>
                  <Slider value={parameters.plateHeight} min={20} max={300} step={1}
                    onChange={(val) => updateParam('plateHeight', val)} compact />
               </div>
             </div>
           ) : (
             <div className="space-y-1.5">
                <Label className="text-[10px] text-zinc-400">尺寸</Label>
                <Slider value={parameters.size} min={20} max={300} step={1}
                  onChange={(val) => updateParam('size', val)} compact />
             </div>
           )}

           {/* Corner radius for all non-circle shapes */}
           {parameters.plateShape !== 'rectangle' && parameters.plateShape !== 'circle' && parameters.plateShape !== 'tray' && (
             <div className="space-y-1.5">
                <Label className="text-[10px] text-zinc-400">圆角半径</Label>
                <Slider value={parameters.plateCornerRadius} min={0} max={30} step={1}
                  onChange={(val) => updateParam('plateCornerRadius', val)} compact />
             </div>
           )}

           {/* Tray-specific controls */}
           {parameters.plateShape === 'tray' && (
             <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 mt-2">
                <div className="space-y-1.5">
                   <Label className="text-[10px] text-zinc-400">边框宽度</Label>
                   <Slider value={parameters.trayBorderWidth} min={2} max={30} step={1}
                     onChange={(val) => updateParam('trayBorderWidth', val)} compact />
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[10px] text-zinc-400">边框高度</Label>
                   <Slider value={parameters.trayBorderHeight} min={1} max={30} step={0.5}
                     onChange={(val) => updateParam('trayBorderHeight', val)} compact />
                </div>
             </div>
           )}

           {/* Edge bevel controls - for rectangle, rounded, tray */}
           {['rectangle', 'rounded', 'tray'].includes(parameters.plateShape) && (
             <div className="space-y-2 pt-2 border-t border-white/5 mt-2">
                <div className="flex items-center justify-between">
                   <Label className="text-[10px] text-zinc-400">底板边缘倒角</Label>
                   <input
                     type="checkbox"
                     checked={parameters.edgeBevelEnabled}
                     onChange={(e) => updateParam('edgeBevelEnabled', e.target.checked)}
                     className="w-4 h-4 rounded border-zinc-600 bg-zinc-800"
                   />
                </div>
                {parameters.edgeBevelEnabled && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                       <button
                         className={`px-2 py-1 text-[10px] rounded ${parameters.edgeBevelType === 'round' ? 'bg-sky-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
                         onClick={() => updateParam('edgeBevelType', 'round')}
                       >圆角</button>
                       <button
                         className={`px-2 py-1 text-[10px] rounded ${parameters.edgeBevelType === 'chamfer' ? 'bg-sky-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
                         onClick={() => updateParam('edgeBevelType', 'chamfer')}
                       >斜角</button>
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] text-zinc-400">倒角大小</Label>
                       <Slider value={parameters.edgeBevelSize} min={0.5} max={10} step={0.5}
                         onChange={(val) => updateParam('edgeBevelSize', val)} compact />
                    </div>
                  </>
                )}
             </div>
           )}

           <div className="grid grid-cols-2 gap-3 mt-3">
             <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] text-zinc-400">厚度</Label>
                <Slider value={parameters.baseThickness} min={1} max={10} step={0.5}
                  onChange={(val) => updateParam('baseThickness', val)} compact />
             </div>
             
             <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] text-zinc-400">底板角度 (°)</Label>
                <Slider value={parameters.plateRotation} min={-180} max={180} step={1}
                  onChange={(val) => updateParam('plateRotation', val)} compact />
             </div>

             <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] text-zinc-400">底板位置</Label>
                <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                         <Label className="text-[10px] text-zinc-400">横向 (X)</Label>
                         <Slider value={parameters.platePosition.x} min={-300} max={300} step={1}
                           onChange={(val) => updateParam('platePosition', { ...parameters.platePosition, x: val })} compact />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] text-zinc-400">纵向 (Y)</Label>
                         <Slider value={parameters.platePosition.y} min={-300} max={300} step={1}
                           onChange={(val) => updateParam('platePosition', { ...parameters.platePosition, y: val })} compact />
                      </div>
                </div>
             </div>

             <div className="col-span-2 space-y-1.5 pt-2 border-t border-white/5">
                <Label className="text-[10px] text-zinc-400 flex justify-between">
                  <span>模型精度 (影响平滑度)</span>
                  <span className="text-zinc-500">{parameters.modelResolution || 3}级</span>
                </Label>
                <Slider value={parameters.modelResolution || 3} min={1} max={5} step={1}
                  onChange={(val) => updateParam('modelResolution', val)} compact />
             </div>
             <div className="col-span-2">
               <HolesControl 
                 holes={parameters.holes}
                 addHole={addHole}
                 removeHole={removeHole}
                 updateHole={updateHole}
               />
             </div>
           </div>
        </div>

        {/* Text Items Section */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">文字列表</h3>
              <button
                onClick={() => addTextItem()}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                + 添加文字
              </button>
           </div>
           
           {parameters.textItems.map((item, index) => (
             <div key={item.id} className="p-3 bg-secondary/50 rounded-md space-y-3">
                <div className="flex items-center justify-between">
                   <span className="text-xs font-medium">文字 #{index + 1}</span>
                   {parameters.textItems.length > 1 && (
                     <button
                       onClick={() => removeTextItem(item.id)}
                       className="text-xs text-destructive hover:underline"
                     >
                       删除
                     </button>
                   )}
                </div>
                
                <Input 
                   type="text" 
                   value={item.content}
                   onChange={(e) => updateTextItem(item.id, { content: e.target.value })}
                   placeholder="输入文字..."
                />
                
                <div className="grid grid-cols-2 gap-3">
                   <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-zinc-400">字体</Label>
                      <FontSelect
                        value={item.fontUrl}
                        onChange={(val) => updateTextItem(item.id, { fontUrl: val })}
                      />
                   </div>
                   
                   <div className="space-y-1.5">
                      <Label className="text-[10px] text-zinc-400">字号</Label>
                      <Slider value={item.fontSize} min={5} max={100} step={1}
                        onChange={(val) => updateTextItem(item.id, { fontSize: val })} compact />
                   </div>
                   
                   <div className="space-y-1.5">
                      <Label className="text-[10px] text-zinc-400">角度 (°)</Label>
                      <Slider value={item.rotation} min={-180} max={180} step={1}
                        onChange={(val) => updateTextItem(item.id, { rotation: val })} compact />
                   </div>
                   
                   <div className="col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-zinc-400">位置</Label>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                            <Label className="text-[10px] text-zinc-400">横向 (X)</Label>
                            <Slider value={item.position.x} min={-300} max={300} step={1}
                              onChange={(val) => updateTextItem(item.id, { position: { ...item.position, x: val } })} compact />
                         </div>
                         <div className="space-y-1.5">
                            <Label className="text-[10px] text-zinc-400">纵向 (Y)</Label>
                            <Slider value={item.position.y} min={-300} max={300} step={1}
                              onChange={(val) => updateTextItem(item.id, { position: { ...item.position, y: val } })} compact />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
        
        {/* Material Section */}
        <div className="space-y-4 border-t border-border pt-4">
           <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">材质设置</h3>
           
           <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                 <Label className="text-[10px] text-zinc-400">底板颜色</Label>
                 <ColorInput value={parameters.plateColor} onChange={(val) => updateParam('plateColor', val)} />
              </div>
              
              <div className="space-y-1.5">
                 <Label className="text-[10px] text-zinc-400">粗糙度</Label>
                 <Slider value={parameters.roughness} min={0} max={1} step={0.05}
                   onChange={(val) => updateParam('roughness', val)} compact />
              </div>
              
              <div className="space-y-1.5">
                 <Label className="text-[10px] text-zinc-400">金属度</Label>
                 <Slider value={parameters.metalness} min={0} max={1} step={0.05}
                   onChange={(val) => updateParam('metalness', val)} compact />
              </div>
           </div>
        </div>
        <LayoutSection />
      </div>
    )
  }

  if (currentMode === 'qr') {
    return (
      <div className="p-5 space-y-5">
        <div className="pb-3 border-b border-white/5">
           <h2 className="text-base font-semibold bg-linear-to-r from-white to-sky-200 bg-clip-text text-transparent">二维码参数</h2>
           <p className="text-xs text-muted-foreground mt-0.5">生成可Print的 3D 二维码</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <LabelWithHint hint="输入链接或文本生成二维码">链接/内容</LabelWithHint>
            <Input 
              value={parameters.qrText}
              onChange={(e) => updateParam('qrText', e.target.value)}
              placeholder="https://example.com"
              className="mt-1.5"
            />
          </div>

          <div className="space-y-1.5">
             <Label className="text-[10px] text-zinc-400">尺寸</Label>
             <Slider value={parameters.qrSize} min={20} max={200} step={1}
               onChange={(val) => updateParam('qrSize', val)} compact />
          </div>

          <div className="space-y-1.5">
             <Label className="text-[10px] text-zinc-400">深度</Label>
             <Slider value={parameters.qrDepth} min={0.5} max={10} step={0.5}
               onChange={(val) => updateParam('qrDepth', val)} compact />
          </div>
          
          <div className="col-span-2 space-y-1.5">
             <Label className="text-[10px] text-zinc-400">底板厚度</Label>
             <Slider value={parameters.baseThickness} min={1} max={10} step={0.5}
               onChange={(val) => updateParam('baseThickness', val)} compact />
          </div>
          
          <div className="col-span-2 bg-muted/30 p-3 rounded-lg space-y-3">
             <Label className="text-[10px] text-zinc-400">生成模式</Label>
             <div className="flex gap-2">
               <button
                 onClick={() => updateParam('qrInvert', false)}
                 className={cn(
                   "flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors border",
                   !parameters.qrInvert 
                     ? "bg-primary text-primary-foreground border-primary" 
                     : "bg-transparent text-muted-foreground border-border hover:bg-muted"
                 )}
               >
                 浮雕 (凸)
               </button>
               <button
                 onClick={() => updateParam('qrInvert', true)}
                 className={cn(
                   "flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors border",
                   parameters.qrInvert 
                     ? "bg-primary text-primary-foreground border-primary" 
                     : "bg-transparent text-muted-foreground border-border hover:bg-muted"
                 )}
               >
                 凹雕 (凹)
               </button>
             </div>
             <p className="text-[10px] text-muted-foreground">
               {parameters.qrInvert ? '适合作为模具或内嵌图案 (挖空)' : '适合作为铭牌或印章 (凸起)'}
             </p>
             
             {parameters.qrInvert && (
                <div className="flex items-center gap-3 pt-3 mt-1 border-t border-white/5">
                  <Switch 
                     id="qr-through"
                     checked={parameters.qrIsThrough}
                     onCheckedChange={(val) => updateParam('qrIsThrough', val)}
                  />
                  <Label htmlFor="qr-through" className="mb-0 text-xs font-medium cursor-pointer">
                    贯穿底板 (镂空)
                  </Label>
                </div>
             )}
          </div>
          {/* Close Previous Grid */}
          </div>

           {/* Corner and Margin - NEW Grid */}
           <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-1.5">
                 <Label className="text-[10px] text-zinc-400">底板圆角</Label>
                 <Slider value={parameters.plateCornerRadius} min={0} max={parameters.qrSize/2} step={1}
                   onChange={(val) => updateParam('plateCornerRadius', val)} compact />
              </div>

              <div className="space-y-1.5">
                 <Label className="text-[10px] text-zinc-400">边距</Label>
                 <Slider value={parameters.qrMargin} min={0} max={20} step={0.5}
                   onChange={(val) => updateParam('qrMargin', val)} compact />
              </div>
           </div>
           
            {/* Material Section Reuse */}
            <Section title="材质设置">
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5">
                   <Label className="text-[10px] text-zinc-400">底板颜色</Label>
                   <div className="flex gap-2">
                     <Input 
                       type="color" 
                       value={parameters.plateColor}
                       onChange={(e) => updateParam('plateColor', e.target.value)}
                       className="w-8 h-8 p-0 border-0 rounded-md cursor-pointer shrink-0"
                     />
                     <Input 
                       value={parameters.plateColor}
                       onChange={(e) => updateParam('plateColor', e.target.value)}
                       className="font-mono text-xs h-8"
                     />
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <Label className="text-[10px] text-zinc-400">二维码颜色</Label>
                   <div className="flex gap-2">
                     <Input 
                       type="color" 
                       value={parameters.textColor}
                       onChange={(e) => updateParam('textColor', e.target.value)}
                       className="w-8 h-8 p-0 border-0 rounded-md cursor-pointer shrink-0"
                     />
                     <Input 
                       value={parameters.textColor}
                       onChange={(e) => updateParam('textColor', e.target.value)}
                       className="font-mono text-xs h-8"
                     />
                   </div>
                 </div>
                 
                 <div className="space-y-1.5">
                   <Label className="text-[10px] text-zinc-400">粗糙度</Label>
                   <Slider value={parameters.roughness} min={0} max={1} step={0.05}
                     onChange={(val) => updateParam('roughness', val)} compact />
                 </div>
                 
                 <div className="space-y-1.5">
                   <Label className="text-[10px] text-zinc-400">金属度</Label>
                   <Slider value={parameters.metalness} min={0} max={1} step={0.05}
                     onChange={(val) => updateParam('metalness', val)} compact />
                 </div>
               </div>
            </Section>
            <div className="pt-2">
              <HolesControl 
                holes={parameters.holes}
                addHole={addHole}
                removeHole={removeHole}
                updateHole={updateHole}
              />
            </div>
        <LayoutSection />
      </div>
    )
  }

  // Template library mode
  if (currentMode === 'template') {
    const templates = [
      { 
        id: 'nameplate', 
        name: '姓名牌', 
        icon: '🏷️',
        description: '个性化姓名标牌',
        mode: 'relief' as const,
        params: { plateShape: 'rounded', size: 80, baseThickness: 3 }
      },
      { 
        id: 'keychain', 
        name: '钥匙扣', 
        icon: '🔑',
        description: '带孔钥匙挂件',
        mode: 'hollow' as const,
        params: { plateShape: 'circle', size: 40, baseThickness: 4 }
      },
      { 
        id: 'logo', 
        name: 'LOGO 板', 
        icon: '✨',
        description: '品牌标识展示',
        mode: 'relief' as const,
        params: { plateShape: 'rectangle', plateWidth: 100, plateHeight: 100, baseThickness: 5 }
      },
      { 
        id: 'qr-badge', 
        name: '二维码徽章', 
        icon: '📱',
        description: '扫码名片/链接',
        mode: 'qr' as const,
        params: { qrSize: 60, baseThickness: 3, plateCornerRadius: 5 }
      },
      { 
        id: 'gift-tag', 
        name: '礼品吊牌', 
        icon: '🎁',
        description: '节日礼品标签',
        mode: 'relief' as const,
        params: { plateShape: 'heart', size: 50, baseThickness: 2 }
      },
      { 
        id: 'pet-tag', 
        name: '宠物牌', 
        icon: '🐾',
        description: '宠物身份标识',
        mode: 'hollow' as const,
        params: { plateShape: 'hexagon', size: 35, baseThickness: 3 }
      },
      { 
        id: 'door-sign', 
        name: '门牌号', 
        icon: '🚪',
        description: '门牌/房间号',
        mode: 'relief' as const,
        params: { plateShape: 'rectangle', plateWidth: 120, plateHeight: 60, baseThickness: 4 }
      },
      { 
        id: 'coaster', 
        name: '杯垫', 
        icon: '☕',
        description: '个性化杯垫',
        mode: 'relief' as const,
        params: { plateShape: 'circle', size: 90, baseThickness: 4 }
      },
      { 
        id: 'phone-stand', 
        name: '手机支架', 
        icon: '📲',
        description: '桌面手机支架',
        mode: 'basic' as const,
        params: { shapeType: 'cube', size: 60, height: 80 }
      },
      { 
        id: 'trophy', 
        name: '迷你奖杯', 
        icon: '🏆',
        description: '桌面装饰奖杯',
        mode: 'basic' as const,
        params: { shapeType: 'torusKnot', size: 50 }
      },
      { 
        id: 'geometric', 
        name: '几何艺术', 
        icon: '💎',
        description: '装饰几何体',
        mode: 'basic' as const,
        params: { shapeType: 'icosahedron', size: 60 }
      },
      { 
        id: 'card-holder', 
        name: '名片座', 
        icon: '💼',
        description: '桌面名片架',
        mode: 'relief' as const,
        params: { plateShape: 'wave', size: 100, baseThickness: 8 }
      },
    ]

    const handleApplyTemplate = (template: typeof templates[0]) => {
      // Switch to the template's mode
      useModelStore.getState().setMode(template.mode)
      // Apply template params
      Object.entries(template.params).forEach(([key, value]) => {
        updateParam(key as keyof typeof parameters, value)
      })
    }

    return (
      <div className="p-5 space-y-5">
        <div className="pb-3 border-b border-white/5">
          <h2 className="text-base font-semibold bg-linear-to-r from-white to-amber-200 bg-clip-text text-transparent">模板库</h2>
          <p className="text-xs text-muted-foreground mt-0.5">选择预设模板快速开始</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => handleApplyTemplate(template)}
              className="group flex flex-col items-center p-4 rounded-xl border border-white/5 bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{template.icon}</span>
              <span className="text-sm font-medium text-foreground">{template.name}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{template.description}</span>
            </button>
          ))}
        </div>
        
        <div className="pt-3 border-t border-white/5">
          <p className="text-[10px] text-muted-foreground text-center">
            点击模板后可继续调整参数
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex items-center justify-center text-muted-foreground text-sm">
      此模式参数面板尚未实现
    </div>
  )
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
