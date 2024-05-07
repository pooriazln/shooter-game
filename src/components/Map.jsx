import React, { useEffect } from "react"
import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"

export const Map = () => {
  const map = useGLTF("models/map.glb")

  useEffect(() => {
    map.scene.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
  }, [map])

  return (
    <RigidBody colliders='trimesh' type='fixed'>
      <primitive object={map.scene} />
    </RigidBody>
  )
}

useGLTF.preload("models/map.glb")
