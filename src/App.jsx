import { Canvas } from "@react-three/fiber"
import { Experience } from "./components/Experience"
import { Loader, SoftShadows } from "@react-three/drei"
import { Suspense } from "react"
import { Physics } from "@react-three/rapier"
import { Bloom, EffectComposer } from "@react-three/postprocessing"
import { Leaderboard } from "./components/Leaderboard"

function App() {
  return (
    <>
      <Loader />
      <Leaderboard />
      <Canvas shadows camera={{ position: [0, 30, 0], fov: 30, near: 2 }}>
        <SoftShadows size={"40"} />
        <color attach='background' args={["#242424"]} />
        <Suspense>
          <Physics>
            <Experience />
          </Physics>
        </Suspense>
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={1} intensity={1.5} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </>
  )
}

export default App
