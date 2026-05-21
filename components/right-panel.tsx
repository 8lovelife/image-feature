"use client";

import { useState, useRef, useEffect } from "react";
import { ImageIcon, BarChart3, Cpu, Brain, Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import type { FeatureType } from "./middle-panel";
import ColorHistogramChart from "./color-histogram-chart";
import ImageFeatureDisplay from "./image-features-display";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SelectedImage {
  id: number;
  src: string;
  alt: string;
  description: string;
  features: { [key: string]: number[] };
}

interface RightPanelProps {
  selectedImages: SelectedImage[];
  currentFeatureType: FeatureType;
}

// ─────────────────────────────────────────────────────────────
// Feature info metadata
// ─────────────────────────────────────────────────────────────

const featureInfo = {
  resnet: {
    name: "ResNet-50",
    dimensions: 2048,
    category: "Machine Learning",
    description: "Deep Residual Network with skip connections",
    license: "Apache 2.0",
    repository: "https://github.com/pytorch/vision",
    paper: "Deep Residual Learning for Image Recognition (2015)",
  },
  vgg: {
    name: "VGG-16",
    dimensions: 4096,
    category: "Machine Learning",
    description: "Visual Geometry Group Convolutional Neural Network",
    license: "MIT",
    repository: "https://github.com/pytorch/vision",
    paper:
      "Very Deep Convolutional Networks for Large-Scale Image Recognition (2014)",
  },
  mobilenet: {
    name: "MobileNet",
    dimensions: 1024,
    category: "Machine Learning",
    description: "Efficient CNN for mobile and embedded vision applications",
    license: "Apache 2.0",
    repository: "https://github.com/tensorflow/models",
    paper:
      "MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications (2017)",
  },
  sift: {
    name: "SIFT",
    dimensions: 128,
    category: "Traditional",
    description: "Scale-Invariant Feature Transform for keypoint detection",
    license: "BSD",
    repository: "https://github.com/opencv/opencv",
    paper: "Distinctive Image Features from Scale-Invariant Keypoints (2004)",
  },
  hog: {
    name: "HOG",
    dimensions: 3780,
    category: "Traditional",
    description: "Histogram of Oriented Gradients for object detection",
    license: "BSD",
    repository: "https://github.com/scikit-image/scikit-image",
    paper: "Histograms of Oriented Gradients for Human Detection (2005)",
  },
  lbp: {
    name: "LBP",
    dimensions: 256,
    category: "Traditional",
    description: "Local Binary Patterns for texture classification",
    license: "BSD",
    repository: "https://github.com/scikit-image/scikit-image",
    paper:
      "Multiresolution Gray-Scale and Rotation Invariant Texture Classification with Local Binary Patterns (2002)",
  },
  color_histogram: {
    name: "Color Histogram",
    dimensions: 768,
    category: "Traditional",
    description: "RGB color distribution histogram",
    license: "Public Domain",
    repository: "https://github.com/opencv/opencv",
    paper: "Color indexing (1991)",
  },
  orb: {
    name: "ORB",
    dimensions: 256,
    category: "Traditional",
    description: "Oriented FAST and Rotated BRIEF feature detector",
    license: "BSD",
    repository: "https://github.com/opencv/opencv",
    paper: "ORB: An efficient alternative to SIFT or SURF (2011)",
  },
};

// ─────────────────────────────────────────────────────────────
// 7D Feature Space Visualization (from d-chart.tsx)
// ─────────────────────────────────────────────────────────────

const easeIO = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const C = {
  f1: "#f43f5e",
  f2: "#22d3ee",
  f3: "#a78bfa",
  f4: "#fbbf24",
  f5: "#4ade80",
  f6: "#60a5fa",
  f7: "#f472b6",
};

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
        color={C.f1}
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
              color: C.f1,
              textShadow: "0 1px 4px rgba(0,0,0,0.2)",
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
            color={C.f2}
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
                  color: C.f2,
                  textShadow: "0 1px 4px rgba(0,0,0,0.2)",
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
            color={C.f3}
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
                  color: C.f3,
                  textShadow: "0 1px 4px rgba(0,0,0,0.2)",
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

function Floor() {
  return <gridHelper args={[12, 24, "#cbd5e1", "#e2e8f0"]} />;
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
    { id: "f4", len: l4, dir: d4, color: C.f4, label: "特4(色)" },
    { id: "f5", len: l5, dir: d5, color: C.f5, label: "特5(大)" },
    { id: "f6", len: l6, dir: d6, color: C.f6, label: "特6(透)" },
    { id: "f7", len: l7, dir: d7, color: C.f7, label: "特7(形)" },
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
              border: `1px solid ${C.f4}88`,
              borderRadius: 8,
              padding: "6px 10px",
              opacity: labelOpacity,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ fontSize: 11, color: C.f4, fontWeight: 700 }}>
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
          color={C.f3}
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
        color={C.f1}
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
        color={C.f2}
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

// ─── Self-contained 7D tab with its own state ──────────────────
function FeatureSpaceTab() {
  const [f1, setF1] = useState(2.5);
  const [f2, setF2] = useState(2);
  const [f3, setF3] = useState(3);
  const [f4, setF4] = useState(45);
  const [f5, setF5] = useState(0.45);
  const [f6, setF6] = useState(0.85);
  const [f7, setF7] = useState(1.5);
  const [activeDim, setActiveDim] = useState<number>(7);
  const [progresses, setProgresses] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      setProgresses((prev) => {
        let isAnimating = false;
        const next = prev.map((p, i) => {
          const dimIndex = i + 1;
          const target = activeDim >= dimIndex ? 0 : 1;
          const diff = target - p;
          if (Math.abs(diff) < 0.005) return target;
          isAnimating = true;
          return p + diff * 0.08;
        });
        if (isAnimating) animRef.current = requestAnimationFrame(tick);
        return next;
      });
    };
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current!);
  }, [activeDim]);

  const isAnimating = progresses.some((p) => p > 0.005 && p < 0.995);

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">
      {/* Top bar: title + vector display */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs font-semibold text-foreground">
            7维特征空间降维演示
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

      {/* Main content: controls + canvas */}
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

// ─────────────────────────────────────────────────────────────
// Main RightPanel export
// ─────────────────────────────────────────────────────────────

export default function RightPanel({
  selectedImages,
  currentFeatureType,
}: RightPanelProps) {
  const currentFeatureInfo = featureInfo[currentFeatureType];
  const isMachineLearning = currentFeatureInfo.category === "Machine Learning";

  return (
    <div className="h-full p-2 md:p-4 flex flex-col">
      <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            {isMachineLearning ? (
              <Brain className="h-5 w-5 flex-shrink-0" />
            ) : (
              <Cpu className="h-5 w-5 flex-shrink-0" />
            )}
            <span>Image Feature Details</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 overflow-hidden p-2 md:p-4 pt-0">
          <Tabs defaultValue="features" className="h-full flex flex-col">
            <TabsList className="shrink-0 mb-3 w-full">
              <TabsTrigger
                value="features"
                className="flex-1 flex items-center gap-1.5 text-xs"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                特征向量详情
              </TabsTrigger>
              <TabsTrigger
                value="dimreduction"
                className="flex-1 flex items-center gap-1.5 text-xs"
              >
                <Box className="h-3.5 w-3.5" />
                7维降维演示
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Feature Vectors */}
            <TabsContent
              value="features"
              className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden"
            >
              <ScrollArea className="h-full w-full">
                <div className="space-y-4 md:space-y-6 pr-2">
                  {selectedImages.map((image, index) => (
                    <div key={image.id} className="space-y-2 md:space-y-3">
                      <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2 flex items-center gap-2">
                        <ImageIcon className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                        Image #{index + 1} Features
                      </h3>
                      <div className="text-xs text-muted-foreground mb-2">
                        {image.description} | Dimensions:{" "}
                        {image.features[currentFeatureType]?.length ||
                          currentFeatureInfo.dimensions}
                      </div>
                      <ImageFeatureDisplay
                        image={image}
                        featureVector={image.features[currentFeatureType]}
                      />
                      <div className="mt-2 md:mt-4">
                        <ColorHistogramChart
                          featureVector={image.features[currentFeatureType]}
                        />
                      </div>
                    </div>
                  ))}
                  {selectedImages.length === 0 && (
                    <div className="text-center text-muted-foreground py-6 md:py-8">
                      <BarChart3 className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm md:text-base">
                        Select images to view feature vector details
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tab 2: 7D Visualization */}
            <TabsContent
              value="dimreduction"
              className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden"
            >
              <div className="h-full rounded-lg p-1 overflow-hidden">
                <FeatureSpaceTab />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
