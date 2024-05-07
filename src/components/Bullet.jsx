import React, { useEffect, useRef } from "react"
import { RigidBody, vec3 } from "@react-three/rapier"
import { MeshBasicMaterial } from "three"
import { WEAPON_OFFSET } from "./SoldierController"
import { isHost } from "playroomkit"

const BULLET_SPEED = 20
const bulletMaterial = new MeshBasicMaterial({
  color: "hotpink",
  toneMapped: false,
})

bulletMaterial.color.multiplyScalar(42)

export const Bullet = ({ player, angle, position, onHit }) => {
  const rigidBody = useRef()

  useEffect(() => {
    const velocity = {
      x: Math.sin(angle) * BULLET_SPEED,
      y: 0,
      z: Math.cos(angle) * BULLET_SPEED,
    }

    rigidBody.current.setLinvel(velocity, true)

    const audio = new Audio("/audio/rifle.mp3")
    audio.play()
  }, [])

  return (
    <group position={[position.x, position.y, position.z]} rotation-y={angle}>
      <group
        position-x={WEAPON_OFFSET.x}
        position-y={WEAPON_OFFSET.y}
        position-z={WEAPON_OFFSET.z}
      >
        <RigidBody
          ref={rigidBody}
          gravityScale={0}
          sensor
          onIntersectionEnter={(e) => {
            if (isHost() && e.other.rigidBody.userData?.type !== "bullet") {
              rigidBody.current.setEnabled(false)
              onHit(vec3(rigidBody.current.translation()))
            }
          }}
          userData={{
            type: "bullet",
            player,
            damage: 10,
          }}
        >
          <mesh position-z={0.25} material={bulletMaterial} castShadow>
            <boxGeometry args={[0.05, 0.05, 0.5]} />
          </mesh>
        </RigidBody>
      </group>
    </group>
  )
}
