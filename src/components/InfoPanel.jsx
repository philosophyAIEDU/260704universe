import { useState } from 'react';
import { PLANETS } from '../data/planets.js';
import { positionAtDate, distanceBetweenAU } from '../utils/kepler.js';

const AU_KM = 149597870.7;
const LIGHT_KM_PER_SEC = 299792.458;
const MOON_GRAVITY = 0.17; // 달 표면 중력 (지구 = 1)
const EARTH = PLANETS.find((p) => p.id === 'earth');

/** km를 읽기 쉬운 한국어 단위로: 5,760만 km / 7.8억 km */
function formatKm(km) {
  if (km >= 1e8) return `${(km / 1e8).toFixed(1)}억 km`;
  return `${Math.round(km / 1e4).toLocaleString('ko-KR')}만 km`;
}

/** 빛 도달 시간: 42초 / 6분 51초 / 4시간 10분 */
function formatLightTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}초`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 ${Math.round(seconds % 60)}초`;
  return `${Math.floor(seconds / 3600)}시간 ${Math.round((seconds % 3600) / 60)}분`;
}

/** 행성 클릭 시 표시되는 정보 팝업 + 실시간 거리 + 몸무게 체험 + 도전 퀴즈 */
export default function InfoPanel({ planet, onClose, onQuizCorrect, weightKg, setWeightKg, dateMs }) {
  // 선택한 보기 번호 (null = 아직 안 풂). App에서 key={planet.id}로 행성마다 초기화됨.
  const [picked, setPicked] = useState(null);

  if (!planet) return null;

  const rows = [
    ['지름', planet.physical.diameter],
    ['질량', planet.physical.mass],
    ['표면 중력', `지구의 ${planet.gravity}배`],
    ['공전 주기', planet.physical.orbitalPeriod],
    ['자전 주기', planet.physical.rotationPeriod],
    ['자전축 기울기', planet.physical.tilt],
    ['위성 수', planet.physical.moons],
    ['태양까지 평균 거리', planet.physical.distance],
  ];

  // --- 실시간 거리 (날짜 슬라이더를 움직이면 실시간으로 변함) ---
  const date = new Date(dateMs);
  const pos = positionAtDate(planet.elements, date);
  const sunKm = Math.hypot(pos.x, pos.y, pos.z) * AU_KM;
  const isEarth = planet.id === 'earth';
  const earthKm = isEarth ? null : distanceBetweenAU(planet.elements, EARTH.elements, date) * AU_KM;
  const lightSec = (isEarth ? sunKm : earthKm) / LIGHT_KM_PER_SEC;

  // --- 몸무게 체험 ---
  const w = Number(weightKg);
  const validWeight = w > 0 && w < 1000;
  const gravityNote =
    planet.gravity < 0.5
      ? '몸이 훨씬 가벼워져요! 높이뛰기 세계 신기록도 문제없겠죠?'
      : planet.gravity > 1.5
        ? '몸이 두 배 넘게 무거워져요. 일어서는 것도 힘들 거예요!'
        : '지구와 비슷한 무게로 느껴져요.';

  const quiz = planet.quiz;
  const answered = picked !== null;
  const correct = answered && picked === quiz.answer;

  const pick = (i) => {
    if (answered) return;
    setPicked(i);
    if (i === quiz.answer) onQuizCorrect?.(planet.id);
  };

  return (
    <div className="panel info-panel" role="dialog" aria-label={`${planet.nameKo} 정보`}>
      <div className="info-header">
        <h2>
          <span className="info-dot" style={{ background: planet.color }} />
          {planet.nameKo} <span className="info-en">{planet.nameEn}</span>
        </h2>
        <button className="btn btn-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>

      <div className="info-live">
        <h3>📡 지금 이 순간 (날짜를 움직여 보세요!)</h3>
        <div className="info-live-row">
          <span>태양까지</span>
          <strong>{formatKm(sunKm)}</strong>
        </div>
        {!isEarth && (
          <div className="info-live-row">
            <span>지구까지</span>
            <strong>{formatKm(earthKm)}</strong>
          </div>
        )}
        <div className="info-live-row">
          <span>{isEarth ? '햇빛이 지구까지 오는 데' : '빛으로 지구에서'}</span>
          <strong>{formatLightTime(lightSec)}</strong>
        </div>
      </div>

      <table className="info-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="info-weight">
        <h3>🏋️ 이 행성에서 내 몸무게는?</h3>
        <div className="weight-row">
          <input
            type="number"
            min={1}
            max={999}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="몸무게"
            aria-label="내 몸무게 (kg)"
          />
          <span className="weight-unit">kg 이라면 →</span>
          <strong className="weight-result">
            {validWeight
              ? isEarth
                ? `달에서 ${(w * MOON_GRAVITY).toFixed(1)} kg`
                : `${(w * planet.gravity).toFixed(1)} kg`
              : '?'}
          </strong>
        </div>
        {validWeight && (
          <p className="weight-note">
            {isEarth
              ? '지구는 기준(1배)이에요. 대신 달에 가면 중력이 지구의 0.17배라 몸이 깃털처럼 가벼워져요!'
              : gravityNote}
          </p>
        )}
      </div>

      <div className="info-facts">
        <h3>🔭 알고 있나요?</h3>
        <ul>
          {planet.funFacts.map((fact, i) => (
            <li key={i}>{fact}</li>
          ))}
        </ul>
      </div>

      {quiz && (
        <div className="info-quiz">
          <h3>🎯 도전 퀴즈</h3>
          <p className="quiz-question">{quiz.question}</p>
          <div className="quiz-choices">
            {quiz.choices.map((choice, i) => {
              let cls = 'btn quiz-choice';
              if (answered && i === quiz.answer) cls += ' quiz-correct';
              else if (answered && i === picked) cls += ' quiz-wrong';
              return (
                <button key={i} className={cls} onClick={() => pick(i)} disabled={answered}>
                  {['①', '②', '③', '④'][i]} {choice}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className={`quiz-feedback ${correct ? 'quiz-feedback-correct' : ''}`}>
              <strong>{correct ? '🎉 정답이에요!' : '😅 아쉬워요! 정답을 확인하세요.'}</strong>
              <p>{quiz.explain}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
