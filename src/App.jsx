import { useEffect, useState } from 'react';
import SolarSystem from './components/SolarSystem.jsx';
import TimeControls from './components/TimeControls.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import AIProfessor from './components/AIProfessor.jsx';

const MIN_MS = Date.UTC(1800, 0, 1);
const MAX_MS = Date.UTC(2050, 11, 31);
const DAY_MS = 86400000;

const clampDate = (ms) => Math.min(Math.max(ms, MIN_MS), MAX_MS);

export default function App() {
  const [dateMs, setDateMs] = useState(() => clampDate(Date.now()));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10); // 일/초
  const [selected, setSelected] = useState(null);
  const [pretty, setPretty] = useState(true); // true = 보기 좋게(기본), false = 사실적 비율

  // 재생: requestAnimationFrame으로 날짜를 흐르게 함
  useEffect(() => {
    if (!playing) return;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setDateMs((prev) => clampDate(prev + speed * DAY_MS * dt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  // 2050년 끝에 도달하면 자동 정지
  useEffect(() => {
    if (playing && dateMs >= MAX_MS) setPlaying(false);
  }, [playing, dateMs]);

  return (
    <div className="app">
      <SolarSystem
        dateMs={dateMs}
        pretty={pretty}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
      />

      <header className="panel top-bar">
        <h1>🌌 실시간 3D 태양계 오러리</h1>
        <div className="scale-toggle" role="group" aria-label="크기·거리 표시 모드">
          <button
            className={`btn btn-small ${!pretty ? 'btn-active' : ''}`}
            onClick={() => setPretty(false)}
          >
            사실적 비율
          </button>
          <button
            className={`btn btn-small ${pretty ? 'btn-active' : ''}`}
            onClick={() => setPretty(true)}
          >
            보기 좋게
          </button>
        </div>
        <p className="disclaimer">
          ※ 행성 크기와 거리는 보기 좋게 조정된 값이며 실제 비율이 아닙니다. 위치는
          1800~2050년 구간에서 근사적으로 정확합니다.
        </p>
      </header>

      <TimeControls
        dateMs={dateMs}
        setDateMs={(ms) => setDateMs(clampDate(ms))}
        playing={playing}
        setPlaying={setPlaying}
        speed={speed}
        setSpeed={setSpeed}
        minMs={MIN_MS}
        maxMs={MAX_MS}
      />

      <InfoPanel planet={selected} onClose={() => setSelected(null)} />

      <AIProfessor selectedPlanet={selected} dateMs={dateMs} />
    </div>
  );
}
