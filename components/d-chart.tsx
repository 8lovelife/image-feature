"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 维度配置
const DIMENSION_COLORS = [
  { color: "#ef4444", lightColor: "#fca5a5", label: "X" }, // 红
  { color: "#22c55e", lightColor: "#86efac", label: "Y" }, // 绿
  { color: "#3b82f6", lightColor: "#93c5fd", label: "Z" }, // 蓝
  { color: "#a855f7", lightColor: "#d8b4fe", label: "W" }, // 紫
  { color: "#f97316", lightColor: "#fdba74", label: "V" }, // 橙
];

// 相机控制器 - 根据视角模式切换相机位置
function CameraController({ viewMode }: { viewMode: "3d" | "2d" }) {
  const { camera } = useThree();

  useEffect(() => {
    if (viewMode === "2d") {
      camera.position.set(0, 0, 15);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(8, 6, 8);
      camera.lookAt(0, 0, 0);
    }
    camera.updateProjectionMatrix();
  }, [viewMode, camera]);

  return null;
}

// 生成高维随机数据点
function generateHighDimClusterData(
  center: number[],
  count: number,
  spread: number,
): number[][] {
  const points: number[][] = [];
  for (let i = 0; i < count; i++) {
    const point = center.map((c) => c + (Math.random() - 0.5) * spread);
    points.push(point);
  }
  return points;
}

// 计算高维欧氏距离
function euclideanDistanceND(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

// 将高维点投影到3D（简单的前3维投影）
function projectTo3D(
  point: number[],
  targetDim: number,
  animationProgress: number,
): [number, number, number] {
  const x = point[0] || 0;
  const y = point[1] || 0;

  // 根据目标维度决定z值
  if (targetDim === 2) {
    // 2D: z轴压扁到0
    const z = (point[2] || 0) * (1 - animationProgress);
    return [x, y, z];
  } else {
    // 3D: 正常显示z
    const z = point[2] || 0;
    return [x, y, z];
  }
}

// 动画坐标轴组件
function AnimatedAxis({
  axis,
  color,
  lightColor,
  label,
  highlightDirection,
  scale,
}: {
  axis: "x" | "y" | "z";
  color: string;
  lightColor: string;
  label: string;
  highlightDirection: "positive" | "negative" | null;
  scale: number;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const currentScale = useRef(scale);

  useFrame(() => {
    if (meshRef.current) {
      // 平滑过渡缩放
      currentScale.current += (scale - currentScale.current) * 0.1;
      if (axis === "z") {
        meshRef.current.scale.set(1, 1, currentScale.current);
      }
    }
  });

  const positiveEnd: [number, number, number] =
    axis === "x" ? [5, 0, 0] : axis === "y" ? [0, 5, 0] : [0, 0, 5];
  const negativeEnd: [number, number, number] =
    axis === "x" ? [-5, 0, 0] : axis === "y" ? [0, -5, 0] : [0, 0, -5];
  const origin: [number, number, number] = [0, 0, 0];

  const isPositiveHighlighted = highlightDirection === "positive";
  const isNegativeHighlighted = highlightDirection === "negative";

  // 如果是z轴且缩放为0，不渲染
  if (axis === "z" && scale < 0.01) return null;

  return (
    <group ref={meshRef}>
      {isPositiveHighlighted && (
        <Line
          points={[origin, positiveEnd]}
          color={color}
          lineWidth={10}
          transparent
          opacity={0.4}
        />
      )}
      <Line
        points={[origin, positiveEnd]}
        color={isPositiveHighlighted ? "#ffffff" : color}
        lineWidth={isPositiveHighlighted ? 4 : 2}
      />
      <Text
        position={[
          positiveEnd[0] * 1.1,
          positiveEnd[1] * 1.1,
          positiveEnd[2] * 1.1,
        ]}
        fontSize={0.3}
        color={isPositiveHighlighted ? "#ffffff" : color}
        anchorX="center"
        anchorY="middle"
        fontWeight={isPositiveHighlighted ? "bold" : "normal"}
      >
        {label}
      </Text>

      {isNegativeHighlighted && (
        <Line
          points={[origin, negativeEnd]}
          color={color}
          lineWidth={10}
          transparent
          opacity={0.4}
        />
      )}
      <Line
        points={[origin, negativeEnd]}
        color={isNegativeHighlighted ? "#ffffff" : lightColor}
        lineWidth={isNegativeHighlighted ? 4 : 1}
      />
      {isNegativeHighlighted && (
        <Text
          position={[
            negativeEnd[0] * 1.1,
            negativeEnd[1] * 1.1,
            negativeEnd[2] * 1.1,
          ]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {`-${label}`}
        </Text>
      )}
    </group>
  );
}

// 网格地面
function GridFloor({ is2D }: { is2D: boolean }) {
  const rotationRef = useRef<THREE.Mesh>(null);
  const targetRotation = is2D ? 0 : -Math.PI / 2;

  useFrame(() => {
    if (rotationRef.current) {
      rotationRef.current.rotation.x +=
        (targetRotation - rotationRef.current.rotation.x) * 0.1;
    }
  });

  return (
    <group ref={rotationRef as any}>
      <gridHelper
        args={[10, 20, "#94a3b8", "#cbd5e1"]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -0.01]}
      />
    </group>
  );
}

// 动画数据点组件
function AnimatedDataPoint({
  position,
  targetPosition,
  color,
  size = 0.12,
}: {
  position: [number, number, number];
  targetPosition: [number, number, number];
  color: string;
  size?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentPos = useRef(new THREE.Vector3(...position));

  useFrame(() => {
    if (meshRef.current) {
      currentPos.current.lerp(new THREE.Vector3(...targetPosition), 0.08);
      meshRef.current.position.copy(currentPos.current);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// 查询点组件
function AnimatedQueryPoint({
  position,
  targetPosition,
}: {
  position: [number, number, number];
  targetPosition: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentPos = useRef(new THREE.Vector3(...position));

  useFrame((state) => {
    if (meshRef.current) {
      currentPos.current.lerp(new THREE.Vector3(...targetPosition), 0.08);
      meshRef.current.position.copy(currentPos.current);
      meshRef.current.scale.setScalar(
        1 + Math.sin(state.clock.elapsedTime * 2) * 0.1,
      );
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshStandardMaterial
        color="#facc15"
        emissive="#facc15"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// 动画类别中心点
function AnimatedClusterCenter({
  position,
  targetPosition,
  color,
}: {
  position: [number, number, number];
  targetPosition: [number, number, number];
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentPos = useRef(new THREE.Vector3(...position));

  useFrame(() => {
    if (meshRef.current) {
      currentPos.current.lerp(new THREE.Vector3(...targetPosition), 0.08);
      meshRef.current.position.copy(currentPos.current);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// 动画连线
function AnimatedConnectionLine({
  start,
  end,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const lineRef = useRef<any>(null);
  const currentStart = useRef(new THREE.Vector3(...start));
  const currentEnd = useRef(new THREE.Vector3(...end));

  useFrame(() => {
    currentStart.current.lerp(new THREE.Vector3(...start), 0.08);
    currentEnd.current.lerp(new THREE.Vector3(...end), 0.08);
  });

  return (
    <Line
      points={[start, end]}
      color={color}
      lineWidth={2}
      dashed
      dashSize={0.1}
      gapSize={0.05}
    />
  );
}

// 高维指示器 - 显示被折叠的维度
function DimensionIndicator({
  dimensions,
  targetDimensions,
  features,
}: {
  dimensions: number;
  targetDimensions: number;
  features: number[];
}) {
  if (dimensions <= 3) return null;

  const collapsedDims = dimensions - targetDimensions;

  return (
    <group position={[6, 3, 0]}>
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.25}
        color="#64748b"
        anchorX="left"
      >
        {`隐藏维度: ${collapsedDims}`}
      </Text>
      {features.slice(3).map((value, i) => (
        <group key={i} position={[0, -i * 0.4, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.2}
            color={DIMENSION_COLORS[3 + i]?.color || "#888"}
            anchorX="left"
          >
            {`${DIMENSION_COLORS[3 + i]?.label || `D${4 + i}`}: ${value.toFixed(1)}`}
          </Text>
        </group>
      ))}
    </group>
  );
}

// 3D场景
function Scene({
  queryFeatures,
  highlightedAxis,
  clusterA,
  clusterB,
  clusterC,
  centerA,
  centerB,
  centerC,
  nearestCluster,
  viewMode,
  dimensions,
  animationProgress,
}: {
  queryFeatures: number[];
  highlightedAxis: { axis: number; direction: "positive" | "negative" } | null;
  clusterA: number[][];
  clusterB: number[][];
  clusterC: number[][];
  centerA: number[];
  centerB: number[];
  centerC: number[];
  nearestCluster: "A" | "B" | "C";
  viewMode: "3d" | "2d";
  dimensions: number;
  animationProgress: number;
}) {
  const targetDim = viewMode === "2d" ? 2 : 3;

  // 投影所有点
  const projectedQueryPos = projectTo3D(
    queryFeatures,
    targetDim,
    animationProgress,
  );
  const projectedCenterA = projectTo3D(centerA, targetDim, animationProgress);
  const projectedCenterB = projectTo3D(centerB, targetDim, animationProgress);
  const projectedCenterC = projectTo3D(centerC, targetDim, animationProgress);

  const nearestCenter =
    nearestCluster === "A"
      ? projectedCenterA
      : nearestCluster === "B"
        ? projectedCenterB
        : projectedCenterC;
  const nearestColor =
    nearestCluster === "A"
      ? "#991b1b"
      : nearestCluster === "B"
        ? "#1d4ed8"
        : "#166534";

  // Z轴缩放（用于动画）
  const zAxisScale = viewMode === "2d" ? 1 - animationProgress : 1;

  // 判断某个轴的高亮方向
  const getHighlightDir = (axisIndex: number) => {
    if (highlightedAxis?.axis === axisIndex) {
      return highlightedAxis.direction;
    }
    return null;
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* X轴 */}
      <AnimatedAxis
        axis="x"
        color={DIMENSION_COLORS[0].color}
        lightColor={DIMENSION_COLORS[0].lightColor}
        label={DIMENSION_COLORS[0].label}
        highlightDirection={getHighlightDir(0)}
        scale={1}
      />
      {/* Y轴 */}
      <AnimatedAxis
        axis="y"
        color={DIMENSION_COLORS[1].color}
        lightColor={DIMENSION_COLORS[1].lightColor}
        label={DIMENSION_COLORS[1].label}
        highlightDirection={getHighlightDir(1)}
        scale={1}
      />
      {/* Z轴 - 带压扁动画 */}
      <AnimatedAxis
        axis="z"
        color={DIMENSION_COLORS[2].color}
        lightColor={DIMENSION_COLORS[2].lightColor}
        label={DIMENSION_COLORS[2].label}
        highlightDirection={getHighlightDir(2)}
        scale={zAxisScale}
      />

      {/* 网格地面 */}
      <GridFloor is2D={viewMode === "2d"} />

      {/* 相机控制器 */}
      <CameraController viewMode={viewMode} />

      {/* 高维指示器 */}
      <DimensionIndicator
        dimensions={dimensions}
        targetDimensions={3}
        features={queryFeatures}
      />

      {/* 类别A数据点 */}
      {clusterA.map((point, i) => {
        const targetPos = projectTo3D(point, targetDim, animationProgress);
        return (
          <AnimatedDataPoint
            key={`a-${i}`}
            position={projectTo3D(point, 3, 0)}
            targetPosition={targetPos}
            color="#991b1b"
          />
        );
      })}
      <AnimatedClusterCenter
        position={projectTo3D(centerA, 3, 0)}
        targetPosition={projectedCenterA}
        color="#7f1d1d"
      />

      {/* 类别B数据点 */}
      {clusterB.map((point, i) => {
        const targetPos = projectTo3D(point, targetDim, animationProgress);
        return (
          <AnimatedDataPoint
            key={`b-${i}`}
            position={projectTo3D(point, 3, 0)}
            targetPosition={targetPos}
            color="#1d4ed8"
          />
        );
      })}
      <AnimatedClusterCenter
        position={projectTo3D(centerB, 3, 0)}
        targetPosition={projectedCenterB}
        color="#1e3a8a"
      />

      {/* 类别C数据点 */}
      {clusterC.map((point, i) => {
        const targetPos = projectTo3D(point, targetDim, animationProgress);
        return (
          <AnimatedDataPoint
            key={`c-${i}`}
            position={projectTo3D(point, 3, 0)}
            targetPosition={targetPos}
            color="#166534"
          />
        );
      })}
      <AnimatedClusterCenter
        position={projectTo3D(centerC, 3, 0)}
        targetPosition={projectedCenterC}
        color="#14532d"
      />

      {/* 查询点 */}
      <AnimatedQueryPoint
        position={projectTo3D(queryFeatures, 3, 0)}
        targetPosition={projectedQueryPos}
      />

      {/* 连接线到最近邻 */}
      <AnimatedConnectionLine
        start={projectedQueryPos}
        end={nearestCenter}
        color={nearestColor}
      />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={viewMode === "3d"}
      />
    </>
  );
}

export default function FeatureSpaceDemo() {
  const [dimensions, setDimensions] = useState(3); // 当前维度数量
  const [features, setFeatures] = useState<number[]>([0, 0, 0, 0, 0]); // 最多5维特征
  const [highlightedAxis, setHighlightedAxis] = useState<{
    axis: number;
    direction: "positive" | "negative";
  } | null>(null);
  const lastValuesRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const [animationProgress, setAnimationProgress] = useState(0);

  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // 动画效果
  useEffect(() => {
    const targetProgress = viewMode === "2d" ? 1 : 0;

    const animate = () => {
      setAnimationProgress((prev) => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.01) return targetProgress;
        return prev + diff * 0.1;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [viewMode]);

  // 生成固定的聚类数据（支持高维）
  const { clusterA, clusterB, clusterC, centerA, centerB, centerC } =
    useMemo(() => {
      const cA = [-2, 2, -1, 1, 0.5];
      const cB = [1.5, 0.5, 1, -0.5, 1];
      const cC = [0, -2, 0, 0.5, -1];

      return {
        clusterA: generateHighDimClusterData(cA, 25, 2),
        clusterB: generateHighDimClusterData(cB, 25, 2),
        clusterC: generateHighDimClusterData(cC, 25, 2),
        centerA: cA,
        centerB: cB,
        centerC: cC,
      };
    }, []);

  // 当前维度的特征值
  const currentFeatures = features.slice(0, dimensions);

  // 计算到各类别中心的距离（使用当前维度）
  const distanceA = euclideanDistanceND(
    currentFeatures,
    centerA.slice(0, dimensions),
  );
  const distanceB = euclideanDistanceND(
    currentFeatures,
    centerB.slice(0, dimensions),
  );
  const distanceC = euclideanDistanceND(
    currentFeatures,
    centerC.slice(0, dimensions),
  );

  // 找最近的类别
  const nearestCluster =
    distanceA <= distanceB && distanceA <= distanceC
      ? "A"
      : distanceB <= distanceC
        ? "B"
        : "C";
  const nearestDistance = Math.min(distanceA, distanceB, distanceC);

  // 处理滑块变化时高亮对应轴
  const handleFeatureChange = useCallback(
    (axisIndex: number, value: number) => {
      const lastValue = lastValuesRef.current[axisIndex];
      const direction = value >= lastValue ? "positive" : "negative";

      lastValuesRef.current[axisIndex] = value;
      setHighlightedAxis({ axis: axisIndex, direction });

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }

      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedAxis(null);
      }, 2000);

      setFeatures((prev) => {
        const newFeatures = [...prev];
        newFeatures[axisIndex] = value;
        return newFeatures;
      });
    },
    [],
  );

  // 切换维度
  const handleDimensionChange = (newDim: number) => {
    setDimensions(newDim);
    // 如果是2D模式切换到更高维度，自动切回3D
    if (viewMode === "2d" && newDim > 2) {
      setViewMode("3d");
    }
  };

  const resetQueryPoint = () => {
    setFeatures([0, 0, 0, 0, 0]);
    setHighlightedAxis(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* 头部 */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                AI 特征空间演示
              </h1>
              <p className="text-slate-600 mt-1">
                当前{" "}
                <span className="font-semibold text-purple-600">
                  {dimensions}D
                </span>{" "}
                空间 | 查询点与{" "}
                <span className="font-semibold">类别 {nearestCluster}</span>{" "}
                最相似 (距离: {nearestDistance.toFixed(2)})
              </p>
            </div>
            <div className="text-right">
              <div className="flex gap-4 text-sm text-slate-600 mb-1">
                <span>最近邻</span>
                <span>类别 A</span>
                <span>类别 B</span>
                <span>类别 C</span>
              </div>
              <div className="flex gap-4 items-center">
                <span className="font-bold text-slate-800">
                  类别 {nearestCluster}
                </span>
                <span className="font-semibold text-red-700">
                  {distanceA.toFixed(2)}
                </span>
                <span className="font-semibold text-blue-700">
                  {distanceB.toFixed(2)}
                </span>
                <span className="font-semibold text-green-700">
                  {distanceC.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* 维度选择器 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-slate-700">
              维度数量:
            </span>
            <div className="flex bg-slate-100 rounded-lg p-1">
              {[2, 3, 4, 5].map((dim) => (
                <button
                  key={dim}
                  onClick={() => handleDimensionChange(dim)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    dimensions === dim
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {dim}D
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 ml-2">
              {dimensions > 3 ? `(${dimensions - 3}个隐藏维度投影到3D)` : ""}
            </span>
          </div>

          {/* 3D可视化区域 */}
          <div className="h-[500px] bg-slate-50 rounded-xl overflow-hidden mb-6 relative">
            <Canvas camera={{ position: [8, 6, 8], fov: 50 }}>
              <Scene
                queryFeatures={currentFeatures}
                highlightedAxis={highlightedAxis}
                clusterA={clusterA.map((p) => p.slice(0, dimensions))}
                clusterB={clusterB.map((p) => p.slice(0, dimensions))}
                clusterC={clusterC.map((p) => p.slice(0, dimensions))}
                centerA={centerA.slice(0, dimensions)}
                centerB={centerB.slice(0, dimensions)}
                centerC={centerC.slice(0, dimensions)}
                nearestCluster={nearestCluster}
                viewMode={viewMode}
                dimensions={dimensions}
                animationProgress={animationProgress}
              />
            </Canvas>

            {/* 维度转换动画提示 */}
            {animationProgress > 0 && animationProgress < 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                {viewMode === "2d" ? "压缩 Z 轴..." : "展开 Z 轴..."}
              </div>
            )}
          </div>

          {/* 控制面板 */}
          <div className="space-y-4">
            {/* 特征滑块 - 动态生成 */}
            <div className="grid grid-cols-2 gap-6">
              {Array.from({ length: Math.min(dimensions, 3) }).map((_, i) => {
                const dimConfig = DIMENSION_COLORS[i];
                const isDisabled = viewMode === "2d" && i === 2;
                const axisLabels = ["X", "Y", "Z"];

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 transition-opacity duration-300 ${isDisabled ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    <span
                      className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                        highlightedAxis?.axis === i
                          ? `font-bold scale-110`
                          : "text-slate-700"
                      }`}
                      style={{
                        color:
                          highlightedAxis?.axis === i
                            ? dimConfig.color
                            : undefined,
                      }}
                    >
                      特征 {i + 1} ({axisLabels[i]})
                    </span>
                    <Slider
                      value={[features[i]]}
                      onValueChange={([v]) => handleFeatureChange(i, v)}
                      min={-5}
                      max={5}
                      step={0.1}
                      disabled={isDisabled}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={features[i].toFixed(0)}
                      onChange={(e) =>
                        handleFeatureChange(i, parseFloat(e.target.value) || 0)
                      }
                      disabled={isDisabled}
                      className={`w-16 text-center transition-all duration-300 ${
                        highlightedAxis?.axis === i ? "ring-2" : ""
                      }`}
                      style={{
                        borderColor:
                          highlightedAxis?.axis === i
                            ? dimConfig.color
                            : undefined,
                        boxShadow:
                          highlightedAxis?.axis === i
                            ? `0 0 0 2px ${dimConfig.lightColor}`
                            : undefined,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* 高维特征滑块（4D、5D） */}
            {dimensions > 3 && (
              <div className="border-t border-slate-200 pt-4 mt-4">
                <p className="text-sm text-slate-500 mb-3">
                  高维特征（投影到3D空间）
                </p>
                <div className="grid grid-cols-2 gap-6">
                  {Array.from({ length: dimensions - 3 }).map((_, idx) => {
                    const i = idx + 3;
                    const dimConfig = DIMENSION_COLORS[i];
                    const dimLabels = ["W", "V"];

                    return (
                      <div key={i} className="flex items-center gap-4">
                        <span
                          className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                            highlightedAxis?.axis === i
                              ? `font-bold scale-110`
                              : "text-slate-700"
                          }`}
                          style={{
                            color:
                              highlightedAxis?.axis === i
                                ? dimConfig.color
                                : undefined,
                          }}
                        >
                          特征 {i + 1} ({dimLabels[idx]})
                        </span>
                        <Slider
                          value={[features[i]]}
                          onValueChange={([v]) => handleFeatureChange(i, v)}
                          min={-5}
                          max={5}
                          step={0.1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={features[i].toFixed(0)}
                          onChange={(e) =>
                            handleFeatureChange(
                              i,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className={`w-16 text-center transition-all duration-300`}
                          style={{
                            borderColor:
                              highlightedAxis?.axis === i
                                ? dimConfig.color
                                : undefined,
                            boxShadow:
                              highlightedAxis?.axis === i
                                ? `0 0 0 2px ${dimConfig.lightColor}`
                                : undefined,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 视角模式和重置 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700">
                  视角模式
                </span>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("3d")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === "3d"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    3D 空间
                  </button>
                  <button
                    onClick={() => setViewMode("2d")}
                    disabled={dimensions < 3}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === "2d"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    } ${dimensions < 3 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    2D 投影
                  </button>
                </div>
              </div>
              <Button
                onClick={resetQueryPoint}
                variant="secondary"
                className="bg-slate-200 hover:bg-slate-300 text-slate-700"
              >
                重置查询点
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
