"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { Slider } from "@/components/ui/slider";

// ─────────────────────────────────────────────────────────────
// 坐标系说明（重要）：
//   特征1 (f1) → Three.js X 轴（水平，向右）
//   特征2 (f2) → Three.js Z 轴（水平，向前/后）
//   特征3 (f3) → Three.js Y 轴（垂直，向上，降维时被压到0）
//
// 这样俯视(top-down)时，X 水平、Z 垂直，网格完全正常。
// ─────────────────────────────────────────────────────────────

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const FEAT_COLORS = {
  f1: "#f43f5e", // 特征1 → X → 红
  f2: "#22d3ee", // 特征2 → Z → 青
  f3: "#a78bfa", // 特征3 → Y → 紫（被压缩）
};

const PHASES = [
  {
    range: [0, 0.3] as [number, number],
    label: "① 侧面观察",
    desc: "从侧面看，能清楚看到点在「特征3」方向有多高",
  },
  {
    range: [0.3, 0.65] as [number, number],
    label: "② 压缩特征3",
    desc: "特征3（Y 轴）正在被丢弃，注意高度竖线消失",
  },
  {
    range: [0.65, 1.0] as [number, number],
    label: "③ 俯视 2D",
    desc: "从正上方俯视：只剩特征1（X）和特征2（Z）",
  },
];

function getPhase(p: number) {
  for (let i = 0; i < PHASES.length; i++) {
    const [a, b] = PHASES[i].range;
    if (p <= b)
      return { ...PHASES[i], localT: Math.min(1, (p - a) / (b - a)), index: i };
  }
  return { ...PHASES[PHASES.length - 1], localT: 1, index: PHASES.length - 1 };
}

// ─── 相机控制器 ───────────────────────────────────────────────
// 3D 默认：斜45度 (9, 8, 9) → 三轴都清晰
// 阶段1：移到侧面 (0, 6, 16) → 能看到Y轴高度
// 阶段2：保持侧面，看Y被压扁
// 阶段3：升到正上方 (0, 20, 0.1) → 俯视XZ平面
function CameraRig({
  progress,
  active,
}: {
  progress: number;
  active: boolean;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!active && progress === 0) return;
    let tx: number, ty: number, tz: number;

    if (progress < 0.3) {
      const t = easeInOut(progress / 0.3);
      tx = lerp(9, 0, t);
      ty = lerp(8, 5, t);
      tz = lerp(9, 18, t);
    } else if (progress < 0.65) {
      tx = 0;
      ty = 5;
      tz = 18;
    } else {
      const t = easeInOut((progress - 0.65) / 0.35);
      tx = lerp(0, 0.01, t);
      ty = lerp(5, 22, t);
      tz = lerp(18, 0.01, t);
    }

    camera.position.lerp(new THREE.Vector3(tx, ty, tz), 0.06);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

// ─── 坐标轴 ──────────────────────────────────────────────────
// X轴（特征1）、Z轴（特征2）永远可见
// Y轴（特征3）随 yProgress 缩短消失
function CoordAxes({ yProgress }: { yProgress: number }) {
  const smoothY = useRef(1 - yProgress);
  const [ys, setYs] = useState(1);

  useFrame(() => {
    const target = 1 - yProgress;
    smoothY.current += (target - smoothY.current) * 0.08;
    setYs(smoothY.current);
  });

  const len = 6;
  const ticks = [-4, -3, -2, -1, 1, 2, 3, 4];

  return (
    <group>
      {/* ── X 轴（特征1）── */}
      <Line
        points={[
          [-len, 0, 0],
          [len, 0, 0],
        ]}
        color={FEAT_COLORS.f1}
        lineWidth={2.5}
        transparent
        opacity={0.85}
      />
      <Text
        position={[len + 0.5, 0, 0]}
        fontSize={0.4}
        color={FEAT_COLORS.f1}
        anchorX="center"
        anchorY="middle"
      >
        X
      </Text>
      <Text
        position={[len + 0.5, -0.55, 0]}
        fontSize={0.22}
        color={FEAT_COLORS.f1}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.6}
      >
        特征1
      </Text>
      {ticks.map((t) => (
        <group key={t} position={[t, 0, 0]}>
          <Line
            points={[
              [0, 0, -0.1],
              [0, 0, 0.1],
            ]}
            color={FEAT_COLORS.f1}
            lineWidth={1}
            transparent
            opacity={0.4}
          />
          <Text
            position={[0, 0, 0.35]}
            fontSize={0.18}
            color={FEAT_COLORS.f1}
            anchorX="center"
            fillOpacity={0.4}
          >
            {t}
          </Text>
        </group>
      ))}

      {/* ── Z 轴（特征2）── */}
      <Line
        points={[
          [0, 0, -len],
          [0, 0, len],
        ]}
        color={FEAT_COLORS.f2}
        lineWidth={2.5}
        transparent
        opacity={0.85}
      />
      <Text
        position={[0, 0, len + 0.5]}
        fontSize={0.4}
        color={FEAT_COLORS.f2}
        anchorX="center"
        anchorY="middle"
      >
        Z
      </Text>
      <Text
        position={[0.55, 0, len + 0.5]}
        fontSize={0.22}
        color={FEAT_COLORS.f2}
        anchorX="left"
        anchorY="middle"
        fillOpacity={0.6}
      >
        特征2
      </Text>
      {ticks.map((t) => (
        <group key={t} position={[0, 0, t]}>
          <Line
            points={[
              [-0.1, 0, 0],
              [0.1, 0, 0],
            ]}
            color={FEAT_COLORS.f2}
            lineWidth={1}
            transparent
            opacity={0.4}
          />
          <Text
            position={[0.35, 0, 0]}
            fontSize={0.18}
            color={FEAT_COLORS.f2}
            anchorX="left"
            fillOpacity={0.4}
          >
            {t}
          </Text>
        </group>
      ))}

      {/* ── Y 轴（特征3，被压缩）── */}
      {ys > 0.02 && (
        <>
          <Line
            points={[
              [0, 0, 0],
              [0, len * ys, 0],
            ]}
            color={FEAT_COLORS.f3}
            lineWidth={2.5}
            transparent
            opacity={ys * 0.85}
          />
          <Line
            points={[
              [0, -len * ys * 0.3, 0],
              [0, 0, 0],
            ]}
            color={FEAT_COLORS.f3}
            lineWidth={1}
            transparent
            opacity={ys * 0.3}
          />
          <Text
            position={[0, len * ys + 0.55, 0]}
            fontSize={0.4 * Math.max(0.5, ys)}
            color={FEAT_COLORS.f3}
            anchorX="center"
            anchorY="middle"
            fillOpacity={ys}
          >
            Y
          </Text>
          <Text
            position={[0.55, len * ys + 0.55, 0]}
            fontSize={0.22 * Math.max(0.5, ys)}
            color={FEAT_COLORS.f3}
            anchorX="left"
            anchorY="middle"
            fillOpacity={ys * 0.7}
          >
            特征3
          </Text>
          {ticks
            .filter((t) => Math.abs(t) <= len * ys)
            .map((t) => (
              <group key={t} position={[0, t, 0]}>
                <Line
                  points={[
                    [-0.1, 0, 0],
                    [0.1, 0, 0],
                  ]}
                  color={FEAT_COLORS.f3}
                  lineWidth={1}
                  transparent
                  opacity={0.3 * ys}
                />
              </group>
            ))}
        </>
      )}

      {/* 原点 */}
      <mesh>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// ─── 地板网格（XZ平面，完全水平）────────────────────────────
function Floor({ yProgress }: { yProgress: number }) {
  const opacity = useRef(0);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    opacity.current += (yProgress * 0.12 - opacity.current) * 0.06;
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        opacity.current;
    }
  });

  return (
    <>
      {/* gridHelper 默认就是 XZ 平面，完全正确 */}
      <gridHelper args={[12, 24, "#334155", "#1e293b"]} />
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

// ─── 投影辅助线 ──────────────────────────────────────────────
// f1→X, f2→Z, f3→Y（被压缩）
function ProjectionLines({
  f1,
  f2,
  f3,
  yProgress,
}: {
  f1: number;
  f2: number;
  f3: number;
  yProgress: number;
}) {
  const effectiveY = f3 * (1 - yProgress);

  return (
    <group>
      {/* Y方向竖线（特征3的高度）—— 最重要，动画主角 */}
      {Math.abs(effectiveY) > 0.05 && (
        <Line
          points={[
            [f1, effectiveY, f2],
            [f1, 0, f2],
          ]}
          color={FEAT_COLORS.f3}
          lineWidth={2.5}
          dashed
          dashSize={0.14}
          gapSize={0.07}
          transparent
          opacity={(1 - yProgress) * 0.85}
        />
      )}

      {/* X方向虚线（到ZY平面） */}
      <Line
        points={[
          [f1, 0, f2],
          [0, 0, f2],
        ]}
        color={FEAT_COLORS.f1}
        lineWidth={1.5}
        dashed
        dashSize={0.1}
        gapSize={0.06}
        transparent
        opacity={0.45}
      />

      {/* Z方向虚线（到XY平面） */}
      <Line
        points={[
          [f1, 0, f2],
          [f1, 0, 0],
        ]}
        color={FEAT_COLORS.f2}
        lineWidth={1.5}
        dashed
        dashSize={0.1}
        gapSize={0.06}
        transparent
        opacity={0.45}
      />

      {/* XZ平面上的落点圆（Y投影结果）*/}
      <mesh position={[f1, 0.01, f2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial
          color={FEAT_COLORS.f3}
          transparent
          opacity={Math.min(0.7, yProgress * 0.9)}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* X轴落点 */}
      <mesh position={[f1, 0, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={FEAT_COLORS.f1} transparent opacity={0.6} />
      </mesh>

      {/* Z轴落点 */}
      <mesh position={[0, 0, f2]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={FEAT_COLORS.f2} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ─── 向量分解线 ──────────────────────────────────────────────
function FeatureVectors({
  f1,
  f2,
  f3,
  yProgress,
  show,
}: {
  f1: number;
  f2: number;
  f3: number;
  yProgress: number;
  show: boolean;
}) {
  if (!show) return null;
  const eff3 = f3 * (1 - yProgress);
  return (
    <group>
      <Line
        points={[
          [0, 0, 0],
          [f1, 0, 0],
        ]}
        color={FEAT_COLORS.f1}
        lineWidth={3.5}
        transparent
        opacity={0.7}
      />
      <Line
        points={[
          [f1, 0, 0],
          [f1, 0, f2],
        ]}
        color={FEAT_COLORS.f2}
        lineWidth={3.5}
        transparent
        opacity={0.7}
      />
      {Math.abs(eff3) > 0.05 && (
        <Line
          points={[
            [f1, 0, f2],
            [f1, eff3, f2],
          ]}
          color={FEAT_COLORS.f3}
          lineWidth={3.5}
          transparent
          opacity={(1 - yProgress) * 0.7}
        />
      )}
      <Line
        points={[
          [0, 0, 0],
          [f1, eff3, f2],
        ]}
        color="#ffffff"
        lineWidth={1.5}
        transparent
        opacity={0.3}
      />
    </group>
  );
}

// ─── 主数据点 ─────────────────────────────────────────────────
function DataPoint({
  f1,
  f2,
  f3,
  yProgress,
}: {
  f1: number;
  f2: number;
  f3: number;
  yProgress: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const curY = useRef(f3);

  useFrame((state) => {
    const targetY = f3 * (1 - yProgress);
    curY.current += (targetY - curY.current) * 0.08;
    if (meshRef.current) {
      meshRef.current.position.set(f1, curY.current, f2);
      const sq = Math.max(0.06, 1 - yProgress * 0.94);
      meshRef.current.scale.set(1 + (1 - sq) * 0.25, sq, 1 + (1 - sq) * 0.25);
    }
    if (glowRef.current) {
      glowRef.current.position.set(f1, curY.current, f2);
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.1;
      glowRef.current.scale.setScalar(pulse * 2.8);
    }
  });

  return (
    <group>
      <mesh ref={glowRef} position={[f1, f3, f2]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.07} />
      </mesh>
      <mesh ref={meshRef} position={[f1, f3, f2]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#facc15"
          emissiveIntensity={0.4}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>
    </group>
  );
}

// ─── Y值丢失标注 ─────────────────────────────────────────────
function YLossLabel({ f3, yProgress }: { f3: number; yProgress: number }) {
  const visible = yProgress > 0.12 && yProgress < 0.9 && Math.abs(f3) > 0.2;
  if (!visible) return null;
  const curVal = f3 * (1 - yProgress);
  const fadeIn = Math.min(1, (yProgress - 0.12) / 0.12);
  const fadeOut = Math.min(1, (0.9 - yProgress) / 0.12);
  const op = fadeIn * fadeOut;
  return (
    <group position={[3.5, Math.max(0.3, curVal + 0.3), 0]}>
      <Text fontSize={0.3} color="#fb923c" anchorX="left" fillOpacity={op}>
        {`特征3 = ${curVal.toFixed(2)}`}
      </Text>
      <Text
        position={[0, -0.45, 0]}
        fontSize={0.22}
        color="#fb923c"
        anchorX="left"
        fillOpacity={op * 0.7}
      >
        正在被丢弃...
      </Text>
    </group>
  );
}

// ─── 场景 ────────────────────────────────────────────────────
function Scene({
  f1,
  f2,
  f3,
  mode,
  yProgress,
  showDecomp,
}: {
  f1: number;
  f2: number;
  f3: number;
  mode: "3d" | "2d";
  yProgress: number;
  showDecomp: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[10, 12, 10]} intensity={1.1} />
      <pointLight position={[-8, 6, -8]} intensity={0.4} color="#a78bfa" />

      {mode === "2d" && (
        <CameraRig progress={yProgress} active={mode === "2d"} />
      )}

      <Floor yProgress={yProgress} />
      <CoordAxes yProgress={yProgress} />
      <ProjectionLines f1={f1} f2={f2} f3={f3} yProgress={yProgress} />
      <FeatureVectors
        f1={f1}
        f2={f2}
        f3={f3}
        yProgress={yProgress}
        show={showDecomp}
      />
      <DataPoint f1={f1} f2={f2} f3={f3} yProgress={yProgress} />
      <YLossLabel f3={f3} yProgress={yProgress} />

      <OrbitControls enablePan enableZoom enableRotate={mode === "3d"} />
    </>
  );
}

// ─── 滑块组件 ────────────────────────────────────────────────
function FeatureSlider({
  label,
  axisLabel,
  color,
  value,
  onChange,
  disabled,
}: {
  label: string;
  axisLabel: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`transition-opacity duration-300 ${disabled ? "opacity-30 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: color, boxShadow: `0 0 5px ${color}99` }}
        />
        <span className="text-xs font-semibold text-slate-200">{label}</span>
        <span className="text-[10px] text-slate-500 font-mono">
          → {axisLabel}
        </span>
        <span
          className="ml-auto font-mono text-sm font-bold tabular-nums"
          style={{ color }}
        >
          {value >= 0 ? "+" : ""}
          {value.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-slate-600 w-5 text-right">
          −5
        </span>
        <div className="flex-1">
          <Slider
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            min={-5}
            max={5}
            step={0.05}
            disabled={disabled}
          />
        </div>
        <span className="font-mono text-[10px] text-slate-600 w-4">+5</span>
      </div>
      {/* 双向进度条 */}
      <div className="mt-2 h-1 bg-[#1e293b] rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600" />
        <div
          className="absolute top-0 h-full rounded-full transition-all duration-75"
          style={{
            background: color,
            opacity: 0.55,
            left: value >= 0 ? "50%" : `${((value + 5) / 10) * 100}%`,
            width: `${(Math.abs(value) / 10) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────
export default function FeatureSpaceDemo() {
  const [f1, setF1] = useState(2);
  const [f2, setF2] = useState(2);
  const [f3, setF3] = useState(3);
  const [mode, setMode] = useState<"3d" | "2d">("3d");
  const [yProgress, setYProgress] = useState(0);
  const [showDecomp, setShowDecomp] = useState(true);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const target = mode === "2d" ? 1 : 0;
    const tick = () => {
      setYProgress((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.003) return target;
        return prev + diff * 0.055;
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mode]);

  const phase = getPhase(yProgress);
  const isAnimating = yProgress > 0.01 && yProgress < 0.99;
  const eff3 = f3 * (1 - yProgress);

  return (
    <div
      className="min-h-screen bg-[#0b0f18]"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div
        className="max-w-7xl mx-auto p-4 flex flex-col gap-3"
        style={{ minHeight: "100vh" }}
      >
        {/* 顶栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              特征值 = 空间坐标
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              拖动滑块改变特征值，观察点在空间中的位置变化
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#131929] border border-slate-700 rounded-xl px-4 py-2 font-mono text-sm">
            <span className="text-slate-500">q = [</span>
            <span style={{ color: FEAT_COLORS.f1 }}>
              {f1 >= 0 ? "+" : ""}
              {f1.toFixed(2)}
            </span>
            <span className="text-slate-600">,</span>
            <span style={{ color: FEAT_COLORS.f2 }}>
              {f2 >= 0 ? "+" : ""}
              {f2.toFixed(2)}
            </span>
            <span className="text-slate-600">,</span>
            <span
              style={{
                color: FEAT_COLORS.f3,
                opacity: Math.max(0.3, 1 - yProgress * 0.8),
              }}
            >
              {f3 >= 0 ? "+" : ""}
              {f3.toFixed(2)}
            </span>
            <span className="text-slate-500">]</span>
          </div>
        </div>

        {/* 主体 */}
        <div className="flex gap-4 flex-1" style={{ minHeight: 0 }}>
          {/* 左侧控制 */}
          <div
            className="w-68 shrink-0 flex flex-col gap-3"
            style={{ width: 272 }}
          >
            {/* 特征值滑块 */}
            <div className="bg-[#131929] border border-slate-700/60 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  特征值
                </span>
                <button
                  onClick={() => {
                    setF1(0);
                    setF2(0);
                    setF3(0);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-2 py-1 transition-all"
                >
                  归零
                </button>
              </div>
              <FeatureSlider
                label="特征 1"
                axisLabel="X 轴（左右）"
                color={FEAT_COLORS.f1}
                value={f1}
                onChange={setF1}
              />
              <FeatureSlider
                label="特征 2"
                axisLabel="Z 轴（前后）"
                color={FEAT_COLORS.f2}
                value={f2}
                onChange={setF2}
              />
              <FeatureSlider
                label="特征 3"
                axisLabel="Y 轴（高度）"
                color={FEAT_COLORS.f3}
                value={f3}
                onChange={setF3}
                disabled={mode === "2d" && yProgress > 0.6}
              />
              {mode === "2d" && yProgress > 0.6 && (
                <div className="text-[11px] text-orange-400 bg-orange-950/40 border border-orange-800/40 rounded-lg px-3 py-2 leading-relaxed">
                  特征 3 已被忽略
                  <br />
                  <span className="text-orange-500/70">
                    2D 投影中不存在第三个维度
                  </span>
                </div>
              )}
            </div>

            {/* 视图模式 */}
            <div className="bg-[#131929] border border-slate-700/60 rounded-2xl p-5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-3">
                视图
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["3d", "2d"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      mode === m
                        ? "bg-white text-slate-900"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {m === "3d" ? "3D 空间" : "2D 投影"}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed">
                {mode === "3d"
                  ? "3 个特征值 → 3D 空间中的唯一位置"
                  : "忽略特征 3 → 降到 2D，信息永久丢失"}
              </p>
            </div>

            {/* 显示选项 */}
            <div className="bg-[#131929] border border-slate-700/60 rounded-2xl p-5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-3">
                辅助线
              </span>
              <button
                onClick={() => setShowDecomp((v) => !v)}
                className="flex items-center gap-3 w-full"
              >
                <div
                  className={`w-9 h-5 rounded-full transition-all relative ${showDecomp ? "bg-white" : "bg-slate-700"}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${showDecomp ? "bg-slate-900 left-4" : "bg-slate-500 left-0.5"}`}
                  />
                </div>
                <span className="text-sm text-slate-300">向量分解</span>
              </button>
            </div>

            {/* 实时坐标 */}
            <div className="bg-[#131929] border border-slate-700/60 rounded-2xl p-5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-3">
                实时坐标
              </span>
              <div className="space-y-3">
                {[
                  {
                    label: "特征1 → X",
                    color: FEAT_COLORS.f1,
                    val: f1,
                    eff: f1,
                  },
                  {
                    label: "特征2 → Z",
                    color: FEAT_COLORS.f2,
                    val: f2,
                    eff: f2,
                  },
                  {
                    label: "特征3 → Y",
                    color: FEAT_COLORS.f3,
                    val: f3,
                    eff: eff3,
                    fading: true,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span
                        className="text-[11px]"
                        style={{ color: item.color }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="font-mono text-[11px] tabular-nums"
                        style={{
                          color: item.color,
                          opacity: item.fading
                            ? Math.max(0.3, 1 - yProgress)
                            : 1,
                        }}
                      >
                        {item.eff >= 0 ? "+" : ""}
                        {item.eff.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600" />
                      <div
                        className="absolute top-0 h-full rounded-full transition-all duration-75"
                        style={{
                          background: item.color,
                          opacity: item.fading
                            ? Math.max(0.15, (1 - yProgress) * 0.8)
                            : 0.75,
                          left:
                            item.eff >= 0
                              ? "50%"
                              : `${((item.eff + 5) / 10) * 100}%`,
                          width: `${(Math.abs(item.eff) / 10) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：Canvas */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* 阶段字幕 */}
            <div style={{ minHeight: 56 }}>
              {isAnimating && (
                <div className="bg-[#131929] border border-amber-600/35 rounded-xl px-5 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-1.5">
                      {PHASES.map((_, i) => (
                        <div
                          key={i}
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: i === phase.index ? 28 : 8,
                            background:
                              i <= phase.index ? "#f59e0b" : "#1e293b",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-amber-400 text-xs font-semibold">
                      {phase.label}
                    </span>
                    <span className="text-slate-400 text-xs">{phase.desc}</span>
                  </div>
                  <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-75"
                      style={{ width: `${yProgress * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Canvas 区域 */}
            <div
              className="flex-1 rounded-2xl overflow-hidden border border-slate-700/50 relative"
              style={{ minHeight: 440, background: "#080c14" }}
            >
              <Canvas
                camera={{ position: [9, 8, 9], fov: 48 }}
                gl={{ antialias: true }}
              >
                <Scene
                  f1={f1}
                  f2={f2}
                  f3={f3}
                  mode={mode}
                  yProgress={yProgress}
                  showDecomp={showDecomp}
                />
              </Canvas>

              {/* 图例 */}
              <div className="absolute bottom-4 left-4 space-y-1">
                {[
                  {
                    color: FEAT_COLORS.f1,
                    text: "特征1（X 轴）",
                    fading: false,
                  },
                  {
                    color: FEAT_COLORS.f2,
                    text: "特征2（Z 轴）",
                    fading: false,
                  },
                  {
                    color: FEAT_COLORS.f3,
                    text: "特征3（Y 轴，被压缩）",
                    fading: true,
                  },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1"
                    style={{
                      opacity: item.fading
                        ? Math.max(0.3, 1 - yProgress * 0.8)
                        : 1,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: item.color }}
                    />
                    <span className="text-[11px] font-mono text-slate-300">
                      {item.text}
                    </span>
                  </div>
                ))}
                {showDecomp && (
                  <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1">
                    <div className="w-4 h-0.5 bg-white opacity-30" />
                    <span className="text-[11px] font-mono text-slate-500">
                      合向量
                    </span>
                  </div>
                )}
              </div>

              {/* 右上角维度标识 */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2 text-right">
                <div className="font-mono text-xs text-slate-500">
                  {mode === "3d" ? "ℝ³ 空间" : "ℝ² 投影"}
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {mode === "3d" ? "3" : "2"} 维
                </div>
              </div>
            </div>

            {/* 底部概念卡片 */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: "📍",
                  title: "特征值 = 坐标",
                  body: "特征1控制左右（X），特征2控制前后（Z），特征3控制高低（Y）。改变任意一个，点就会移动。",
                },
                {
                  icon: "📐",
                  title: "3 个特征 → 3D",
                  body: "有多少特征值，就有多少维度。特征值的组合唯一确定这个点在空间中的位置。",
                },
                {
                  icon: "🗜️",
                  title: "降维 = 丢弃信息",
                  body: "3D→2D 意味着忽略特征3。原本高低不同的两个点，投影后可能完全重叠，无法区分。",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-[#131929] border border-slate-700/60 rounded-xl p-4"
                >
                  <div className="text-lg mb-1.5">{card.icon}</div>
                  <div className="text-xs font-semibold text-white mb-1">
                    {card.title}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    {card.body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
