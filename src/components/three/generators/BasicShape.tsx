"use client"

import { useModelStore } from "@/lib/store"

export function BasicShape() {
  const { parameters } = useModelStore()
  const { shapeType, size, height, segments, showShadows } = parameters

  // Mesh properties - shadows controlled by showShadows param
  const meshProps = showShadows ? {
    castShadow: true,
    receiveShadow: true,
  } : {}

  // Calculate Y offset so bottom of shape sits on grid (y=0)
  const getYOffset = () => {
    switch (shapeType) {
      case 'cube': return size / 2
      case 'sphere': return size / 2
      case 'cylinder': return height / 2
      case 'cone': return height / 2
      case 'torus': return size / 6 // tube radius
      case 'octahedron': return size / 2
      default: return size / 2
    }
  }

  const yOffset = getYOffset()

  if (shapeType === 'cube') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
    )
  }
  
  if (shapeType === 'sphere') {
     return (
        <mesh {...meshProps} position={[0, yOffset, 0]}>
            <sphereGeometry args={[size / 2, segments, segments]} />
            <meshStandardMaterial color="#0ea5e9" />
        </mesh>
     )
  }

  if (shapeType === 'cylinder') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <cylinderGeometry args={[size / 2, size / 2, height, segments]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
    )
  }

  if (shapeType === 'cone') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <cylinderGeometry args={[0, size / 2, height, segments]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
    )
  }

  if (shapeType === 'torus') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size / 2, size / 6, 16, segments]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
    )
  }

  if (shapeType === 'octahedron') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <octahedronGeometry args={[size / 2, 0]} />
        <meshStandardMaterial color="#0ea5e9" flatShading />
      </mesh>
    )
  }

  return (
    <mesh {...meshProps} position={[0, yOffset, 0]}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color="#0ea5e9" />
    </mesh>
  )
}
