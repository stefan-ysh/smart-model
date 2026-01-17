import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Scene } from "@/components/three/Scene"
import { Panel } from "@/components/controls/Panel"

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <div className="flex-1 flex relative overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 bg-muted/30 relative flex items-center justify-center overflow-hidden">
            <Scene />
          </div>
          
          {/* Parameters Panel */}
          <div className="w-80 h-full border-l border-border bg-card overflow-y-auto">
             <Panel />
          </div>
        </div>
      </main>
    </div>
  )
}
