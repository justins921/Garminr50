"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Line, Plane } from "@react-three/drei";
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

// ─── Distance markers on the fairway ────────────────────────────────────────

function DistanceMarkers() {
  const markers = [50, 100, 150, 200, 250, 300];
  return (
    <>
      {markers.map((yds) => {
        const z = yds * YDS_TO_M;
        return (
          <group key={yds} position={[0, 0.01, z]}>
            {/* Line across the fairway */}
            <Line
              points={[[-20, 0, 0], [20, 0, 0]]}
              color="#334155"
              lineWidth={1}
            />
            {/* Distance label */}
            <Text
              position={[22, 0.5, 0]}
              fontSize={1.5}
              color="#64748b"
              anchorX="left"
              anchorY="middle"
              rotation={[-Math.PI / 2, 0, 0]}
            >
              {yds}
            </Text>
          </group>
        );
      })}
    </>
  );
}

// ─── Landing zone target circles ────────────────────────────────────────────

function LandingZone({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={[position.x, 0.02, position.z]}>
      {[3, 6, 9].map((radius) => (
        <Line
          key={radius}
          points={Array.from({ length: 65 }, (_, i) => {
            const angle = (i / 64) * Math.PI * 2;
            return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number];
          })}
          color="#f59e0b"
          lineWidth={1}
          opacity={0.3}
          transparent
        />
      ))}
      {/* Center dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#f59e0b" opacity={0.6} transparent />
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

    // Advance through trajectory points
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
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
    </mesh>
  );
}

// ─── Shot trail (tracer line) ───────────────────────────────────────────────

function ShotTrail({
  trajectory,
  startIndex,
  color = "#22d3ee",
  opacity = 0.8,
}: {
  trajectory: THREE.Vector3[];
  startIndex: number;
  color?: string;
  opacity?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
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
      lineWidth={2.5}
      opacity={opacity}
      transparent
    />
  );
}

// ─── Previous shot trails (static) ─────────────────────────────────────────

function PreviousShotTrails({
  shots,
  config,
}: {
  shots: { trajectory: THREE.Vector3[]; startIndex: number }[];
  config: SimulatorConfig;
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
              color="#475569"
              lineWidth={1}
              opacity={0.3}
              transparent
            />
            {/* Landing dot */}
            <mesh position={[shot.trajectory[shot.trajectory.length - 1].x, 0.05, shot.trajectory[shot.trajectory.length - 1].z]}>
              <sphereGeometry args={[0.4, 8, 8]} />
              <meshBasicMaterial color="#64748b" opacity={0.5} transparent />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

// ─── Impact screen visualization ────────────────────────────────────────────

function ImpactScreen({ config }: { config: SimulatorConfig }) {
  const m = configToMeters(config);

  return (
    <group position={[0, m.screenHeight / 2, m.screenDistance]}>
      <Plane args={[m.screenWidth, m.screenHeight]}>
        <meshBasicMaterial
          color="#1e293b"
          opacity={0.15}
          transparent
          side={THREE.DoubleSide}
        />
      </Plane>
      {/* Screen border */}
      <Line
        points={[
          [-m.screenWidth / 2, -m.screenHeight / 2, 0],
          [m.screenWidth / 2, -m.screenHeight / 2, 0],
          [m.screenWidth / 2, m.screenHeight / 2, 0],
          [-m.screenWidth / 2, m.screenHeight / 2, 0],
          [-m.screenWidth / 2, -m.screenHeight / 2, 0],
        ]}
        color="#334155"
        lineWidth={2}
      />
    </group>
  );
}

// ─── Shot info HUD ──────────────────────────────────────────────────────────

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
    <group position={position}>
      <Text fontSize={2.5} color="#22d3ee" anchorX="center" anchorY="bottom">
        {Math.round(carry)} YDS
      </Text>
      <Text fontSize={1.2} color="#94a3b8" anchorX="center" anchorY="top" position={[0, -0.5, 0]}>
        {Math.round(shot.ballSpeed)} mph · {Math.round(shot.spinRate)} rpm
        {direction ? ` · ${Math.abs(Math.round(offline))}${direction}` : ""}
      </Text>
    </group>
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

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 100, 50]} intensity={0.6} />
      <hemisphereLight args={["#1e3a5f", "#0f172a", 0.3]} />

      {/* Sky */}
      <color attach="background" args={["#0c1222"]} />
      <fog attach="fog" args={["#0c1222", 200, 400]} />

      {/* Ground / Fairway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 140]}>
        <planeGeometry args={[200, 320]} />
        <meshStandardMaterial color="#1a3a1a" />
      </mesh>

      {/* Tee box area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -1]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#2d5a2d" />
      </mesh>

      {/* Impact screen */}
      <ImpactScreen config={config} />

      {/* Distance markers */}
      <DistanceMarkers />

      {/* Previous shot trails */}
      <PreviousShotTrails shots={previousShots} config={config} />

      {/* Previous landing dots */}
      {previousShots.map((ps, idx) => {
        const landing = ps.trajectory[ps.trajectory.length - 1];
        return <LandingZone key={idx} position={landing} />;
      })}

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
            color="#22d3ee"
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

      {/* Camera positioned at tee looking down the fairway */}
      <FirstPersonCamera config={config} targetZ={landingPoint?.z ?? 120} />
    </>
  );
}

// ─── First person camera ────────────────────────────────────────────────────

function FirstPersonCamera({
  config,
  targetZ,
}: {
  config: SimulatorConfig;
  targetZ: number;
}) {
  const cameraHeight = 1.6; // eye height in meters (~5'3")

  useFrame(({ camera }) => {
    // Position camera at the tee, slightly behind
    camera.position.set(0, cameraHeight, -1);
    // Look down the fairway, slightly above center to see the arc
    camera.lookAt(0, cameraHeight * 0.8, Math.min(targetZ, 150));
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
    <div className="w-full h-full bg-[#0c1222] rounded-lg overflow-hidden">
      <Canvas
        camera={{
          fov: 60,
          near: 0.1,
          far: 500,
          position: [0, 1.6, -1],
        }}
        gl={{ antialias: true }}
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
