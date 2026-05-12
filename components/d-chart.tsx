"use client";

import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { Slider } from "@/components/ui/slider";

// ─────────────────────────────────────────────────────────────
// 坐标系：
//   特征1 (f1) → X 轴（水平左右）
//   特征2 (f2) → Z 轴（水平前后）
//   特征3 (f3) → Y 轴（垂直高低，降维时压到 0）
//
// 俯视时 X 水平、Z 垂直，gridHelper 天然正确。
// ─────────────────────────────────────────────────────────────

const easeIO = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const C = {
  f1: "#f43f5e",
  f2: "#22d3ee",
  f3: "#a78bfa",
  f4: "#fb923c",
  f5: "#34d399",
};

// ─── 第4维：色相计算 ─────────────────────────────────────────
// f4 ∈ [-5, 5] → 色相 [220°蓝, 20°红]
function hueFromF4(v: number): number {
  return 220 - ((v + 5) / 10) * 200;
}
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
function hslToThreeColor(h: number, s: number, l: number): THREE.Color {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return new THREE.Color(f(0), f(8), f(4));
}

// 相机关键帧（progress 0=3D, 1=2D）
// 3D home:  (10, 8, 10) — 经典斜视，三轴清晰
// 侧视:     (1, 5, 18)  — 从侧面看 Y 高度
// 俯视:     (0.01, 22, 0.01) — 正上方看 XZ 平面
function camAt(p: number): [number, number, number] {
  if (p <= 0) return [10, 8, 10];
  if (p < 0.3) {
    // 3D斜视 → 侧视
    const t = easeIO(p / 0.3);
    return [lerp(10, 1, t), lerp(8, 5, t), lerp(10, 18, t)];
  }
  if (p < 0.65) {
    // 侧视，保持，观看 Y 被压扁
    return [1, 5, 18];
  }
  if (p < 1) {
    // 侧视 → 俯视
    const t = easeIO((p - 0.65) / 0.35);
    return [lerp(1, 0.01, t), lerp(5, 22, t), lerp(18, 8, t)];
  }
  return [0.01, 22, 8];
}

// ─── 相机控制器（始终挂载，双向动画）────────────────────────
// progress 由父组件驱动（0↔1），CameraRig 负责所有相机运动
// 动画中禁用 OrbitControls，静止时启用
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

// ─── 坐标轴 ──────────────────────────────────────────────────
function CoordAxes({ yProgress }: { yProgress: number }) {
  const ysRef = useRef(1 - yProgress);
  const [ys, setYs] = useState(1);

  useFrame(() => {
    ysRef.current += (1 - yProgress - ysRef.current) * 0.09;
    setYs(ysRef.current);
  });

  const LEN = 6;
  const ticks = [-4, -2, 2, 4];
  // distanceFactor 让 Html 标签大小跟随 3D 空间缩放，视角改变时保持视觉一致
  const df = 12;

  return (
    <group>
      {/* X 轴（特征1，红）*/}
      <Line
        points={[
          [-LEN, 0, 0],
          [LEN, 0, 0],
        ]}
        color={C.f1}
        lineWidth={3}
        transparent
        opacity={0.95}
      />
      <Html
        position={[LEN + 1.0, 0, 0]}
        center
        distanceFactor={df}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div style={{ textAlign: "center", lineHeight: 1.2 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: C.f1,
              textShadow: "0 0 8px #000, 0 0 16px #000",
            }}
          >
            X
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: C.f1,
              opacity: 0.85,
              textShadow: "0 0 6px #000",
            }}
          >
            特征1
          </div>
        </div>
      </Html>
      {ticks.map((t) => (
        <group key={t} position={[t, 0, 0]}>
          <Line
            points={[
              [0, 0, -0.15],
              [0, 0, 0.15],
            ]}
            color={C.f1}
            lineWidth={1.5}
            transparent
            opacity={0.5}
          />
          <Html
            position={[0, 0, 0.55]}
            center
            distanceFactor={df}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div
              style={{
                fontSize: 11,
                color: C.f1,
                opacity: 0.6,
                textShadow: "0 0 4px #000",
              }}
            >
              {t}
            </div>
          </Html>
        </group>
      ))}

      {/* Z 轴（特征2，青）*/}
      <Line
        points={[
          [0, 0, -LEN],
          [0, 0, LEN],
        ]}
        color={C.f2}
        lineWidth={3}
        transparent
        opacity={0.95}
      />
      <Html
        position={[0, 0, LEN + 1.0]}
        center
        distanceFactor={df}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div style={{ textAlign: "center", lineHeight: 1.2 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: C.f2,
              textShadow: "0 0 8px #000, 0 0 16px #000",
            }}
          >
            Z
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: C.f2,
              opacity: 0.85,
              textShadow: "0 0 6px #000",
            }}
          >
            特征2
          </div>
        </div>
      </Html>
      {ticks.map((t) => (
        <group key={t} position={[0, 0, t]}>
          <Line
            points={[
              [-0.15, 0, 0],
              [0.15, 0, 0],
            ]}
            color={C.f2}
            lineWidth={1.5}
            transparent
            opacity={0.5}
          />
          <Html
            position={[0.55, 0, 0]}
            center
            distanceFactor={df}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div
              style={{
                fontSize: 11,
                color: C.f2,
                opacity: 0.6,
                textShadow: "0 0 4px #000",
              }}
            >
              {t}
            </div>
          </Html>
        </group>
      ))}

      {/* Y 轴（特征3，紫）— 随 yProgress 缩短 */}
      {ys > 0.015 && (
        <>
          <Line
            points={[
              [0, 0, 0],
              [0, LEN * ys, 0],
            ]}
            color={C.f3}
            lineWidth={2.5}
            transparent
            opacity={Math.min(0.9, ys * 1.1)}
          />
          <Line
            points={[
              [0, -LEN * ys * 0.25, 0],
              [0, 0, 0],
            ]}
            color={C.f3}
            lineWidth={1.5}
            transparent
            opacity={ys * 0.35}
          />
          {/* Y 标签放在轴顶端正上方，不与轴线重叠 */}
          <Html
            position={[0, LEN * ys + 0.8, 0]}
            center
            distanceFactor={df}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div
              style={{
                textAlign: "center",
                lineHeight: 1.2,
                opacity: Math.min(1, ys * 1.5),
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: C.f3,
                  textShadow: "0 0 8px #000, 0 0 16px #000",
                }}
              >
                Y
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.f3,
                  opacity: 0.85,
                  textShadow: "0 0 6px #000",
                }}
              >
                特征3
              </div>
            </div>
          </Html>
          {ticks
            .filter((t) => t > 0 && t <= LEN * ys)
            .map((t) => (
              <group key={t} position={[0, t, 0]}>
                <Line
                  points={[
                    [-0.12, 0, 0],
                    [0.12, 0, 0],
                  ]}
                  color={C.f3}
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
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
    </group>
  );
}

// ─── 地板网格 ────────────────────────────────────────────────
function Floor() {
  return <gridHelper args={[12, 24, "#1e293b", "#1e293b"]} />;
}

// ─── 投影辅助线 ──────────────────────────────────────────────
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
  const effYRef = useRef(f3);
  const [effY, setEffY] = useState(f3);

  useFrame(() => {
    const target = f3 * (1 - yProgress);
    effYRef.current += (target - effYRef.current) * 0.09;
    setEffY(effYRef.current);
  });

  return (
    <group>
      {/* 特征3 高度竖线 — 动画主角，从点垂直落到地面 */}
      {Math.abs(effY) > 0.04 && (
        <Line
          points={[
            [f1, effY, f2],
            [f1, 0, f2],
          ]}
          color={C.f3}
          lineWidth={3}
          dashed
          dashSize={0.15}
          gapSize={0.08}
          transparent
          opacity={Math.min(0.9, (1 - yProgress) * 1.1)}
        />
      )}
      {/* 特征1 落到 X 轴的虚线 */}
      <Line
        points={[
          [f1, 0, f2],
          [0, 0, f2],
        ]}
        color={C.f1}
        lineWidth={1.5}
        dashed
        dashSize={0.1}
        gapSize={0.06}
        transparent
        opacity={0.5}
      />
      {/* 特征2 落到 Z 轴的虚线 */}
      <Line
        points={[
          [f1, 0, f2],
          [f1, 0, 0],
        ]}
        color={C.f2}
        lineWidth={1.5}
        dashed
        dashSize={0.1}
        gapSize={0.06}
        transparent
        opacity={0.5}
      />

      {/* X 轴落点 */}
      <mesh position={[f1, 0, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color={C.f1} transparent opacity={0.7} />
      </mesh>
      {/* Z 轴落点 */}
      <mesh position={[0, 0, f2]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color={C.f2} transparent opacity={0.7} />
      </mesh>
      {/* XZ 平面投影落点（Y压缩完后才明显） */}
      <mesh position={[f1, 0.01, f2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.18, 32]} />
        <meshBasicMaterial
          color={C.f3}
          transparent
          opacity={Math.min(0.75, yProgress)}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─── 向量分解箭头 ─────────────────────────────────────────────
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
  const effY = f3 * (1 - yProgress);
  return (
    <group>
      <Line
        points={[
          [0, 0, 0],
          [f1, 0, 0],
        ]}
        color={C.f1}
        lineWidth={4}
        transparent
        opacity={0.75}
      />
      <Line
        points={[
          [f1, 0, 0],
          [f1, 0, f2],
        ]}
        color={C.f2}
        lineWidth={4}
        transparent
        opacity={0.75}
      />
      {Math.abs(effY) > 0.04 && (
        <Line
          points={[
            [f1, 0, f2],
            [f1, effY, f2],
          ]}
          color={C.f3}
          lineWidth={4}
          transparent
          opacity={(1 - yProgress) * 0.75}
        />
      )}
      <Line
        points={[
          [0, 0, 0],
          [f1, effY, f2],
        ]}
        color="#ffffff"
        lineWidth={1.5}
        transparent
        opacity={0.28}
      />
    </group>
  );
}

// ─── 主数据点（支持第4维颜色、第5维大小） ──────────────────
function DataPoint({
  f1,
  f2,
  f3,
  f4,
  f5,
  dims,
  yProgress,
  colProgress,
  sizProgress,
}: {
  f1: number;
  f2: number;
  f3: number;
  f4: number;
  f5: number;
  dims: number;
  yProgress: number;
  colProgress: number;
  sizProgress: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const curY = useRef(f3 * (1 - yProgress));

  useFrame((state) => {
    const target = f3 * (1 - yProgress);
    curY.current += (target - curY.current) * 0.09;

    // ── 颜色（特征4）：蓝→红色相，降维时变灰 ──
    let ptColor: THREE.Color;
    if (dims >= 4) {
      const hue = hueFromF4(f4);
      const colored = hslToThreeColor(hue, 75, 55);
      const gray = new THREE.Color(0.6, 0.6, 0.6);
      ptColor = colored.clone().lerp(gray, colProgress);
    } else {
      ptColor = new THREE.Color("#facc15");
    }

    // ── 大小（特征5）：f5∈[-5,5]→scale[0.45,2.0]，降维时归一 ──
    let scale = 1.0;
    if (dims >= 5) {
      const sized = 0.45 + ((f5 + 5) / 10) * 1.55;
      scale = sized + (1.0 - sized) * sizProgress;
    }
    const sq = Math.max(0.05, 1 - yProgress * 0.95);

    if (meshRef.current) {
      meshRef.current.position.set(f1, curY.current, f2);
      meshRef.current.scale.set(
        scale * (1 + (1 - sq) * 0.3),
        scale * sq,
        scale * (1 + (1 - sq) * 0.3),
      );
      (meshRef.current.material as THREE.MeshStandardMaterial).color.copy(
        ptColor,
      );
      (meshRef.current.material as THREE.MeshStandardMaterial).emissive.copy(
        ptColor,
      );
    }
    if (glowRef.current) {
      glowRef.current.position.set(f1, curY.current, f2);
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.1;
      glowRef.current.scale.setScalar(scale * pulse * 3);
      (glowRef.current.material as THREE.MeshBasicMaterial).color.copy(ptColor);
    }
    if (ringRef.current) {
      ringRef.current.position.set(f1, curY.current, f2);
      ringRef.current.visible = dims >= 4 && colProgress < 0.92;
      (ringRef.current.material as THREE.MeshBasicMaterial).color.copy(ptColor);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0,
        (1 - colProgress) * 0.45,
      );
    }
  });

  return (
    <group>
      {/* 发光晕 */}
      <mesh ref={glowRef} position={[f1, f3, f2]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.06} />
      </mesh>
      {/* 主体球（颜色+大小受特征4/5控制） */}
      <mesh ref={meshRef} position={[f1, f3, f2]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#facc15"
          emissiveIntensity={0.35}
          roughness={0.12}
          metalness={0.15}
        />
      </mesh>
      {/* 颜色指示环（有第4维时显示，降维时淡出） */}
      <mesh ref={ringRef} position={[f1, f3, f2]}>
        <torusGeometry args={[0.38, 0.04, 8, 48]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0} />
      </mesh>
    </group>
  );
}

// ─── 幽灵点：展示信息丢失 ────────────────────────────────────
// 2D 投影后，原来的 3D 位置变成半透明幽灵，地面出现实心投影点
// 两者之间的连线 = 丢失的特征3信息（高度差）
function GhostPoint({
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
  const ghostRef = useRef<THREE.Mesh>(null);
  const labelOpacity = Math.min(1, Math.max(0, (yProgress - 0.75) * 4));
  const ghostOpacity = Math.min(0.35, Math.max(0, (yProgress - 0.7) * 1.2));

  useFrame(() => {
    if (ghostRef.current) {
      // 幽灵点停在原始 f3 高度，不随压缩移动
      ghostRef.current.position.set(f1, f3, f2);
    }
  });

  if (yProgress < 0.7 || Math.abs(f3) < 0.1) return null;

  return (
    <group>
      {/* 幽灵球：原来的 3D 位置 */}
      <mesh ref={ghostRef} position={[f1, f3, f2]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial
          color="#facc15"
          transparent
          opacity={ghostOpacity}
          wireframe={false}
        />
      </mesh>

      {/* 幽灵→投影点的连线：视觉上表示"这段高度被丢弃了" */}
      <Line
        points={[
          [f1, f3, f2],
          [f1, 0.01, f2],
        ]}
        color="#f97316"
        lineWidth={2}
        dashed
        dashSize={0.12}
        gapSize={0.08}
        transparent
        opacity={Math.min(0.8, ghostOpacity * 3)}
      />

      {/* 连线中点的 Html 标注 */}
      {labelOpacity > 0.05 && (
        <Html
          position={[f1 + 0.5, f3 / 2, f2]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.75)",
              border: "1px solid #f9731688",
              borderRadius: 8,
              padding: "5px 10px",
              opacity: labelOpacity,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontSize: 11, color: "#fb923c", fontWeight: 700 }}>
              特征3 = {f3.toFixed(2)} → 丢失
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
              这段高度在 2D 中不存在
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({
  f1,
  f2,
  f3,
  f4,
  f5,
  dims,
  yProgress,
  colProgress,
  sizProgress,
  isAnimating,
  showDecomp,
}: {
  f1: number;
  f2: number;
  f3: number;
  f4: number;
  f5: number;
  dims: number;
  yProgress: number;
  colProgress: number;
  sizProgress: number;
  isAnimating: boolean;
  showDecomp: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 14, 10]} intensity={1.0} />
      <pointLight position={[-8, 6, -8]} intensity={0.4} color="#a78bfa" />

      {/* 相机始终由 CameraRig 控制 */}
      <CameraRig progress={yProgress} isAnimating={isAnimating} />

      <Floor />
      <CoordAxes yProgress={yProgress} />
      <ProjectionLines f1={f1} f2={f2} f3={f3} yProgress={yProgress} />
      <FeatureVectors
        f1={f1}
        f2={f2}
        f3={f3}
        yProgress={yProgress}
        show={showDecomp}
      />
      <DataPoint
        f1={f1}
        f2={f2}
        f3={f3}
        f4={f4}
        f5={f5}
        dims={dims}
        yProgress={yProgress}
        colProgress={colProgress}
        sizProgress={sizProgress}
      />
      <GhostPoint f1={f1} f2={f2} f3={f3} yProgress={yProgress} />

      {/* 动画时禁用 OrbitControls，静止时启用 */}
      <OrbitControls
        enabled={!isAnimating}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        makeDefault
      />
    </>
  );
}

// ─── 阶段说明 ─────────────────────────────────────────────────
const PHASES_3TO2 = [
  {
    range: [0, 0.3] as [number, number],
    label: "① 移到侧面",
    desc: "侧视角，能清楚看到特征3（Y轴）有多高",
  },
  {
    range: [0.3, 0.65] as [number, number],
    label: "② 压缩特征3",
    desc: "Y 轴缩短，点的高度归零，紫色竖线消失",
  },
  {
    range: [0.65, 1.0] as [number, number],
    label: "③ 升至俯视",
    desc: "正上方俯视 XZ 平面 = 2D 投影完成",
  },
];
const PHASES_2TO3 = [
  {
    range: [0, 0.35] as [number, number],
    label: "① 下降视角",
    desc: "从俯视下降，Z 轴（特征2）开始出现",
  },
  {
    range: [0.35, 0.7] as [number, number],
    label: "② 恢复特征3",
    desc: "Y 轴伸展，点从地面升起，特征3 重新出现",
  },
  {
    range: [0.7, 1.0] as [number, number],
    label: "③ 回到 3D",
    desc: "三轴完整，特征1/2/3 全部可见",
  },
];

function getPhaseInfo(p: number, to2D: boolean) {
  const phases = to2D ? PHASES_3TO2 : PHASES_2TO3;
  // 2→3 时 p 从 1 降到 0，用 1-p 查找
  const lookup = to2D ? p : 1 - p;
  for (let i = 0; i < phases.length; i++) {
    const [a, b] = phases[i].range;
    if (lookup <= b + 0.001)
      return { ...phases[i], index: i, total: phases.length };
  }
  return {
    ...phases[phases.length - 1],
    index: phases.length - 1,
    total: phases.length,
  };
}

// ─── 滑块 ────────────────────────────────────────────────────
function FSlider({
  label,
  sub,
  color,
  value,
  onChange,
  disabled,
}: {
  label: string;
  sub: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`transition-opacity duration-500 ${disabled ? "opacity-25 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
        />
        <span className="text-xs font-semibold text-slate-200">{label}</span>
        <span className="text-[10px] text-slate-600 font-mono ml-1">{sub}</span>
        <span
          className="ml-auto font-mono text-sm font-bold tabular-nums"
          style={{ color }}
        >
          {value >= 0 ? "+" : ""}
          {value.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-slate-700 w-5 text-right shrink-0">
          −5
        </span>
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={-5}
          max={5}
          step={0.05}
          disabled={disabled}
          className="flex-1"
        />
        <span className="font-mono text-[10px] text-slate-700 w-5 shrink-0">
          +5
        </span>
      </div>
      {/* 双向进度条 */}
      <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600" />
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            background: color,
            opacity: 0.6,
            left: value >= 0 ? "50%" : `${((value + 5) / 10) * 100}%`,
            width: `${(Math.abs(value) / 10) * 100}%`,
            transition: "width 75ms, left 75ms",
          }}
        />
      </div>
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────
export default function FeatureSpaceDemo() {
  const [f1, setF1] = useState(2.5);
  const [f2, setF2] = useState(2);
  const [f3, setF3] = useState(3);
  // 第4维：颜色通道（色相）
  const [f4, setF4] = useState(1.5);
  // 第5维：大小通道（球半径）
  const [f5, setF5] = useState(2.0);
  // 当前展示维度数
  const [dims, setDims] = useState(3);
  const [mode, setMode] = useState<"3d" | "2d">("3d");
  const [yProgress, setYProgress] = useState(0); // Y轴压缩进度
  const [colProgress, setColProgress] = useState(0); // 颜色归灰进度
  const [sizProgress, setSizProgress] = useState(0); // 大小归一进度
  const [showDecomp, setShowDecomp] = useState(true);
  const animRef = useRef<number | null>(null);
  const dirRef = useRef<"to2d" | "to3d">("to2d");

  // 动画驱动 — 三通道同步，略有速差，体现降维顺序
  useEffect(() => {
    const target = mode === "2d" ? 1 : 0;
    dirRef.current = mode === "2d" ? "to2d" : "to3d";
    const tick = () => {
      setYProgress((p) => {
        const d = target - p;
        return Math.abs(d) < 0.002 ? target : p + d * 0.05;
      });
      setColProgress((p) => {
        const d = target - p;
        return Math.abs(d) < 0.002 ? target : p + d * 0.045;
      });
      setSizProgress((p) => {
        const d = target - p;
        return Math.abs(d) < 0.002 ? target : p + d * 0.04;
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mode]);

  const isAnimating = yProgress > 0.005 && yProgress < 0.995;
  const to2D = dirRef.current === "to2d";
  const phase = isAnimating ? getPhaseInfo(yProgress, to2D) : null;

  // 实时有效特征3值（动画中变化）
  const [dispF3, setDispF3] = useState(f3);
  useEffect(() => {
    setDispF3(f3 * (1 - yProgress));
  }, [f3, yProgress]);

  // 当前点颜色（给顶部向量显示用）
  const ptColorHex = dims >= 4 ? hslToHex(hueFromF4(f4), 75, 55) : "#facc15";

  // 维度切换时重置2D模式
  const handleSetDims = (d: number) => {
    setDims(d);
    if (mode === "2d" && d < 3) {
      setMode("3d");
      setYProgress(0);
      setColProgress(0);
      setSizProgress(0);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#08090f]"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div
        className="max-w-7xl mx-auto p-4 flex flex-col gap-3"
        style={{ minHeight: "100vh" }}
      >
        {/* 顶栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">特征值 = 空间坐标</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              拖动滑块改变特征值，观察点在空间中的位置变化
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#12151f] border border-slate-700/80 rounded-xl px-4 py-2.5 font-mono text-sm">
            <span className="text-slate-600">q&nbsp;=&nbsp;[</span>
            <span style={{ color: C.f1 }}>
              {f1 >= 0 ? "+" : ""}
              {f1.toFixed(2)}
            </span>
            {dims >= 2 && (
              <>
                <span className="text-slate-600">,&nbsp;</span>
                <span style={{ color: C.f2 }}>
                  {f2 >= 0 ? "+" : ""}
                  {f2.toFixed(2)}
                </span>
              </>
            )}
            {dims >= 3 && (
              <>
                <span className="text-slate-600">,&nbsp;</span>
                <span
                  style={{
                    color: C.f3,
                    opacity: Math.max(0.25, 1 - yProgress * 0.85),
                  }}
                >
                  {dispF3 >= 0 ? "+" : ""}
                  {dispF3.toFixed(2)}
                </span>
              </>
            )}
            {dims >= 4 && (
              <>
                <span className="text-slate-600">,&nbsp;</span>
                <span
                  style={{
                    color: ptColorHex,
                    opacity: Math.max(0.25, 1 - colProgress * 0.85),
                  }}
                >
                  {f4 >= 0 ? "+" : ""}
                  {(f4 * (1 - colProgress)).toFixed(2)}
                </span>
              </>
            )}
            {dims >= 5 && (
              <>
                <span className="text-slate-600">,&nbsp;</span>
                <span
                  style={{
                    color: C.f5,
                    opacity: Math.max(0.25, 1 - sizProgress * 0.85),
                  }}
                >
                  {f5 >= 0 ? "+" : ""}
                  {(f5 * (1 - sizProgress)).toFixed(2)}
                </span>
              </>
            )}
            <span className="text-slate-600">]</span>
          </div>
        </div>

        {/* 主体 */}
        <div className="flex gap-4 flex-1" style={{ minHeight: 0 }}>
          {/* ── 左侧控制面板 ── */}
          <div className="flex flex-col gap-3" style={{ width: 268 }}>
            {/* 维度选择 */}
            <div className="bg-[#12151f] border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-3">
                空间维度
              </span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleSetDims(d)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${dims === d ? "bg-white text-slate-900" : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-200"}`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
              <div className="mt-2.5 space-y-1">
                {[
                  { label: "特征1", sub: "X轴·主空间", color: C.f1, fade: 0 },
                  { label: "特征2", sub: "Z轴·主空间", color: C.f2, fade: 0 },
                  {
                    label: "特征3",
                    sub: "Y轴·主空间",
                    color: C.f3,
                    fade: yProgress,
                  },
                  {
                    label: "特征4",
                    sub: "颜色·色相",
                    color: ptColorHex,
                    fade: colProgress,
                  },
                  {
                    label: "特征5",
                    sub: "大小·半径",
                    color: C.f5,
                    fade: sizProgress,
                  },
                ]
                  .slice(0, dims)
                  .map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 text-[10px]"
                      style={{ opacity: Math.max(0.25, 1 - item.fade * 0.8) }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: item.color }}
                      />
                      <span className="text-slate-600">{item.label}</span>
                      <span className="text-slate-700 mx-0.5">→</span>
                      <span style={{ color: item.color }} className="font-mono">
                        {item.sub}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-[#12151f] border border-slate-700/60 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  特征值
                </span>
                <button
                  onClick={() => {
                    setF1(0);
                    setF2(0);
                    setF3(0);
                    setF4(0);
                    setF5(0);
                  }}
                  className="text-[11px] text-slate-600 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-2 py-1 transition-all"
                >
                  归零
                </button>
              </div>
              {dims >= 1 && (
                <FSlider
                  label="特征 1"
                  sub="→ X 轴（左右）"
                  color={C.f1}
                  value={f1}
                  onChange={setF1}
                />
              )}
              {dims >= 2 && (
                <FSlider
                  label="特征 2"
                  sub="→ Z 轴（前后）"
                  color={C.f2}
                  value={f2}
                  onChange={setF2}
                />
              )}
              {dims >= 3 && (
                <FSlider
                  label="特征 3"
                  sub="→ Y 轴（高低）"
                  color={C.f3}
                  value={f3}
                  onChange={setF3}
                  disabled={mode === "2d" && yProgress > 0.7}
                />
              )}
              {dims >= 4 && (
                <div className="border-t border-slate-800 pt-4 space-y-5">
                  <div className="text-[9px] text-slate-700 font-mono">
                    额外视觉通道（不占空间轴）
                  </div>
                  <FSlider
                    label="特征 4"
                    sub="→ 颜色色相"
                    color={ptColorHex}
                    value={f4}
                    onChange={setF4}
                    disabled={mode === "2d" && colProgress > 0.7}
                  />
                </div>
              )}
              {dims >= 5 && (
                <FSlider
                  label="特征 5"
                  sub="→ 球体大小"
                  color={C.f5}
                  value={f5}
                  onChange={setF5}
                  disabled={mode === "2d" && sizProgress > 0.7}
                />
              )}
              {mode === "2d" && yProgress > 0.7 && (
                <div className="text-[11px] bg-orange-950/30 border border-orange-900/40 rounded-xl px-3 py-2.5 leading-relaxed space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-30 shrink-0" />
                    <span className="text-slate-400">
                      幽灵点 = 原来的 3D 位置
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 shrink-0" />
                    <span className="text-slate-400">
                      实心点 = 2D 投影后的位置
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 border-t-2 border-dashed border-orange-400 shrink-0" />
                    <span className="text-orange-400 font-medium">
                      橙色虚线 = 丢失的特征3高度
                    </span>
                  </div>
                  <div className="text-slate-500 pt-1 border-t border-slate-800">
                    不同高度的点，投影后可能完全重叠
                  </div>
                </div>
              )}
            </div>

            {/* 视图切换 */}
            <div className="bg-[#12151f] border border-slate-700/60 rounded-2xl p-5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-3">
                视图模式
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["3d", "2d"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    disabled={m === "2d" && dims < 3}
                    className={`py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                      mode === m
                        ? "bg-white text-slate-900 shadow-lg"
                        : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    } ${m === "2d" && dims < 3 ? "opacity-30 cursor-not-allowed" : ""}`}
                  >
                    {m === "3d" ? "3D 空间" : "2D 投影"}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-600 mt-3 leading-relaxed">
                {mode === "3d"
                  ? "三个特征值完整定义点在 3D 空间的位置"
                  : "忽略特征3 → 降至 2D，高度信息永久丢失"}
              </p>
            </div>

            {/* 辅助线开关 */}
            <div className="bg-[#12151f] border border-slate-700/60 rounded-2xl p-5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-3">
                辅助显示
              </span>
              <button
                onClick={() => setShowDecomp((v) => !v)}
                className="flex items-center gap-3 w-full"
              >
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative ${showDecomp ? "bg-white" : "bg-slate-700"}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${showDecomp ? "bg-slate-900 left-4" : "bg-slate-500 left-0.5"}`}
                  />
                </div>
                <span className="text-sm text-slate-300">向量分解</span>
              </button>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                显示每个特征值对应的坐标分量
              </p>
            </div>

            {/* 实时坐标 */}
            <div className="bg-[#12151f] border border-slate-700/60 rounded-2xl p-5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-3">
                实时坐标
              </span>
              <div className="space-y-3">
                {[
                  {
                    label: "特征1 → X",
                    color: C.f1,
                    eff: f1,
                    fade: 0,
                    show: dims >= 1,
                  },
                  {
                    label: "特征2 → Z",
                    color: C.f2,
                    eff: f2,
                    fade: 0,
                    show: dims >= 2,
                  },
                  {
                    label: "特征3 → Y",
                    color: C.f3,
                    eff: dispF3,
                    fade: yProgress,
                    show: dims >= 3,
                  },
                  {
                    label: "特征4 → 颜色",
                    color: ptColorHex,
                    eff: f4 * (1 - colProgress),
                    fade: colProgress,
                    show: dims >= 4,
                  },
                  {
                    label: "特征5 → 大小",
                    color: C.f5,
                    eff: f5 * (1 - sizProgress),
                    fade: sizProgress,
                    show: dims >= 5,
                  },
                ]
                  .filter((i) => i.show)
                  .map((item) => (
                    <div
                      key={item.label}
                      style={{ opacity: Math.max(0.2, 1 - item.fade * 0.9) }}
                    >
                      <div className="flex justify-between mb-1">
                        <span
                          className="text-[11px]"
                          style={{ color: item.color }}
                        >
                          {item.label}
                        </span>
                        <span
                          className="font-mono text-[11px] tabular-nums"
                          style={{ color: item.color }}
                        >
                          {item.eff >= 0 ? "+" : ""}
                          {item.eff.toFixed(3)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700" />
                        <div
                          className="absolute top-0 h-full rounded-full"
                          style={{
                            background: item.color,
                            opacity: 0.7,
                            left:
                              item.eff >= 0
                                ? "50%"
                                : `${((item.eff + 5) / 10) * 100}%`,
                            width: `${(Math.abs(item.eff) / 10) * 100}%`,
                            transition: "width 80ms, left 80ms",
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* ── 右侧 Canvas ── */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Canvas */}
            <div
              className="flex-1 rounded-2xl overflow-hidden border border-slate-700/50 relative"
              style={{ minHeight: 440, background: "#060810" }}
            >
              <Canvas
                camera={{ position: [10, 8, 10], fov: 48 }}
                gl={{ antialias: true }}
              >
                <Scene
                  f1={f1}
                  f2={f2}
                  f3={f3}
                  f4={f4}
                  f5={f5}
                  dims={dims}
                  yProgress={yProgress}
                  colProgress={colProgress}
                  sizProgress={sizProgress}
                  isAnimating={isAnimating}
                  showDecomp={showDecomp}
                />
              </Canvas>

              {/* 图例 */}
              <div className="absolute bottom-4 left-4 space-y-1.5">
                {[
                  {
                    color: C.f1,
                    text: "特征1 → X 轴（左右）",
                    fade: 0,
                    show: dims >= 1,
                  },
                  {
                    color: C.f2,
                    text: "特征2 → Z 轴（前后）",
                    fade: 0,
                    show: dims >= 2,
                  },
                  {
                    color: C.f3,
                    text: "特征3 → Y 轴（高低）",
                    fade: yProgress,
                    show: dims >= 3,
                  },
                  {
                    color: ptColorHex,
                    text: "特征4 → 颜色（色相）",
                    fade: colProgress,
                    show: dims >= 4,
                  },
                  {
                    color: C.f5,
                    text: "特征5 → 大小（半径）",
                    fade: sizProgress,
                    show: dims >= 5,
                  },
                ]
                  .filter((i) => i.show)
                  .map((item) => (
                    <div
                      key={item.text}
                      className="flex items-center gap-2 bg-black/55 backdrop-blur-sm rounded-lg px-2.5 py-1"
                      style={{ opacity: Math.max(0.25, 1 - item.fade * 0.85) }}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: item.color }}
                      />
                      <span className="text-[11px] font-mono text-slate-300">
                        {item.text}
                      </span>
                    </div>
                  ))}
                {showDecomp && (
                  <div className="flex items-center gap-2 bg-black/55 backdrop-blur-sm rounded-lg px-2.5 py-1">
                    <div className="w-4 h-px bg-white opacity-30" />
                    <span className="text-[11px] font-mono text-slate-500">
                      合向量（原点→点）
                    </span>
                  </div>
                )}
              </div>

              {/* 右上角维度标 */}
              <div className="absolute top-4 right-4 bg-black/55 backdrop-blur-sm rounded-xl px-3 py-2 text-right">
                <div className="font-mono text-[10px] text-slate-500">
                  {mode === "3d" ? `ℝ${dims} 空间` : "ℝ² 投影"}
                </div>
                <div className="font-mono text-2xl font-black text-white leading-tight">
                  {mode === "3d" ? dims : 2}
                  <span className="text-sm font-normal text-slate-400">
                    {" "}
                    维
                  </span>
                </div>
                {dims > 3 && mode === "3d" && (
                  <div className="text-[9px] text-slate-600 mt-0.5">
                    主轴3 + 通道{dims - 3}
                  </div>
                )}
              </div>

              {/* 静止时提示 */}
              {!isAnimating && (
                <div className="absolute bottom-4 right-4 bg-black/55 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <span className="text-[11px] text-slate-500">
                    静止时可旋转视角
                  </span>
                </div>
              )}
            </div>

            {/* 底部概念卡片 */}
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  icon: "📍",
                  title: "特征值 = 坐标",
                  body: "特征1/2/3 控制点在 3D 空间的位置（X/Z/Y 轴）。改变任意一个，点立刻移动。",
                },
                {
                  icon: "🎨",
                  title: "颜色 = 第4维",
                  body: "空间三轴用完后，用颜色编码特征4。蓝=-5，红=+5。降维时颜色消失变灰。",
                },
                {
                  icon: "⚫",
                  title: "大小 = 第5维",
                  body: "用球体半径编码特征5。小球=-5，大球=+5。降维时大小归一，信息丢失。",
                },
                {
                  icon: "🗜️",
                  title: "降维 = 信息丢失",
                  body: "5D→2D 依次丢弃大小、颜色、高度。三个维度的信息永远消失，无法还原。",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-[#12151f] border border-slate-700/60 rounded-xl p-4"
                >
                  <div className="text-xl mb-1.5">{card.icon}</div>
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
