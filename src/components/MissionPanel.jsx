import { useState } from 'react';
import { MISSIONS } from '../data/missions.js';

/**
 * 탐구 미션 패널 — 학생이 앱을 조작하며 달성하는 미션 체크리스트.
 * 달성한 미션은 "배움 포인트" 설명이 펼쳐집니다.
 */
export default function MissionPanel({ progress, onReset }) {
  const [collapsed, setCollapsed] = useState(
    typeof window !== 'undefined' && window.innerWidth < 900
  );

  const doneCount = MISSIONS.filter((m) => m.isDone(progress)).length;
  const allDone = doneCount === MISSIONS.length;

  return (
    <div className={`panel mission-panel ${collapsed ? 'mission-collapsed' : ''}`}>
      <div className="mission-header" onClick={() => setCollapsed(!collapsed)}>
        <h2>
          {allDone ? '🏆' : '🚀'} 탐구 미션{' '}
          <span className="mission-count">
            {doneCount}/{MISSIONS.length}
          </span>
        </h2>
        <button className="btn btn-close" aria-label={collapsed ? '펼치기' : '접기'}>
          {collapsed ? '▼' : '▲'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="mission-bar" aria-hidden="true">
            <div
              className="mission-bar-fill"
              style={{ width: `${(doneCount / MISSIONS.length) * 100}%` }}
            />
          </div>

          {allDone && (
            <p className="mission-congrats">
              🎉 모든 미션 완료! 여러분은 이제 어엿한 꼬마 천문학자예요. AI 교수님에게
              더 깊은 질문을 던져보세요!
            </p>
          )}

          <ul className="mission-list">
            {MISSIONS.map((m) => {
              const done = m.isDone(progress);
              return (
                <li key={m.id} className={`mission-item ${done ? 'mission-done' : ''}`}>
                  <div className="mission-title">
                    <span className="mission-check">{done ? '✅' : m.icon}</span>
                    <strong>{m.title}</strong>
                    {!done && m.progressText && (
                      <span className="mission-progress">{m.progressText(progress)}</span>
                    )}
                  </div>
                  {done ? (
                    <p className="mission-learn">💡 {m.learn}</p>
                  ) : (
                    <p className="mission-goal">{m.goal}</p>
                  )}
                </li>
              );
            })}
          </ul>

          <button className="btn btn-small mission-reset" onClick={onReset}>
            ↺ 미션 처음부터
          </button>
        </>
      )}
    </div>
  );
}
