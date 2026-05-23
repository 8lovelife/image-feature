"use client";

import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const easeIO = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const FEATURE_COLORS = {
  f1: "#f43f5e",
  f2: "#22d3ee",
  f3: "#a78bfa",
  f4: "#fbbf24",
  f5: "#4ade80",
  f6: "#60a5fa",
  f7: "#f472b6",
};

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

function CameraRig({
  progress,
  isAnimating,
}: {
  progress: number;
  isAnimating: boolean;
}) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(...camAt(progress)));
  useFrame(() => {
    const [tx, ty, tz] = camAt(progress);
    targetRef.current.set(tx, ty, tz);
    camera.position.lerp(targetRef.current, isAnimating ? 0.065 : 0.08);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });
  return null;
}

// ─────────────────────────────────────────────────────────────
// Scene elements
// ─────────────────────────────────────────────────────────────

function Floor() {
  return <gridHelper args={[12, 24, "#cbd5e1", "#e2e8f0"]} />;
}

function CoordAxes({ progresses }: { progresses: number[] }) {
  const pZ = progresses[1];
  const pY = progresses[2];
  const ysRef = useRef(1 - pY);
  const zsRef = useRef(1 - pZ);
  const [ys, setYs] = useState(1);
  const [zs, setZs] = useState(1);
  useFrame(() => {
    ysRef.current += (1 - pY - ysRef.current) * 0.09;
    zsRef.current += (1 - pZ - zsRef.current) * 0.09;
    setYs(ysRef.current);
    setZs(zsRef.current);
  });
  const LEN = 6;
  const df = 12;
  return (
    <group>
      <Line
        points={[
          [-LEN, 0, 0],
          [LEN, 0, 0],
        ]}
        color={FEATURE_COLORS.f1}
        lineWidth={3}
        transparent
        opacity={0.95}
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
              fontSize: 28,
              fontWeight: 900,
              color: FEATURE_COLORS.f1,
              textShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          >
            X
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: FEATURE_COLORS.f1,
              opacity: 0.85,
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
            color={FEATURE_COLORS.f2}
            lineWidth={3}
            transparent
            opacity={0.95 * zs}
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
                  fontSize: 28,
                  fontWeight: 900,
                  color: FEATURE_COLORS.f2,
                  textShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
              >
                Z
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: FEATURE_COLORS.f2,
                  opacity: 0.85,
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
            color={FEATURE_COLORS.f3}
            lineWidth={2.5}
            transparent
            opacity={ys * 1.1}
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
                opacity: ys * 1.5,
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: FEATURE_COLORS.f3,
                  textShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
              >
                Y
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: FEATURE_COLORS.f3,
                  opacity: 0.85,
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
        <meshBasicMaterial color="#fff" />
      </mesh>
    </group>
  );
}

function SubCoordinates({ f4, f5, f6, f7, progresses }: any) {
  const pColor = progresses[3];
  const pSize = progresses[4];
  const pOpacity = progresses[5];
  const pShape = progresses[6];
  const l4 = (f4 / 360) * 2 * (1 - pColor);
  const l5 = (f5 / 1.0) * 2 * (1 - pSize);
  const l6 = (f6 / 1.0) * 2 * (1 - pOpacity);
  const l7 = (f7 === 0 ? 0 : (f7 / 3) * 2) * (1 - pShape);
  const d4 = new THREE.Vector3(1, 1, 1).normalize();
  const d5 = new THREE.Vector3(-1, 1, -1).normalize();
  const d6 = new THREE.Vector3(-1, -1, 1).normalize();
  const d7 = new THREE.Vector3(1, -1, -1).normalize();
  const axes = [
    { id: "f4", len: l4, dir: d4, color: FEATURE_COLORS.f4, label: "特4(色)" },
    { id: "f5", len: l5, dir: d5, color: FEATURE_COLORS.f5, label: "特5(大)" },
    { id: "f6", len: l6, dir: d6, color: FEATURE_COLORS.f6, label: "特6(透)" },
    { id: "f7", len: l7, dir: d7, color: FEATURE_COLORS.f7, label: "特7(形)" },
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
                lineWidth={2.5}
                transparent
                opacity={0.8}
              />
              <mesh
                position={[
                  ax.dir.x * ax.len,
                  ax.dir.y * ax.len,
                  ax.dir.z * ax.len,
                ]}
              >
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshBasicMaterial color={ax.color} />
              </mesh>
              <Html
                position={[
                  ax.dir.x * ax.len * 1.2,
                  ax.dir.y * ax.len * 1.2,
                  ax.dir.z * ax.len * 1.2,
                ]}
                center
                style={{ pointerEvents: "none" }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: ax.color,
                    fontWeight: 900,
                    textShadow: "0px 1px 3px rgba(0,0,0,0.2)",
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

function DataPoint({ f1, f2, f3, f4, f5, f6, f7, progresses }: any) {
  const posGroupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const matRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  useFrame(() => {
    const pZ = progresses[1],
      pY = progresses[2],
      pColor = progresses[3];
    const pSize = progresses[4],
      pOpacity = progresses[5],
      pShape = progresses[6];
    const curZ = f2 * (1 - pZ);
    const curY = f3 * (1 - pY);
    if (posGroupRef.current) posGroupRef.current.position.set(f1, curY, curZ);
    const curSize = lerp(f5, 0.22, pSize);
    const sq = Math.max(0.05, 1 - pY * 0.95);
    const sx = curSize * (1 + (1 - sq) * 0.3);
    const sy = curSize * sq;
    const sz = curSize * (1 + (1 - sq) * 0.3);
    const targetColor = new THREE.Color().setHSL(f4 / 360, 1.0, 0.5);
    const grayColor = new THREE.Color("#888888");
    const curColor = targetColor.lerp(grayColor, pColor);
    const curOpacity = lerp(f6, 1.0, pOpacity);
    const curF7 = f7 * (1 - pShape);
    const idx1 = Math.floor(curF7);
    const idx2 = Math.min(3, Math.ceil(curF7));
    const t = curF7 - idx1;
    for (let i = 0; i < 4; i++) {
      if (meshRefs.current[i] && matRefs.current[i]) {
        let o = 0;
        if (i === idx1 && i === idx2) o = 1;
        else if (i === idx1) o = 1 - t;
        else if (i === idx2) o = t;
        const mat = matRefs.current[i];
        mat.color.copy(curColor);
        mat.emissive.copy(curColor).multiplyScalar(0.45);
        mat.opacity = curOpacity * o;
        mat.transparent = mat.opacity < 1.0;
        const mesh = meshRefs.current[i];
        mesh.visible = o > 0.001;
        if (mesh.visible) mesh.scale.set(sx, sy, sz);
      }
    }
  });
  const shapes = [
    <sphereGeometry args={[1, 32, 32]} key="0" />,
    <boxGeometry args={[1.4, 1.4, 1.4]} key="1" />,
    <octahedronGeometry args={[1.2]} key="2" />,
    <torusGeometry args={[0.7, 0.35, 16, 32]} key="3" />,
  ];
  return (
    <group ref={posGroupRef}>
      <group>
        {shapes.map((geom, i) => (
          <mesh key={i} ref={(el) => (meshRefs.current[i] = el as THREE.Mesh)}>
            {geom}
            <meshStandardMaterial
              ref={(el) =>
                (matRefs.current[i] = el as THREE.MeshStandardMaterial)
              }
              roughness={0.1}
              metalness={0.2}
            />
          </mesh>
        ))}
      </group>
      <SubCoordinates f4={f4} f5={f5} f6={f6} f7={f7} progresses={progresses} />
    </group>
  );
}

function GhostPoint({ f1, f2, f3, f4, f5, f6, f7, progresses }: any) {
  const ghost1Ref = useRef<THREE.Mesh>(null);
  const ghost2Ref = useRef<THREE.Mesh>(null);
  const maxCollapse = Math.max(...progresses.slice(1));
  const ghostAlpha = Math.min(0.35, maxCollapse * 0.4);
  const labelOpacity = Math.min(1, Math.max(0, (maxCollapse - 0.2) * 2));
  useFrame(() => {
    if (ghost1Ref.current) {
      ghost1Ref.current.position.set(f1, f3, f2);
      ghost1Ref.current.scale.setScalar(f5);
    }
    if (ghost2Ref.current) {
      ghost2Ref.current.position.set(f1, f3, f2);
      ghost2Ref.current.scale.setScalar(f5);
    }
  });
  if (maxCollapse < 0.05) return null;
  const originalColor = new THREE.Color().setHSL(f4 / 360, 1.0, 0.5);
  const idx1 = Math.floor(f7);
  const idx2 = Math.min(3, Math.ceil(f7));
  const t = f7 - idx1;
  const shapes = [
    <sphereGeometry args={[1, 32, 32]} key="0" />,
    <boxGeometry args={[1.4, 1.4, 1.4]} key="1" />,
    <octahedronGeometry args={[1.2]} key="2" />,
    <torusGeometry args={[0.7, 0.35, 16, 32]} key="3" />,
  ];
  return (
    <group>
      {t < 1 && (
        <mesh ref={ghost1Ref}>
          {shapes[idx1]}
          <meshBasicMaterial
            color={originalColor}
            transparent
            opacity={ghostAlpha * f6 * 2.5 * (1 - t)}
            wireframe
          />
        </mesh>
      )}
      {t > 0 && (
        <mesh ref={ghost2Ref}>
          {shapes[idx2]}
          <meshBasicMaterial
            color={originalColor}
            transparent
            opacity={ghostAlpha * f6 * 2.5 * t}
            wireframe
          />
        </mesh>
      )}
      {progresses[2] > 0.1 && Math.abs(f3) > 0.1 && (
        <Line
          points={[
            [f1, f3, f2],
            [f1, f3 * (1 - progresses[2]) + 0.01, f2],
          ]}
          color={originalColor}
          lineWidth={2}
          dashed
          dashSize={0.12}
          gapSize={0.08}
          transparent
          opacity={Math.min(0.8, progresses[2] * 2)}
        />
      )}
      {labelOpacity > 0.05 && (
        <Html
          position={[f1 + 0.5, f3 / 2, f2]}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              border: `1px solid ${FEATURE_COLORS.f4}88`,
              borderRadius: 8,
              padding: "6px 10px",
              opacity: labelOpacity,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: FEATURE_COLORS.f4,
                fontWeight: 700,
              }}
            >
              高维原貌 (幽灵)
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#64748b",
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              丢失特征:
              {progresses[2] > 0.5 && (
                <span>
                  <br />• Y高度({f3.toFixed(1)})
                </span>
              )}
              {progresses[3] > 0.5 && (
                <span>
                  <br />• 颜色(色相{f4.toFixed(0)}°)
                </span>
              )}
              {progresses[4] > 0.5 && (
                <span>
                  <br />• 尺寸({f5.toFixed(2)})
                </span>
              )}
              {progresses[5] > 0.5 && (
                <span>
                  <br />• 透明度({f6.toFixed(2)})
                </span>
              )}
              {progresses[6] > 0.5 && (
                <span>
                  <br />• 形状({f7.toFixed(2)})
                </span>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function DChartScene({
  f1,
  f2,
  f3,
  f4,
  f5,
  f6,
  f7,
  progresses,
  isAnimating,
}: any) {
  const pZ = progresses[1];
  const pY = progresses[2];
  const curZ = f2 * (1 - pZ);
  const curY = f3 * (1 - pY);
  return (
    <>
      <ambientLight intensity={1.4} />
      <pointLight position={[10, 14, 10]} intensity={1.8} />
      <pointLight position={[-8, 6, -8]} intensity={0.6} color="#a78bfa" />
      <CameraRig progress={pY} isAnimating={isAnimating} />
      <Floor />
      <CoordAxes progresses={progresses} />
      {Math.abs(curY) > 0.04 && (
        <Line
          points={[
            [f1, curY, curZ],
            [f1, 0, curZ],
          ]}
          color={FEATURE_COLORS.f3}
          dashed
          dashSize={0.15}
          gapSize={0.08}
          transparent
          opacity={(1 - pY) * 0.9}
        />
      )}
      <Line
        points={[
          [f1, 0, curZ],
          [0, 0, curZ],
        ]}
        color={FEATURE_COLORS.f1}
        dashed
        dashSize={0.1}
        gapSize={0.06}
        transparent
        opacity={0.5 * (1 - pZ)}
      />
      <Line
        points={[
          [f1, 0, curZ],
          [f1, 0, 0],
        ]}
        color={FEATURE_COLORS.f2}
        dashed
        dashSize={0.1}
        gapSize={0.06}
        transparent
        opacity={0.5 * (1 - pZ)}
      />
      <DataPoint
        f1={f1}
        f2={f2}
        f3={f3}
        f4={f4}
        f5={f5}
        f6={f6}
        f7={f7}
        progresses={progresses}
      />
      <GhostPoint
        f1={f1}
        f2={f2}
        f3={f3}
        f4={f4}
        f5={f5}
        f6={f6}
        f7={f7}
        progresses={progresses}
      />
      <OrbitControls
        enabled={!isAnimating}
        enablePan
        enableZoom
        enableRotate
        makeDefault
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// FSlider
// ─────────────────────────────────────────────────────────────

function FSlider({
  label,
  sub,
  color,
  value,
  onChange,
  disabled,
  min = -5,
  max = 5,
  step = 0.05,
  isSymmetric = true,
  marks = { min: "−5", max: "+5" },
  format = (v: number) => (v >= 0 && isSymmetric ? "+" : "") + v.toFixed(2),
}: any) {
  const range = max - min;
  const pct = isSymmetric
    ? (Math.abs(value) / max) * 50
    : ((value - min) / range) * 100;
  const left = isSymmetric ? (value >= 0 ? "50%" : `${50 - pct}%`) : "0%";
  return (
    <div
      className={`transition-opacity duration-300 ${disabled ? "opacity-30 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: color, boxShadow: `0 0 6px ${color}55` }}
        />
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground font-mono ml-1">
          {sub}
        </span>
        <span
          className="ml-auto font-mono text-sm font-bold tabular-nums"
          style={{ color }}
        >
          {format(value)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-muted-foreground w-5 text-right shrink-0">
          {marks.min}
        </span>
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="flex-1"
        />
        <span className="font-mono text-[10px] text-muted-foreground w-5 shrink-0">
          {marks.max}
        </span>
      </div>
      <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden relative">
        {isSymmetric && (
          <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
        )}
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            background: color,
            opacity: 0.7,
            left,
            width: `${pct}%`,
            transition: "width 75ms, left 75ms",
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export: FeatureSpaceTab
// ─────────────────────────────────────────────────────────────

export interface FeatureSpaceValues {
  f1: number; // X轴/左右  [-5, 5]
  f2: number; // Z轴/前后  [-5, 5]
  f3: number; // Y轴/高低  [-5, 5]
  f4: number; // 色相      [0, 360]
  f5: number; // 大小/半径 [0.1, 1.0]
  f6: number; // 透明度    [0.1, 1.0]
  f7: number; // 几何形状  [0, 3]
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
  /** When provided, sliders initialise and reset to these values */
  initialValues?: FeatureSpaceValues;
  /** Label shown in top-bar, e.g. "Image #1" */
  sourceLabel?: string;
}

export default function FeatureSpaceTab({
  initialValues,
  sourceLabel,
}: FeatureSpaceTabProps = {}) {
  const init = initialValues ?? DEFAULT_VALUES;
  const [f1, setF1] = useState(init.f1);
  const [f2, setF2] = useState(init.f2);
  const [f3, setF3] = useState(init.f3);
  const [f4, setF4] = useState(init.f4);
  const [f5, setF5] = useState(init.f5);
  const [f6, setF6] = useState(init.f6);
  const [f7, setF7] = useState(init.f7);
  const [activeDim, setActiveDim] = useState<number>(7);
  const [progresses, setProgresses] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const animRef = useRef<number | null>(null);

  // Re-sync sliders whenever the selected image changes
  useEffect(() => {
    const v = initialValues ?? DEFAULT_VALUES;
    setF1(v.f1);
    setF2(v.f2);
    setF3(v.f3);
    setF4(v.f4);
    setF5(v.f5);
    setF6(v.f6);
    setF7(v.f7);
  }, [initialValues]);

  useEffect(() => {
    const tick = () => {
      setProgresses((prev) => {
        let stillAnimating = false;
        const next = prev.map((p, i) => {
          const target = activeDim >= i + 1 ? 0 : 1;
          const diff = target - p;
          if (Math.abs(diff) < 0.005) return target;
          stillAnimating = true;
          return p + diff * 0.08;
        });
        if (stillAnimating) animRef.current = requestAnimationFrame(tick);
        return next;
      });
    };
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current!);
  }, [activeDim]);

  const isAnimating = progresses.some((p) => p > 0.005 && p < 0.995);
  const C = FEATURE_COLORS;

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs font-semibold text-foreground">
            7维特征空间降维演示
            {sourceLabel && (
              <span className="ml-2 text-muted-foreground font-normal">
                — {sourceLabel}
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground">
            逐级剥离特征，观察高维数据的坍缩
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted border border-border rounded-lg px-2 py-1 font-mono text-[10px] shadow-sm">
          <span className="text-muted-foreground">V=[</span>
          <span style={{ color: C.f1 }}>
            {f1 >= 0 ? "+" : ""}
            {f1.toFixed(1)}
          </span>
          <span className="text-muted-foreground">,</span>
          <span style={{ color: C.f2, opacity: 1 - progresses[1] * 0.75 }}>
            {f2 >= 0 ? "+" : ""}
            {(f2 * (1 - progresses[1])).toFixed(1)}
          </span>
          <span className="text-muted-foreground">,</span>
          <span style={{ color: C.f3, opacity: 1 - progresses[2] * 0.75 }}>
            {f3 >= 0 ? "+" : ""}
            {(f3 * (1 - progresses[2])).toFixed(1)}
          </span>
          <span className="text-muted-foreground">,</span>
          <span style={{ color: C.f4, opacity: 1 - progresses[3] * 0.75 }}>
            {f4.toFixed(0)}°
          </span>
          <span className="text-muted-foreground">,</span>
          <span style={{ color: C.f5, opacity: 1 - progresses[4] * 0.75 }}>
            {f5.toFixed(2)}
          </span>
          <span className="text-muted-foreground">,</span>
          <span style={{ color: C.f6, opacity: 1 - progresses[5] * 0.75 }}>
            {f6.toFixed(2)}
          </span>
          <span className="text-muted-foreground">,</span>
          <span style={{ color: C.f7, opacity: 1 - progresses[6] * 0.75 }}>
            {(f7 * (1 - progresses[6])).toFixed(2)}
          </span>
          <span className="text-muted-foreground">]</span>
        </div>
      </div>

      {/* Controls + Canvas */}
      <div className="flex gap-2 flex-1 min-h-0">
        {/* Left controls */}
        <div className="flex flex-col gap-2 w-52 overflow-y-auto shrink-0">
          {/* Dim selector */}
          <div className="bg-muted/50 border border-border rounded-xl p-3 shrink-0">
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

          {/* Sliders */}
          <div className="bg-muted/50 border border-border rounded-xl p-3 space-y-4 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              特征参数 (1-7)
            </span>
            <FSlider
              label="特1"
              sub="X轴/左右"
              color={C.f1}
              value={f1}
              onChange={setF1}
              disabled={false}
            />
            <FSlider
              label="特2"
              sub="Z轴/前后"
              color={C.f2}
              value={f2}
              onChange={setF2}
              disabled={activeDim < 2}
            />
            <FSlider
              label="特3"
              sub="Y轴/高低"
              color={C.f3}
              value={f3}
              onChange={setF3}
              disabled={activeDim < 3}
            />
            <div className="border-t border-border" />
            <FSlider
              label="特4"
              sub="色相"
              color={C.f4}
              value={f4}
              onChange={setF4}
              min={0}
              max={360}
              step={1}
              isSymmetric={false}
              marks={{ min: "0°", max: "360°" }}
              format={(v: number) => v.toFixed(0) + "°"}
              disabled={activeDim < 4}
            />
            <FSlider
              label="特5"
              sub="大小/半径"
              color={C.f5}
              value={f5}
              onChange={setF5}
              min={0.1}
              max={1.0}
              step={0.01}
              isSymmetric={false}
              marks={{ min: "0.1", max: "1.0" }}
              disabled={activeDim < 5}
            />
            <FSlider
              label="特6"
              sub="透明度"
              color={C.f6}
              value={f6}
              onChange={setF6}
              min={0.1}
              max={1.0}
              step={0.01}
              isSymmetric={false}
              marks={{ min: "0.1", max: "1.0" }}
              disabled={activeDim < 6}
            />
            <FSlider
              label="特7"
              sub="几何形状"
              color={C.f7}
              value={f7}
              onChange={setF7}
              min={0}
              max={3}
              step={0.01}
              isSymmetric={false}
              marks={{ min: "0", max: "3" }}
              format={(v: number) => v.toFixed(2)}
              disabled={activeDim < 7}
            />
          </div>
        </div>

        {/* 3D Canvas + info cards */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex-1 rounded-xl overflow-hidden border border-border relative bg-slate-100 dark:bg-slate-900">
            <Canvas
              camera={{ position: [10, 8, 10], fov: 48 }}
              gl={{ antialias: true }}
            >
              <color attach="background" args={["#f1f5f9"]} />
              <DChartScene
                f1={f1}
                f2={f2}
                f3={f3}
                f4={f4}
                f5={f5}
                f6={f6}
                f7={f7}
                progresses={progresses}
                isAnimating={isAnimating}
              />
            </Canvas>
            <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md rounded-lg px-3 py-1.5 text-right shadow-md border border-border">
              <div className="font-mono text-[10px] text-muted-foreground mb-0.5">
                当前保留状态
              </div>
              <div className="font-mono text-2xl font-black text-foreground leading-none">
                {activeDim}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  维
                </span>
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            {[
              {
                icon: "🧬",
                title: "特征 = 维度",
                body: "颜色、大小、透明度和形状都是独立特征，共同构成高维向量。",
              },
              {
                icon: "🗜️",
                title: "降维 = 抹杀个性",
                body: "逐级降维时对应特征被强制洗成标准基态，最终所有点毫无差异。",
              },
              {
                icon: "👻",
                title: "幽灵点与信息丢失",
                body: "幽灵线框代表被抛弃的「特征差异」，相同投影点的高维原貌可能天差地别。",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-muted/50 border border-border rounded-lg p-2.5"
              >
                <div className="text-base mb-1">{card.icon}</div>
                <div className="text-xs font-bold text-foreground mb-1">
                  {card.title}
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  {card.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
