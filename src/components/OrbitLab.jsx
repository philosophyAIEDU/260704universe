const A_PRESETS = [
  { label: '지구 (1 AU)', a: 1 },
  { label: '화성 (1.5)', a: 1.52 },
  { label: '목성 (5.2)', a: 5.2 },
  { label: '명왕성 (39.5)', a: 39.5 },
];

/** 공전 주기를 읽기 좋게: 2년 미만은 일 단위 병기 */
function formatPeriod(years) {
  if (years < 2) return `${years.toFixed(2)}년 (약 ${Math.round(years * 365.25)}일)`;
  return `${years.toFixed(1)}년`;
}

/**
 * 궤도 실험실 — 학생이 슬라이더로 "나만의 행성"의
 * 장반경 a와 이심률 e를 조절하며 케플러 법칙을 직접 실험합니다.
 * 조절 결과는 3D 화면에 분홍색 궤도로 즉시 그려집니다.
 */
export default function OrbitLab({ config, onChange, onClose }) {
  const { a, e } = config;
  const periodYears = Math.pow(a, 1.5); // 케플러 제3법칙 P² = a³
  const perihelion = a * (1 - e);
  const aphelion = a * (1 + e);

  const set = (patch) => onChange({ ...config, ...patch });

  return (
    <div className="panel lab-panel" role="region" aria-label="궤도 실험실">
      <div className="lab-header">
        <h2>🧪 궤도 실험실</h2>
        <button className="btn btn-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>

      <p className="lab-intro">
        슬라이더를 움직여 <strong style={{ color: '#ff8fd8' }}>나만의 행성 ✨</strong>
        (분홍색 궤도)을 조종해보세요. ▶ 재생을 누르면 움직임이 보여요!
      </p>

      <label className="lab-label">
        태양까지의 거리 (장반경 a): <strong>{a.toFixed(1)} AU</strong>
        <input
          type="range"
          className="lab-slider"
          min={0.2}
          max={40}
          step={0.1}
          value={a}
          onChange={(ev) => set({ a: Number(ev.target.value) })}
          aria-label="장반경 (0.2 ~ 40 AU)"
        />
      </label>

      <div className="lab-presets" role="group" aria-label="거리 예시">
        {A_PRESETS.map((p) => (
          <button
            key={p.label}
            className={`btn btn-small ${Math.abs(a - p.a) < 0.05 ? 'btn-active' : ''}`}
            onClick={() => set({ a: p.a })}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="lab-label">
        궤도 찌그러짐 (이심률 e): <strong>{e.toFixed(2)}</strong>
        <input
          type="range"
          className="lab-slider"
          min={0}
          max={0.9}
          step={0.01}
          value={e}
          onChange={(ev) => set({ e: Number(ev.target.value) })}
          aria-label="이심률 (0 ~ 0.9)"
        />
      </label>
      <p className="lab-hint">
        {e < 0.05
          ? '거의 완전한 원 궤도예요 (지구: 0.02)'
          : e < 0.3
            ? '살짝 찌그러진 타원이에요 (수성: 0.21)'
            : '혜성처럼 길쭉한 궤도예요! (핼리 혜성: 0.97)'}
      </p>

      <div className="lab-results">
        <div className="lab-result">
          <span>내 행성의 1년</span>
          <strong>{formatPeriod(periodYears)}</strong>
        </div>
        <div className="lab-result">
          <span>태양과 가장 가까울 때</span>
          <strong>{perihelion.toFixed(2)} AU</strong>
        </div>
        <div className="lab-result">
          <span>태양과 가장 멀 때</span>
          <strong>{aphelion.toFixed(2)} AU</strong>
        </div>
      </div>

      <div className="lab-law">
        <p>
          📐 <strong>케플러 제3법칙</strong>: 1년의 길이² = 거리³ (P² = a³). 거리를
          늘리면 1년이 얼마나 길어지는지 위 숫자로 확인해보세요.
        </p>
        <p>
          🏃 <strong>케플러 제2법칙</strong>: 이심률을 크게 하고 재생하면, 행성이 태양
          가까이에서 빨라지고 멀리서 느려지는 게 보여요.
        </p>
      </div>
    </div>
  );
}
