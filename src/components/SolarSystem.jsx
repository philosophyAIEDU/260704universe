import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import Planet from './Planet.jsx';
import { PLANETS, SUN } from '../data/planets.js';
import { orbitPoints } from '../utils/kepler.js';

/** 궤도선: 궤도 요소가 아주 천천히 변하므로 약 10년 단위 + 표시 모드가 바뀔 때만 재계산 */
function OrbitLine({ planet, dateMs, pretty }) {
  const decadeKey = Math.round(dateMs / (86400000 * 3652.5));
  const points = useMemo(
    () => orbitPoints(planet.elements, decadeKey * 86400000 * 3652.5, pretty),
    [planet, decadeKey, pretty]
  );
  return (
    <Line points={points} color="#8899cc" transparent opacity={0.28} lineWidth={1} />
  );
}

function Sun({ pretty }) {
  const size = pretty ? SUN.displaySize : 1.1;
  return (
    <group>
      <mesh>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial
          color={SUN.color}
          emissive="#ffaa33"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>
      {/* 은은한 코로나(발광 느낌) */}
      <mesh>
        <sphereGeometry args={[size * 1.25, 32, 32]} />
        <meshBasicMaterial color="#ffbb55" transparent opacity={0.15} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={3} decay={0} color="#fff3d6" />
    </group>
  );
}

/** 3D 태양계 씬 전체 */
export default function SolarSystem({ dateMs, pretty, selectedId, onSelect }) {
  return (
    <Canvas
      camera={{ position: [0, 30, 52], fov: 50, near: 0.1, far: 2000 }}
      onPointerMissed={() => onSelect(null)}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#04060f']} />
      <ambientLight intensity={0.3} />

      <Stars radius={400} depth={80} count={6000} factor={5} saturation={0} fade />

      <Sun pretty={pretty} />

      {PLANETS.map((planet) => (
        <OrbitLine key={`orbit-${planet.id}`} planet={planet} dateMs={dateMs} pretty={pretty} />
      ))}

      {PLANETS.map((planet) => (
        <Planet
          key={planet.id}
          data={planet}
          dateMs={dateMs}
          pretty={pretty}
          isSelected={selectedId === planet.id}
          onSelect={onSelect}
        />
      ))}

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3}
        maxDistance={500}
        zoomSpeed={0.8}
      />
    </Canvas>
  );
}
