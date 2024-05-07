import { Environment } from "@react-three/drei"
import { Map } from "./Map"
import { useCallback, useEffect, useState } from "react"
import {
  Joystick,
  insertCoin,
  isHost,
  myPlayer,
  onPlayerJoin,
  useMultiplayerState,
} from "playroomkit"
import { SoldierController } from "./SoldierController"
import { Bullet } from "./Bullet"
import { BulletHit } from "./BulletHit"

export const Experience = () => {
  const [players, setPlayers] = useState([])
  const [bullets, setBullets] = useState([])
  const [hits, setHits] = useState([])

  const [networkBullets, setNetworkBullets] = useMultiplayerState("bullets", [])
  const [networkHits, setNetworkHits] = useMultiplayerState("hits", [])

  const onFire = (bullet) => {
    setBullets((bullets) => [...bullets, bullet])
  }

  const onHit = (bulletId, position) => {
    setBullets((bullets) => bullets.filter((bullet) => bullet.id !== bulletId))
    setHits((hits) => [...hits, { id: bulletId, position }])
  }

  const onHitEnded = (hitId) => {
    setHits((hits) => hits.filter((h) => h.id !== hitId))
  }

  const start = useCallback(async () => {
    await insertCoin()
  }, [])

  const onKilled = (_victim, killer) => {
    const killerState = players.find((p) => p.state.id === killer).state
    killerState.setState("kills", killerState.state.kills + 1)
  }

  useEffect(() => {
    setNetworkBullets(bullets)
  }, [bullets])

  useEffect(() => {
    setNetworkHits(hits)
  }, [hits])

  useEffect(() => {
    start()

    onPlayerJoin((player) => {
      const joystick = new Joystick(player, {
        type: "angular",
        buttons: [{ id: "fire", label: "Fire" }],
      })
      const newPlayer = { state: player, joystick }
      player.setState("health", 100)
      player.setState("deaths", 0)
      player.setState("kills", 0)

      setPlayers((prevPlayers) => [...prevPlayers, newPlayer])

      player.onQuit((player) => {
        setPlayers((prevPlayers) =>
          prevPlayers.filter((p) => p.state.id !== player.id)
        )
      })
    })
  }, [])

  return (
    <>
      <directionalLight
        position={[25, 18, -25]}
        intensity={0.3}
        castShadow
        shadow-camera-near={0}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-bias={-0.0001}
      />
      <Map />
      <Environment preset='sunset' />
      {players.map(({ state, joystick }, index) => (
        <SoldierController
          key={`SOLDIER_CONTROLLER_${index}`}
          joystick={joystick}
          state={state}
          userPlayer={state.id === myPlayer()?.id}
          onFire={onFire}
          onKilled={onKilled}
        />
      ))}
      {(isHost() ? bullets : networkBullets).map((bullet) => (
        <Bullet
          key={bullet.id}
          {...bullet}
          onHit={(pos) => onHit(bullet.id, pos)}
        />
      ))}
      {(isHost() ? hits : networkHits).map((hit) => (
        <BulletHit key={hit.id} {...hit} onEnded={() => onHitEnded(hit.id)} />
      ))}
    </>
  )
}
