import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, MeshReflectorMaterial, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/* ─── Procedural motorcycle body ─── */
function MotorcycleBody() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.18;
    groupRef.current.position.y = Math.sin(t * 0.6) * 0.04;
  });

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1a1f35"),
        metalness: 0.92,
        roughness: 0.12,
        envMapIntensity: 1.8,
      }),
    []
  );

  const orangeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#F97316"),
        metalness: 0.6,
        roughness: 0.25,
        emissive: new THREE.Color("#F97316"),
        emissiveIntensity: 0.18,
      }),
    []
  );

  const chromeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#c0c8d8"),
        metalness: 0.98,
        roughness: 0.05,
        envMapIntensity: 2.5,
      }),
    []
  );

  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#a8c8ff"),
        metalness: 0.1,
        roughness: 0.05,
        transparent: true,
        opacity: 0.35,
        envMapIntensity: 2,
      }),
    []
  );

  const tireMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#111111"),
        metalness: 0.0,
        roughness: 0.95,
      }),
    []
  );

  const rimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#888ea8"),
        metalness: 0.9,
        roughness: 0.15,
        envMapIntensity: 2,
      }),
    []
  );

  /* Helper shapes */
  const CylH = ({ args, mat, pos, rot }: any) => (
    <mesh material={mat} position={pos} rotation={rot} castShadow>
      <cylinderGeometry args={args} />
    </mesh>
  );

  const Box = ({ args, mat, pos, rot }: any) => (
    <mesh material={mat} position={pos} rotation={rot} castShadow>
      <boxGeometry args={args} />
    </mesh>
  );

  const Wheel = ({ x }: { x: number }) => (
    <group position={[x, -0.42, 0]}>
      {/* Tire */}
      <CylH args={[0.38, 0.38, 0.18, 32]} mat={tireMat} pos={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} />
      {/* Rim */}
      <CylH args={[0.26, 0.26, 0.20, 8]} mat={rimMat} pos={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} />
      {/* Hub */}
      <CylH args={[0.06, 0.06, 0.22, 16]} mat={chromeMat} pos={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} />
      {/* Spokes */}
      {[0, 45, 90, 135].map((a, i) => (
        <mesh key={i} material={rimMat} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, (a * Math.PI) / 180]} castShadow>
          <boxGeometry args={[0.02, 0.46, 0.015]} />
        </mesh>
      ))}
      {/* Brake disc */}
      <CylH args={[0.18, 0.18, 0.025, 24]} mat={chromeMat} pos={[0, 0, 0.1]} rot={[Math.PI / 2, 0, 0]} />
    </group>
  );

  return (
    <group ref={groupRef} scale={[1.1, 1.1, 1.1]}>
      {/* WHEELS */}
      <Wheel x={-0.75} />
      <Wheel x={0.75} />

      {/* FRAME / swingarm */}
      <mesh material={chromeMat} position={[0, -0.15, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.6, 0.06, 0.06]} />
      </mesh>

      {/* MAIN BODY — fairing */}
      <mesh material={bodyMat} position={[-0.05, 0.1, 0]} castShadow>
        <boxGeometry args={[0.8, 0.3, 0.3]} />
      </mesh>

      {/* TANK */}
      <mesh material={bodyMat} position={[0.15, 0.25, 0]} castShadow>
        <boxGeometry args={[0.55, 0.22, 0.28]} />
      </mesh>

      {/* Orange accent stripe */}
      <Box args={[0.82, 0.04, 0.28]} mat={orangeMat} pos={[-0.05, -0.01, 0]} rot={undefined} />

      {/* SEAT */}
      <mesh material={bodyMat} position={[0.35, 0.28, 0]} castShadow>
        <boxGeometry args={[0.45, 0.1, 0.22]} />
      </mesh>

      {/* HEADLIGHT cluster */}
      <mesh material={glassMat} position={[-0.6, 0.14, 0]} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.18]} />
      </mesh>
      {/* DRL strip */}
      <mesh material={orangeMat} position={[-0.61, 0.12, 0]}>
        <boxGeometry args={[0.03, 0.02, 0.16]} />
      </mesh>

      {/* WINDSCREEN */}
      <mesh material={glassMat} position={[-0.42, 0.38, 0]} rotation={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[0.22, 0.26, 0.015]} />
      </mesh>

      {/* EXHAUST pipe */}
      <CylH args={[0.025, 0.025, 0.72, 12]} mat={chromeMat} pos={[0.25, -0.28, 0.17]} rot={[0, 0, Math.PI / 2]} />
      <CylH args={[0.04, 0.032, 0.22, 12]} mat={chromeMat} pos={[0.65, -0.28, 0.17]} rot={[0, 0, Math.PI / 2]} />

      {/* HANDLEBARS */}
      <CylH args={[0.012, 0.012, 0.38, 8]} mat={chromeMat} pos={[-0.48, 0.42, 0]} rot={[0, 0, 0.3]} />
      <CylH args={[0.012, 0.012, 0.32, 8]} mat={chromeMat} pos={[-0.48, 0.42, 0]} rot={[Math.PI / 2, 0, 0]} />

      {/* FORKS */}
      <CylH args={[0.022, 0.022, 0.6, 8]} mat={chromeMat} pos={[-0.76, 0.0, 0.1]} rot={[0, 0, 0.25]} />
      <CylH args={[0.022, 0.022, 0.6, 8]} mat={chromeMat} pos={[-0.76, 0.0, -0.1]} rot={[0, 0, 0.25]} />

      {/* REAR FENDER */}
      <mesh material={bodyMat} position={[0.72, -0.08, 0]} rotation={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[0.3, 0.06, 0.22]} />
      </mesh>

      {/* TAIL LIGHT */}
      <mesh material={orangeMat} position={[0.83, -0.04, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.14]} />
      </mesh>

      {/* ENGINE block */}
      <mesh material={chromeMat} position={[-0.02, -0.04, 0]} castShadow>
        <boxGeometry args={[0.38, 0.28, 0.24]} />
      </mesh>

      {/* RADIATOR fins */}
      {[-0.08, -0.02, 0.04, 0.1].map((z, i) => (
        <mesh key={i} material={chromeMat} position={[-0.24, -0.04, z]}>
          <boxGeometry args={[0.06, 0.22, 0.01]} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Glowing floor ─── */
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.86, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={512}
        mixBlur={1}
        mixStrength={40}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050508"
        metalness={0.6}
        mirror={0}
      />
    </mesh>
  );
}

/* ─── Orange rim light ─── */
function Lights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} color="#ffffff" />
      <pointLight position={[-3, 2, 3]} intensity={2} color="#F97316" distance={8} decay={2} />
      <pointLight position={[3, 1, -3]} intensity={1.2} color="#3B82F6" distance={8} decay={2} />
      <pointLight position={[0, -0.5, 0]} intensity={0.8} color="#F97316" distance={4} decay={2} />
      <spotLight position={[0, 6, 0]} angle={0.4} penumbra={0.5} intensity={2} color="#ffffff" castShadow />
    </>
  );
}

/* ─── Particle dust ─── */
function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 180;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = Math.random() * 3 - 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color="#F97316" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

/* ─── Camera rig ─── */
function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.6, 2.8);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.12) * 0.4;
    camera.position.y = 0.6 + Math.sin(t * 0.18) * 0.08;
    camera.lookAt(0, 0.05, 0);
  });
  return null;
}

/* ─── Public export ─── */
export default function BikeScene({ className = "" }: { className?: string }) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 42, near: 0.1, far: 50 }}
      >
        <CameraRig />
        <Lights />
        <Float speed={1.6} rotationIntensity={0.08} floatIntensity={0.12}>
          <MotorcycleBody />
        </Float>
        <Floor />
        <ContactShadows
          position={[0, -0.86, 0]}
          opacity={0.65}
          scale={6}
          blur={2.5}
          far={2}
          color="#000000"
        />
        <Particles />
        <Environment preset="city" />
        <fog attach="fog" args={["#0D0F14", 6, 16]} />
      </Canvas>
    </div>
  );
}
