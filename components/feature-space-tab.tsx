"use client";

import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIO = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const FEATURE_COLORS = {
  f1: "#f43f5e",
  f2: "#22d3ee",
  f3: "#a78bfa",
  f4: "#fbbf24",
  f5: "#4ade80",
  f6: "#60a5fa",
  f7: "#f472b6",
};

// Palette for distinguishing multiple data points (images)
export const POINT_PALETTE = [
  "#6366f1", // indigo
  "#f97316", // orange
  "#10b981", // emerald
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#8b5cf6", // violet
];

export interface FeatureSpaceValues {
  f1: number; // X  [-5, 5]
  f2: number; // Z  [-5, 5]
  f3: number; // Y  [-5, 5]
  f4: number; // hue   [0, 360]
  f5: number; // size  [0.1, 1.0]
  f6: number; // alpha [0.1, 1.0]
  f7: number; // shape [0, 3]
}

export const DEFAULT_VALUES: FeatureSpaceValues = {
  f1: 2.5,
  f2: 2,
  f3: 3,
  f4: 45,
  f5: 0.45,
  f6: 0.85,
  f7: 1.5,
};

interface FeatureSpaceTabProps {
  /** All images' 7D values — one entry per selected image */
  allImages?: Array<{
    label: string;
    src?: string;
    values: FeatureSpaceValues;
  }>;
}

// ─────────────────────────────────────────────────────────────
// Camera
// ─────────────────────────────────────────────────────────────

function camAt(p: number): [number, number, number] {
  if (p <= 0) return [10, 8, 10];
  if (p < 0.3) {
    const t = easeIO(p / 0.3);
    return [lerp(10, 1, t), lerp(8, 5, t), lerp(10, 18, t)];
  }
  if (p < 0.65) return [1, 5, 18];
  if (p < 1) {
    const t = easeIO((p - 0.65) / 0.35);
    return [lerp(1, 0.01, t), lerp(5, 22, t), lerp(18, 8, t)];
  }
  return [0.01, 22, 8];
}

function CameraRig({ progress }: { progress: number }) {
  const { camera } = useThree();
  const prevProgress = useRef(progress);
  const settling = useRef(0); // frames remaining to animate

  useEffect(() => {
    if (Math.abs(progress - prevProgress.current) > 0.01) {
      prevProgress.current = progress;
      settling.current = 60; // animate for ~1s then hand back to OrbitControls
    }
  }, [progress]);

  useFrame(() => {
    if (settling.current <= 0) return;
    settling.current -= 1;
    const [tx, ty, tz] = camAt(progress);
    const target = new THREE.Vector3(tx, ty, tz);
    camera.position.lerp(target, 0.07);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });
  return null;
}

// ─────────────────────────────────────────────────────────────
// Scene: axes, floor
// ─────────────────────────────────────────────────────────────

function Floor() {
  return <gridHelper args={[14, 28, "#cbd5e1", "#e2e8f0"]} />;
}

function CoordAxes({ progresses }: { progresses: number[] }) {
  const pZ = progresses[1],
    pY = progresses[2];
  const ysRef = useRef(1 - pY),
    zsRef = useRef(1 - pZ);
  const [ys, setYs] = useState(1),
    [zs, setZs] = useState(1);
  useFrame(() => {
    ysRef.current += (1 - pY - ysRef.current) * 0.09;
    zsRef.current += (1 - pZ - zsRef.current) * 0.09;
    setYs(ysRef.current);
    setZs(zsRef.current);
  });
  const LEN = 6,
    df = 12,
    FC = FEATURE_COLORS;
  return (
    <group>
      <Line
        points={[
          [-LEN, 0, 0],
          [LEN, 0, 0],
        ]}
        color={FC.f1}
        lineWidth={3}
        transparent
        opacity={0.9}
      />
      <Html
        position={[LEN + 1.0, 0, 0]}
        center
        distanceFactor={df}
        style={{ pointerEvents: "none" }}
      >
        <div style={{ textAlign: "center", lineHeight: 1.2 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: FC.f1,
              textShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }}
          >
            X
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: FC.f1,
              opacity: 0.8,
            }}
          >
            特征1
          </div>
        </div>
      </Html>
      {zs > 0.015 && (
        <>
          <Line
            points={[
              [0, 0, -LEN * zs],
              [0, 0, LEN * zs],
            ]}
            color={FC.f2}
            lineWidth={3}
            transparent
            opacity={0.9 * zs}
          />
          <Html
            position={[0, 0, LEN * zs + 1.0]}
            center
            distanceFactor={df}
            style={{ pointerEvents: "none" }}
          >
            <div style={{ textAlign: "center", lineHeight: 1.2, opacity: zs }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: FC.f2,
                  textShadow: "0 1px 4px rgba(0,0,0,0.15)",
                }}
              >
                Z
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: FC.f2,
                  opacity: 0.8,
                }}
              >
                特征2
              </div>
            </div>
          </Html>
        </>
      )}
      {ys > 0.015 && (
        <>
          <Line
            points={[
              [0, 0, 0],
              [0, LEN * ys, 0],
            ]}
            color={FC.f3}
            lineWidth={2.5}
            transparent
            opacity={ys * 1.0}
          />
          <Html
            position={[0, LEN * ys + 0.8, 0]}
            center
            distanceFactor={df}
            style={{ pointerEvents: "none" }}
          >
            <div
              style={{
                textAlign: "center",
                lineHeight: 1.2,
                opacity: ys * 1.4,
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: FC.f3,
                  textShadow: "0 1px 4px rgba(0,0,0,0.15)",
                }}
              >
                Y
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: FC.f3,
                  opacity: 0.8,
                }}
              >
                特征3
              </div>
            </div>
          </Html>
        </>
      )}
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-dimension spokes (f4–f7) — shown only for active point
// ─────────────────────────────────────────────────────────────

function SubCoordinates({ f4, f5, f6, f7, progresses, pointColor }: any) {
  const pColor = progresses[3],
    pSize = progresses[4];
  const pOpacity = progresses[5],
    pShape = progresses[6];
  const l4 = (f4 / 360) * 2 * (1 - pColor);
  const l5 = (f5 / 1.0) * 2 * (1 - pSize);
  const l6 = (f6 / 1.0) * 2 * (1 - pOpacity);
  const l7 = (f7 === 0 ? 0 : (f7 / 3) * 2) * (1 - pShape);
  const FC = FEATURE_COLORS;
  const dirs = [
    new THREE.Vector3(1, 1, 1).normalize(),
    new THREE.Vector3(-1, 1, -1).normalize(),
    new THREE.Vector3(-1, -1, 1).normalize(),
    new THREE.Vector3(1, -1, -1).normalize(),
  ];
  const axes = [
    { id: "f4", len: l4, dir: dirs[0], color: FC.f4, label: "特4(色)" },
    { id: "f5", len: l5, dir: dirs[1], color: FC.f5, label: "特5(大)" },
    { id: "f6", len: l6, dir: dirs[2], color: FC.f6, label: "特6(透)" },
    { id: "f7", len: l7, dir: dirs[3], color: FC.f7, label: "特7(形)" },
  ];
  return (
    <group>
      {axes.map(
        (ax) =>
          ax.len > 0.01 && (
            <group key={ax.id}>
              <Line
                points={[
                  [0, 0, 0],
                  [ax.dir.x * ax.len, ax.dir.y * ax.len, ax.dir.z * ax.len],
                ]}
                color={ax.color}
                lineWidth={2}
                transparent
                opacity={0.75}
              />
              <mesh
                position={[
                  ax.dir.x * ax.len,
                  ax.dir.y * ax.len,
                  ax.dir.z * ax.len,
                ]}
              >
                <sphereGeometry args={[0.055, 12, 12]} />
                <meshBasicMaterial color={ax.color} />
              </mesh>
              <Html
                position={[
                  ax.dir.x * ax.len * 1.25,
                  ax.dir.y * ax.len * 1.25,
                  ax.dir.z * ax.len * 1.25,
                ]}
                center
                style={{ pointerEvents: "none" }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: ax.color,
                    fontWeight: 900,
                    textShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}
                >
                  {ax.label}
                </div>
              </Html>
            </group>
          ),
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Single data point mesh
// ─────────────────────────────────────────────────────────────

const SHAPES_DEF = [
  (k: string) => <sphereGeometry key={k} args={[1, 32, 32]} />,
  (k: string) => <boxGeometry key={k} args={[1.4, 1.4, 1.4]} />,
  (k: string) => <octahedronGeometry key={k} args={[1.2]} />,
  (k: string) => <torusGeometry key={k} args={[0.7, 0.35, 16, 32]} />,
];

function DataPoint({
  f1,
  f2,
  f3,
  f4,
  f5,
  f6,
  f7,
  progresses,
  pointColor,
  isActive,
  label,
}: any) {
  const posGroupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const matRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  useFrame(() => {
    const pZ = progresses[1],
      pY = progresses[2];
    const pColor = progresses[3],
      pSize = progresses[4];
    const pOpacity = progresses[5],
      pShape = progresses[6];

    // All points: position driven by f1/f2/f3 + global collapse
    const curZ = f2 * (1 - pZ);
    const curY = f3 * (1 - pY);
    if (posGroupRef.current) posGroupRef.current.position.set(f1, curY, curZ);

    // All points encode their own f4 colour (tinted toward pointColor for non-active)
    const hslColor = new THREE.Color().setHSL(f4 / 360, 1.0, 0.5);
    const paletteColor = new THREE.Color(pointColor);
    // active: fully hsl-encoded; non-active: 60% palette, 40% hsl
    const blended = isActive
      ? hslColor.lerp(new THREE.Color("#888"), pColor)
      : hslColor.clone().lerp(paletteColor, 0.6);

    // All points encode f5 size (non-active scaled down by 0.7)
    const sizeScale = isActive ? 1.0 : 0.7;
    const curSize = lerp(f5, 0.22, pSize) * sizeScale;
    const sq = Math.max(0.05, 1 - pY * 0.95);
    const sx = curSize * (1 + (1 - sq) * 0.3);
    const sy = curSize * sq;
    const sz = curSize * (1 + (1 - sq) * 0.3);

    // All points encode f6 opacity (non-active capped at 0.75)
    const curOpacity = Math.min(lerp(f6, 1.0, pOpacity), isActive ? 1.0 : 0.75);

    // All points encode f7 shape (non-active also morph shape)
    const curF7 = f7 * (1 - pShape);
    const idx1 = Math.floor(curF7),
      idx2 = Math.min(3, Math.ceil(curF7)),
      t = curF7 - idx1;

    for (let i = 0; i < 4; i++) {
      if (!meshRefs.current[i] || !matRefs.current[i]) continue;
      let o = 0;
      if (i === idx1 && i === idx2) o = 1;
      else if (i === idx1) o = 1 - t;
      else if (i === idx2) o = t;
      const mat = matRefs.current[i];
      mat.color.copy(blended);
      mat.emissive.copy(blended).multiplyScalar(isActive ? 0.35 : 0.1);
      mat.opacity = curOpacity * o;
      mat.transparent = true;
      const mesh = meshRefs.current[i];
      mesh.visible = o > 0.001;
      if (mesh.visible) mesh.scale.set(sx, sy, sz);
    }
  });

  return (
    <group ref={posGroupRef}>
      <group>
        {SHAPES_DEF.map((geomFn, i) => (
          <mesh
            key={i}
            ref={(el) => {
              meshRefs.current[i] = el as THREE.Mesh;
            }}
          >
            {geomFn(`s${i}`)}
            <meshStandardMaterial
              ref={(el) => {
                matRefs.current[i] = el as THREE.MeshStandardMaterial;
              }}
              roughness={0.15}
              metalness={0.15}
            />
          </mesh>
        ))}
      </group>
      {/* Label — always shown above each point */}
      <Html
        center
        style={{ pointerEvents: "none" }}
        position={[0, lerp(f5, 0.22, 0) * (isActive ? 1 : 0.7) + 0.5, 0]}
      >
        <div
          style={{
            background: isActive ? pointColor : "rgba(255,255,255,0.88)",
            border: `1.5px solid ${pointColor}`,
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 700,
            color: isActive ? "#fff" : pointColor,
            whiteSpace: "nowrap",
            boxShadow: isActive
              ? `0 2px 8px ${pointColor}66`
              : "0 1px 4px rgba(0,0,0,0.1)",
            transition: "all 0.2s",
          }}
        >
          {label}
        </div>
      </Html>
      {/* Sub-axes only for active point */}
      {isActive && (
        <SubCoordinates
          f4={f4}
          f5={f5}
          f6={f6}
          f7={f7}
          progresses={progresses}
          pointColor={pointColor}
        />
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Ghost (projection trace) — only for active point
// ─────────────────────────────────────────────────────────────

function GhostPoint({
  f1,
  f2,
  f3,
  f4,
  f5,
  f6,
  f7,
  progresses,
  pointColor,
  isActive,
}: any) {
  const ghost1Ref = useRef<THREE.Mesh>(null);
  const ghost2Ref = useRef<THREE.Mesh>(null);
  const maxCollapse = Math.max(...progresses.slice(1));
  // Active point: full ghost; others: lighter wireframe only
  const ghostAlpha = isActive
    ? Math.min(0.3, maxCollapse * 0.35)
    : Math.min(0.15, maxCollapse * 0.18);
  useFrame(() => {
    if (ghost1Ref.current) {
      ghost1Ref.current.position.set(f1, f3, f2);
      ghost1Ref.current.scale.setScalar(f5 * (isActive ? 1 : 0.7));
    }
    if (ghost2Ref.current) {
      ghost2Ref.current.position.set(f1, f3, f2);
      ghost2Ref.current.scale.setScalar(f5 * (isActive ? 1 : 0.7));
    }
  });
  if (maxCollapse < 0.05) return null;
  const origColor = new THREE.Color().setHSL(f4 / 360, 1.0, 0.5);
  const idx1 = Math.floor(f7),
    idx2 = Math.min(3, Math.ceil(f7)),
    t = f7 - idx1;
  const shapesEl = [
    <sphereGeometry args={[1, 32, 32]} key="0" />,
    <boxGeometry args={[1.4, 1.4, 1.4]} key="1" />,
    <octahedronGeometry args={[1.2]} key="2" />,
    <torusGeometry args={[0.7, 0.35, 16, 32]} key="3" />,
  ];
  return (
    <group>
      {t < 1 && (
        <mesh ref={ghost1Ref}>
          {shapesEl[idx1]}
          <meshBasicMaterial
            color={origColor}
            transparent
            opacity={ghostAlpha * f6 * 2.2 * (1 - t)}
            wireframe
          />
        </mesh>
      )}
      {t > 0 && (
        <mesh ref={ghost2Ref}>
          {shapesEl[idx2]}
          <meshBasicMaterial
            color={origColor}
            transparent
            opacity={ghostAlpha * f6 * 2.2 * t}
            wireframe
          />
        </mesh>
      )}
      {/* Drop-line from original Y to collapsed Y — all points */}
      {progresses[2] > 0.1 && Math.abs(f3) > 0.1 && (
        <Line
          points={[
            [f1, f3, f2],
            [f1, f3 * (1 - progresses[2]) + 0.01, f2],
          ]}
          color={new THREE.Color(pointColor)}
          lineWidth={isActive ? 2 : 1}
          dashed
          dashSize={0.1}
          gapSize={0.07}
          transparent
          opacity={Math.min(isActive ? 0.75 : 0.35, progresses[2] * 2)}
        />
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Projection drop-lines for active point
// ─────────────────────────────────────────────────────────────

function ProjectionLines({
  f1,
  f2,
  f3,
  progresses,
  opacity = 1.0,
  color,
}: any) {
  const pZ = progresses[1],
    pY = progresses[2];
  const curZ = f2 * (1 - pZ),
    curY = f3 * (1 - pY);
  // Active point: use axis colours; non-active: use point palette colour
  const col3 = color ?? FEATURE_COLORS.f3;
  const col1 = color ?? FEATURE_COLORS.f1;
  const col2 = color ?? FEATURE_COLORS.f2;
  return (
    <>
      {Math.abs(curY) > 0.04 && (
        <Line
          points={[
            [f1, curY, curZ],
            [f1, 0, curZ],
          ]}
          color={col3}
          dashed
          dashSize={0.14}
          gapSize={0.07}
          transparent
          opacity={(1 - pY) * 0.85 * opacity}
        />
      )}
      <Line
        points={[
          [f1, 0, curZ],
          [0, 0, curZ],
        ]}
        color={col1}
        dashed
        dashSize={0.09}
        gapSize={0.06}
        transparent
        opacity={0.45 * (1 - pZ) * opacity}
      />
      <Line
        points={[
          [f1, 0, curZ],
          [f1, 0, 0],
        ]}
        color={col2}
        dashed
        dashSize={0.09}
        gapSize={0.06}
        transparent
        opacity={0.45 * (1 - pZ) * opacity}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Full scene
// ─────────────────────────────────────────────────────────────

function DChartScene({
  points,
  activeIdx,
  progresses,
}: {
  points: Array<{
    label: string;
    src?: string;
    values: FeatureSpaceValues;
    color: string;
  }>;
  activeIdx: number;
  progresses: number[];
}) {
  return (
    <>
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 14, 10]} intensity={1.8} />
      <pointLight position={[-8, 6, -8]} intensity={0.5} color="#a78bfa" />
      <CameraRig progress={progresses[2]} />
      <Floor />
      <CoordAxes progresses={progresses} />
      {/* Projection lines for ALL points */}
      {points.map((pt, i) => (
        <ProjectionLines
          key={`proj-${i}`}
          f1={pt.values.f1}
          f2={pt.values.f2}
          f3={pt.values.f3}
          progresses={progresses}
          opacity={i === activeIdx ? 1.0 : 0.35}
          color={pt.color}
        />
      ))}
      {/* Data points — render non-active first so active draws on top */}
      {[
        ...points
          .map((pt, i) => ({ pt, i }))
          .filter(({ i }) => i !== activeIdx),
        ...points
          .map((pt, i) => ({ pt, i }))
          .filter(({ i }) => i === activeIdx),
      ].map(({ pt, i }) => (
        <DataPoint
          key={`pt-${i}`}
          f1={pt.values.f1}
          f2={pt.values.f2}
          f3={pt.values.f3}
          f4={pt.values.f4}
          f5={pt.values.f5}
          f6={pt.values.f6}
          f7={pt.values.f7}
          progresses={progresses}
          pointColor={pt.color}
          isActive={i === activeIdx}
          label={pt.label}
        />
      ))}
      {/* Ghost for ALL points */}
      {points.map((pt, i) => (
        <GhostPoint
          key={`ghost-${i}`}
          f1={pt.values.f1}
          f2={pt.values.f2}
          f3={pt.values.f3}
          f4={pt.values.f4}
          f5={pt.values.f5}
          f6={pt.values.f6}
          f7={pt.values.f7}
          progresses={progresses}
          pointColor={pt.color}
          isActive={i === activeIdx}
        />
      ))}
      <OrbitControls enablePan enableZoom enableRotate makeDefault />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

export default function FeatureSpaceTab({
  allImages,
}: FeatureSpaceTabProps = {}) {
  // Build point list: use real images if provided, else a default demo point
  const points =
    allImages && allImages.length > 0
      ? allImages.map((img, i) => ({
          label: img.label,
          src: img.src,
          values: img.values,
          color: POINT_PALETTE[i % POINT_PALETTE.length],
        }))
      : [
          {
            label: "示例",
            src: undefined,
            values: DEFAULT_VALUES,
            color: POINT_PALETTE[0],
          },
        ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [activeDim, setActiveDim] = useState(7);
  const [progresses, setProgresses] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const animRef = useRef<number | null>(null);

  // Clamp activeIdx when images change
  const safeActive = Math.min(activeIdx, points.length - 1);

  useEffect(() => {
    const tick = () => {
      setProgresses((prev) => {
        let still = false;
        const next = prev.map((p, i) => {
          const target = activeDim >= i + 1 ? 0 : 1;
          const diff = target - p;
          if (Math.abs(diff) < 0.005) return target;
          still = true;
          return p + diff * 0.08;
        });
        if (still) animRef.current = requestAnimationFrame(tick);
        return next;
      });
    };
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current!);
  }, [activeDim]);

  const FC = FEATURE_COLORS;

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden w-full">
      {/* Top bar */}
      <div className="flex items-center gap-2 shrink-0 overflow-hidden">
        <div>
          <p className="text-xs font-semibold text-foreground">
            特征空间降维演示
          </p>
          <p className="text-[10px] text-muted-foreground">
            当前展示 7 个维度的特征数据，逐级剥离后观察高维坍缩过程
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-2 flex-1 min-h-0">
        {/* Left panel */}
        <div className="flex flex-col gap-2 w-52 overflow-y-auto overflow-x-hidden shrink-0">
          {/* Dim selector */}
          <div className="shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
              维度 (1D–7D)
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((dim) => (
                <button
                  key={dim}
                  onClick={() => setActiveDim(dim)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${
                    activeDim === dim
                      ? "bg-foreground text-background shadow-md scale-105"
                      : activeDim > dim
                        ? "bg-foreground/20 text-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {dim}
                </button>
              ))}
            </div>
          </div>

          {/* Image list */}
          <div className="shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
              数据点 ({points.length})
            </span>
            <div className="space-y-1.5">
              {points.map((pt, i) => {
                const v = pt.values;
                const isAct = i === safeActive;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`w-full text-left rounded-lg px-2.5 py-2 transition-all border ${
                      isAct
                        ? "border-current bg-background shadow-sm"
                        : "border-transparent hover:bg-muted"
                    }`}
                    style={{ color: isAct ? pt.color : undefined }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {pt.src ? (
                        <img
                          src={pt.src}
                          alt={pt.label}
                          className="w-8 h-8 rounded-md object-cover shrink-0"
                          style={{
                            outline: `2px solid ${pt.color}`,
                            outlineOffset: "1px",
                          }}
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center"
                          style={{
                            background: pt.color + "22",
                            border: `2px solid ${pt.color}`,
                          }}
                        >
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: pt.color }}
                          >
                            {pt.label}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: pt.color }}
                          />
                          <span className="text-xs font-semibold truncate text-foreground">
                            {pt.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-[9px] text-muted-foreground leading-relaxed pl-4">
                      <span style={{ color: FC.f1 }}>
                        X:{v.f1 >= 0 ? "+" : ""}
                        {v.f1.toFixed(1)}
                      </span>{" "}
                      <span
                        style={{
                          color: FC.f2,
                          opacity: activeDim >= 2 ? 1 : 0.3,
                        }}
                      >
                        Z:{v.f2 >= 0 ? "+" : ""}
                        {v.f2.toFixed(1)}
                      </span>{" "}
                      <span
                        style={{
                          color: FC.f3,
                          opacity: activeDim >= 3 ? 1 : 0.3,
                        }}
                      >
                        Y:{v.f3 >= 0 ? "+" : ""}
                        {v.f3.toFixed(1)}
                      </span>
                      <br />
                      <span
                        style={{
                          color: FC.f4,
                          opacity: activeDim >= 4 ? 1 : 0.3,
                        }}
                      >
                        {v.f4.toFixed(0)}°
                      </span>{" "}
                      <span
                        style={{
                          color: FC.f5,
                          opacity: activeDim >= 5 ? 1 : 0.3,
                        }}
                      >
                        sz:{v.f5.toFixed(2)}
                      </span>{" "}
                      <span
                        style={{
                          color: FC.f6,
                          opacity: activeDim >= 6 ? 1 : 0.3,
                        }}
                      >
                        a:{v.f6.toFixed(2)}
                      </span>{" "}
                      <span
                        style={{
                          color: FC.f7,
                          opacity: activeDim >= 7 ? 1 : 0.3,
                        }}
                      >
                        sh:{v.f7.toFixed(2)}
                      </span>
                    </div>
                    {/* Ghost info — only for active point when dimensions are collapsed */}
                    {isAct &&
                      activeDim < 7 &&
                      (() => {
                        const lost: string[] = [];
                        if (activeDim < 2) lost.push(`Z(${v.f2.toFixed(1)})`);
                        if (activeDim < 3) lost.push(`Y(${v.f3.toFixed(1)})`);
                        if (activeDim < 4)
                          lost.push(`色相(${v.f4.toFixed(0)}°)`);
                        if (activeDim < 5)
                          lost.push(`尺寸(${v.f5.toFixed(2)})`);
                        if (activeDim < 6)
                          lost.push(`透明(${v.f6.toFixed(2)})`);
                        if (activeDim < 7)
                          lost.push(`形状(${v.f7.toFixed(2)})`);
                        return lost.length > 0 ? (
                          <div
                            className="mt-1.5 mx-0 rounded-md px-2 py-1.5 text-[9px] leading-relaxed"
                            style={{
                              background: pt.color + "12",
                              border: `1px solid ${pt.color}44`,
                            }}
                          >
                            <div
                              className="font-bold mb-0.5"
                              style={{ color: pt.color }}
                            >
                              👻 高维原貌 (幽灵)
                            </div>
                            <div className="text-muted-foreground">
                              丢失: {lost.join(" · ")}
                            </div>
                          </div>
                        ) : null;
                      })()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 rounded-xl overflow-hidden border border-border relative bg-slate-100 dark:bg-slate-900 min-w-0">
          <Canvas
            camera={{ position: [10, 8, 10], fov: 48 }}
            gl={{ antialias: true }}
          >
            <color attach="background" args={["#f1f5f9"]} />
            <DChartScene
              points={points}
              activeIdx={safeActive}
              progresses={progresses}
            />
          </Canvas>
          {/* Status badge */}
          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md rounded-lg px-3 py-1.5 text-right shadow-md border border-border">
            <div className="font-mono text-[10px] text-muted-foreground mb-0.5">
              当前保留维度
            </div>
            <div className="font-mono text-2xl font-black text-foreground leading-none">
              {activeDim}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                维
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
