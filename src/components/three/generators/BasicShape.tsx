"use client"

import { useModelStore } from "@/lib/store"
import { MATERIAL_CONFIGS } from "@/components/hooks/useMaterialPreset"

export function BasicShape() {
  const { parameters } = useModelStore()
  const { shapeType, size, height, segments, showShadows, plateColor, roughness, metalness } = parameters
  const wireframeMode = useModelStore(state => state.wireframeMode)
  const materialPreset = useModelStore(state => state.materialPreset)

  // Higher detail for smoother curves
  const detailSegments = Math.max(segments, 64)

  // Mesh properties - shadows controlled by showShadows param
  const meshProps = showShadows ? {
    castShadow: true,
    receiveShadow: true,
  } : {}

  // Get material props based on preset
  const getMaterialProps = () => {
    const config = MATERIAL_CONFIGS[materialPreset]
    
    if (materialPreset === 'default') {
      return {
        color: plateColor,
        metalness,
        roughness,
        wireframe: wireframeMode,
      }
    }
    
    return {
      color: config.color || plateColor,
      metalness: config.metalness,
      roughness: config.roughness,
      emissive: config.emissive,
      emissiveIntensity: config.emissiveIntensity,
      transparent: config.transparent,
      opacity: config.opacity,
      envMapIntensity: config.envMapIntensity,
      wireframe: wireframeMode,
    }
  }

  const materialProps = getMaterialProps()

  // Calculate Y offset so bottom of shape sits on grid (y=0)
  const getYOffset = () => {
    switch (shapeType) {
      case 'cube': return size / 2
      case 'sphere': return size / 2
      case 'cylinder': return height / 2
      case 'cone': return height / 2
      case 'torus': return size / 6
      case 'octahedron': return size / 2
      case 'dodecahedron': return size / 2
      case 'icosahedron': return size / 2
      case 'tetrahedron': return size / 2
      case 'torusKnot': return size / 3
      case 'capsule': return height / 2
      case 'ring': return 0
      default: return size / 2
    }
  }

  const yOffset = getYOffset()

  // Cube
  if (shapeType === 'cube') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    )
  }
  
  // Sphere - higher segments for smoother surface
  if (shapeType === 'sphere') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <sphereGeometry args={[size / 2, detailSegments, detailSegments]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    )
  }

  // Cylinder
  if (shapeType === 'cylinder') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <cylinderGeometry args={[size / 2, size / 2, height, detailSegments]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    )
  }

  // Cone
  if (shapeType === 'cone') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <cylinderGeometry args={[0, size / 2, height, detailSegments]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    )
  }

  // Torus (Donut)
  if (shapeType === 'torus') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size / 2, size / 6, 32, detailSegments]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    )
  }

  // Octahedron (8 faces)
  if (shapeType === 'octahedron') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <octahedronGeometry args={[size / 2, 0]} />
        <meshStandardMaterial {...materialProps} flatShading />
      </mesh>
    )
  }

  // Dodecahedron (12 faces) - NEW
  if (shapeType === 'dodecahedron') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <dodecahedronGeometry args={[size / 2, 0]} />
        <meshStandardMaterial {...materialProps} flatShading />
      </mesh>
    )
  }

  // Icosahedron (20 faces) - NEW
  if (shapeType === 'icosahedron') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <icosahedronGeometry args={[size / 2, 0]} />
        <meshStandardMaterial {...materialProps} flatShading />
      </mesh>
    )
  }

  // Tetrahedron (4 faces) - NEW
  if (shapeType === 'tetrahedron') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <tetrahedronGeometry args={[size / 2, 0]} />
        <meshStandardMaterial {...materialProps} flatShading />
      </mesh>
    )
  }

  // Torus Knot - NEW (decorative twisted torus)
  if (shapeType === 'torusKnot') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <torusKnotGeometry args={[size / 3, size / 10, 128, 32]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    )
  }

  // Capsule - NEW (pill shape)
  if (shapeType === 'capsule') {
    return (
      <mesh {...meshProps} position={[0, yOffset, 0]}>
        <capsuleGeometry args={[size / 3, height / 2, 16, detailSegments]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    )
  }

  // Ring - NEW (flat ring/washer)
  if (shapeType === 'ring') {
    return (
      <mesh {...meshProps} position={[0, size / 16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size / 3, size / 2, detailSegments]} />
        <meshStandardMaterial {...materialProps} side={2} />
      </mesh>
    )
  }

  // Default fallback
  return (
    <mesh {...meshProps} position={[0, yOffset, 0]}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  )
}
