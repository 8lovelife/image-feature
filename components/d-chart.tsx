"use client";

import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import { Slider } from "@/components/ui/slider";

// ─────────────────────────────────────────────────────────────
// 坐标系映射：
//   特征1 (f1) → X 轴（水平左右）
//   特征2 (f2) → Y 轴（垂直上下，2D 平面的另一轴）
//   特征3 (f3) → Z 轴（前后深度，3D→2D 时被压缩）
//   特征4 (f4) → W 轴（子坐标系中的局部方向，4D→3D 时被压缩）
// ─────────────────────────────────────────────────────────────

const easeIO = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 更平滑的缓动函数
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

const C = {
  f1: "#f43f5e", // X (Red)
  f2: "#22d3ee", // Y (Cyan)
  f3: "#a78bfa", // Z (Purple)
  f4: "#d946ef", // W (Magenta)
};

// 局部 W 轴的延伸方向（为了视觉上避开主轴，选一个斜向向量）
const W_DIR = [0.6, 0.5, -0.5];

// 相机关键帧：dimLevel (4=4D, 3=3D, 2=2D)
function camAt(dim: number): [number, number, number] {
  if (dim > 3) {
    // 3D → 4D: 稍微拉远，给子坐标系留出空间
    const t = dim - 3;
    return [lerp(10, 14, t), lerp(8, 10, t), lerp(14, 18, t)];
  } else {
    // 2D → 3D: 从正前方平视 (XY平面) 转移到 3D 斜视
    const t = easeIO(dim - 2);
    return [lerp(0.01, 10, t), lerp(0.01, 8, t), lerp(26, 14, t)];
  }
}

// ─── 相机控制器 ──────────────────────────────────────────────
function CameraRig({
  dimLevel,
  isAnimating,
}: {
  dimLevel: number;
  isAnimating: boolean;
}) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(...camAt(dimLevel)));

  useFrame(() => {
    if (!isAnimating) return;

    const [tx, ty, tz] = camAt(dimLevel);
    targetRef.current.set(tx, ty, tz);

    // 简单的 lerp，跟随 dimLevel 变化
    camera.position.x = lerp(camera.position.x, tx, 0.03);
    camera.position.y = lerp(camera.position.y, ty, 0.03);
    camera.position.z = lerp(camera.position.z, tz, 0.03);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

// ─── 主坐标轴 ────────────────────────────────────────────────
function CoordAxes({ zProg }: { zProg: number }) {
  // 直接使用 zProg，动画由父级控制
  const zScale = zProg;

  const LEN = 8;
  const ticks = [-6, -4, -2, 2, 4, 6];
  const df = 12;

  const AxisLabel = ({ pos, color, label, sub }: any) => (
    <Html
      position={pos}
      center
      distanceFactor={df}
      style={{ pointerEvents: "none" }}
    >
      <div style={{ textAlign: "center", lineHeight: 1.2 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color,
            textShadow: "0 0 8px #000",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color, opacity: 0.85 }}>
          {sub}
        </div>
      </div>
    </Html>
  );

  return (
    <group>
      {/* X 轴 */}
      <Line
        points={[
          [-LEN, 0, 0],
          [LEN, 0, 0],
        ]}
        color={C.f1}
        lineWidth={3}
        opacity={0.9}
        transparent
      />
      <AxisLabel pos={[LEN + 1, 0, 0]} color={C.f1} label="X" sub="特征1" />
      {ticks.map((t) => (
        <Line
          key={`x${t}`}
          points={[
            [t, -0.15, 0],
            [t, 0.15, 0],
          ]}
          color={C.f1}
          lineWidth={1.5}
          opacity={0.5}
          transparent
        />
      ))}

      {/* Y 轴 */}
      <Line
        points={[
          [0, -LEN, 0],
          [0, LEN, 0],
        ]}
        color={C.f2}
        lineWidth={3}
        opacity={0.9}
        transparent
      />
      <AxisLabel pos={[0, LEN + 1, 0]} color={C.f2} label="Y" sub="特征2" />
      {ticks.map((t) => (
        <Line
          key={`y${t}`}
          points={[
            [-0.15, t, 0],
            [0.15, t, 0],
          ]}
          color={C.f2}
          lineWidth={1.5}
          opacity={0.5}
          transparent
        />
      ))}

      {/* Z 轴（随 3D→2D 收缩） */}
      {zScale > 0.01 && (
        <group>
          <Line
            points={[
              [0, 0, -LEN * zScale],
              [0, 0, LEN * zScale],
            ]}
            color={C.f3}
            lineWidth={3}
            opacity={zScale}
            transparent
          />
          <AxisLabel
            pos={[0, 0, LEN * zScale + 1]}
            color={C.f3}
            label="Z"
            sub="特征3"
          />
          {ticks
            .filter((t) => Math.abs(t) <= LEN * zScale)
            .map((t) => (
              <Line
                key={`z${t}`}
                points={[
                  [-0.15, 0, t],
                  [0.15, 0, t],
                ]}
                color={C.f3}
                lineWidth={1.5}
                opacity={0.5 * zScale}
                transparent
              />
            ))}
        </group>
      )}

      {/* 原点 */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
    </group>
  );
}

// ─── 局部子坐标系 (第4维) ────────────────────────────────────
function LocalCoordinateSystem({ bX, bY, bZ, f4, wProg }: any) {
  if (wProg < 0.01) return null;

  const [wx, wy, wz] = W_DIR;

  return (
    <group position={[bX, bY, bZ]} scale={wProg}>
      {/* 局部坐标轴基准线 */}
      <Line
        points={[
          [0, 0, 0],
          [1.5, 0, 0],
        ]}
        color={C.f1}
        opacity={0.3}
        transparent
      />
      <Line
        points={[
          [0, 0, 0],
          [0, 1.5, 0],
        ]}
        color={C.f2}
        opacity={0.3}
        transparent
      />
      <Line
        points={[
          [0, 0, 0],
          [0, 0, 1.5],
        ]}
        color={C.f3}
        opacity={0.3}
        transparent
      />

      {/* W 轴轨道�� */}
      <Line
        points={[
          [-wx * 6, -wy * 6, -wz * 6],
          [wx * 6, wy * 6, wz * 6],
        ]}
        color={C.f4}
        dashed
        dashSize={0.2}
        gapSize={0.1}
        opacity={0.25}
        transparent
      />

      {/* 当前 W 向量 */}
      <Line
        points={[
          [0, 0, 0],
          [wx * f4, wy * f4, wz * f4],
        ]}
        color={C.f4}
        lineWidth={4}
        opacity={0.9}
        transparent
      />

      <Html
        position={[wx * 6.5, wy * 6.5, wz * 6.5]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            color: C.f4,
            fontSize: 13,
            fontWeight: "bold",
            textShadow: "0 0 6px #000",
            whiteSpace: "nowrap",
            opacity: wProg,
          }}
        >
          W 轴 (子坐标)
        </div>
      </Html>
    </group>
  );
}

// ─── 投影与向量分解 ──────────────────────────────────────────
function Projections({
  f1,
  f2,
  f3,
  bX,
  bY,
  bZ,
  pX,
  pY,
  pZ,
  zProg,
  showDecomp,
}: any) {
  return (
    <group>
      {/* Z 轴投影线 (丢弃的深度) */}
      {zProg > 0.01 && (
        <Line
          points={[
            [f1, f2, 0],
            [bX, bY, bZ],
          ]}
          color={C.f3}
          dashed
          dashSize={0.15}
          gapSize={0.08}
          lineWidth={2}
          opacity={0.5 * zProg}
          transparent
        />
      )}

      {showDecomp && (
        <>
          <Line
            points={[
              [0, 0, 0],
              [f1, 0, 0],
            ]}
            color={C.f1}
            lineWidth={3}
            opacity={0.6}
            transparent
          />
          <Line
            points={[
              [f1, 0, 0],
              [f1, f2, 0],
            ]}
            color={C.f2}
            lineWidth={3}
            opacity={0.6}
            transparent
          />
          <Line
            points={[
              [0, 0, 0],
              [pX, pY, pZ],
            ]}
            color="#fff"
            lineWidth={1.5}
            opacity={0.2}
            transparent
          />
        </>
      )}
    </group>
  );
}

// ─── 投影可视化系统 (清晰展示降维过程) ──────────────────────
function ProjectionVisualizer({ f1, f2, f3, f4, wProg, zProg }: any) {
  const [wx, wy, wz] = W_DIR;

  // 4D 完整位置（包含 W 分量）
  const pos4DFull: [number, number, number] = [
    f1 + wx * f4,
    f2 + wy * f4,
    f3 + wz * f4,
  ];

  // 3D 位置（W 分量被投影掉）
  const pos3D: [number, number, number] = [f1, f2, f3];

  // 2D 位置（Z 分量被投影掉）
  const pos2D: [number, number, number] = [f1, f2, 0];

  // 当前点的实际位置（随 wProg 和 zProg 变化）
  const currentPos: [number, number, number] = [
    f1 + wx * f4 * wProg,
    f2 + wy * f4 * wProg,
    f3 * zProg + wz * f4 * wProg,
  ];

  // 4D → 3D 投影过程中显示
  const showing4DProjection =
    wProg > 0.01 && wProg < 0.99 && Math.abs(f4) > 0.3;

  // 3D → 2D 投影过程中显示
  const showing3DProjection =
    zProg > 0.01 && zProg < 0.99 && Math.abs(f3) > 0.3;

  return (
    <group>
      {/* === 4D → 3D 投影可视化 === */}
      {showing4DProjection && (
        <group>
          {/* 原始 4D 位置（幽灵点） */}
          <mesh position={pos4DFull}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial
              color={C.f4}
              transparent
              opacity={0.6}
              wireframe
            />
          </mesh>

          {/* 投影目标点（3D 位置） */}
          <mesh position={[pos3D[0], pos3D[1], pos3D[2] * zProg]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color={C.f4} transparent opacity={0.3} />
          </mesh>

          {/* 投影路径线 - 从 4D 位置到 3D 位置 */}
          <Line
            points={[pos4DFull, [pos3D[0], pos3D[1], pos3D[2] * zProg]]}
            color={C.f4}
            lineWidth={3}
            opacity={0.8}
            transparent
          />

          {/* 投影箭头指示 */}
          <Html
            position={[
              (pos4DFull[0] + pos3D[0]) / 2,
              (pos4DFull[1] + pos3D[1]) / 2 + 0.5,
              (pos4DFull[2] + pos3D[2] * zProg) / 2,
            ]}
            center
            style={{ pointerEvents: "none" }}
          >
            <div className="text-xs font-bold text-fuchsia-400 bg-black/80 px-2 py-1 rounded whitespace-nowrap">
              W 轴投影 ({(wProg * 100).toFixed(0)}%)
            </div>
          </Html>
        </group>
      )}

      {/* === 3D → 2D 投影可视化 === */}
      {showing3DProjection && (
        <group>
          {/* 原始 3D 位置（幽灵点） */}
          <mesh position={pos3D}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial
              color={C.f3}
              transparent
              opacity={0.6}
              wireframe
            />
          </mesh>

          {/* 投影目标点（2D 位置） */}
          <mesh position={pos2D}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color={C.f3} transparent opacity={0.3} />
          </mesh>

          {/* 投影路径线 - 从 3D 位置到 2D 位置 */}
          <Line
            points={[pos3D, pos2D]}
            color={C.f3}
            lineWidth={3}
            opacity={0.8}
            transparent
          />

          {/* 投影箭头指示 */}
          <Html
            position={[f1 + 0.8, f2, f3 / 2]}
            center
            style={{ pointerEvents: "none" }}
          >
            <div className="text-xs font-bold text-purple-400 bg-black/80 px-2 py-1 rounded whitespace-nowrap">
              Z 轴投影 ({((1 - zProg) * 100).toFixed(0)}%)
            </div>
          </Html>
        </group>
      )}

      {/* 当前投影阶段完成后的残影 */}
      {wProg < 0.1 && Math.abs(f4) > 0.3 && (
        <Html position={pos3D} center style={{ pointerEvents: "none" }}>
          <div className="text-[10px] text-fuchsia-400/60 bg-black/50 px-1.5 py-0.5 rounded whitespace-nowrap">
            W 维度已压缩
          </div>
        </Html>
      )}

      {zProg < 0.1 && Math.abs(f3) > 0.3 && (
        <Html position={pos2D} center style={{ pointerEvents: "none" }}>
          <div className="text-[10px] text-purple-400/60 bg-black/50 px-1.5 py-0.5 rounded whitespace-nowrap">
            Z 维度已压缩
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── 主数据点 ─────────────────────────────────────────────────
function DataPoint({ pX, pY, pZ }: any) {
  // 直接使用传入的位置，动画由 dimLevel 控制
  return (
    <mesh position={[pX, pY, pZ]}>
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshStandardMaterial
        color="#facc15"
        emissive="#facc15"
        emissiveIntensity={0.6}
      />
    </mesh>
  );
}

function Scene({ f1, f2, f3, f4, dimLevel, isAnimating, showDecomp }: any) {
  const wProg = Math.max(0, Math.min(1, dimLevel - 3));
  const zProg = Math.max(0, Math.min(1, dimLevel - 2));

  // 3D 空间基准点 (受 3D->2D 影响)
  const bX = f1;
  const bY = f2;
  const bZ = f3 * zProg;

  // 最终 4D 数据点 (附在子坐标系末端，受 4D->3D 影响)
  const [wx, wy, wz] = W_DIR;
  const pX = bX + wx * f4 * wProg;
  const pY = bY + wy * f4 * wProg;
  const pZ = bZ + wz * f4 * wProg;

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 14, 10]} intensity={1.2} />

      <CameraRig dimLevel={dimLevel} isAnimating={isAnimating} />

      {/* 2D 投影幕布 (XY 平面) */}
      <gridHelper
        args={[30, 30, "#1e293b", "#1e293b"]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      <CoordAxes zProg={zProg} />

      <LocalCoordinateSystem bX={bX} bY={bY} bZ={bZ} f4={f4} wProg={wProg} />

      <Projections
        f1={f1}
        f2={f2}
        f3={f3}
        bX={bX}
        bY={bY}
        bZ={bZ}
        pX={pX}
        pY={pY}
        pZ={pZ}
        zProg={zProg}
        showDecomp={showDecomp}
      />

      <ProjectionVisualizer
        f1={f1}
        f2={f2}
        f3={f3}
        f4={f4}
        wProg={wProg}
        zProg={zProg}
      />

      <DataPoint pX={pX} pY={pY} pZ={pZ} />

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

// ─── 滑块组件 ─────────────────────────────────────────────────
function FSlider({ label, sub, color, value, onChange, disabled }: any) {
  return (
    <div
      className={`transition-opacity duration-500 ${disabled ? "opacity-30 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
        />
        <span className="text-xs font-semibold text-slate-200">{label}</span>
        <span className="text-[10px] text-slate-500">{sub}</span>
        <span className="ml-auto font-mono text-sm font-bold" style={{ color }}>
          {value >= 0 ? "+" : ""}
          {value.toFixed(2)}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={-5}
        max={5}
        step={0.05}
        className="flex-1"
      />
    </div>
  );
}

// ─── 主界面组件 ────────────────────────────────────────────────
export default function DimensionalityDemo() {
  const [f1, setF1] = useState(3.0);
  const [f2, setF2] = useState(2.5);
  const [f3, setF3] = useState(3.5);
  const [f4, setF4] = useState(4.0);

  const [mode, setMode] = useState<"4d" | "3d" | "2d">("4d");
  const [dimLevel, setDimLevel] = useState(4); // 4.0 ~ 2.0
  const [showDecomp, setShowDecomp] = useState(true);

  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startLevelRef = useRef<number>(4);

  // 基于时间的缓慢动画（2.5秒完成一个维度的转换）
  const ANIM_DURATION = 2500; // 毫秒

  useEffect(() => {
    const target = mode === "4d" ? 4 : mode === "3d" ? 3 : 2;
    startTimeRef.current = performance.now();
    startLevelRef.current = dimLevel;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / ANIM_DURATION);
      const easedProgress = easeInOutQuart(progress);

      const newVal = lerp(startLevelRef.current, target, easedProgress);
      setDimLevel(newVal);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mode]);

  const isAnimating = Math.abs(dimLevel - Math.round(dimLevel)) > 0.01;
  const wProg = Math.max(0, Math.min(1, dimLevel - 3));
  const zProg = Math.max(0, Math.min(1, dimLevel - 2));

  return (
    <div
      className="min-h-screen bg-[#08090f] text-slate-200"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div
        className="max-w-[1400px] mx-auto p-4 flex flex-col gap-4"
        style={{ height: "100vh" }}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              高维降维可视化：4D → 3D → 2D
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              观察子坐标系与主维度的逐级坍缩
            </p>
          </div>
          <div className="flex gap-2 bg-[#12151f] border border-slate-700 rounded-xl px-4 py-2 font-mono text-sm">
            <span>q = [</span>
            <span style={{ color: C.f1 }}>{f1.toFixed(1)}</span>,
            <span style={{ color: C.f2 }}>{f2.toFixed(1)}</span>,
            <span style={{ color: C.f3, opacity: zProg > 0.5 ? 1 : 0.3 }}>
              {(f3 * zProg).toFixed(1)}
            </span>
            ,
            <span style={{ color: C.f4, opacity: wProg > 0.5 ? 1 : 0.3 }}>
              {(f4 * wProg).toFixed(1)}
            </span>
            <span>]</span>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* 左侧面板 */}
          <div className="w-[300px] flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="bg-[#12151f] border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-3">
                空间维度
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["4d", "3d", "2d"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      mode === m
                        ? "bg-white text-slate-900 shadow-lg"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-500 leading-relaxed min-h-[40px]">
                {mode === "4d" &&
                  "全维度：主空间确定基础位置，附带局部子坐标系延伸出第四维 W。"}
                {mode === "3d" &&
                  "第一次降维：子坐标系 W 轴消失，4D 坍缩回 3D 基础点。"}
                {mode === "2d" &&
                  "第二次降维：深度 Z 轴收缩，立体空间拍平到屏幕 XY 平面上。"}
              </div>

              {/* 降维进度指示器 */}
              {isAnimating && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">降维进度</span>
                    <span className="font-mono text-white">
                      {dimLevel.toFixed(2)}D
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 transition-all duration-100"
                      style={{ width: `${((4 - dimLevel) / 2) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>4D</span>
                    <span>3D</span>
                    <span>2D</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#12151f] border border-slate-700/60 rounded-2xl p-4 space-y-5">
              <FSlider
                label="特征 1"
                sub="→ X 轴 (左右)"
                color={C.f1}
                value={f1}
                onChange={setF1}
              />
              <FSlider
                label="特征 2"
                sub="→ Y 轴 (上下)"
                color={C.f2}
                value={f2}
                onChange={setF2}
              />
              <FSlider
                label="特征 3"
                sub="→ Z 轴 (深度)"
                color={C.f3}
                value={f3}
                onChange={setF3}
                disabled={mode === "2d"}
              />
              <div className="pt-2 border-t border-slate-700">
                <FSlider
                  label="特征 4"
                  sub="→ W 轴 (局部)"
                  color={C.f4}
                  value={f4}
                  onChange={setF4}
                  disabled={mode !== "4d"}
                />
              </div>
            </div>

            <div className="bg-[#12151f] border border-slate-700/60 rounded-2xl p-4">
              <button
                onClick={() => setShowDecomp(!showDecomp)}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-8 h-4 rounded-full relative transition-colors ${showDecomp ? "bg-indigo-500" : "bg-slate-700"}`}
                >
                  <div
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${showDecomp ? "left-4.5" : "left-0.5"}`}
                  />
                </div>
                <span className="text-sm">显示向量分解</span>
              </button>
            </div>
          </div>

          {/* 右侧画布 */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700 relative bg-[#060810]">
            <Canvas camera={{ position: [14, 10, 16], fov: 45 }}>
              <Scene
                f1={f1}
                f2={f2}
                f3={f3}
                f4={f4}
                dimLevel={dimLevel}
                isAnimating={isAnimating}
                showDecomp={showDecomp}
              />
            </Canvas>

            {/* 降维状态角标 */}
            <div className="absolute top-5 right-5 text-right bg-black/60 backdrop-blur px-4 py-2 rounded-xl">
              <div className="text-[10px] text-slate-400 font-mono tracking-widest mb-1">
                {mode === "4d"
                  ? "HYPERSPACE"
                  : mode === "3d"
                    ? "3D SPACE"
                    : "2D PROJECTION"}
              </div>
              <div className="text-3xl font-black text-white">
                {Math.round(dimLevel)}{" "}
                <span className="text-lg font-normal text-slate-400">维</span>
              </div>
            </div>

            {/* 图例 */}
            <div className="absolute bottom-5 left-5 flex gap-2">
              <div className="bg-black/60 backdrop-blur px-3 py-2 rounded-lg text-xs font-mono space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded bg-[#f43f5e]" /> X (主轴水平)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded bg-[#22d3ee]" /> Y (主轴垂直)
                </div>
                <div
                  className={`flex items-center gap-2 transition-opacity ${zProg < 0.5 ? "opacity-30" : ""}`}
                >
                  <div className="w-2 h-2 rounded bg-[#a78bfa]" /> Z (主轴深度)
                </div>
                <div
                  className={`flex items-center gap-2 transition-opacity ${wProg < 0.5 ? "opacity-30" : ""}`}
                >
                  <div className="w-2 h-2 rounded bg-[#d946ef]" /> W
                  (局部子坐标系)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
