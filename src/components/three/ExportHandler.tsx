"use client"

import * as THREE from "three"
import { useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { STLExporter, OBJExporter, GLTFExporter, mergeBufferGeometries } from "three-stdlib"
import { useModelStore } from "@/lib/store"

function sanitizeForExport(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry
  const positions = nonIndexed.attributes.position.array as ArrayLike<number>
  const cleanedPositions: number[] = []
  const eps = 1e-12

  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i], ay = positions[i + 1], az = positions[i + 2]
    const bx = positions[i + 3], by = positions[i + 4], bz = positions[i + 5]
    const cx = positions[i + 6], cy = positions[i + 7], cz = positions[i + 8]
    if (
      Number.isNaN(ax) || Number.isNaN(ay) || Number.isNaN(az) ||
      Number.isNaN(bx) || Number.isNaN(by) || Number.isNaN(bz) ||
      Number.isNaN(cx) || Number.isNaN(cy) || Number.isNaN(cz)
    ) {
      continue
    }

    const abx = bx - ax, aby = by - ay, abz = bz - az
    const acx = cx - ax, acy = cy - ay, acz = cz - az
    const crossX = aby * acz - abz * acy
    const crossY = abz * acx - abx * acz
    const crossZ = abx * acy - aby * acx
    const area2 = crossX * crossX + crossY * crossY + crossZ * crossZ
    if (area2 < eps) continue

    cleanedPositions.push(ax, ay, az, bx, by, bz, cx, cy, cz)
  }

  const cleaned = new THREE.BufferGeometry()
  cleaned.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(cleanedPositions, 3)
  )
  cleaned.computeVertexNormals()

  if (nonIndexed !== geometry) nonIndexed.dispose()
  return cleaned
}

/**
 * Collect all meshes from target and prepare for export
 */
function isTransformControlsObject(obj: THREE.Object3D): boolean {
  const name = obj.name || ""
  const type = (obj as any).type || ""
  if (
    type === "TransformControls" ||
    name.includes("TransformControls") ||
    name.includes("TransformControlsGizmo") ||
    name.includes("TransformControlsPlane") ||
    name.includes("Gizmo")
  ) {
    return true
  }
  const userData = (obj as any).userData || {}
  return !!userData.isTransformControls
}

function hasTransformControlsAncestor(obj: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = obj
  while (current) {
    if (isTransformControlsObject(current)) return true
    current = current.parent
  }
  return false
}

function collectMeshes(target: THREE.Object3D): {
  geometries: THREE.BufferGeometry[];
  mesh: THREE.Mesh | null;
} {
  const geometries: THREE.BufferGeometry[] = []
  
  // MANUAL MATRIX STRATEGY:
  // Instead of cloning (which can be flaky or undefined), we manually calculate
  // the cumulative transformation matrix for each mesh relative to the target.
  // We explicitly use scale=[1,1,1] at every step to bypass animation scales.
  
  target.traverse((child) => {
    if (child instanceof THREE.InstancedMesh && child.geometry) {
      if (child.userData.noExport || child.parent?.userData.noExport) return
      if (hasTransformControlsAncestor(child)) return

      const baseGeo = child.geometry
      const combinedMatrix = new THREE.Matrix4()
      const tempMatrix = new THREE.Matrix4()
      const one = new THREE.Vector3(1, 1, 1)

      let current: THREE.Object3D | null = child
      while (current && current !== target) {
        current.updateMatrix()
        tempMatrix.compose(current.position, current.quaternion, one)
        combinedMatrix.premultiply(tempMatrix)
        current = current.parent
      }

      const instanceMatrix = new THREE.Matrix4()
      for (let i = 0; i < child.count; i++) {
        child.getMatrixAt(i, instanceMatrix)
        const geo = baseGeo.clone()
        const finalMatrix = combinedMatrix.clone().multiply(instanceMatrix)
        geo.applyMatrix4(finalMatrix)
        const sanitized = sanitizeForExport(geo)
        sanitized.computeVertexNormals()
        geometries.push(sanitized)
        geo.dispose()
      }
      return
    }

    if (child instanceof THREE.Mesh && child.geometry) {
      // Check for noExport flag on mesh or parent
      if (child.userData.noExport || child.parent?.userData.noExport) return
      // Guard against TransformControls gizmo/planes getting exported
      if (hasTransformControlsAncestor(child)) return

      const geo = child.geometry.clone()
      
      // Calculate matrix relative to export target, forcing scale to 1
      const combinedMatrix = new THREE.Matrix4()
      const tempMatrix = new THREE.Matrix4()
      const one = new THREE.Vector3(1, 1, 1)
      
      let current: THREE.Object3D | null = child
      
      // Walk up the hierarchy until we hit the export target
      while (current && current !== target) {
        // Ensure local transform properties (especially quaternion from R3F props) are up to date
        current.updateMatrix()
        
        // Compose local matrix with Scale=1
        tempMatrix.compose(current.position, current.quaternion, one)
        
        // Multiply: Parent * Child
        combinedMatrix.premultiply(tempMatrix)
        
        current = current.parent
      }
      
      geo.applyMatrix4(combinedMatrix)
      
      // Convert to non-indexed geometry and sanitize for export
      const sanitized = sanitizeForExport(geo)
      sanitized.computeVertexNormals()
      geometries.push(sanitized)
      
      geo.dispose()
    }
  })

  if (geometries.length === 0) {
    return { geometries: [], mesh: null }
  }

  // Merge all geometries into one
  let mergedGeometry: THREE.BufferGeometry | null
  if (geometries.length === 1) {
    mergedGeometry = geometries[0]
  } else {
    mergedGeometry = mergeBufferGeometries(geometries)
  }

  if (!mergedGeometry) {
    return { geometries, mesh: null }
  }

  // Final normal computation
  mergedGeometry.computeVertexNormals()
  
  // Create a temporary mesh for export
  const material = new THREE.MeshStandardMaterial({ color: 0x808080 })
  const exportMesh = new THREE.Mesh(mergedGeometry, material)
  
  return { geometries, mesh: exportMesh }
}

/**
 * Export as STL (binary)
 */
function exportSTL(mesh: THREE.Mesh): void {
  const exporter = new STLExporter()
  const result = exporter.parse(mesh, { binary: true }) as DataView
  
  const arrayBuffer = result.buffer.slice(
    result.byteOffset, 
    result.byteOffset + result.byteLength
  ) as ArrayBuffer
  
  downloadBlob(
    new Blob([arrayBuffer], { type: 'application/octet-stream' }),
    'stl'
  )
}

/**
 * Export as OBJ
 */
function exportOBJ(mesh: THREE.Mesh): void {
  const exporter = new OBJExporter()
  const result = exporter.parse(mesh)
  
  downloadBlob(
    new Blob([result], { type: 'text/plain' }),
    'obj'
  )
}

/**
 * Export as GLTF (JSON format)
 */
function exportGLTF(mesh: THREE.Mesh): void {
  const exporter = new GLTFExporter()
  
  exporter.parse(
    mesh,
    (result) => {
      const output = JSON.stringify(result, null, 2)
      downloadBlob(
        new Blob([output], { type: 'application/json' }),
        'gltf'
      )
    },
    (error) => {
      console.error('GLTF export error:', error)
    },
    { binary: false }
  )
}

/**
 * Export as GLB (binary GLTF)
 */
function exportGLB(mesh: THREE.Mesh): void {
  const exporter = new GLTFExporter()
  
  exporter.parse(
    mesh,
    (result) => {
      downloadBlob(
        new Blob([result as ArrayBuffer], { type: 'application/octet-stream' }),
        'glb'
      )
    },
    (error) => {
      console.error('GLB export error:', error)
    },
    { binary: true }
  )
}

/**
 * Helper to download a blob as file
 */
function downloadBlob(blob: Blob, extension: string): void {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `smart-model-${Date.now()}.${extension}`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function ExportHandler() {
  const { scene } = useThree()
  const { parameters } = useModelStore()
  const { exportTrigger, exportFormat } = parameters
  const lastExportTriggerRef = useRef(exportTrigger)

  useEffect(() => {
    if (exportTrigger === 0) return
    if (exportTrigger === lastExportTriggerRef.current) return
    lastExportTriggerRef.current = exportTrigger

    // Find the export target group
    const target = scene.getObjectByName('export-target')
    if (!target) {
      console.warn("Export target not found")
      return
    }

    const { geometries, mesh } = collectMeshes(target)
    
    if (!mesh) {
      console.warn("No meshes found in export target")
      return
    }

    // Export based on selected format
    switch (exportFormat) {
      case 'stl':
        exportSTL(mesh)
        break
      case 'obj':
        exportOBJ(mesh)
        break
      case 'gltf':
        exportGLTF(mesh)
        break
      case 'glb':
        exportGLB(mesh)
        break
      default:
        exportSTL(mesh)
    }

    // Cleanup
    geometries.forEach(g => g.dispose())
    if (geometries.length > 1 && mesh.geometry) {
      mesh.geometry.dispose()
    }
    
  }, [exportTrigger, exportFormat, scene])

  return null
}
