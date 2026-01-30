import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HoleItem } from "@/lib/store";
import { Trash2, Plus } from "lucide-react";
import { SliderWithInput } from "./SliderWithInput";

interface HolesControlProps {
  holes: HoleItem[];
  addHole: () => void;
  removeHole: (id: string) => void;
  updateHole: (id: string, updates: Partial<HoleItem>) => void;
}

export function HolesControl({ holes, addHole, removeHole, updateHole }: HolesControlProps) {
  const safeHoles = holes || [];

  return (
    <div className="space-y-4 pt-4 border-t border-white/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">底板打孔</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={addHole}
          className="h-7 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          添加孔
        </Button>
      </div>

      <div className="space-y-3">
        {safeHoles.map((hole, index) => (
          <div key={hole.id} className="p-3 bg-secondary/50 rounded-md space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">孔位 #{index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-destructive hover:text-destructive/80"
                onClick={() => removeHole(hole.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex flex-col gap-3">
               {/* X Position */}
               <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">X 坐标</Label>
                  <SliderWithInput
                    value={hole.x}
                    min={-150}
                    max={150}
                    step={1}
                    onChange={(val) => updateHole(hole.id, { x: val })}
                    compact
                  />
               </div>

               {/* Y Position */}
               <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">Y 坐标</Label>
                  <SliderWithInput
                    value={hole.y}
                    min={-150}
                    max={150}
                    step={1}
                    onChange={(val) => updateHole(hole.id, { y: val })}
                    compact
                  />
               </div>

               {/* Radius */}
               <div className="space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">半径 (mm)</Label>
                  <SliderWithInput
                    value={hole.radius}
                    min={1}
                    max={50}
                    step={0.5}
                    onChange={(val) => updateHole(hole.id, { radius: val })}
                    compact
                  />
               </div>
            </div>
          </div>
        ))}
        {safeHoles.length === 0 && (
          <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-white/10 rounded-md">
            暂无孔位，点击上方按钮添加
          </div>
        )}
      </div>
    </div>
  );
}
