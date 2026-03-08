"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Line, Sky, Billboard, GradientTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  ShotInput,
  SimulatorConfig,
  DEFAULT_SIM_CONFIG,
  computeTrajectory,
  getScreenImpactIndex,
  configToMeters,
} from "./trajectory";

const YDS_TO_M = 0.9144;

// ─── Procedural grass texture ───────────────────────────────────────────────

function useGrassTexture(color1: string, color2: string, size = 512) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Base color
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, size, size);

    // Random grass blades / variation
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const blend = Math.random();
      const c = c1.clone().lerp(c2, blend);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 4);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(40, 60);
    return tex;
  }, [color1, color2, size]);
}

// ─── Tree (simple billboard cone + trunk) ───────────────────────────────────

function Tree({ position, height = 8 }: { position: [number, number, number]; height?: number }) {
  const trunkHeight = height * 0.3;
  const canopyHeight = height * 0.7;
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[0.15, 0.25, trunkHeight, 6]} />
        <meshStandardMaterial color="#5c3a1e" />
      </mesh>
      {/* Canopy - layered cones for fullness */}
      {[0, 0.35, 0.65].map((offset, i) => (
        <mesh key={i} position={[0, trunkHeight + canopyHeight * offset, 0]}>
          <coneGeometry args={[1.8 - i * 0.3, canopyHeight * 0.55, 7]} />
          <meshStandardMaterial
            color={i === 1 ? "#2d6b2d" : "#1f5c1f"}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Tree line along edges ──────────────────────────────────────────────────

function TreeLine() {
  const trees = useMemo(() => {
    const result: { pos: [number, number, number]; h: number }[] = [];
    // Left side
    for (let z = 20; z < 300; z += 6 + Math.random() * 8) {
      const x = -38 - Math.random() * 15;
      result.push({ pos: [x, 0, z * YDS_TO_M], h: 7 + Math.random() * 6 });
    }
    // Right side
    for (let z = 20; z < 300; z += 6 + Math.random() * 8) {
      const x = 38 + Math.random() * 15;
      result.push({ pos: [x, 0, z * YDS_TO_M], h: 7 + Math.random() * 6 });
    }
    // Back tree line
    for (let x = -50; x < 50; x += 4 + Math.random() * 5) {
      result.push({ pos: [x, 0, 310 * YDS_TO_M], h: 8 + Math.random() * 5 });
    }
    return result;
  }, []);

  return (
    <>
      {trees.map((t, i) => (
        <Tree key={i} position={t.pos} height={t.h} />
      ))}
    </>
  );
}

// ─── Target green with flag ─────────────────────────────────────────────────

function TargetGreen({ yardage }: { yardage: number }) {
  const z = yardage * YDS_TO_M;
  const radius = 4 + yardage * 0.02; // bigger greens further out

  return (
    <group position={[0, 0.01, z]}>
      {/* Green surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial color="#2a8a2a" />
      </mesh>
      {/* Darker ring around green */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <ringGeometry args={[radius, radius + 1, 32]} />
        <meshStandardMaterial color="#1a5c1a" />
      </mesh>
      {/* Flag pole */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 3, 6]} />
        <meshStandardMaterial color="#d4d4d4" />
      </mesh>
      {/* Flag */}
      <mesh position={[0.4, 2.7, 0]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshStandardMaterial
          color={yardage <= 100 ? "#ef4444" : yardage <= 200 ? "#eab308" : "#3b82f6"}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Yardage sign */}
      <Billboard position={[radius + 1.5, 1.2, 0]}>
        <Text fontSize={1.4} color="#ffffff" outlineColor="#000000" outlineWidth={0.08}>
          {yardage}
        </Text>
      </Billboard>
    </group>
  );
}

// ─── Divider lines between bays ─────────────────────────────────────────────

function BayDividers() {
  return (
    <>
      {[-3, 3].map((x) => (
        <Line
          key={x}
          points={[
            [x, 0.02, -2],
            [x, 0.02, 8],
          ]}
          color="#8b8b6b"
          lineWidth={1.5}
        />
      ))}
    </>
  );
}

// ─── Tee mat ────────────────────────────────────────────────────────────────

function TeeMat() {
  return (
    <group position={[0, 0.01, 0]}>
      {/* Mat surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshStandardMaterial color="#3d7a3d" roughness={0.9} />
      </mesh>
      {/* Mat border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.003, 0]}>
        <planeGeometry args={[1.7, 1.7]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* Tee marker */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.01, 0.02, 0.04, 8]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
    </group>
  );
}

// ─── Distance markers (yard signs with poles) ───────────────────────────────

function DistanceMarkers() {
  const markers = [50, 100, 150, 200, 250, 300];
  return (
    <>
      {markers.map((yds) => (
        <TargetGreen key={yds} yardage={yds} />
      ))}
    </>
  );
}

// ─── Landing zone target circles ────────────────────────────────────────────

function LandingZone({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={[position.x, 0.03, position.z]}>
      {/* Impact mark on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <ringGeometry args={[0.6, 1.2, 16]} />
        <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}

// ─── Animated ball along trajectory ─────────────────────────────────────────

function AnimatedBall({
  trajectory,
  startIndex,
  onComplete,
  speed = 1.5,
}: {
  trajectory: THREE.Vector3[];
  startIndex: number;
  onComplete?: () => void;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(startIndex);
  const completedRef = useRef(false);

  useFrame((_, delta) => {
    if (!meshRef.current || completedRef.current) return;

    progressRef.current += delta * trajectory.length * speed;
    const idx = Math.min(Math.floor(progressRef.current), trajectory.length - 1);

    const point = trajectory[idx];
    meshRef.current.position.copy(point);

    if (idx >= trajectory.length - 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  return (
    <mesh ref={meshRef} position={trajectory[startIndex]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} roughness={0.3} />
    </mesh>
  );
}

// ─── Shot trail (animated tracer line) ──────────────────────────────────────

function ShotTrail({
  trajectory,
  startIndex,
  color = "#ffffff",
}: {
  trajectory: THREE.Vector3[];
  startIndex: number;
  color?: string;
}) {
  const progressRef = useRef(startIndex);
  const [visiblePoints, setVisiblePoints] = useState<[number, number, number][]>([]);

  useFrame((_, delta) => {
    progressRef.current += delta * trajectory.length * 1.5;
    const idx = Math.min(Math.floor(progressRef.current), trajectory.length - 1);

    const pts = trajectory
      .slice(startIndex, idx + 1)
      .map((p) => [p.x, p.y, p.z] as [number, number, number]);

    if (pts.length >= 2) {
      setVisiblePoints(pts);
    }
  });

  if (visiblePoints.length < 2) return null;

  return (
    <Line
      points={visiblePoints}
      color={color}
      lineWidth={2}
      opacity={0.85}
      transparent
    />
  );
}

// ─── Previous shot trails (static) ─────────────────────────────────────────

function PreviousShotTrails({
  shots,
}: {
  shots: { trajectory: THREE.Vector3[]; startIndex: number }[];
}) {
  return (
    <>
      {shots.map((shot, idx) => {
        const pts = shot.trajectory
          .slice(shot.startIndex)
          .map((p) => [p.x, p.y, p.z] as [number, number, number]);
        if (pts.length < 2) return null;

        return (
          <group key={idx}>
            <Line
              points={pts}
              color="#a3a3a3"
              lineWidth={1}
              opacity={0.25}
              transparent
            />
            <LandingZone position={shot.trajectory[shot.trajectory.length - 1]} />
          </group>
        );
      })}
    </>
  );
}

// ─── Impact screen (semi-transparent, inside room) ──────────────────────────

function ImpactScreen({ config }: { config: SimulatorConfig }) {
  const m = configToMeters(config);

  return (
    <group position={[0, m.screenHeight / 2, m.screenDistance]}>
      <mesh>
        <planeGeometry args={[m.screenWidth, m.screenHeight]} />
        <meshBasicMaterial
          color="#e8e8e8"
          opacity={0.08}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Faint border */}
      <Line
        points={[
          [-m.screenWidth / 2, -m.screenHeight / 2, 0],
          [m.screenWidth / 2, -m.screenHeight / 2, 0],
          [m.screenWidth / 2, m.screenHeight / 2, 0],
          [-m.screenWidth / 2, m.screenHeight / 2, 0],
          [-m.screenWidth / 2, -m.screenHeight / 2, 0],
        ]}
        color="#888888"
        lineWidth={1}
        opacity={0.3}
        transparent
      />
    </group>
  );
}

// ─── Shot info HUD (billboard so it faces camera) ───────────────────────────

function ShotInfoHUD({
  shot,
  position,
}: {
  shot: ShotInput;
  position: [number, number, number];
}) {
  const carry = shot.carryDistance ?? 0;
  const offline = shot.offlineDistance ?? 0;
  const direction = offline < -2 ? "L" : offline > 2 ? "R" : "";

  return (
    <Billboard position={position}>
      <Text fontSize={2.2} color="#ffffff" outlineColor="#000000" outlineWidth={0.1} anchorY="bottom">
        {Math.round(carry)} YDS
      </Text>
      <Text
        fontSize={1}
        color="#d4d4d4"
        outlineColor="#000000"
        outlineWidth={0.06}
        anchorY="top"
        position={[0, -0.3, 0]}
      >
        {Math.round(shot.ballSpeed)} mph · {Math.round(shot.spinRate)} rpm
        {direction ? ` · ${Math.abs(Math.round(offline))}${direction}` : ""}
      </Text>
    </Billboard>
  );
}

// ─── Side netting / fencing ─────────────────────────────────────────────────

function SideNetting() {
  const netHeight = 12;
  const postSpacing = 15;
  const length = 300 * YDS_TO_M;

  return (
    <>
      {[-35, 35].map((x) => (
        <group key={x}>
          {/* Net mesh */}
          <mesh position={[x, netHeight / 2, length / 2]}>
            <planeGeometry args={[0.1, netHeight, 1, 1]} />
            <meshStandardMaterial color="#333333" opacity={0.15} transparent side={THREE.DoubleSide} />
          </mesh>
          {/* Poles */}
          {Array.from({ length: Math.floor(length / postSpacing) }, (_, i) => (
            <mesh key={i} position={[x, netHeight / 2, i * postSpacing]}>
              <cylinderGeometry args={[0.08, 0.08, netHeight, 6]} />
              <meshStandardMaterial color="#555555" />
            </mesh>
          ))}
          {/* Top cable */}
          <Line
            points={Array.from({ length: Math.floor(length / postSpacing) }, (_, i) => [
              x,
              netHeight,
              i * postSpacing,
            ] as [number, number, number])}
            color="#444444"
            lineWidth={1}
          />
        </group>
      ))}
    </>
  );
}

// ─── Main 3D scene content ──────────────────────────────────────────────────

function SceneContent({
  currentShot,
  previousShots,
  config,
  onAnimationComplete,
}: {
  currentShot: ShotInput | null;
  previousShots: { trajectory: THREE.Vector3[]; startIndex: number; shot: ShotInput }[];
  config: SimulatorConfig;
  onAnimationComplete?: () => void;
}) {
  const { trajectory, startIndex } = useMemo(() => {
    if (!currentShot) return { trajectory: [], startIndex: 0 };
    const traj = computeTrajectory(currentShot);
    const si = getScreenImpactIndex(traj, config.screenDistanceFt);
    return { trajectory: traj, startIndex: si };
  }, [currentShot, config.screenDistanceFt]);

  const landingPoint = trajectory.length > 0 ? trajectory[trajectory.length - 1] : null;

  const grassTex = useGrassTexture("#2d7a2d", "#1f6b1f");
  const roughTex = useGrassTexture("#3a6b2a", "#2a5520");
  const teeboxTex = useGrassTexture("#35913d", "#2d8235");

  return (
    <>
      {/* Sky */}
      <Sky
        distance={4500}
        sunPosition={[100, 40, -50]}
        inclination={0.52}
        azimuth={0.25}
        turbidity={8}
        rayleigh={1.5}
      />

      {/* Lighting — bright sunny day */}
      <ambientLight intensity={0.5} color="#f5f0e0" />
      <directionalLight
        position={[60, 80, 30]}
        intensity={1.2}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={400}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <hemisphereLight args={["#87ceeb", "#4a7c4a", 0.35]} />

      {/* Fog for depth */}
      <fog attach="fog" args={["#b5cfe0", 250, 420]} />

      {/* ── Ground layers ─────────────────────────────────── */}

      {/* Far rough / surroundings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 140]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial map={roughTex} color="#4a7a3a" />
      </mesh>

      {/* Main fairway strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 140]} receiveShadow>
        <planeGeometry args={[60, 320]} />
        <meshStandardMaterial map={grassTex} color="#3a9a3a" />
      </mesh>

      {/* Tee box area — slightly elevated, brighter green */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial map={teeboxTex} color="#45a845" />
      </mesh>

      {/* Tee mat */}
      <TeeMat />

      {/* Bay dividers */}
      <BayDividers />

      {/* Impact screen */}
      <ImpactScreen config={config} />

      {/* Target greens + distance markers */}
      <DistanceMarkers />

      {/* Tree line */}
      <TreeLine />

      {/* Side netting */}
      <SideNetting />

      {/* ── Shot rendering ─────────────────────────────────── */}

      {/* Previous shot trails */}
      <PreviousShotTrails shots={previousShots} />

      {/* Current shot animation */}
      {currentShot && trajectory.length > 0 && (
        <>
          <AnimatedBall
            trajectory={trajectory}
            startIndex={startIndex}
            onComplete={onAnimationComplete}
          />
          <ShotTrail
            trajectory={trajectory}
            startIndex={startIndex}
            color="#ffffff"
          />
        </>
      )}

      {/* Landing zone for current shot */}
      {landingPoint && <LandingZone position={landingPoint} />}

      {/* Shot info display */}
      {currentShot && landingPoint && (
        <ShotInfoHUD
          shot={currentShot}
          position={[landingPoint.x, landingPoint.y + 8, landingPoint.z]}
        />
      )}

      {/* First person camera */}
      <FirstPersonCamera targetZ={landingPoint?.z ?? 120} />
    </>
  );
}

// ─── First person camera ────────────────────────────────────────────────────

function FirstPersonCamera({ targetZ }: { targetZ: number }) {
  const eyeHeight = 1.65; // meters — standing behind the ball

  useFrame(({ camera }) => {
    camera.position.set(0, eyeHeight, -0.8);
    // Look slightly up to see the arc against the sky
    camera.lookAt(0, eyeHeight * 0.7, Math.min(targetZ, 160));
    camera.updateProjectionMatrix();
  });

  return null;
}

// ─── Main exported component ────────────────────────────────────────────────

export interface BallFlightSceneProps {
  currentShot: ShotInput | null;
  previousShots: ShotInput[];
  config?: SimulatorConfig;
  onAnimationComplete?: () => void;
}

export function BallFlightScene({
  currentShot,
  previousShots,
  config = DEFAULT_SIM_CONFIG,
  onAnimationComplete,
}: BallFlightSceneProps) {
  const prevShotData = useMemo(() => {
    return previousShots.map((shot) => {
      const trajectory = computeTrajectory(shot);
      const startIndex = getScreenImpactIndex(trajectory, config.screenDistanceFt);
      return { trajectory, startIndex, shot };
    });
  }, [previousShots, config.screenDistanceFt]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <Canvas
        shadows
        camera={{
          fov: 60,
          near: 0.1,
          far: 500,
          position: [0, 1.65, -0.8],
        }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <SceneContent
          currentShot={currentShot}
          previousShots={prevShotData}
          config={config}
          onAnimationComplete={onAnimationComplete}
        />
      </Canvas>
    </div>
  );
}
