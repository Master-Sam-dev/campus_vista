// src/ThreeDViewer.jsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";


export default function ThreeDViewer(props) {
  // 🔥 FIX: Prevent undefined props crash
  const modelUrl = props?.modelUrl || "/model.glb";

  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Controls
    const controls = new PointerLockControls(camera, document.body);

    // Player state
    let height = 1.75;
    let crouchHeight = 0.9;
    let currentHeight = height;
    let targetHeight = height;
    let velocityY = 0;
    let canJump = true;

    const moveState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      crouch: false,
    };

    // Input
    const onKeyDown = (e) => {
      switch (e.code) {
        case "KeyW": moveState.forward = true; break;
        case "KeyS": moveState.backward = true; break;
        case "KeyA": moveState.left = true; break;
        case "KeyD": moveState.right = true; break;
        case "ShiftLeft":
        case "ShiftRight": moveState.sprint = true; break;
        case "KeyC":
        case "ControlLeft":
        case "ControlRight":
          moveState.crouch = true;
          targetHeight = crouchHeight;
          break;
        case "Space":
          if (canJump) {
            velocityY = 10;
            canJump = false;
          }
          e.preventDefault();
          break;
      }
    };

    const onKeyUp = (e) => {
      switch (e.code) {
        case "KeyW": moveState.forward = false; break;
        case "KeyS": moveState.backward = false; break;
        case "KeyA": moveState.left = false; break;
        case "KeyD": moveState.right = false; break;
        case "ShiftLeft":
        case "ShiftRight": moveState.sprint = false; break;
        case "KeyC":
        case "ControlLeft":
        case "ControlRight":
          moveState.crouch = false;
          targetHeight = height;
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    renderer.domElement.addEventListener("click", () => controls.lock());

    // Load model (DRACO)
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
    );

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      modelUrl,
      (gltf) => {
        scene.add(gltf.scene);

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        camera.position.set(center.x, box.min.y + height, center.z + 10);
      },
      undefined,
      (err) => console.error("Model load error:", err)
    );

    const raycaster = new THREE.Raycaster();
    const clock = new THREE.Clock();

    // HUD
    const hud = document.createElement("div");
    hud.innerText =
      "Click to start • WASD Move • SHIFT Sprint • C/CTRL Crouch • SPACE Jump";
    hud.style.cssText =
      "position:absolute;top:20px;left:20px;color:#fff;background:rgba(0,0,0,0.7);padding:12px 20px;border-radius:10px;font-family:Arial,sans-serif;font-size:16px;pointer-events:none;z-index:100;";
    document.body.appendChild(hud);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (controls.isLocked) {
        const speed = moveState.crouch
          ? 3
          : moveState.sprint
          ? 14
          : 7;

        currentHeight += (targetHeight - currentHeight) * 8 * delta;

        const distance = speed * delta;
        if (moveState.forward) controls.moveForward(distance);
        if (moveState.backward) controls.moveForward(-distance * 0.6);
        if (moveState.left) controls.moveRight(-distance);
        if (moveState.right) controls.moveRight(distance);

        velocityY -= 30 * delta;
        camera.position.y += velocityY * delta;

        raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0 && intersects[0].distance < currentHeight + 0.3) {
          camera.position.y = intersects[0].point.y + currentHeight;
          velocityY = 0;
          canJump = true;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", handleResize);
      hud.remove();
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [modelUrl]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    />
  );
}
