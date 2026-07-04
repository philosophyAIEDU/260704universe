/** 행성 클릭 시 표시되는 정보 팝업 */
export default function InfoPanel({ planet, onClose }) {
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
    </div>
  );
}
