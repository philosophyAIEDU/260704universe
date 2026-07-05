import { useEffect, useRef, useState } from 'react';
import SolarSystem from './components/SolarSystem.jsx';
import TimeControls from './components/TimeControls.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import AIProfessor from './components/AIProfessor.jsx';
import MissionPanel from './components/MissionPanel.jsx';
import OrbitLab from './components/OrbitLab.jsx';
import { MISSIONS } from './data/missions.js';
import { PLANETS } from './data/planets.js';
import { distanceBetweenAU } from './utils/kepler.js';

const MIN_MS = Date.UTC(1800, 0, 1);
const MAX_MS = Date.UTC(2050, 11, 31);
const PAST_MS = Date.UTC(1900, 0, 1); // "과거로 시간여행" 미션 기준
const DAY_MS = 86400000;
const PROGRESS_KEY = 'orrery-mission-progress-v1';
const WEIGHT_KEY = 'orrery-weight-kg';

// "화성 대접근" 미션: 지구-화성 거리 7,000만 km 미만
const AU_KM = 149597870.7;
const MARS_CLOSE_KM = 70000000;
const EARTH_EL = PLANETS.find((p) => p.id === 'earth').elements;
const MARS_EL = PLANETS.find((p) => p.id === 'mars').elements;

const clampDate = (ms) => Math.min(Math.max(ms, MIN_MS), MAX_MS);

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) ?? {};
  } catch {
    return {};
  }
}

export default function App() {
  const [dateMs, setDateMs] = useState(() => clampDate(Date.now()));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10); // 일/초
  const [selected, setSelected] = useState(null);
  const [pretty, setPretty] = useState(true); // true = 보기 좋게(기본), false = 사실적 비율

  // 궤도 실험실: null이면 닫힘, {a, e}면 열림 + 3D 씬에 "내 행성" 표시
  const [lab, setLab] = useState(null);

  // "오러리가 뭐예요?" 설명 펼침 여부
  const [showOrrery, setShowOrrery] = useState(false);

  // 몸무게 체험: 입력값은 저장되어 행성을 바꿔도 유지됨
  const [weightKg, setWeightKg] = useState(() => localStorage.getItem(WEIGHT_KEY) ?? '');
  useEffect(() => {
    try {
      localStorage.setItem(WEIGHT_KEY, weightKg);
    } catch {
      /* 저장 실패는 무시 */
    }
  }, [weightKg]);

  // 탐구 미션 진행 상태 (localStorage에 저장되어 다음 수업에도 이어짐)
  const [progress, setProgress] = useState(loadProgress);
  const [toast, setToast] = useState(null);

  const mark = (patch) =>
    setProgress((prev) => {
      const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
      return next;
    });

  // 진행 상태 저장
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      /* 사생활 보호 모드 등에서 저장 실패는 무시 */
    }
  }, [progress]);

  // 미션 달성 감지 → 축하 토스트 (새로 달성된 미션의 배움 포인트 표시)
  const prevDoneRef = useRef(null);
  useEffect(() => {
    const done = MISSIONS.filter((m) => m.isDone(progress)).map((m) => m.id);
    if (prevDoneRef.current !== null) {
      const fresh = done.find((id) => !prevDoneRef.current.includes(id));
      if (fresh) setToast(MISSIONS.find((m) => m.id === fresh));
    }
    prevDoneRef.current = done;
  }, [progress]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

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

  // --- 미션 감지 ---

  // "시간의 마법사": 5초 이상 연속 재생
  useEffect(() => {
    if (!playing || progress.played) return;
    const t = setTimeout(() => mark({ played: true }), 5000);
    return () => clearTimeout(t);
  }, [playing, progress.played]);

  // "느림보 해왕성": 1년/초 속도로 재생
  useEffect(() => {
    if (playing && speed === 365 && !progress.fastPlayed) mark({ fastPlayed: true });
  }, [playing, speed, progress.fastPlayed]);

  // "진짜 우주 느끼기": 사실적 비율 모드
  useEffect(() => {
    if (!pretty && !progress.realScale) mark({ realScale: true });
  }, [pretty, progress.realScale]);

  // "과거로 시간여행": 1900년 이전
  useEffect(() => {
    if (dateMs < PAST_MS && !progress.pastTravel) mark({ pastTravel: true });
  }, [dateMs, progress.pastTravel]);

  // "화성 대접근 발견": 지구-화성 거리 7,000만 km 미만
  useEffect(() => {
    if (progress.marsClose) return;
    const km = distanceBetweenAU(EARTH_EL, MARS_EL, new Date(dateMs)) * AU_KM;
    if (km < MARS_CLOSE_KM) mark({ marsClose: true });
  }, [dateMs, progress.marsClose]);

  // "행성 탐험가": 행성 클릭 기록
  const handleSelect = (planet) => {
    setSelected(planet);
    if (planet && !progress.visited?.[planet.id]) {
      mark((prev) => ({ visited: { ...prev.visited, [planet.id]: true } }));
    }
  };

  // "퀴즈 명사수": 행성 퀴즈 정답 기록
  const handleQuizCorrect = (planetId) => {
    if (!progress.quizCorrect?.[planetId]) {
      mark((prev) => ({ quizCorrect: { ...prev.quizCorrect, [planetId]: true } }));
    }
  };

  // "나만의 행성": 실험실에서 슬라이더 조작
  const handleLabChange = (config) => {
    setLab(config);
    if (!progress.labTouched) mark({ labTouched: true });
  };

  const resetProgress = () => setProgress({});

  return (
    <div className="app">
      <SolarSystem
        dateMs={dateMs}
        pretty={pretty}
        selectedId={selected?.id ?? null}
        onSelect={handleSelect}
        labConfig={lab}
      />

      <header className="panel top-bar">
        <div className="top-title">
          <h1>🌌 실시간 3D 태양계 오러리</h1>
          <button
            className={`btn btn-small orrery-help-btn ${showOrrery ? 'btn-active' : ''}`}
            onClick={() => setShowOrrery(!showOrrery)}
            aria-expanded={showOrrery}
          >
            ❓ 오러리가 뭐예요?
          </button>
        </div>

        {showOrrery && (
          <div className="orrery-info">
            <p>
              <strong>오러리(Orrery)</strong>는 태양 둘레를 도는 행성들의 움직임을
              한눈에 보여주는 <strong>태양계 모형</strong>이에요.
            </p>
            <p>
              약 300년 전 영국에서 시계 기술자들이 톱니바퀴로 행성이 빙글빙글 돌아가는
              기계를 처음 만들었는데, 이 멋진 모형을 선물받은{' '}
              <strong>오러리 백작(Earl of Orrery)</strong>의 이름을 따서
              &lsquo;오러리&rsquo;라고 부르게 되었답니다.
            </p>
            <p>
              옛날 오러리는 톱니바퀴 ⚙️로 돌았지만, 이 앱은 케플러의 궤도 계산으로
              행성들의 <strong>진짜 위치</strong>를 보여주는 디지털 오러리예요!
            </p>
          </div>
        )}

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
          <button
            className={`btn btn-small ${lab ? 'btn-active' : ''}`}
            onClick={() => setLab(lab ? null : { a: 1.8, e: 0.4 })}
          >
            🧪 궤도 실험실
          </button>
        </div>
        <p className="disclaimer">
          ※ 행성 크기와 거리는 보기 좋게 조정된 값이며 실제 비율이 아닙니다. 위치는
          1800~2050년 구간에서 근사적으로 정확합니다.
        </p>
      </header>

      <div className="right-col">
        <MissionPanel progress={progress} onReset={resetProgress} />
        {lab && <OrbitLab config={lab} onChange={handleLabChange} onClose={() => setLab(null)} />}
      </div>

      {toast && (
        <div className="mission-toast" role="status">
          <strong>
            {toast.icon} 미션 완료 — {toast.title}!
          </strong>
          <p>💡 {toast.learn}</p>
        </div>
      )}

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

      <InfoPanel
        key={selected?.id ?? 'none'}
        planet={selected}
        onClose={() => setSelected(null)}
        onQuizCorrect={handleQuizCorrect}
        weightKg={weightKg}
        setWeightKg={setWeightKg}
        dateMs={dateMs}
      />

      <AIProfessor selectedPlanet={selected} dateMs={dateMs} />
    </div>
  );
}
