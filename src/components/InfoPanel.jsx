import { useState } from 'react';

/** 행성 클릭 시 표시되는 정보 팝업 + 도전 퀴즈 */
export default function InfoPanel({ planet, onClose, onQuizCorrect }) {
  // 선택한 보기 번호 (null = 아직 안 풂). App에서 key={planet.id}로 행성마다 초기화됨.
  const [picked, setPicked] = useState(null);

  if (!planet) return null;

  const rows = [
    ['지름', planet.physical.diameter],
    ['질량', planet.physical.mass],
    ['공전 주기', planet.physical.orbitalPeriod],
    ['자전 주기', planet.physical.rotationPeriod],
    ['자전축 기울기', planet.physical.tilt],
    ['위성 수', planet.physical.moons],
    ['태양까지 평균 거리', planet.physical.distance],
  ];

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
