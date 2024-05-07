import React, { useCallback, useEffect, useRef, useState } from "react"
import { Soldier } from "./Soldier"
import { CapsuleCollider, RigidBody, vec3 } from "@react-three/rapier"
import { useFrame, useThree } from "@react-three/fiber"
import { isHost } from "playroomkit"
import { Billboard, CameraControls, Text } from "@react-three/drei"

const MOVEMENT_SPEED = 200
const FIRE_RATE = 380

export const WEAPON_OFFSET = {
  x: -0.2,
  y: 1.4,
  z: 0.8,
}

export const SoldierController = ({
  state,
  joystick,
  userPlayer,
  onFire,
  onKilled,
  ...props
}) => {
  const group = useRef()
  const character = useRef()
  const rigidBody = useRef()
  const cameraControl = useRef()
  const lastShoot = useRef(0)
  const [animation, setAnimation] = useState("Idle")

  const scene = useThree((state) => state.scene)

  const spawnRandomly = useCallback(() => {
    const randomNumber = Math.floor(Math.random() * 11)
    const randomSpawn = scene.getObjectByName(`spawn_${randomNumber}`)
    rigidBody.current.setTranslation(randomSpawn.position)
  }, [])

  useEffect(() => {
    if (isHost()) spawnRandomly()
  }, [])

  useFrame((_, delta) => {
    if (!rigidBody.current) return

    if (cameraControl.current) {
      const cameraDistanceY = window.innerWidth < 1024 ? 16 : 20
      const cameraDistanceZ = window.innerWidth < 1024 ? 12 : 16
      const playerWorldPosition = vec3(rigidBody.current.translation())

      cameraControl.current.setLookAt(
        playerWorldPosition.x,
        playerWorldPosition.y + (state.state.dead ? 12 : cameraDistanceY),
        playerWorldPosition.z + (state.state.dead ? 2 : cameraDistanceZ),
        playerWorldPosition.x,
        playerWorldPosition.y + 1.5,
        playerWorldPosition.z,
        true
      )
    }

    if (state.state.dead) {
      setAnimation("Death")
      return
    }

    const angle = joystick.angle()

    if (joystick.isJoystickPressed() && angle) {
      setAnimation("Run")
      character.current.rotation.y = angle

      const impulse = {
        x: Math.sin(angle) * MOVEMENT_SPEED * delta,
        y: 0,
        z: Math.cos(angle) * MOVEMENT_SPEED * delta,
      }

      rigidBody.current.applyImpulse(impulse, true)
    } else {
      setAnimation("Idle")
    }

    if (isHost()) {
      state.setState("pos", rigidBody.current.translation())
    } else {
      const pos = state.getState("pos")
      if (pos) rigidBody.current.setTranslation(pos)
    }

    if (joystick.isPressed("fire")) {
      setAnimation("Idle_Shoot")
      if (isHost()) {
        if (Date.now() - lastShoot.current > FIRE_RATE) {
          lastShoot.current = Date.now()
          const newBullet = {
            id: `${state.id}-${new Date()}`,
            position: vec3(rigidBody.current.translation()),
            angle,
            player: state.id,
          }
          onFire(newBullet)
        }
      }
    }
  })

  const handleShoot = useCallback(({ other }) => {
    if (
      isHost() &&
      other.rigidBody.userData.type === "bullet" &&
      state.state.health > 0
    ) {
      const newHealth = state.state.health - other.rigidBody.userData.damage

      if (newHealth <= 0) {
        state.setState("deaths", state.state.deaths + 1)
        state.setState("dead", true)
        state.setState("health", 0)
        rigidBody.current.setEnabled(false)

        setTimeout(() => {
          spawnRandomly()
          rigidBody.current.setEnabled(true)
          state.setState("health", 100)
          state.setState("dead", false)
        }, 2000)
        onKilled(state.id, other.rigidBody.userData.player)
      } else {
        state.setState("health", newHealth)
      }
    }
  }, [])

  return (
    <group ref={group} {...props}>
      {userPlayer && <CameraControls ref={cameraControl} />}
      <RigidBody
        ref={rigidBody}
        colliders={false}
        linearDamping={12}
        lockRotations
        type={isHost() ? "dynamic" : "kinematicPosition"}
        onIntersectionEnter={handleShoot}
      >
        <PlayerInfo state={state.state} />
        <group ref={character}>
          <Soldier color={state.state.profile?.color} animation={animation} />
          {userPlayer && (
            <Crosshair
              position={[WEAPON_OFFSET.x, WEAPON_OFFSET.y, WEAPON_OFFSET.z]}
            />
          )}
        </group>
        <CapsuleCollider args={[0.7, 0.6]} position={[0, 1.28, 0]} />
      </RigidBody>
    </group>
  )
}

const Crosshair = (props) => {
  return (
    <group {...props}>
      <mesh position-z={1}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color='black' transparent opacity={0.9} />
      </mesh>
      <mesh position-z={2}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color='black' transparent opacity={0.85} />
      </mesh>
      <mesh position-z={3}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color='black' transparent opacity={0.8} />
      </mesh>

      <mesh position-z={4.5}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color='black' opacity={0.7} transparent />
      </mesh>

      <mesh position-z={6.5}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color='black' opacity={0.6} transparent />
      </mesh>

      <mesh position-z={9}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color='black' opacity={0.2} transparent />
      </mesh>
    </group>
  )
}

const PlayerInfo = ({ state }) => {
  const health = state.health
  const name = state.profile.name

  return (
    <Billboard position-y={2.5}>
      <Text position-y={0.36} fontSize={0.4}>
        {name}
        <meshBasicMaterial color={state.profile.color} />
      </Text>
      <mesh position-z={-0.1}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color='black' transparent opacity={0.5} />
      </mesh>
      <mesh scale-x={health / 100} position-x={-0.5 * (1 - health / 100)}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color='red' />
      </mesh>
    </Billboard>
  )
}
