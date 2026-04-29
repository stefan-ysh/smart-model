"use client"

import { Html, useProgress } from "@react-three/drei"

export function Loader() {
  const { progress, active } = useProgress()
  if (!active) return null

  return (
    <Html center>
      <div className="relative flex flex-col items-center justify-center pointer-events-none select-none">
        <div className="absolute h-40 w-40 rounded-full bg-primary/10 blur-[60px]" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-border/70 bg-background/70 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-b from-foreground/10 to-transparent rounded-3xl" />
          <svg className="h-20 w-20 -rotate-90 transform">
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              className="text-foreground/20"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={213.6}
              strokeDashoffset={213.6 - (213.6 * progress) / 100}
              className="text-primary transition-all duration-500 ease-out"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-bold text-primary-foreground tabular-nums tracking-tighter">
              {progress.toFixed(0)}<span className="text-[10px] ml-0.5 opacity-50">%</span>
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Initializing Engine
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground/80 uppercase tracking-widest">
            Loading 3D Assets & Resources
          </span>
        </div>
      </div>
    </Html>
  )
}

export function FontLoadingOverlay({
  title = "Global Typography",
  subtitle = "Optimizing Visual Assets",
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md">
      <div className="relative flex flex-col items-center justify-center">
        <div className="absolute h-40 w-40 rounded-full bg-accent/15 blur-[60px]" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-border/70 bg-background/70 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-b from-foreground/10 to-transparent rounded-3xl" />
          <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {title}
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground/80 uppercase tracking-widest">
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  )
}
