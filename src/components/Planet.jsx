import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { positionAtDate, toScenePosition, deg2rad } from '../utils/kepler.js';

const EARTH_DIAMETER_KM = 12756;

/** 개별 행성: 케플러 위치 + 자전축 기울기 + 자전 + 위성 + (토성) 고리 */
export default function Planet({ data, dateMs, pretty, isSelected, onSelect }) {
  const spinRef = useRef();

  const position = useMemo(() => {
    const pos = positionAtDate(data.elements, new Date(dateMs));
    return toScenePosition(pos, pretty);
  }, [data, dateMs, pretty]);

  // pretty: 보기 좋게 조정된 크기 / realistic: 행성 간 실제 지름 비율
  const size = pretty
    ? data.displaySize
    : Math.max(0.045, (data.diameterKm / EARTH_DIAMETER_KM) * 0.13);
  const moonScale = size / data.displaySize;

  // 자전: 자전 주기가 짧을수록 빠르게, 역방향(-)이면 반대로 회전 (시각적 속도)
  useFrame((_, delta) => {
    if (spinRef.current) {
      const speed = (24 / Math.abs(data.rotationHours)) * 0.6;
      const dir = data.rotationHours < 0 ? -1 : 1;
      spinRef.current.rotation.y += dir * speed * delta;
    }
  });

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(data);
  };

  return (
    <group position={position}>
      {/* 자전축 기울기 */}
      <group rotation={[0, 0, deg2rad(data.tiltDeg)]}>
        <mesh
          ref={spinRef}
          onClick={handleSelect}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <sphereGeometry args={[size, 48, 48]} />
          <meshStandardMaterial color={data.color} roughness={0.8} metalness={0.05} />
        </mesh>

        {data.hasRings && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[size * 1.35, size * 2.15, 96]} />
            <meshBasicMaterial color="#cbb98a" side={2} transparent opacity={0.55} />
          </mesh>
        )}
      </group>

      {/* 대표 위성 (장식용 원 궤도, 날짜에 따라 각도 변화) */}
      {data.moons.map((moon, i) => {
        const angle =
          ((dateMs / 86400000 / moon.periodDays) % 1) * Math.PI * 2 + i * 1.3;
        const d = moon.dist * moonScale + size;
        return (
          <mesh
            key={moon.name}
            position={[Math.cos(angle) * d, 0, Math.sin(angle) * d]}
          >
            <sphereGeometry args={[Math.max(0.03, moon.size * moonScale), 24, 24]} />
            <meshStandardMaterial color={moon.color} roughness={0.9} />
          </mesh>
        );
      })}

      {/* 선택 표시 */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[size * 1.35, 24, 24]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.25} />
        </mesh>
      )}

      {/* 이름 라벨 */}
      <Html
        position={[0, size + 0.5, 0]}
        center
        distanceFactor={26}
        style={{ pointerEvents: 'none' }}
      >
        <div className="planet-label" onClick={handleSelect}>
          {data.nameKo}
        </div>
      </Html>
    </group>
  );
}
