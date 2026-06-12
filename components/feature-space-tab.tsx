"use client";

import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

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

export const POINT_PALETTE = [
  "#6366f1",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
];

export interface FeatureSpaceValues {
  f1: number;
  f2: number;
  f3: number;
  f4: number;
  f5: number;
  f6: number;
  f7: number;
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

function toSpace2(vals: FeatureSpaceValues) {
  return new THREE.Vector3(
    (vals.f4 / 360) * 8 - 4,
    ((vals.f5 - 0.1) / 0.9) * 6 - 3,
    ((vals.f6 - 0.1) / 0.9) * 6 - 3,
  );
}
function toSpace3X(vals: FeatureSpaceValues): number {
  return (vals.f7 / 3) * 8 - 4;
}

// ─────────────────────────────────────────────────────────────
// Camera rig
// ─────────────────────────────────────────────────────────────
function CameraRig({ activeDim }: { activeDim: number }) {
  const { camera, get } = useThree();

  const configs = [
    { pos: new THREE.Vector3(18, 12, 28), lookAt: new THREE.Vector3(0, 0, 0) },
    { pos: new THREE.Vector3(20, 16, 30), lookAt: new THREE.Vector3(0, 5, 0) },
    { pos: new THREE.Vector3(22, 24, 34), lookAt: new THREE.Vector3(0, 13, 0) },
  ];
  const cfgIdx = activeDim >= 7 ? 2 : activeDim >= 4 ? 1 : 0;
  const targetPos = configs[cfgIdx].pos;
  const targetLookAt = configs[cfgIdx].lookAt;

  const prevCfgIdx = useRef(cfgIdx);
  const isAnimating = useRef(false);
  const smoothPos = useRef(targetPos.clone());
  const smoothLookAt = useRef(targetLookAt.clone());

  useEffect(() => {
    if (cfgIdx !== prevCfgIdx.current) {
      prevCfgIdx.current = cfgIdx;
      // Start from current camera position, but also sync current OrbitControls target
      smoothPos.current.copy(camera.position);
      const controls = get().controls as any;
      if (controls?.target) {
        smoothLookAt.current.copy(controls.target);
      }
      isAnimating.current = true;
    }
  }, [cfgIdx]);

  useFrame((_, delta) => {
    if (!isAnimating.current) return;
    const dt = Math.min(delta, 0.05);
    const k = 1 - Math.pow(0.5, dt / 0.75);

    smoothPos.current.lerp(targetPos, k);
    smoothLookAt.current.lerp(targetLookAt, k);

    // Update camera position
    camera.position.copy(smoothPos.current);
    camera.updateProjectionMatrix();

    // Critically: keep OrbitControls.target in sync with our lookAt
    // This prevents the "snap" when the user first touches the mouse
    const controls = get().controls as any;
    if (controls?.target) {
      controls.target.copy(smoothLookAt.current);
      controls.update();
    } else {
      camera.lookAt(smoothLookAt.current);
    }

    const done =
      smoothPos.current.distanceTo(targetPos) < 0.005 &&
      smoothLookAt.current.distanceTo(targetLookAt) < 0.005;
    if (done) isAnimating.current = false;
  });
  return null;
}

// ─────────────────────────────────────────────────────────────
// Space 1 axes — collapse Y when space2 emerges
// ─────────────────────────────────────────────────────────────
function Space1Axes({
  activeDim,
  collapse,
}: {
  activeDim: number;
  collapse: number;
}) {
  const LEN = 6,
    FC = FEATURE_COLORS;
  const yScale = 1 - collapse;

  return (
    <group>
      {activeDim >= 1 && (
        <>
          <Line
            points={[
              [-LEN, 0, 0],
              [LEN, 0, 0],
            ]}
            color={FC.f1}
            lineWidth={2.5}
            transparent
            opacity={0.9}
          />
          <Html
            center
            distanceFactor={14}
            position={[LEN + 1, 0, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: FC.f1,
                whiteSpace: "nowrap",
              }}
            >
              X · f1
            </div>
          </Html>
        </>
      )}
      {activeDim >= 2 && (
        <>
          <Line
            points={[
              [0, 0, -LEN],
              [0, 0, LEN],
            ]}
            color={FC.f2}
            lineWidth={2.5}
            transparent
            opacity={0.9}
          />
          <Html
            center
            distanceFactor={14}
            position={[0, 0, LEN + 1]}
            style={{ pointerEvents: "none" }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: FC.f2,
                whiteSpace: "nowrap",
              }}
            >
              Z · f2
            </div>
          </Html>
        </>
      )}
      {activeDim >= 3 && yScale > 0.02 && (
        <>
          <Line
            points={[
              [0, 0, 0],
              [0, LEN * yScale, 0],
            ]}
            color={FC.f3}
            lineWidth={2.5}
            transparent
            opacity={0.9 * yScale}
          />
          <Html
            center
            distanceFactor={14}
            position={[0, LEN * yScale + 0.8, 0]}
            style={{ pointerEvents: "none", opacity: yScale }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: FC.f3,
                whiteSpace: "nowrap",
              }}
            >
              Y · f3
            </div>
          </Html>
        </>
      )}
      {/* Plane visualisation when collapsing */}
      {collapse > 0.05 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[LEN * 2, LEN * 2]} />
          <meshBasicMaterial
            color={FC.f3}
            transparent
            opacity={collapse * 0.07}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      <mesh>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <gridHelper args={[14, 28, "#cbd5e1", "#e2e8f0"]} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Space 2 axes — emerges upward, itself collapses when space3 comes
// ─────────────────────────────────────────────────────────────
function Space2Axes({
  activeDim,
  emerge,
  collapse,
}: {
  activeDim: number;
  emerge: number;
  collapse: number;
}) {
  const LEN = 5,
    FC = FEATURE_COLORS;
  const yOff = lerp(0, 10, emerge);
  const yScale = 1 - collapse;
  if (emerge < 0.02) return null;

  return (
    <group position={[0, yOff, 0]}>
      {/* Floor plane — space1 projected */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LEN * 2, LEN * 2]} />
        <meshBasicMaterial
          color={FC.f4}
          transparent
          opacity={emerge * 0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
      {activeDim >= 4 && (
        <>
          <Line
            points={[
              [-LEN * emerge, 0, 0],
              [LEN * emerge, 0, 0],
            ]}
            color={FC.f4}
            lineWidth={2}
            transparent
            opacity={0.85 * emerge}
          />
          <Html
            center
            distanceFactor={14}
            position={[LEN * emerge + 0.8, 0, 0]}
            style={{ pointerEvents: "none", opacity: emerge }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: FC.f4,
                whiteSpace: "nowrap",
              }}
            >
              色相 · f4
            </div>
          </Html>
        </>
      )}
      {activeDim >= 5 && (
        <>
          <Line
            points={[
              [0, 0, -LEN * emerge],
              [0, 0, LEN * emerge],
            ]}
            color={FC.f5}
            lineWidth={2}
            transparent
            opacity={0.85 * emerge}
          />
          <Html
            center
            distanceFactor={14}
            position={[0, 0, LEN * emerge + 0.8]}
            style={{ pointerEvents: "none", opacity: emerge }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: FC.f5,
                whiteSpace: "nowrap",
              }}
            >
              大小 · f5
            </div>
          </Html>
        </>
      )}
      {activeDim >= 6 && yScale > 0.02 && (
        <>
          <Line
            points={[
              [0, 0, 0],
              [0, LEN * emerge * yScale, 0],
            ]}
            color={FC.f6}
            lineWidth={2}
            transparent
            opacity={0.85 * emerge * yScale}
          />
          <Html
            center
            distanceFactor={14}
            position={[0, LEN * emerge * yScale + 0.8, 0]}
            style={{ pointerEvents: "none", opacity: emerge * yScale }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: FC.f6,
                whiteSpace: "nowrap",
              }}
            >
              透明 · f6
            </div>
          </Html>
        </>
      )}
      {collapse > 0.05 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[LEN * 2, LEN * 2]} />
          <meshBasicMaterial
            color={FC.f6}
            transparent
            opacity={collapse * 0.07}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      <mesh>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Space 3 axis — emerges above space 2
// ─────────────────────────────────────────────────────────────
function Space3Axis({
  activeDim,
  emerge2,
  emerge3,
}: {
  activeDim: number;
  emerge2: number;
  emerge3: number;
}) {
  const LEN = 5,
    FC = FEATURE_COLORS;
  const yOff = lerp(0, 10, emerge2) + lerp(0, 10, emerge3);
  if (emerge3 < 0.02 || activeDim < 7) return null;

  return (
    <group position={[0, yOff, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LEN * 2, LEN * 2]} />
        <meshBasicMaterial
          color={FC.f7}
          transparent
          opacity={emerge3 * 0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line
        points={[
          [-LEN * emerge3, 0, 0],
          [LEN * emerge3, 0, 0],
        ]}
        color={FC.f7}
        lineWidth={2}
        transparent
        opacity={0.85 * emerge3}
      />
      <Html
        center
        distanceFactor={14}
        position={[LEN * emerge3 + 0.8, 0, 0]}
        style={{ pointerEvents: "none", opacity: emerge3 }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: FC.f7,
            whiteSpace: "nowrap",
          }}
        >
          形状 · f7
        </div>
      </Html>
      <mesh>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Shape geometry
// ─────────────────────────────────────────────────────────────
const SHAPES = [
  (k: string) => <sphereGeometry key={k} args={[1, 32, 32]} />,
  (k: string) => <boxGeometry key={k} args={[1.4, 1.4, 1.4]} />,
  (k: string) => <octahedronGeometry key={k} args={[1.2]} />,
  (k: string) => <torusGeometry key={k} args={[0.7, 0.35, 16, 32]} />,
];

// ─────────────────────────────────────────────────────────────
// Point mesh rendered at a given position
// ─────────────────────────────────────────────────────────────
function PointMesh({
  position,
  col,
  size,
  alpha,
  shapeT,
  label,
  pointColor,
  isActive,
  dimTag,
}: {
  position: THREE.Vector3;
  col: THREE.Color;
  size: number;
  alpha: number;
  shapeT: number;
  label: string;
  pointColor: string;
  isActive: boolean;
  dimTag?: string;
}) {
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const matRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) groupRef.current.position.copy(position);
    const idx1 = Math.floor(shapeT),
      idx2 = Math.min(3, Math.ceil(shapeT)),
      t = shapeT - idx1;
    for (let i = 0; i < 4; i++) {
      const mesh = meshRefs.current[i],
        mat = matRefs.current[i];
      if (!mesh || !mat) continue;
      let o = 0;
      if (i === idx1 && i === idx2) o = 1;
      else if (i === idx1) o = 1 - t;
      else if (i === idx2) o = t;
      mat.color.copy(col);
      mat.emissive.copy(col).multiplyScalar(isActive ? 0.3 : 0.05);
      mat.opacity = alpha * o;
      mat.transparent = true;
      mesh.visible = o > 0.001;
      if (mesh.visible) mesh.scale.setScalar(size);
    }
  });

  return (
    <group ref={groupRef}>
      {SHAPES.map((geo, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el as THREE.Mesh;
          }}
        >
          {geo(`m${i}`)}
          <meshStandardMaterial
            ref={(el) => {
              matRefs.current[i] = el as THREE.MeshStandardMaterial;
            }}
            roughness={0.12}
            metalness={0.15}
          />
        </mesh>
      ))}
      <Html
        center
        position={[0, size + 0.45, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            background: isActive ? pointColor : "rgba(255,255,255,0.9)",
            border: `1.5px solid ${pointColor}`,
            borderRadius: 5,
            padding: "1px 6px",
            fontSize: 9,
            fontWeight: 700,
            color: isActive ? "#fff" : pointColor,
            whiteSpace: "nowrap",
            boxShadow: isActive
              ? `0 2px 6px ${pointColor}55`
              : "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {label}
          {dimTag ? ` · ${dimTag}` : ""}
        </div>
      </Html>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Multi-space data point: same element visible in all spaces
// ─────────────────────────────────────────────────────────────
function MultiSpacePoint({
  vals,
  activeDim,
  pointColor,
  label,
  isActive,
  emerge2,
  emerge3,
  collapse1,
  collapse2,
  p4,
  p5,
  p6,
}: {
  vals: FeatureSpaceValues;
  activeDim: number;
  pointColor: string;
  label: string;
  isActive: boolean;
  emerge2: number;
  emerge3: number;
  collapse1: number;
  collapse2: number;
  p4: number;
  p5: number;
  p6: number;
}) {
  // Space 1: Y collapses as space2 emerges
  const pos1 = new THREE.Vector3(
    activeDim >= 1 ? vals.f1 : 0,
    activeDim >= 3 ? vals.f3 * (1 - collapse1) : 0,
    activeDim >= 2 ? vals.f2 : 0,
  );
  // Space 2: each axis activated independently by its own progress
  // p4 drives X (f4/色相), p5 drives Z (f5/大小), p6 drives Y (f6/透明)
  const s2local = toSpace2(vals);
  const s2yBase = lerp(0, 10, emerge2); // floor of space2 rises with emerge2
  const pos2 = new THREE.Vector3(
    s2local.x * p4, // X: grows when dim4 activates
    s2yBase + s2local.y * p6 * (1 - collapse2), // Y: grows when dim6 activates
    s2local.z * p5, // Z: grows when dim5 activates
  );
  // Space 3: single X axis driven by p7 (emerge3)
  const s3x = toSpace3X(vals);
  const pos3 = new THREE.Vector3(
    s3x * emerge3,
    lerp(0, 10, emerge2) + lerp(0, 10, emerge3),
    0,
  );

  const pal = new THREE.Color(pointColor);
  // Use palette color consistently — spatial position carries all info
  const s1col = pal.clone();
  const baseSize = 0.32 * (isActive ? 1 : 0.65);
  const opacity = isActive ? 0.88 : 0.6;
  const shapeT = 0; // shape fixed to sphere; position encodes data

  const colObj = new THREE.Color(pointColor);

  return (
    <>
      {/* Space 1 point */}
      <PointMesh
        position={pos1}
        col={s1col.clone()}
        size={baseSize}
        alpha={opacity}
        shapeT={shapeT}
        label={label}
        pointColor={pointColor}
        isActive={isActive}
      />

      {/* Space 2 point */}
      {emerge2 > 0.05 && (
        <PointMesh
          position={pos2}
          col={pal.clone()}
          size={baseSize * 0.85 * emerge2}
          alpha={opacity * emerge2}
          shapeT={0}
          label={label}
          pointColor={pointColor}
          isActive={isActive}
          dimTag="S2"
        />
      )}

      {/* Space 3 point */}
      {emerge3 > 0.05 && activeDim >= 7 && (
        <PointMesh
          position={pos3}
          col={pal.clone().lerp(new THREE.Color(FEATURE_COLORS.f7), 0.4)}
          size={baseSize * 0.7 * emerge3}
          alpha={opacity * emerge3}
          shapeT={0}
          label={label}
          pointColor={pointColor}
          isActive={isActive}
          dimTag="S3"
        />
      )}

      {/* S1 → S2 connector: same element across spaces */}
      {emerge2 > 0.05 && (
        <Line
          points={[
            pos1.toArray() as [number, number, number],
            pos2.toArray() as [number, number, number],
          ]}
          color={colObj}
          lineWidth={isActive ? 1.2 : 0.6}
          transparent
          opacity={0.35 * emerge2 * (isActive ? 1 : 0.4)}
          dashed
          dashSize={0.22}
          gapSize={0.14}
        />
      )}

      {/* S2 → S3 connector */}
      {emerge3 > 0.05 && activeDim >= 7 && (
        <Line
          points={[
            pos2.toArray() as [number, number, number],
            pos3.toArray() as [number, number, number],
          ]}
          color={colObj}
          lineWidth={isActive ? 1.2 : 0.6}
          transparent
          opacity={0.35 * emerge3 * (isActive ? 1 : 0.4)}
          dashed
          dashSize={0.22}
          gapSize={0.14}
        />
      )}

      {/* Drop-line in space1 */}
      {activeDim >= 3 && Math.abs(vals.f3) > 0.05 && (
        <Line
          points={[
            pos1.toArray() as [number, number, number],
            [pos1.x, 0, pos1.z],
          ]}
          color={FEATURE_COLORS.f3}
          lineWidth={1}
          transparent
          opacity={isActive ? 0.45 : 0.12}
          dashed
          dashSize={0.12}
          gapSize={0.08}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Distance lines in Space 1
// ─────────────────────────────────────────────────────────────
function DistanceLines({
  points,
  activeDim,
  activeIdx,
  simExpanded,
  collapse1,
}: {
  points: Array<{ vals: FeatureSpaceValues; color: string }>;
  activeDim: number;
  activeIdx: number;
  simExpanded: boolean;
  collapse1: number;
}) {
  const positions = points.map(
    (pt) =>
      new THREE.Vector3(
        activeDim >= 1 ? pt.vals.f1 : 0,
        activeDim >= 3 ? pt.vals.f3 * (1 - collapse1) : 0,
        activeDim >= 2 ? pt.vals.f2 : 0,
      ),
  );
  const pairs: Array<{ i: number; j: number; dist: number }> = [];
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++)
      pairs.push({ i, j, dist: positions[i].distanceTo(positions[j]) });
  if (!pairs.length) return null;
  const dists = pairs.map((p) => p.dist),
    minD = Math.min(...dists),
    maxD = Math.max(...dists),
    rng = maxD - minD || 1;
  return (
    <>
      {pairs.map(({ i, j, dist }) => {
        const t = (dist - minD) / rng;
        const isRelated = i === activeIdx || j === activeIdx;
        const fromIdx = i === activeIdx ? i : j === activeIdx ? j : i;
        const toIdx = i === activeIdx ? j : j === activeIdx ? i : j;
        let opacity: number, lineWidth: number;
        if (simExpanded) {
          opacity = isRelated ? lerp(0.85, 0.35, t) : 0.05;
          lineWidth = isRelated ? lerp(2.5, 1.0, t) : 0.4;
        } else {
          opacity = lerp(0.12, 0.03, t);
          lineWidth = lerp(0.8, 0.3, t);
        }
        const colA = new THREE.Color(points[fromIdx].color),
          colB = new THREE.Color(points[toIdx].color);
        return (
          <Line
            key={`dl-${i}-${j}`}
            points={[
              positions[fromIdx].toArray() as [number, number, number],
              positions[toIdx].toArray() as [number, number, number],
            ]}
            vertexColors={[colA, colB]}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            dashed={!isRelated}
            dashSize={0.15}
            gapSize={0.1}
          />
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Full scene — smooth emerge/collapse transitions
// ─────────────────────────────────────────────────────────────
function Scene({
  points,
  activeDim,
  activeIdx,
  simExpanded,
}: {
  points: Array<{ label: string; vals: FeatureSpaceValues; color: string }>;
  activeDim: number;
  activeIdx: number;
  simExpanded: boolean;
}) {
  // Per-dimension smooth progress (0→1 when that dim activates, 1→0 when deactivated)
  // Space1: dims 1-3 via collapse1 (Y folds when dim4 activates)
  // Space2: dims 4,5,6 each get their own axis progress
  // Space3: dim7
  const refs = useRef({ c1: 0, d4: 0, d5: 0, d6: 0, c2: 0, d7: 0 });
  const [prog, setProg] = useState({
    c1: 0,
    d4: 0,
    d5: 0,
    d6: 0,
    c2: 0,
    d7: 0,
  });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // halflife 0.55s — feels snappy but smooth
    const k = 1 - Math.pow(0.5, dt / 0.55);
    const r = refs.current;
    const targets = {
      c1: activeDim >= 4 ? 1 : 0,
      d4: activeDim >= 4 ? 1 : 0,
      d5: activeDim >= 5 ? 1 : 0,
      d6: activeDim >= 6 ? 1 : 0,
      c2: activeDim >= 7 ? 1 : 0,
      d7: activeDim >= 7 ? 1 : 0,
    };
    // Pure exponential — NO snap, NO threshold jump
    // The difference shrinks by factor k each frame; visually indistinguishable from target after ~2s
    let needsUpdate = false;
    const move = (cur: number, target: number) => {
      const diff = target - cur;
      if (Math.abs(diff) < 1e-5) return cur; // truly converged, stop updating
      needsUpdate = true;
      return cur + diff * k;
    };
    r.c1 = move(r.c1, targets.c1);
    r.d4 = move(r.d4, targets.d4);
    r.d5 = move(r.d5, targets.d5);
    r.d6 = move(r.d6, targets.d6);
    r.c2 = move(r.c2, targets.c2);
    r.d7 = move(r.d7, targets.d7);
    if (needsUpdate) setProg({ ...r });
  });

  // Derived values for axes/planes (use max of d4/d5/d6 to know if space2 is visible at all)
  const collapse1 = prog.c1;
  const emerge2 = Math.max(prog.d4, prog.d5, prog.d6); // space2 visible when any axis active
  const collapse2 = prog.c2;
  const emerge3 = prog.d7;
  // Per-axis progress for point position in space2
  const p4 = prog.d4,
    p5 = prog.d5,
    p6 = prog.d6;

  return (
    <>
      <ambientLight intensity={1.6} />
      <pointLight position={[10, 14, 10]} intensity={1.8} />
      <pointLight position={[-10, 8, -8]} intensity={0.5} color="#a78bfa" />
      <CameraRig activeDim={activeDim} />
      <Space1Axes activeDim={activeDim} collapse={collapse1} />
      <Space2Axes activeDim={activeDim} emerge={emerge2} collapse={collapse2} />
      <Space3Axis activeDim={activeDim} emerge2={emerge2} emerge3={emerge3} />
      <DistanceLines
        points={points.map((p) => ({ vals: p.vals, color: p.color }))}
        activeDim={activeDim}
        activeIdx={activeIdx}
        simExpanded={simExpanded}
        collapse1={collapse1}
      />
      {[
        ...points.map((p, i) => ({ p, i })).filter(({ i }) => i !== activeIdx),
        ...points.map((p, i) => ({ p, i })).filter(({ i }) => i === activeIdx),
      ].map(({ p, i }) => (
        <MultiSpacePoint
          key={i}
          vals={p.vals}
          activeDim={activeDim}
          pointColor={p.color}
          label={p.label}
          isActive={i === activeIdx}
          emerge2={emerge2}
          emerge3={emerge3}
          collapse1={collapse1}
          collapse2={collapse2}
          p4={p4}
          p5={p5}
          p6={p6}
        />
      ))}
      <OrbitControls enablePan enableZoom enableRotate makeDefault />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────
interface FeatureSpaceTabProps {
  allImages?: Array<{
    label: string;
    src?: string;
    values: FeatureSpaceValues;
    rawVec?: number[];
  }>;
}

export default function FeatureSpaceTab({
  allImages,
}: FeatureSpaceTabProps = {}) {
  const hasImages = allImages && allImages.length > 0;
  const points = hasImages
    ? allImages!.map((img, i) => ({
        label: img.label,
        src: img.src,
        vals: img.values,
        rawVec: img.rawVec,
        color: POINT_PALETTE[i % POINT_PALETTE.length],
      }))
    : [];

  const [activeIdx, setActiveIdx] = useState(0);
  const [activeDim, setActiveDim] = useState(3);
  const [simExpanded, setSimExpanded] = useState(false);
  const safeActive = Math.min(activeIdx, points.length - 1);
  useEffect(() => {
    setSimExpanded(false);
  }, [safeActive]);

  const FC = FEATURE_COLORS;
  const cosDist = (a: number[], b: number[]) => {
    const dot = a.reduce((s, v, k) => s + v * b[k], 0),
      mA = Math.sqrt(a.reduce((s, v) => s + v * v, 0)),
      mB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    return mA && mB ? 1 - dot / (mA * mB) : NaN;
  };
  const eucDist = (a: number[], b: number[]) =>
    Math.sqrt(a.reduce((s, v, k) => s + (v - b[k]) ** 2, 0));
  const manDist = (a: number[], b: number[]) =>
    a.reduce((s, v, k) => s + Math.abs(v - b[k]), 0);

  const spaceHint =
    activeDim >= 7
      ? "空间1→平面 · 空间2→平面 · 空间3展开"
      : activeDim >= 4
        ? "空间1→平面 · 空间2展开"
        : "空间1三维展开";

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden w-full">
      <div className="shrink-0">
        <p className="text-xs font-semibold text-foreground">
          特征空间降维演示
        </p>
        <p className="text-[10px] text-muted-foreground">
          {activeDim} 个维度 · {spaceHint}
        </p>
      </div>

      <div className="flex gap-2 flex-1 min-h-0">
        {/* Left panel */}
        <div className="flex flex-col gap-2 w-52 overflow-y-auto overflow-x-hidden shrink-0">
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                维度 (1D–7D)
              </span>
              <span className="text-[9px] text-muted-foreground/60">
                点击数字升/降维
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((dim) => (
                <button
                  key={dim}
                  onClick={() => setActiveDim(dim)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${activeDim === dim ? "bg-foreground text-background shadow-md scale-105" : activeDim > dim ? "bg-foreground/20 text-foreground" : "bg-transparent text-muted-foreground hover:bg-muted"}`}
                >
                  {dim}
                </button>
              ))}
            </div>
            <div className="flex mt-1.5 rounded-md overflow-hidden border border-border text-[8px] font-mono select-none">
              {[
                {
                  label: "空间 1",
                  cols: 3,
                  bg: "#f0f9ff",
                  colors: [FC.f1, FC.f2, FC.f3],
                },
                {
                  label: "空间 2",
                  cols: 3,
                  bg: "#fefce8",
                  colors: [FC.f4, FC.f5, FC.f6],
                },
                { label: "空间3", cols: 1, bg: "#fdf4ff", colors: [FC.f7] },
              ].map((g, gi) => (
                <div
                  key={gi}
                  className="flex flex-col items-center py-1 gap-0.5"
                  style={{ flex: g.cols, background: g.bg }}
                >
                  <div className="flex gap-0.5">
                    {g.colors.map((c, ci) => (
                      <div
                        key={ci}
                        className="w-2 h-2 rounded-full transition-opacity duration-500"
                        style={{
                          background: c,
                          opacity: activeDim >= gi * 3 + ci + 1 ? 1 : 0.15,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground leading-none">
                    {g.label}
                  </span>
                </div>
              ))}
            </div>
            {activeDim >= 4 && (
              <div className="mt-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-[9px] text-amber-700 leading-relaxed">
                空间1已折叠为平面，成为空间2的底层基底
              </div>
            )}
            {activeDim >= 7 && (
              <div className="mt-1 px-2 py-1 rounded-md bg-purple-50 border border-purple-200 text-[9px] text-purple-700 leading-relaxed">
                空间2已折叠为平面，成为空间3的底层基底
              </div>
            )}
          </div>

          <div className="shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
              数据点 ({points.length})
            </span>
            <div className="space-y-1.5">
              {points.map((pt, i) => {
                const isAct = i === safeActive,
                  v = pt.vals;
                return (
                  <div key={i}>
                    <div
                      onClick={() => setActiveIdx(i)}
                      className={`rounded-lg px-2.5 py-2 transition-all border cursor-pointer ${isAct ? "border-current bg-background shadow-sm" : "border-transparent hover:bg-muted"}`}
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
                            className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold"
                            style={{
                              background: pt.color + "22",
                              border: `2px solid ${pt.color}`,
                              color: pt.color,
                            }}
                          >
                            {pt.label}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: pt.color }}
                          />
                          <span className="text-xs font-semibold text-foreground">
                            {pt.label}
                          </span>
                        </div>
                      </div>
                      <div className="font-mono text-[9px] leading-relaxed pl-2 space-y-0.5">
                        {activeDim >= 1 && (
                          <div>
                            <span className="text-muted-foreground">S1:</span>
                            <span style={{ color: FC.f1 }}>
                              {" "}
                              X{v.f1 >= 0 ? "+" : ""}
                              {v.f1.toFixed(1)}
                            </span>
                            {activeDim >= 2 && (
                              <span style={{ color: FC.f2 }}>
                                {" "}
                                Z{v.f2 >= 0 ? "+" : ""}
                                {v.f2.toFixed(1)}
                              </span>
                            )}
                            {activeDim >= 3 && (
                              <span style={{ color: FC.f3 }}>
                                {" "}
                                Y{v.f3 >= 0 ? "+" : ""}
                                {v.f3.toFixed(1)}
                              </span>
                            )}
                          </div>
                        )}
                        {activeDim >= 4 && (
                          <div>
                            <span className="text-muted-foreground">S2:</span>
                            <span style={{ color: FC.f4 }}>
                              {" "}
                              {v.f4.toFixed(0)}°
                            </span>
                            {activeDim >= 5 && (
                              <span style={{ color: FC.f5 }}>
                                {" "}
                                {v.f5.toFixed(2)}
                              </span>
                            )}
                            {activeDim >= 6 && (
                              <span style={{ color: FC.f6 }}>
                                {" "}
                                {v.f6.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                        {activeDim >= 7 && (
                          <div>
                            <span className="text-muted-foreground">S3:</span>
                            <span style={{ color: FC.f7 }}>
                              {" "}
                              {v.f7.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                      {isAct &&
                        activeDim < 7 &&
                        (() => {
                          const lost: string[] = [];
                          if (activeDim < 2) lost.push(`Z(${v.f2.toFixed(1)})`);
                          if (activeDim < 3) lost.push(`Y(${v.f3.toFixed(1)})`);
                          if (activeDim < 4)
                            lost.push(`色相(${v.f4.toFixed(0)}°)`);
                          if (activeDim < 5)
                            lost.push(`大小(${v.f5.toFixed(2)})`);
                          if (activeDim < 6)
                            lost.push(`透明(${v.f6.toFixed(2)})`);
                          if (activeDim < 7)
                            lost.push(`形状(${v.f7.toFixed(2)})`);
                          return lost.length > 0 ? (
                            <div
                              className="mt-1.5 rounded-md px-2 py-1.5 text-[9px]"
                              style={{
                                background: pt.color + "12",
                                border: `1px solid ${pt.color}44`,
                              }}
                            >
                              <div
                                className="font-bold mb-0.5"
                                style={{ color: pt.color }}
                              >
                                👻 高维原貌
                              </div>
                              <div className="text-muted-foreground">
                                丢失: {lost.join(" · ")}
                              </div>
                            </div>
                          ) : null;
                        })()}
                    </div>
                    {isAct && pt.rawVec && (
                      <div className="mt-1">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSimExpanded((s) => !s);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer select-none"
                          style={{
                            background: pt.color + "18",
                            color: pt.color,
                          }}
                        >
                          <span>📐 相似度距离</span>
                          <span>{simExpanded ? "▲" : "▼"}</span>
                        </div>
                        {simExpanded &&
                          (() => {
                            const vecA = pt.rawVec!;
                            const rows = points
                              .map((other, oi) => ({ other, oi }))
                              .filter(({ oi }) => oi !== i)
                              .map(({ other, oi }) => {
                                const vecB = other.rawVec;
                                if (!vecB)
                                  return {
                                    oi,
                                    other,
                                    cos: NaN,
                                    euc: NaN,
                                    man: NaN,
                                  };
                                return {
                                  oi,
                                  other,
                                  cos: cosDist(vecA, vecB),
                                  euc: eucDist(vecA, vecB),
                                  man: manDist(vecA, vecB),
                                };
                              });
                            const valid = (arr: number[]) =>
                              arr.filter((v) => !isNaN(v));
                            const norm = (v: number, vals: number[]) => {
                              const lo = Math.min(...vals),
                                hi = Math.max(...vals);
                              return hi === lo ? 0.5 : (v - lo) / (hi - lo);
                            };
                            const allCos = valid(rows.map((r) => r.cos)),
                              allEuc = valid(rows.map((r) => r.euc)),
                              allMan = valid(rows.map((r) => r.man));
                            return (
                              <div
                                className="mt-1 rounded-md border overflow-hidden"
                                style={{ borderColor: pt.color + "44" }}
                              >
                                {rows.map(({ oi, other, cos, euc, man }) => {
                                  const bar = (n: number, col: string) => (
                                    <div className="h-1 bg-muted rounded-full overflow-hidden mt-0.5">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${(isNaN(n) ? 0 : n) * 100}%`,
                                          background: `linear-gradient(90deg,${col}55,${col})`,
                                        }}
                                      />
                                    </div>
                                  );
                                  return (
                                    <div
                                      key={oi}
                                      className="px-2.5 py-2 border-t first:border-t-0 text-[9px]"
                                      style={{ borderColor: pt.color + "22" }}
                                    >
                                      <div className="flex items-center gap-1.5 mb-1.5">
                                        {other.src ? (
                                          <img
                                            src={other.src}
                                            className="w-5 h-5 rounded object-cover shrink-0"
                                            style={{
                                              outline: `1.5px solid ${other.color}`,
                                            }}
                                          />
                                        ) : (
                                          <div
                                            className="w-5 h-5 rounded shrink-0"
                                            style={{
                                              background: other.color + "33",
                                              border: `1.5px solid ${other.color}`,
                                            }}
                                          />
                                        )}
                                        <span
                                          className="font-bold"
                                          style={{ color: other.color }}
                                        >
                                          {other.label}
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        <div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                              余弦
                                            </span>
                                            <span className="font-mono text-foreground">
                                              {isNaN(cos)
                                                ? "—"
                                                : cos.toFixed(4)}
                                            </span>
                                          </div>
                                          {bar(norm(cos, allCos), other.color)}
                                        </div>
                                        <div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                              欧式
                                            </span>
                                            <span className="font-mono text-foreground">
                                              {isNaN(euc)
                                                ? "—"
                                                : euc.toFixed(3)}
                                            </span>
                                          </div>
                                          {bar(norm(euc, allEuc), other.color)}
                                        </div>
                                        <div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                              曼哈顿
                                            </span>
                                            <span className="font-mono text-foreground">
                                              {isNaN(man)
                                                ? "—"
                                                : man.toFixed(1)}
                                            </span>
                                          </div>
                                          {bar(norm(man, allMan), other.color)}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 rounded-xl overflow-hidden border border-border relative bg-slate-50 min-w-0">
          {!hasImages && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-8">
              <div className="text-4xl opacity-30">🌐</div>
              <p className="text-sm font-semibold text-muted-foreground">
                请先在左侧选择图片
              </p>
              <p className="text-xs text-muted-foreground/70">
                选择图片后，其特征向量将被映射到几何空间中展示
              </p>
            </div>
          )}
          {hasImages && (
            <>
              <Canvas
                camera={{ position: [18, 12, 28], fov: 50 }}
                gl={{ antialias: true }}
              >
                <color attach="background" args={["#f8fafc"]} />
                <Scene
                  points={points}
                  activeDim={activeDim}
                  activeIdx={safeActive}
                  simExpanded={simExpanded}
                />
              </Canvas>
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
              <div className="absolute bottom-3 left-3 flex flex-col gap-1">
                {[
                  {
                    label: "空间1: f1-f3 主XZY",
                    colors: [FC.f1, FC.f2, FC.f3],
                    minDim: 1,
                  },
                  {
                    label: "空间2: f4-f6 ↑展开",
                    colors: [FC.f4, FC.f5, FC.f6],
                    minDim: 4,
                  },
                  { label: "空间3: f7 ↑↑展开", colors: [FC.f7], minDim: 7 },
                ]
                  .filter((g) => activeDim >= g.minDim)
                  .map((g) => (
                    <div
                      key={g.label}
                      className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 border border-border"
                    >
                      <div className="flex gap-0.5">
                        {g.colors.map((c, ci) => (
                          <div
                            key={ci}
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        {g.label}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
