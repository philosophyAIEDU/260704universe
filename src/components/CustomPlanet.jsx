import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import {
  makeCustomElements,
  positionAtDate,
  toScenePosition,
  orbitPoints,
} from '../utils/kepler.js';

const COLOR = '#ff6ec7';

/** 궤도 실험실에서 만든 "나만의 행성" — 분홍색 궤도와 함께 3D 씬에 표시 */
export default function CustomPlanet({ config, dateMs, pretty }) {
  const elements = useMemo(
    () => makeCustomElements(config.a, config.e),
    [config.a, config.e]
  );

  // 궤도 모양은 a·e에만 의존하므로 날짜와 무관하게 J2000 기준으로 한 번만 계산.
  // 이심률이 크면 태양 근처 표본이 성기어 각져 보이므로 표본 수를 넉넉히 잡음.
  const points = useMemo(
    () => orbitPoints(elements, Date.UTC(2000, 0, 1), pretty, 540),
    [elements, pretty]
  );

  const position = useMemo(
    () => toScenePosition(positionAtDate(elements, new Date(dateMs)), pretty),
    [elements, dateMs, pretty]
  );

  const size = pretty ? 0.5 : 0.13;

  return (
    <group>
      <Line points={points} color={COLOR} transparent opacity={0.75} lineWidth={1.5} />
      <group position={position}>
        <mesh>
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial
            color={COLOR}
            emissive={COLOR}
            emissiveIntensity={0.35}
            roughness={0.7}
          />
        </mesh>
        <Html
          position={[0, size + 0.5, 0]}
          center
          distanceFactor={26}
          style={{ pointerEvents: 'none' }}
        >
          <div className="planet-label" style={{ color: COLOR }}>
            내 행성 ✨
          </div>
        </Html>
      </group>
    </group>
  );
}
