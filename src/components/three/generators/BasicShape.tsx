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

  if (shapeType === 'cube') {
    return (
      <mesh {...meshProps}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
    )
  }
  
  if (shapeType === 'sphere') {
     return (
        <mesh {...meshProps}>
            <sphereGeometry args={[size / 2, segments, segments]} />
            <meshStandardMaterial color="#0ea5e9" />
        </mesh>
     )
  }

  if (shapeType === 'cylinder') {
    return (
      <mesh {...meshProps}>
        <cylinderGeometry args={[size / 2, size / 2, height, segments]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
    )
  }

  if (shapeType === 'cone') {
    return (
      <mesh {...meshProps}>
        <cylinderGeometry args={[0, size / 2, height, segments]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
    )
  }

  if (shapeType === 'torus') {
    return (
      <mesh {...meshProps} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size / 2, size / 6, 16, segments]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
    )
  }

  if (shapeType === 'octahedron') {
    return (
      <mesh {...meshProps}>
        <octahedronGeometry args={[size / 2, 0]} />
        <meshStandardMaterial color="#0ea5e9" flatShading />
      </mesh>
    )
  }

  return (
    <mesh {...meshProps}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color="#0ea5e9" />
    </mesh>
  )
}
