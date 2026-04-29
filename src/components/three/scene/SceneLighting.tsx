"use client"

export function SceneLighting({ showShadows }: { showShadows: boolean }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.2}
        castShadow={showShadows}
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-30, 50, -30]} intensity={0.3} />
    </>
  )
}
