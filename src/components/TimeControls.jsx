const SPEED_OPTIONS = [
  { label: '1일/초', daysPerSec: 1 },
  { label: '10일/초', daysPerSec: 10 },
  { label: '1개월/초', daysPerSec: 30 },
  { label: '1년/초', daysPerSec: 365 },
];

const DAY_MS = 86400000;

function formatDate(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

/** 날짜 슬라이더 + 재생/일시정지 + 속도 선택 + "지금" 버튼 */
export default function TimeControls({
  dateMs,
  setDateMs,
  playing,
  setPlaying,
  speed,
  setSpeed,
  minMs,
  maxMs,
}) {
  const goNow = () => {
    const now = Date.now();
    setDateMs(Math.min(Math.max(now, minMs), maxMs));
  };

  return (
    <div className="panel time-controls">
      <div className="time-date">{formatDate(dateMs)}</div>

      <input
        type="range"
        className="time-slider"
        min={minMs}
        max={maxMs}
        step={DAY_MS}
        value={dateMs}
        onChange={(e) => setDateMs(Number(e.target.value))}
        aria-label="날짜 슬라이더 (1800년 ~ 2050년)"
      />
      <div className="time-range-labels">
        <span>1800년</span>
        <span>2050년</span>
      </div>

      <div className="time-buttons">
        <button
          className="btn btn-primary"
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? '일시정지' : '재생'}
        >
          {playing ? '⏸ 일시정지' : '▶ 재생'}
        </button>
        <button className="btn" onClick={goNow}>
          📅 지금
        </button>
      </div>

      <div className="speed-buttons" role="group" aria-label="재생 속도">
        {SPEED_OPTIONS.map((opt) => (
          <button
            key={opt.daysPerSec}
            className={`btn btn-small ${speed === opt.daysPerSec ? 'btn-active' : ''}`}
            onClick={() => setSpeed(opt.daysPerSec)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
