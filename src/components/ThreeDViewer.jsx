import React, { Suspense, useEffect, useState, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PointerLockControls, Html, useProgress, Environment, Sky, Float } from '@react-three/drei'
import * as THREE from 'three'

// --- 1. Custom Loader ---
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div style={{ 
        color: '#00ffcc', background: '#111', padding: '20px', 
        borderRadius: '10px', border: '2px solid #00ffcc', 
        boxShadow: '0 0 20px #00ffcc', textAlign: 'center', minWidth: '200px' 
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>UNIVERSITY OF LARKANO</h3>
        <b>Loading: {progress.toFixed(0)}%</b>
      </div>
    </Html>
  )
}

// --- 2. University Model Loader ---
function UniversityModel({ setModelScene }) {
  const { scene } = useGLTF('./Final.glb')
  useEffect(() => { 
    if (scene) {
      scene.updateMatrixWorld(true)
      setModelScene(scene)
    } 
  }, [scene, setModelScene])
  return <primitive object={scene} />
}

// --- 3. HUD Navigation Arrow (Pointer) ---
function NavigationArrow({ targetPos }) {
  const meshRef = useRef()
  const { camera } = useThree()
  useFrame(() => {
    if (!meshRef.current || !targetPos) return
    const dir = new THREE.Vector3().subVectors(targetPos, camera.position).normalize()
    const localDir = dir.clone().applyQuaternion(camera.quaternion.clone().invert())
    meshRef.current.position.set(localDir.x * 0.3, localDir.y * 0.3 - 0.1, -0.4)
    meshRef.current.lookAt(new THREE.Vector3(localDir.x * 10, localDir.y * 10, localDir.z * 10))
    meshRef.current.rotateX(Math.PI / 2)
  })
  return (
    <mesh ref={meshRef} renderOrder={10000}>
      <coneGeometry args={[0.015, 0.07, 12]} />
      <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={20} depthTest={false} transparent />
    </mesh>
  )
}

// --- 4. X-RAY TARGET MARKER (Visible through walls) ---
function TargetMarker({ targetPos }) {
  const ringRef = useRef()
  const beamRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 2
      ringRef.current.scale.set(1 + Math.sin(t * 3) * 0.1, 1 + Math.sin(t * 3) * 0.1, 1)
    }
    if (beamRef.current) {
      beamRef.current.material.opacity = 0.3 + Math.sin(t * 4) * 0.1
    }
  })

  if (!targetPos) return null

  return (
    <group position={[targetPos.x, targetPos.y + 0.05, targetPos.z]}>
      {/* Dynamic Floor Ring - depthTest: false makes it visible through walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} ref={ringRef} renderOrder={9999}>
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshStandardMaterial 
          color="#00ffcc" emissive="#00ffcc" emissiveIntensity={15} 
          transparent opacity={0.9} depthTest={false} side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Floating Eye-Catching Diamond */}
      <Float speed={4} rotationIntensity={1.5} floatIntensity={2}>
        <mesh position={[0, 2, 0]} renderOrder={9999}>
          <octahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial 
            color="#00ffcc" emissive="#00ffcc" emissiveIntensity={25} 
            wireframe depthTest={false} 
          />
        </mesh>
      </Float>

      {/* Vertical Glow Beam (Visible from distance) */}
      <mesh ref={beamRef} position={[0, 10, 0]} renderOrder={9998}>
        <cylinderGeometry args={[0.1, 1, 20, 16, 1, true]} />
        <meshStandardMaterial 
          color="#00ffcc" emissive="#00ffcc" emissiveIntensity={10} 
          transparent opacity={0.4} depthTest={false} depthWrite={false} 
        />
      </mesh>
    </group>
  )
}

// --- 5. Player Movement Control ---
function Player({ scene, movement, menuOpen }) {
  const velocity = useRef(0)
  const isGrounded = useRef(false)
  const playerHeight = 1.6

  useFrame((state, delta) => {
    if (menuOpen || !scene) return 
    const { camera } = state
    const speed = movement.shift ? 12 : 6
    const direction = new THREE.Vector3()
    const frontVector = new THREE.Vector3(0, 0, Number(movement.backward) - Number(movement.forward))
    const sideVector = new THREE.Vector3(Number(movement.left) - Number(movement.right), 0, 0)
    
    direction.subVectors(frontVector, sideVector).normalize().applyEuler(camera.rotation).setY(0)
    camera.position.addScaledVector(direction, speed * delta)

    if (movement.jump && isGrounded.current) { velocity.current = 5.5; isGrounded.current = false; }
    velocity.current -= 15 * delta; camera.position.y += velocity.current * delta

    const raycaster = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0))
    const intersects = raycaster.intersectObjects(scene.children, true)
    const floorY = intersects.length > 0 ? intersects[0].point.y + playerHeight : playerHeight

    if (camera.position.y <= floorY) {
      camera.position.y = floorY
      velocity.current = 0
      isGrounded.current = true
    }
  })
  return null
}

// --- 6. Main App Component ---
export default function ThreeDViewer() {
  const [modelScene, setModelScene] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [targetPos, setTargetPos] = useState(null)
  const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false, shift: false, jump: false })
  const controlsRef = useRef()

  const locations = [
    { label: "Auditorium", id: "auditorium" },
    { label: "Bathroom", id: "bathroom" },
    { label: "Class 1", id: "class 1" },
    { label: "Class 2", id: "class 2" },
    { label: "Class 3", id: "class 3" },
    { label: "Class 4", id: "class 4" },
    { label: "Class 5", id: "class 5" }
  ]

  const startNav = (index) => {
    if (!modelScene) return
    const searchId = locations[index].id.toLowerCase().replace(/ /g, '')
    let target = null
    modelScene.traverse((child) => {
      const childName = child.name.toLowerCase().replace(/[ _]/g, '')
      if (childName === searchId) target = child
    })
    if (target) {
      const wp = new THREE.Vector3()
      target.updateMatrixWorld(true)
      target.getWorldPosition(wp)
      setTargetPos(wp)
      setIsOpen(false)
      if (controlsRef.current) controlsRef.current.lock()
    }
  }

  useEffect(() => {
    const down = (e) => {
      if (e.code === 'KeyB') setTargetPos(null)
      if (e.code === 'KeyF') {
        if (isOpen) { setIsOpen(false); controlsRef.current.lock(); }
        else { setIsOpen(true); controlsRef.current.unlock(); }
      }
      if (!isOpen) {
        const keys = { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right', ShiftLeft: 'shift', Space: 'jump' }
        if (keys[e.code]) setMovement(m => ({ ...m, [keys[e.code]]: true }))
      } else {
        if (e.code === 'ArrowDown') setSelectedIndex(s => (s + 1) % locations.length)
        if (e.code === 'ArrowUp') setSelectedIndex(s => (s - 1 + locations.length) % locations.length)
        if (e.code === 'Enter') startNav(selectedIndex)
      }
    }
    const handleKeyUp = (e) => {
      const keys = { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right', ShiftLeft: 'shift', Space: 'jump' }
      if (keys[e.code]) setMovement(m => ({ ...m, [keys[e.code]]: false }))
    }
    window.addEventListener('keydown', down); window.addEventListener('keyup', handleKeyUp)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', handleKeyUp) }
  }, [isOpen, selectedIndex, modelScene])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden', fontFamily: 'Arial, sans-serif' }}>
      <Canvas shadows camera={{ fov: 60, position: [0, 1.6, 10] }}>
        <Suspense fallback={<Loader />}>
          <Sky sunPosition={[100, 20, 100]} />
          <Environment preset="city" />
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
          
          <UniversityModel setModelScene={setModelScene} />
          {modelScene && <Player scene={modelScene} movement={movement} menuOpen={isOpen} />}
          
          {targetPos && (
            <>
              <NavigationArrow targetPos={targetPos} />
              <TargetMarker targetPos={targetPos} />
            </>
          )}
          
          <PointerLockControls ref={controlsRef} />
        </Suspense>
      </Canvas>

      {/* Control Instruction UI */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', color: '#00ffcc', zIndex: 10, background: 'rgba(0,0,0,0.7)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #00ffcc' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>CONTROLS</div>
        WASD: Move | Shift: Run | Space: Jump <br/>
        <b>[F]</b> Open Map | <b>[B]</b> Clear Target
      </div>

      {/* Navigation Menu Overlay */}
      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(5,15,15,0.95)', padding: '35px', borderRadius: '20px', border: '2px solid #00ffcc', 
          zIndex: 9999, minWidth: '350px', backdropFilter: 'blur(15px)', boxShadow: '0 0 30px rgba(0,255,204,0.3)'
        }}>
          <h2 style={{ color: '#00ffcc', textAlign: 'center', margin: '0 0 25px 0', letterSpacing: '4px', borderBottom: '1px solid #00ffcc33', paddingBottom: '10px' }}>CAMPUS NAVIGATOR</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {locations.map((loc, i) => (
              <div key={loc.id} style={{ 
                padding: '12px 20px', fontSize: '18px', border: '1px solid', 
                borderColor: selectedIndex === i ? '#00ffcc' : 'rgba(0,255,204,0.1)',
                background: selectedIndex === i ? 'rgba(0,255,204,0.15)' : 'transparent',
                color: selectedIndex === i ? '#fff' : '#00ffcc99', borderRadius: '8px', 
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span>{loc.label}</span>
                {selectedIndex === i && <span style={{ fontSize: '12px' }}>[ENTER]</span>}
              </div>
            ))}
          </div>
          <p style={{ color: '#00ffcc55', fontSize: '11px', marginTop: '20px', textAlign: 'center' }}>Use UP/DOWN ARROWS to select and ENTER to confirm</p>
        </div>
      )}
    </div>
  )
}
