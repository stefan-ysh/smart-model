import * as THREE from "three";

export type OrbitControlsLike = {
  target: THREE.Vector3
  update: () => void
}
