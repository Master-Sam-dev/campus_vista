import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CampusModel from "./CampusModel"; // your 3D model loader component

function Viewer() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
        <CampusModel />
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default Viewer;
