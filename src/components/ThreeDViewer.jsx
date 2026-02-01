import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

// ================= CONSTANTS =================
const GRAVITY = -30;
const PLAYER_HEIGHT = 1.5;
const MOVE_SPEED = 8;
const SPRINT_MULT = 2.25;
const JUMP_POWER = 10;
const DOOR_DISTANCE = 2.2;

const NAV_TARGETS = [
  { label: "Gate", position: new THREE.Vector3(5, 0, 10) },
  { label: "Parking Area", position: new THREE.Vector3(-8, 0, 4) },
  { label: "Cafeteria", position: new THREE.Vector3(12, 0, -6) },
  { label: "Security Office", position: new THREE.Vector3(-12, 0, -3) },
  { label: "Emergency Exit", position: new THREE.Vector3(0, 0, -15) },
];

const formatName = (name) =>
  name.replace(/[_\-]/g, " ").replace(/\d+/g, "").replace(/\s+/g, " ").trim();

const isMobile = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// ================= COMPONENT =================
export default function ThreeDViewer({ modelUrl = "input.glb" }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [navTargets, setNavTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState("");

  const activeTargetRef = useRef(null);
  const dummyPointRef = useRef(null);
  const targetWorldPosRef = useRef(new THREE.Vector3());

  // -------- MOBILE STATE --------
  const moveRef = useRef({ x: 0, y: 0 });
  const lookRef = useRef({ x: 0, y: 0 });
  const sprintRef = useRef(false);
  const jumpRef = useRef(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ================= SCENE =================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x20232a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // ================= LIGHT =================
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const dir = new THREE.DirectionalLight(0xffffff, 2);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    // ================= CONTROLS =================
    const controls = new PointerLockControls(camera, renderer.domElement);
    const player = { velocity: new THREE.Vector3(), onGround: false };

    // ================= RAYCAST =================
    const raycaster = new THREE.Raycaster();
    const down = new THREE.Vector3(0, -1, 0);
    const groundMeshes = [];
    const doors = [];

    const checkGround = () => {
      raycaster.set(camera.position, down);
      const hits = raycaster.intersectObjects(groundMeshes, false);
      const hit = hits.find((h) => h.distance <= PLAYER_HEIGHT + 0.3);
      if (hit) {
        player.onGround = true;
        player.velocity.y = Math.max(0, player.velocity.y);
        camera.position.y = hit.point.y + PLAYER_HEIGHT;
      } else {
        player.onGround = false;
      }
    };

    // ================= LOADER =================
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader.setDRACOLoader(draco);

    loader.load(import.meta.env.BASE_URL + modelUrl, (gltf) => {
      scene.add(gltf.scene);

      const detected = [];
      const added = new Set();

      gltf.scene.traverse((c) => {
        if (!c.isMesh) return;
        groundMeshes.push(c);

        if (c.name.toLowerCase().includes("door")) {
          c.userData.opened = false;
          doors.push(c);
        }

        const label = formatName(c.name);
        if (label && !added.has(label)) {
          detected.push({ label, type: "mesh", ref: c });
          added.add(label);
        }
      });

      setNavTargets([
        ...detected,
        ...NAV_TARGETS.map((t) => ({ ...t, type: "point" })),
      ]);

      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      camera.position.set(center.x, box.min.y + PLAYER_HEIGHT, center.z + 6);

      setLoading(false);
    });

    // ================= INPUT =================
    const keys = {};
    const onKeyDown = (e) => {
      keys[e.code] = true;
      if (e.code === "Space" && player.onGround) {
        player.velocity.y = JUMP_POWER;
      }
    };
    const onKeyUp = (e) => (keys[e.code] = false);

    if (!isMobile()) {
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);
      renderer.domElement.addEventListener("click", () => controls.lock());
    }

    // ================= LOOP =================
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // -------- DESKTOP --------
      if (!isMobile() && controls.isLocked) {
        const speed = MOVE_SPEED * (keys.ShiftLeft ? SPRINT_MULT : 1);
        if (keys.KeyW) controls.moveForward(speed * delta);
        if (keys.KeyS) controls.moveForward(-speed * delta);
        if (keys.KeyA) controls.moveRight(-speed * delta);
        if (keys.KeyD) controls.moveRight(speed * delta);
      }

      // -------- MOBILE --------
      if (isMobile()) {
        const speed =
          MOVE_SPEED * (sprintRef.current ? SPRINT_MULT : 1);
        controls.moveForward(moveRef.current.y * speed * delta);
        controls.moveRight(moveRef.current.x * speed * delta);

        camera.rotation.y -= lookRef.current.x * delta * 1.5;
        camera.rotation.x -= lookRef.current.y * delta * 1.5;
        camera.rotation.x = THREE.MathUtils.clamp(
          camera.rotation.x,
          -Math.PI / 2,
          Math.PI / 2
        );

        if (jumpRef.current && player.onGround) {
          player.velocity.y = JUMP_POWER;
          jumpRef.current = false;
        }
      }

      // -------- PHYSICS --------
      if (!player.onGround) player.velocity.y += GRAVITY * delta;
      camera.position.y += player.velocity.y * delta;
      checkGround();

      renderer.render(scene, camera);
    };
    animate();

    // ================= CLEANUP =================
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.clear();
    };
  }, [modelUrl]);

  // ================= NAV =================
  const handleSelect = (e) => {
    const t = navTargets.find((n) => n.label === e.target.value);
    if (!t) return;
    activeTargetRef.current = t.type === "mesh" ? t.ref : null;
  };

  return (
    <div ref={mountRef} style={{ width: "100vw", height: "100vh" }}>
      {loading && <div style={overlayStyle}>Loading…</div>}
      {error && <div style={{ ...overlayStyle, color: "red" }}>{error}</div>}

      <select style={selectStyle} onChange={handleSelect}>
        <option value="">Select Destination</option>
        {navTargets.map((t) => (
          <option key={t.label}>{t.label}</option>
        ))}
      </select>

      {isMobile() && (
        <>
          {/* LEFT JOYSTICK */}
          <div
            style={joystick}
            onTouchMove={(e) => {
              const t = e.touches[0];
              moveRef.current.x =
                (t.clientX - window.innerWidth * 0.2) / 80;
              moveRef.current.y =
                (window.innerHeight * 0.7 - t.clientY) / 80;
            }}
            onTouchEnd={() => (moveRef.current = { x: 0, y: 0 })}
          />

          {/* LOOK AREA */}
          <div
            style={lookArea}
            onTouchMove={(e) => {
              const t = e.touches[0];
              lookRef.current.x = t.movementX || 0.5;
              lookRef.current.y = t.movementY || 0.5;
            }}
            onTouchEnd={() => (lookRef.current = { x: 0, y: 0 })}
          />

          {/* BUTTONS */}
          <button style={jumpBtn} onTouchStart={() => (jumpRef.current = true)}>
            ⬆️
          </button>
          <button
            style={sprintBtn}
            onTouchStart={() => (sprintRef.current = true)}
            onTouchEnd={() => (sprintRef.current = false)}
          >
            ⚡
          </button>
        </>
      )}
    </div>
  );
}

// ================= STYLES =================
const overlayStyle = {
  position: "absolute",
  inset: 0,
  background: "#000",
  color: "#fff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "36px",
  zIndex: 10,
};

const selectStyle = {
  position: "absolute",
  top: 20,
  left: "50%",
  transform: "translateX(-50%)",
  padding: "10px",
  zIndex: 20,
};

const joystick = {
  position: "absolute",
  bottom: 40,
  left: 40,
  width: 120,
  height: 120,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.15)",
};

const lookArea = {
  position: "absolute",
  right: 0,
  bottom: 0,
  width: "50%",
  height: "100%",
};

const jumpBtn = {
  position: "absolute",
  bottom: 160,
  right: 40,
  width: 60,
  height: 60,
  borderRadius: "50%",
  fontSize: 24,
};

const sprintBtn = {
  position: "absolute",
  bottom: 80,
  right: 40,
  width: 60,
  height: 60,
  borderRadius: "50%",
  fontSize: 24,
};
