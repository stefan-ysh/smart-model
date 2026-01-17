"use client"

import { useModelStore, ShapeType, GeneratorMode } from "@/lib/store"
import { cn } from "@/lib/utils"
import { FontSelect } from "./FontSelect"
import { SliderWithInput } from "./SliderWithInput"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  value, min, max, step, onChange, unit = '', showInput = true 
}: { 
  value: number, min: number, max: number, step: number, 
  onChange: (val: number) => void, unit?: string, showInput?: boolean 
}) => (
  <SliderWithInput 
    value={value} 
    min={min} 
    max={max} 
    step={step} 
    onChange={onChange} 
    unit={unit} 
    showInput={showInput} 
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

// Plate shape icons
const PlateShapeButton = ({ 
  shape, selected, onClick, label 
}: { 
  shape: string, selected: boolean, onClick: () => void, label: string 
}) => {
  const icons: Record<string, string> = {
    square: '▢', rectangle: '▭', circle: '○', 
    diamond: '◇', star: '☆', wave: '〰', heart: '♡'
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all min-w-[60px]",
        selected 
          ? "border-primary bg-primary/10 text-primary" 
          : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
      )}
    >
      <span className="text-xl">{icons[shape] || '□'}</span>
      <span className="text-xs mt-1">{label}</span>
    </button>
  )
}

// Color picker component
const ColorInput = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label?: string }) => (
  <div className="flex items-center gap-2">
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-10 h-10 rounded cursor-pointer border border-border"
    />
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 font-mono"
      placeholder="#000000"
    />
  </div>
)

// Section component for better organization
const Section = ({ title, children, collapsible = false }: { title: string, children: React.ReactNode, collapsible?: boolean }) => (
  <div className="space-y-3 border-b border-border pb-4 last:border-0">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
    {children}
  </div>
)

export function Panel() {
  const { currentMode, parameters, updateParam } = useModelStore()

  if (currentMode === 'basic') {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">基础模型参数</h2>
          <p className="text-sm text-muted-foreground">调整几何体的大小和形状</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>形状类型</Label>
            <SimpleSelect
              value={parameters.shapeType}
              options={[
                { value: 'cube', label: '立方体 (Cube)' },
                { value: 'sphere', label: '球体 (Sphere)' },
                { value: 'cylinder', label: '圆柱体 (Cylinder)' },
                { value: 'cone', label: '圆锥体 (Cone)' },
                { value: 'torus', label: '圆环体 (Torus)' },
                { value: 'octahedron', label: '八面体 (Octahedron)' },
              ]}
              onChange={(val) => updateParam('shapeType', val as ShapeType)}
            />
          </div>

          <div>
            <Label>尺寸 (Size)</Label>
            <Slider
              value={parameters.size}
              min={10}
              max={200}
              step={1}
              onChange={(val) => updateParam('size', val)}
            />
          </div>

          {(parameters.shapeType === 'cylinder' || parameters.shapeType === 'cone') && (
            <div>
              <Label>高度 (Height)</Label>
              <Slider
                value={parameters.height}
                min={10}
                max={200}
                step={1}
                onChange={(val) => updateParam('height', val)}
              />
            </div>
          )}

          {(parameters.shapeType === 'sphere' || parameters.shapeType === 'cylinder' || parameters.shapeType === 'cone' || parameters.shapeType === 'torus') && (
            <div>
              <Label>分段数 (Segments) - 精度</Label>
              <Slider
                value={parameters.segments}
                min={3}
                max={128}
                step={1}
                onChange={(val) => updateParam('segments', val)}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (currentMode === 'text') {
    return (
      <div className="p-6 space-y-6">
        <div>
           <h2 className="text-lg font-semibold mb-1">文字3D参数</h2>
           <p className="text-sm text-muted-foreground">输入文字并调整大小与厚度</p>
        </div>
        
        <div className="space-y-4">
           <div>
              <Label>字体 (Font)</Label>
              <FontSelect
                value={parameters.fontUrl}
                onChange={(val) => updateParam('fontUrl', val)}
              />
           </div>
           
           <div>
              <Label>文字内容</Label>
              <Input 
                type="text" 
                value={parameters.textContent}
                onChange={(e) => updateParam('textContent', e.target.value)}
              />
           </div>
           
           <div>
              <Label>文字大小 (Font Size)</Label>
              <Slider
                value={parameters.fontSize}
                min={10}
                max={100}
                step={1}
                onChange={(val) => updateParam('fontSize', val)}
              />
           </div>
           
           <div>
              <Label>厚度 (Extrusion)</Label>
              <Slider
                value={parameters.thickness}
                min={1}
                max={50}
                step={0.5}
                onChange={(val) => updateParam('thickness', val)}
              />
           </div>
        </div>
      </div>
    )
  }
  
  if (currentMode === 'relief') {
    const { addTextItem, removeTextItem, updateTextItem } = useModelStore.getState()
    
    return (
      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-100px)]">
        <div>
           <h2 className="text-lg font-semibold mb-1">文字浮雕板</h2>
           <p className="text-sm text-muted-foreground">选择板形并添加多个凸起文字</p>
        </div>
        
        {/* Plate Shape Section */}
        <div className="space-y-4 border-b border-border pb-4">
           <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">底板形状</h3>
           
           <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'square', label: '正方' },
                { value: 'rectangle', label: '长方' },
                { value: 'circle', label: '圆形' },
                { value: 'diamond', label: '菱形' },
                { value: 'star', label: '五星' },
                { value: 'wave', label: '波浪' },
                { value: 'heart', label: '爱心' },
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
             <>
               <div>
                  <Label>宽度 (Width)</Label>
                  <Slider value={parameters.plateWidth} min={20} max={200} step={1}
                    onChange={(val) => updateParam('plateWidth', val)} />
               </div>
               <div>
                  <Label>高度 (Height)</Label>
                  <Slider value={parameters.plateHeight} min={20} max={200} step={1}
                    onChange={(val) => updateParam('plateHeight', val)} />
               </div>
             </>
           ) : (
             <div>
                <Label>尺寸 (Size)</Label>
                <Slider value={parameters.size} min={20} max={200} step={1}
                  onChange={(val) => updateParam('size', val)} />
             </div>
           )}

           <div>
              <Label>底板厚度</Label>
              <Slider value={parameters.baseThickness} min={1} max={10} step={0.5}
                onChange={(val) => updateParam('baseThickness', val)} />
           </div>
           
           <div>
              <Label>浮雕高度</Label>
              <Slider value={parameters.reliefHeight} min={1} max={20} step={0.5}
                onChange={(val) => updateParam('reliefHeight', val)} />
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
                
                <div>
                   <Label>字体</Label>
                   <FontSelect
                     value={item.fontUrl}
                     onChange={(val) => updateTextItem(item.id, { fontUrl: val })}
                   />
                </div>
                
                <div>
                   <Label>字号</Label>
                   <Slider value={item.fontSize} min={5} max={50} step={1}
                     onChange={(val) => updateTextItem(item.id, { fontSize: val })} />
                </div>
                
                <div>
                   <Label>角度 (°)</Label>
                   <Slider value={item.rotation} min={-180} max={180} step={1}
                     onChange={(val) => updateTextItem(item.id, { rotation: val })} />
                </div>
                
                <div>
                   <Label>位置</Label>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-muted-foreground w-8">横向</span>
                         <Slider value={item.position.x} min={-200} max={200} step={1}
                           onChange={(val) => updateTextItem(item.id, { position: { ...item.position, x: val } })} />
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-muted-foreground w-8">纵向</span>
                         <Slider value={item.position.y} min={-200} max={200} step={1}
                           onChange={(val) => updateTextItem(item.id, { position: { ...item.position, y: val } })} />
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
        
        {/* Material Section */}
        <div className="space-y-4 border-t border-border pt-4">
           <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">材质设置</h3>
           
           <div>
              <Label>底板颜色</Label>
              <ColorInput value={parameters.plateColor} onChange={(val) => updateParam('plateColor', val)} />
           </div>
           
           <div>
              <Label>文字颜色</Label>
              <ColorInput value={parameters.textColor} onChange={(val) => updateParam('textColor', val)} />
           </div>
           
           <div>
              <Label>粗糙度</Label>
              <Slider value={parameters.roughness} min={0} max={1} step={0.05}
                onChange={(val) => updateParam('roughness', val)} />
           </div>
           
           <div>
              <Label>金属度</Label>
              <Slider value={parameters.metalness} min={0} max={1} step={0.05}
                onChange={(val) => updateParam('metalness', val)} />
           </div>
        </div>
      </div>
    )
  }

  if (currentMode === 'hollow') {
    const { addTextItem, removeTextItem, updateTextItem } = useModelStore.getState()
    
    return (
      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-100px)]">
        <div>
           <h2 className="text-lg font-semibold mb-1">文字镂空板</h2>
           <p className="text-sm text-muted-foreground">选择板形并添加多个文字</p>
        </div>
        
        {/* Plate Shape Section */}
        <div className="space-y-4 border-b border-border pb-4">
           <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">底板形状</h3>
           
           <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'square', label: '正方' },
                { value: 'rectangle', label: '长方' },
                { value: 'circle', label: '圆形' },
                { value: 'diamond', label: '菱形' },
                { value: 'star', label: '五星' },
                { value: 'wave', label: '波浪' },
                { value: 'heart', label: '爱心' },
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
             <>
               <div>
                  <Label>宽度 (Width)</Label>
                  <Slider value={parameters.plateWidth} min={20} max={200} step={1}
                    onChange={(val) => updateParam('plateWidth', val)} />
               </div>
               <div>
                  <Label>高度 (Height)</Label>
                  <Slider value={parameters.plateHeight} min={20} max={200} step={1}
                    onChange={(val) => updateParam('plateHeight', val)} />
               </div>
             </>
           ) : (
             <div>
                <Label>尺寸 (Size)</Label>
                <Slider value={parameters.size} min={20} max={200} step={1}
                  onChange={(val) => updateParam('size', val)} />
             </div>
           )}

           <div>
              <Label>厚度 (Thickness)</Label>
              <Slider value={parameters.baseThickness} min={1} max={10} step={0.5}
                onChange={(val) => updateParam('baseThickness', val)} />
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
                
                <div>
                   <Label>字体</Label>
                   <FontSelect
                     value={item.fontUrl}
                     onChange={(val) => updateTextItem(item.id, { fontUrl: val })}
                   />
                </div>
                
                <div>
                   <Label>字号</Label>
                   <Slider value={item.fontSize} min={5} max={50} step={1}
                     onChange={(val) => updateTextItem(item.id, { fontSize: val })} />
                </div>
                
                <div>
                   <Label>角度 (°)</Label>
                   <Slider value={item.rotation} min={-180} max={180} step={1}
                     onChange={(val) => updateTextItem(item.id, { rotation: val })} />
                </div>
                
                <div>
                   <Label>位置</Label>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-muted-foreground w-8">横向</span>
                         <Slider value={item.position.x} min={-200} max={200} step={1}
                           onChange={(val) => updateTextItem(item.id, { position: { ...item.position, x: val } })} />
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-muted-foreground w-8">纵向</span>
                         <Slider value={item.position.y} min={-200} max={200} step={1}
                           onChange={(val) => updateTextItem(item.id, { position: { ...item.position, y: val } })} />
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
        
        {/* Material Section */}
        <div className="space-y-4 border-t border-border pt-4">
           <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">材质设置</h3>
           
           <div>
              <Label>底板颜色</Label>
              <ColorInput value={parameters.plateColor} onChange={(val) => updateParam('plateColor', val)} />
           </div>
           
           <div>
              <Label>粗糙度</Label>
              <Slider value={parameters.roughness} min={0} max={1} step={0.05}
                onChange={(val) => updateParam('roughness', val)} />
           </div>
           
           <div>
              <Label>金属度</Label>
              <Slider value={parameters.metalness} min={0} max={1} step={0.05}
                onChange={(val) => updateParam('metalness', val)} />
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex items-center justify-center text-muted-foreground">
      此模式参数面板尚未实现
    </div>
  )
}
