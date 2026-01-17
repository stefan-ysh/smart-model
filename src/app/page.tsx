import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Scene } from "@/components/three/Scene"
import { Panel } from "@/components/controls/Panel"

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground dark">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header />
        <div className="flex-1 flex relative overflow-hidden">
          {/* Canvas Area with gradient background */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden min-w-0 bg-gradient-to-br from-background via-background to-purple-950/20">
            {/* Subtle grid pattern overlay */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}
            />
            <Scene />
          </div>
          
          {/* Parameters Panel */}
          <div className="w-72 shrink-0 h-full border-l border-white/5 bg-card/50 backdrop-blur-xl overflow-y-auto">
             <Panel />
          </div>
        </div>
      </main>
    </div>
  )
}
