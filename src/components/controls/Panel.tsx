"use client"

import { useModelStore, ShapeType, GeneratorMode } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useState } from "react"

// Enhanced UI Components

const Label = ({ children, hint }: { children: React.ReactNode, hint?: string }) => (
  <div className="mb-2">
    <label className="text-sm font-medium text-foreground block">{children}</label>
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
  </div>
)

const Slider = ({ 
  value, min, max, step, onChange, unit = '', showInput = true 
}: { 
  value: number, min: number, max: number, step: number, 
  onChange: (val: number) => void, unit?: string, showInput?: boolean 
}) => {
  const [inputValue, setInputValue] = useState(value.toString())
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    const num = parseFloat(e.target.value)
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num)
    }
  }
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value)
    onChange(num)
    setInputValue(num.toString())
  }
  
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
        className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
      />
      {showInput ? (
        <div className="flex items-center">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={() => setInputValue(value.toString())}
            min={min}
            max={max}
            step={step}
            className="w-16 px-2 py-1 text-sm bg-secondary rounded border border-border text-right focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
        </div>
      ) : (
        <span className="text-sm w-14 text-right tabular-nums">{value}{unit}</span>
      )}
    </div>
  )
}

const Select = ({ value, options, onChange }: { value: string, options: { value: string, label: string }[], onChange: (val: string) => void }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2.5 bg-secondary rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
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
            <Select
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
              <Select
                value={parameters.fontUrl}
                options={[
                  { value: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', label: 'Helvetiker (Regular)' },
                  { value: 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', label: 'Helvetiker (Bold)' },
                  { value: 'https://threejs.org/examples/fonts/optimer_regular.typeface.json', label: 'Optimer (Regular)' },
                  { value: 'https://threejs.org/examples/fonts/optimer_bold.typeface.json', label: 'Optimer (Bold)' },
                  { value: 'https://threejs.org/examples/fonts/gentilis_regular.typeface.json', label: 'Gentilis (Regular)' },
                  { value: 'https://threejs.org/examples/fonts/gentilis_bold.typeface.json', label: 'Gentilis (Bold)' },
                  { value: 'https://threejs.org/examples/fonts/droid/droid_sans_regular.typeface.json', label: 'Droid Sans' },
                  { value: 'https://threejs.org/examples/fonts/droid/droid_serif_regular.typeface.json', label: 'Droid Serif' },
                ]}
                onChange={(val) => updateParam('fontUrl', val)}
              />
           </div>
           
           <div>
              <Label>文字内容</Label>
              <input 
                type="text" 
                value={parameters.textContent}
                onChange={(e) => updateParam('textContent', e.target.value)}
                className="w-full px-3 py-2 bg-secondary rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
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
                
                <input 
                  type="text" 
                  value={item.content}
                  onChange={(e) => updateTextItem(item.id, { content: e.target.value })}
                  placeholder="输入文字..."
                  className="w-full px-3 py-2 bg-background rounded-md border border-border text-sm" 
                />
                
                <div>
                   <Label>字体</Label>
                   <Select
                     value={item.fontUrl}
                     options={[
                       { value: 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', label: 'Helvetiker Bold' },
                       { value: 'https://threejs.org/examples/fonts/optimer_bold.typeface.json', label: 'Optimer Bold' },
                       { value: 'https://threejs.org/examples/fonts/gentilis_bold.typeface.json', label: 'Gentilis Bold' },
                       { value: 'https://threejs.org/examples/fonts/droid/droid_sans_bold.typeface.json', label: 'Droid Sans Bold' },
                     ]}
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
                   <div className="grid grid-cols-2 gap-2">
                      <div>
                         <span className="text-xs text-muted-foreground">X</span>
                         <Slider value={item.position.x} min={-50} max={50} step={1}
                           onChange={(val) => updateTextItem(item.id, { position: { ...item.position, x: val } })} />
                      </div>
                      <div>
                         <span className="text-xs text-muted-foreground">Y</span>
                         <Slider value={item.position.y} min={-50} max={50} step={1}
                           onChange={(val) => updateTextItem(item.id, { position: { ...item.position, y: val } })} />
                      </div>
                   </div>
                </div>
             </div>
           ))}
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
                
                <input 
                  type="text" 
                  value={item.content}
                  onChange={(e) => updateTextItem(item.id, { content: e.target.value })}
                  placeholder="输入文字..."
                  className="w-full px-3 py-2 bg-background rounded-md border border-border text-sm" 
                />
                
                <div>
                   <Label>字体</Label>
                   <Select
                     value={item.fontUrl}
                     options={[
                       { value: 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', label: 'Helvetiker Bold (推荐)' },
                       { value: 'https://threejs.org/examples/fonts/optimer_bold.typeface.json', label: 'Optimer Bold' },
                       { value: 'https://threejs.org/examples/fonts/gentilis_bold.typeface.json', label: 'Gentilis Bold' },
                       { value: 'https://threejs.org/examples/fonts/droid/droid_sans_bold.typeface.json', label: 'Droid Sans Bold' },
                     ]}
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
                   <div className="grid grid-cols-2 gap-2">
                      <div>
                         <span className="text-xs text-muted-foreground">X</span>
                         <Slider value={item.position.x} min={-50} max={50} step={1}
                           onChange={(val) => updateTextItem(item.id, { position: { ...item.position, x: val } })} />
                      </div>
                      <div>
                         <span className="text-xs text-muted-foreground">Y</span>
                         <Slider value={item.position.y} min={-50} max={50} step={1}
                           onChange={(val) => updateTextItem(item.id, { position: { ...item.position, y: val } })} />
                      </div>
                   </div>
                </div>
             </div>
           ))}
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
