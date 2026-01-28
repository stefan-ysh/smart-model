"use client";

import { useEffect, useState } from "react";
import { Monitor, Smartphone, AlertCircle } from "lucide-react";

export function MobileNotSupported() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(39,39,42,1)_0%,rgba(9,9,11,1)_100%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
        
        {/* Animated Orbs */}
        <div className="absolute -left-24 -top-24 h-96 w-96 animate-pulse rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-[100px] [animation-delay:1s]" />
      </div>

      {/* Glassmorphism Card */}
      <div className="relative mx-6 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all hover:border-white/20">
        <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20 blur-xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl">
              <Monitor className="h-12 w-12 text-blue-400" />
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-zinc-900 bg-red-500 shadow-lg">
                <Smartphone className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          <h1 className="mb-4 text-2xl font-bold tracking-tight text-white">
            建议使用 PC 访问
          </h1>
          
          <div className="mb-6 space-y-3">
            <p className="text-zinc-400 text-sm leading-relaxed">
              为了获得最佳的 <span className="text-blue-400 font-medium">3D 建模与实时预览</span> 体验，
              请在桌面端浏览器中打开本项目。
            </p>
          </div>

          <div className="flex w-full items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-3 text-left">
            <AlertCircle className="h-5 w-5 shrink-0 text-blue-400" />
            <span className="text-xs text-zinc-500">
              移动端暂不支持查看和编辑 3D 内容
            </span>
          </div>

          <div className="mt-8 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
            Smart Model Engine v0.1
          </div>
        </div>
      </div>
    </div>
  );
}
