"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { Text, Line, Sky, Billboard, Clouds, Cloud, Sparkles, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA, ToneMapping, HueSaturation, BrightnessContrast } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
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

// ─── Procedural texture generators ──────────────────────────────────────────

function useProceduralGrass(
  baseHex: string,
  variantHex: string,
  darkHex: string,
  size = 1024,
  density = 20000,
) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const base = new THREE.Color(baseHex);
    const variant = new THREE.Color(variantHex);
    const dark = new THREE.Color(darkHex);

    // Soft gradient base
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.7);
    grad.addColorStop(0, `#${base.getHexString()}`);
    grad.addColorStop(1, `#${variant.getHexString()}`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Mowing stripe pattern (subtle lighter/darker bands)
    for (let y = 0; y < size; y += 32) {
      const stripe = (Math.floor(y / 32) % 2 === 0) ? 1.06 : 0.94;
      ctx.fillStyle = `rgba(${stripe > 1 ? 255 : 0}, ${stripe > 1 ? 255 : 0}, ${stripe > 1 ? 255 : 0}, 0.03)`;
      ctx.fillRect(0, y, size, 32);
    }

    // Individual grass blades
    for (let i = 0; i < density; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const blend = Math.random();
      const c = blend < 0.7
        ? base.clone().lerp(variant, Math.random())
        : base.clone().lerp(dark, Math.random() * 0.5);
      const brightness = 0.85 + Math.random() * 0.3;
      c.multiplyScalar(brightness);
      ctx.fillStyle = `#${c.getHexString()}`;
      // Thin vertical blade shapes
      const w = 0.5 + Math.random() * 1.5;
      const h = 2 + Math.random() * 6;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.3);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // Subtle noise overlay for depth
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const alpha = Math.random() * 0.06;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(x, y, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 16;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [baseHex, variantHex, darkHex, size, density]);
}

function useNormalMap(size = 512) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // Neutral normal (pointing up)
    ctx.fillStyle = "#8080ff";
    ctx.fillRect(0, 0, size, size);
    // Slight perturbations to simulate grass surface
    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 128 + (Math.random() - 0.5) * 30;
      const g = 128 + (Math.random() - 0.5) * 30;
      ctx.fillStyle = `rgb(${r},${g},255)`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 5);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(30, 50);
    return tex;
  }, [size]);
}

// ─── Deciduous tree (rounded canopy with multiple spheres) ──────────────────

function DeciduousTree({ position, height = 8, seed = 0 }: { position: [number, number, number]; height?: number; seed?: number }) {
  const trunkH = height * 0.35;
  const canopyR = height * 0.28;
  // Seeded pseudo-random for consistent trees
  const s = Math.sin(seed * 127.1) * 43758.5453;
  const r1 = (s - Math.floor(s));
  const s2 = Math.sin(seed * 269.5) * 43758.5453;
  const r2 = (s2 - Math.floor(s2));

  const leafColor = useMemo(() => {
    const colors = ["#2d6e2d", "#337a33", "#2b7a1f", "#3a8c2a", "#276e1f", "#358035"];
    return colors[Math.floor(r1 * colors.length)];
  }, [r1]);

  const leafColorDark = useMemo(() => {
    const c = new THREE.Color(leafColor);
    c.multiplyScalar(0.75);
    return `#${c.getHexString()}`;
  }, [leafColor]);

  return (
    <group position={position}>
      {/* Trunk — tapered cylinder with bark color */}
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.22 + r2 * 0.08, trunkH, 8]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.95} />
      </mesh>

      {/* Canopy — overlapping spheres for organic shape */}
      {[
        [0, trunkH + canopyR * 0.9, 0, canopyR * 1.1],
        [canopyR * 0.4 * (r1 - 0.5), trunkH + canopyR * 1.4, canopyR * 0.3 * (r2 - 0.5), canopyR * 0.85],
        [-canopyR * 0.3 * r2, trunkH + canopyR * 0.5, canopyR * 0.4 * r1, canopyR * 0.9],
        [canopyR * 0.25, trunkH + canopyR * 1.7, -canopyR * 0.2, canopyR * 0.7],
      ].map(([cx, cy, cz, cr], i) => (
        <mesh key={i} position={[cx, cy, cz]} castShadow>
          <sphereGeometry args={[cr, 12, 10]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? leafColor : leafColorDark}
            roughness={0.85}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Pine tree (conifer) ────────────────────────────────────────────────────

function PineTree({ position, height = 10, seed = 0 }: { position: [number, number, number]; height?: number; seed?: number }) {
  const trunkH = height * 0.25;
  const s = Math.sin(seed * 311.7) * 43758.5453;
  const r = s - Math.floor(s);

  return (
    <group position={position}>
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.18, trunkH, 6]} />
        <meshStandardMaterial color="#4a2e14" roughness={0.95} />
      </mesh>
      {/* Layered cones — more layers for realism */}
      {[0, 0.22, 0.42, 0.6, 0.76].map((offset, i) => {
        const layerRadius = (2.2 - i * 0.35) * (0.9 + r * 0.2);
        const layerH = height * 0.22;
        return (
          <mesh key={i} position={[0, trunkH + height * 0.7 * offset, 0]} castShadow>
            <coneGeometry args={[layerRadius, layerH, 8]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#1f5c1f" : "#1a4f1a"}
              roughness={0.9}
              flatShading
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Forest tree line ───────────────────────────────────────────────────────

function TreeLine() {
  const trees = useMemo(() => {
    const result: { pos: [number, number, number]; h: number; type: "d" | "p"; seed: number }[] = [];
    const rng = (i: number) => {
      const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };
    let idx = 0;

    // Left tree line — dense, multiple rows
    for (let row = 0; row < 3; row++) {
      for (let z = 10; z < 310; z += 4 + rng(idx) * 6) {
        const x = -36 - row * 6 - rng(idx + 1) * 5;
        const h = 7 + rng(idx + 2) * 7;
        const type = rng(idx + 3) > 0.4 ? "d" : "p";
        result.push({ pos: [x, 0, z * YDS_TO_M], h, type, seed: idx });
        idx++;
      }
    }

    // Right tree line
    for (let row = 0; row < 3; row++) {
      for (let z = 10; z < 310; z += 4 + rng(idx) * 6) {
        const x = 36 + row * 6 + rng(idx + 1) * 5;
        const h = 7 + rng(idx + 2) * 7;
        const type = rng(idx + 3) > 0.4 ? "d" : "p";
        result.push({ pos: [x, 0, z * YDS_TO_M], h, type, seed: idx });
        idx++;
      }
    }

    // Back wall of trees
    for (let row = 0; row < 3; row++) {
      for (let x = -55; x < 55; x += 3 + rng(idx) * 4) {
        const z = 305 + row * 5 + rng(idx + 1) * 3;
        const h = 9 + rng(idx + 2) * 5;
        result.push({ pos: [x, 0, z * YDS_TO_M], h, type: rng(idx + 3) > 0.5 ? "d" : "p", seed: idx });
        idx++;
      }
    }

    return result;
  }, []);

  return (
    <>
      {trees.map((t, i) =>
        t.type === "d" ? (
          <DeciduousTree key={i} position={t.pos} height={t.h} seed={t.seed} />
        ) : (
          <PineTree key={i} position={t.pos} height={t.h} seed={t.seed} />
        )
      )}
    </>
  );
}

// ─── Target green with flag ─────────────────────────────────────────────────

function TargetGreen({ yardage }: { yardage: number }) {
  const z = yardage * YDS_TO_M;
  const radius = 4 + yardage * 0.02;

  return (
    <group position={[0, 0.015, z]}>
      {/* Green — brighter, shorter cut */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color="#2eb82e" roughness={0.6} />
      </mesh>
      {/* Apron / collar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.003, 0]}>
        <ringGeometry args={[radius, radius + 1.5, 48]} />
        <meshStandardMaterial color="#238a23" roughness={0.7} />
      </mesh>
      {/* Fringe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <ringGeometry args={[radius + 1.5, radius + 2.5, 48]} />
        <meshStandardMaterial color="#2a7a2a" roughness={0.8} />
      </mesh>

      {/* Flag pole — metallic */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 3, 8]} />
        <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Flag */}
      <mesh position={[0.35, 2.75, 0]} castShadow>
        <planeGeometry args={[0.7, 0.45]} />
        <meshStandardMaterial
          color={yardage <= 100 ? "#dc2626" : yardage <= 200 ? "#ca8a04" : "#2563eb"}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Yardage sign post */}
      <group position={[radius + 2, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1, 6]} />
          <meshStandardMaterial color="#8B7355" roughness={0.9} />
        </mesh>
        <Billboard position={[0, 1.2, 0]}>
          {/* Sign board background */}
          <mesh>
            <planeGeometry args={[2, 1]} />
            <meshStandardMaterial color="#2d1b0e" roughness={0.9} />
          </mesh>
          <Text fontSize={0.65} color="#f5e6c8" anchorY="middle" position={[0, 0, 0.01]}>
            {yardage} YDS
          </Text>
        </Billboard>
      </group>
    </group>
  );
}

// ─── Sand bunkers near greens ───────────────────────────────────────────────

function Bunker({ position, radiusX = 3, radiusZ = 2 }: { position: [number, number, number]; radiusX?: number; radiusZ?: number }) {
  const sandGeo = useMemo(() => {
    const geo = new THREE.CircleGeometry(1, 32);
    geo.scale(radiusX, radiusZ, 1);
    return geo;
  }, [radiusX, radiusZ]);

  return (
    <group position={position}>
      {/* Sand */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} geometry={sandGeo}>
        <meshStandardMaterial color="#e8d5a3" roughness={0.95} />
      </mesh>
      {/* Lip shadow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <ringGeometry args={[Math.min(radiusX, radiusZ) * 0.85, Math.min(radiusX, radiusZ), 32]} />
        <meshStandardMaterial color="#c4a56e" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ─── Water pond ─────────────────────────────────────────────────────────────

function Pond({ position, radius = 8 }: { position: [number, number, number]; radius?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.envMapIntensity = 0.8 + Math.sin(clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial
          color="#1a5566"
          roughness={0.05}
          metalness={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Bank/edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <ringGeometry args={[radius, radius + 1.2, 48]} />
        <meshStandardMaterial color="#5c4a2e" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── Tee mat with realistic detail ──────────────────────────────────────────

function TeeMat() {
  return (
    <group position={[0, 0.012, 0]}>
      {/* Rubber base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <planeGeometry args={[1.8, 1.8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
      </mesh>
      {/* Turf surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.5, 1.5]} />
        <meshStandardMaterial color="#368836" roughness={0.85} />
      </mesh>
      {/* Tee */}
      <mesh position={[0, 0.02, -0.05]} castShadow>
        <cylinderGeometry args={[0.008, 0.015, 0.05, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.6} />
      </mesh>
      {/* Ball on tee */}
      <mesh position={[0, 0.055, -0.05]} castShadow>
        <sphereGeometry args={[0.021, 16, 16]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─── Bay dividers — rubber mats and partitions ──────────────────────────────

function BayDividers() {
  return (
    <>
      {[-3.2, 3.2].map((x) => (
        <group key={x}>
          {/* Partition post */}
          <mesh position={[x, 0.5, 0]} castShadow>
            <boxGeometry args={[0.08, 1, 0.08]} />
            <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Ground line */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, 2]}>
            <planeGeometry args={[0.05, 6]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── Side netting — realistic net mesh ──────────────────────────────────────

function SideNetting() {
  const netHeight = 15;
  const length = 300 * YDS_TO_M;

  const netGeometry = useMemo(() => {
    // Create a grid of lines to simulate netting
    const positions: number[] = [];
    const spacing = 2;
    // Verticals
    for (let z = 0; z < length; z += spacing) {
      positions.push(0, 0, z, 0, netHeight, z);
    }
    // Horizontals
    for (let y = 0; y < netHeight; y += spacing) {
      positions.push(0, y, 0, 0, y, length);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [length, netHeight]);

  return (
    <>
      {[-37, 37].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {/* Net lines */}
          <lineSegments geometry={netGeometry}>
            <lineBasicMaterial color="#222222" opacity={0.12} transparent />
          </lineSegments>
          {/* Steel poles */}
          {Array.from({ length: Math.floor(length / 20) + 1 }, (_, i) => (
            <mesh key={i} position={[0, netHeight / 2, i * 20]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, netHeight, 8]} />
              <meshStandardMaterial color="#777777" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {/* Top cable */}
          <Line
            points={Array.from({ length: Math.floor(length / 20) + 1 }, (_, i) => [
              0, netHeight, i * 20,
            ] as [number, number, number])}
            color="#555555"
            lineWidth={1.5}
          />
        </group>
      ))}
    </>
  );
}

// ─── Impact screen ──────────────────────────────────────────────────────────

function ImpactScreen({ config }: { config: SimulatorConfig }) {
  const m = configToMeters(config);
  return (
    <group position={[0, m.screenHeight / 2, m.screenDistance]}>
      <mesh>
        <planeGeometry args={[m.screenWidth, m.screenHeight]} />
        <meshBasicMaterial color="#ffffff" opacity={0.06} transparent side={THREE.DoubleSide} />
      </mesh>
      <Line
        points={[
          [-m.screenWidth / 2, -m.screenHeight / 2, 0],
          [m.screenWidth / 2, -m.screenHeight / 2, 0],
          [m.screenWidth / 2, m.screenHeight / 2, 0],
          [-m.screenWidth / 2, m.screenHeight / 2, 0],
          [-m.screenWidth / 2, -m.screenHeight / 2, 0],
        ]}
        color="#aaaaaa"
        lineWidth={0.5}
        opacity={0.2}
        transparent
      />
    </group>
  );
}

// ─── Landing zone (impact mark) ─────────────────────────────────────────────

function LandingZone({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={[position.x, 0.025, position.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.003, 0]}>
        <ringGeometry args={[0.4, 0.8, 16]} />
        <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}

// ─── Animated ball with shadow ──────────────────────────────────────────────

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
  const groupRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(startIndex);
  const completedRef = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current || completedRef.current) return;

    progressRef.current += delta * trajectory.length * speed;
    const idx = Math.min(Math.floor(progressRef.current), trajectory.length - 1);
    const point = trajectory[idx];

    groupRef.current.position.copy(point);

    // Ground shadow follows ball
    if (shadowRef.current) {
      shadowRef.current.position.set(point.x, 0.01, point.z);
      const shadowScale = Math.max(0.1, 1 - point.y * 0.01);
      shadowRef.current.scale.set(shadowScale, shadowScale, 1);
    }

    if (idx >= trajectory.length - 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  return (
    <>
      <group ref={groupRef} position={trajectory[startIndex]}>
        {/* Ball — bright with glow for bloom to pick up */}
        <mesh>
          <sphereGeometry args={[0.15, 20, 20]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.5}
            roughness={0.2}
          />
        </mesh>
        {/* Subtle point light on ball for glow effect */}
        <pointLight color="#ffffff" intensity={2} distance={5} decay={2} />
      </group>
      {/* Ground shadow */}
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.3, 12]} />
        <meshBasicMaterial color="#000000" opacity={0.25} transparent />
      </mesh>
    </>
  );
}

// ─── Shot trail (animated) ──────────────────────────────────────────────────

function ShotTrail({
  trajectory,
  startIndex,
}: {
  trajectory: THREE.Vector3[];
  startIndex: number;
}) {
  const progressRef = useRef(startIndex);
  const [visiblePoints, setVisiblePoints] = useState<[number, number, number][]>([]);

  useFrame((_, delta) => {
    progressRef.current += delta * trajectory.length * 1.5;
    const idx = Math.min(Math.floor(progressRef.current), trajectory.length - 1);
    const pts = trajectory
      .slice(startIndex, idx + 1)
      .map((p) => [p.x, p.y, p.z] as [number, number, number]);
    if (pts.length >= 2) setVisiblePoints(pts);
  });

  if (visiblePoints.length < 2) return null;

  return (
    <Line
      points={visiblePoints}
      color="#ffffff"
      lineWidth={2}
      opacity={0.9}
      transparent
    />
  );
}

// ─── Previous shot trails ───────────────────────────────────────────────────

function PreviousShotTrails({ shots }: { shots: { trajectory: THREE.Vector3[]; startIndex: number }[] }) {
  return (
    <>
      {shots.map((shot, idx) => {
        const pts = shot.trajectory
          .slice(shot.startIndex)
          .map((p) => [p.x, p.y, p.z] as [number, number, number]);
        if (pts.length < 2) return null;
        return (
          <group key={idx}>
            <Line points={pts} color="#cccccc" lineWidth={0.8} opacity={0.2} transparent />
            <LandingZone position={shot.trajectory[shot.trajectory.length - 1]} />
          </group>
        );
      })}
    </>
  );
}

// ─── Shot info HUD ──────────────────────────────────────────────────────────

function ShotInfoHUD({ shot, position }: { shot: ShotInput; position: [number, number, number] }) {
  const carry = shot.carryDistance ?? 0;
  const offline = shot.offlineDistance ?? 0;
  const direction = offline < -2 ? "L" : offline > 2 ? "R" : "";

  return (
    <Billboard position={position}>
      <Text fontSize={2.4} color="#ffffff" outlineColor="#000000" outlineWidth={0.12} anchorY="bottom" font={undefined}>
        {Math.round(carry)} YDS
      </Text>
      <Text fontSize={1} color="#e0e0e0" outlineColor="#000000" outlineWidth={0.06} anchorY="top" position={[0, -0.4, 0]} font={undefined}>
        {Math.round(shot.ballSpeed)} mph · {Math.round(shot.spinRate)} rpm
        {direction ? ` · ${Math.abs(Math.round(offline))}${direction}` : ""}
      </Text>
    </Billboard>
  );
}

// ─── Post-processing pipeline ───────────────────────────────────────────────

function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <BrightnessContrast brightness={0.02} contrast={0.08} />
      <HueSaturation saturation={0.1} />
      <Vignette eskil={false} offset={0.2} darkness={0.4} />
    </EffectComposer>
  );
}

// ─── Clouds ─────────────────────────────────────────────────────────────────

function SceneClouds() {
  return (
    <Clouds material={THREE.MeshBasicMaterial}>
      <Cloud
        seed={1}
        segments={20}
        bounds={[80, 6, 20]}
        volume={15}
        opacity={0.35}
        speed={0.15}
        fade={50}
        position={[0, 65, 120]}
        color="#ffffff"
      />
      <Cloud
        seed={7}
        segments={15}
        bounds={[60, 5, 15]}
        volume={12}
        opacity={0.25}
        speed={0.1}
        fade={40}
        position={[-40, 70, 180]}
        color="#f0f0f0"
      />
      <Cloud
        seed={13}
        segments={12}
        bounds={[50, 4, 10]}
        volume={10}
        opacity={0.2}
        speed={0.12}
        fade={35}
        position={[50, 68, 90]}
        color="#e8e8e8"
      />
    </Clouds>
  );
}

// ─── Main scene content ─────────────────────────────────────────────────────

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

  // High-quality grass textures
  const fairwayTex = useProceduralGrass("#2e8a2e", "#238a23", "#1a6b1a", 1024, 25000);
  const fairwayNormal = useNormalMap();
  const roughTex = useProceduralGrass("#3a7a2a", "#2a5f20", "#1f4a18", 1024, 15000);
  const teeboxTex = useProceduralGrass("#38a838", "#2d9a2d", "#258825", 1024, 30000);

  // Texture repeat settings
  useMemo(() => {
    fairwayTex.repeat.set(20, 40);
    roughTex.repeat.set(30, 50);
    teeboxTex.repeat.set(4, 4);
  }, [fairwayTex, roughTex, teeboxTex]);

  return (
    <>
      {/* ── Sky & atmosphere ────────────────────────── */}
      <Sky
        distance={45000}
        sunPosition={[80, 35, -60]}
        inclination={0.49}
        azimuth={0.25}
        turbidity={6}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <SceneClouds />
      <fog attach="fog" args={["#c4dbed", 220, 380]} />

      {/* ── Lighting — golden hour feel ────────────── */}
      <ambientLight intensity={0.45} color="#f0e8d8" />
      <directionalLight
        position={[80, 60, -40]}
        intensity={1.8}
        color="#fff3e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={350}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
      {/* Fill light from opposite side */}
      <directionalLight
        position={[-40, 30, 20]}
        intensity={0.3}
        color="#a0c0e0"
      />
      <hemisphereLight args={["#87CEEB", "#4a8c4a", 0.3]} />

      {/* ── Ground ────────────────────────────────── */}

      {/* Distant terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 140]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial map={roughTex} color="#4a7a3a" roughness={0.95} />
      </mesh>

      {/* Fairway — with normal map for surface detail */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 140]} receiveShadow>
        <planeGeometry args={[65, 320]} />
        <meshStandardMaterial
          map={fairwayTex}
          normalMap={fairwayNormal}
          normalScale={new THREE.Vector2(0.3, 0.3)}
          color="#3a9a3a"
          roughness={0.75}
        />
      </mesh>

      {/* Tee box platform — slightly elevated */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial map={teeboxTex} color="#42a842" roughness={0.6} />
      </mesh>

      {/* ── Range elements ─────────────────────────── */}
      <TeeMat />
      <BayDividers />
      <ImpactScreen config={config} />
      <DistanceMarkers />
      <TreeLine />
      <SideNetting />

      {/* Bunkers near some greens */}
      <Bunker position={[6, 0, 135 * YDS_TO_M]} radiusX={3.5} radiusZ={2.5} />
      <Bunker position={[-5, 0, 185 * YDS_TO_M]} radiusX={4} radiusZ={2.5} />
      <Bunker position={[7, 0, 240 * YDS_TO_M]} radiusX={3} radiusZ={2} />

      {/* Pond */}
      <Pond position={[18, 0, 160 * YDS_TO_M]} radius={9} />

      {/* ── Shots ──────────────────────────────────── */}
      <PreviousShotTrails shots={previousShots} />

      {currentShot && trajectory.length > 0 && (
        <>
          <AnimatedBall
            trajectory={trajectory}
            startIndex={startIndex}
            onComplete={onAnimationComplete}
          />
          <ShotTrail trajectory={trajectory} startIndex={startIndex} />
        </>
      )}

      {landingPoint && <LandingZone position={landingPoint} />}

      {currentShot && landingPoint && (
        <ShotInfoHUD
          shot={currentShot}
          position={[landingPoint.x, landingPoint.y + 8, landingPoint.z]}
        />
      )}

      <FirstPersonCamera targetZ={landingPoint?.z ?? 120} />

      {/* Post-processing */}
      <PostProcessing />
    </>
  );
}

// ─── First person camera ────────────────────────────────────────────────────

function FirstPersonCamera({ targetZ }: { targetZ: number }) {
  const eyeHeight = 1.65;

  useFrame(({ camera }) => {
    camera.position.set(0, eyeHeight, -0.8);
    camera.lookAt(0, eyeHeight * 0.65, Math.min(targetZ, 160));
    camera.updateProjectionMatrix();
  });

  return null;
}

// ─── Distance markers ───────────────────────────────────────────────────────

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
        shadows="soft"
        camera={{
          fov: 62,
          near: 0.1,
          far: 500,
          position: [0, 1.65, -0.8],
        }}
        gl={{
          antialias: false, // SMAA handles this
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
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
