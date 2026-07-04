// 케플러 궤도 요소(JPL 근사식)로 날짜 → 태양 중심 행성 위치(AU)를 계산합니다.
// 1800~2050년 구간에서 근사적으로 정확합니다.

export function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

// -180 ~ +180 범위로 각도 정규화
function normalizeDeg180(deg) {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

/**
 * 특정 날짜의 행성 위치(태양 중심 황도 좌표, 단위 AU)를 계산합니다.
 * @param {object} el - 궤도 요소 { a, e, I, L, peri, node } (각각 [J2000 기준값, 세기당 변화율])
 * @param {Date} date
 * @returns {{x:number, y:number, z:number}}
 */
export function positionAtDate(el, date) {
  const JD = date.getTime() / 86400000 + 2440587.5;
  const T = (JD - 2451545.0) / 36525;

  const a = el.a[0] + el.a[1] * T;
  const e = el.e[0] + el.e[1] * T;
  const I = deg2rad(el.I[0] + el.I[1] * T);
  const L = el.L[0] + el.L[1] * T;
  const peri = el.peri[0] + el.peri[1] * T;
  const node = deg2rad(el.node[0] + el.node[1] * T);

  const w = deg2rad(peri) - node; // 근일점 인수
  const M = deg2rad(normalizeDeg180(L - peri)); // 평균근점이각 (-π ~ π)

  // 케플러 방정식 E - e·sin(E) = M 을 뉴턴법으로 풂
  let E = M;
  for (let i = 0; i < 7; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }

  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

  const cw = Math.cos(w);
  const sw = Math.sin(w);
  const cn = Math.cos(node);
  const sn = Math.sin(node);
  const ci = Math.cos(I);
  const si = Math.sin(I);

  const x = (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp;
  const y = (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp;
  const z = sw * si * xp + cw * si * yp;

  return { x, y, z };
}

/** 장반경 a(AU)로부터 공전 주기(일)를 구합니다. (케플러 제3법칙) */
export function orbitalPeriodDays(el, date) {
  const JD = date.getTime() / 86400000 + 2440587.5;
  const T = (JD - 2451545.0) / 36525;
  const a = el.a[0] + el.a[1] * T;
  return Math.pow(a, 1.5) * 365.25;
}

/**
 * 황도 좌표(AU) → Three.js 씬 좌표로 변환합니다.
 * - 태양이 원점, (x, z, y) 매핑으로 황도면이 수평이 되게 함
 * - pretty 모드에서는 반지름을 pow(r, 0.5)로 압축하되 방향(각도)은 유지
 */
export function toScenePosition(pos, pretty) {
  const r = Math.hypot(pos.x, pos.y, pos.z);
  if (r === 0) return [0, 0, 0];
  const rDisplay = pretty ? Math.pow(r, 0.5) * 7.5 : r * 3.2;
  const s = rDisplay / r;
  return [pos.x * s, pos.z * s, pos.y * s];
}

/** 두 천체 사이의 실제 거리(AU)를 계산합니다. (예: 지구 ↔ 화성) */
export function distanceBetweenAU(elA, elB, date) {
  const a = positionAtDate(elA, date);
  const b = positionAtDate(elB, date);
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * 궤도 실험실용: 장반경 a(AU)와 이심률 e만으로 간단한 궤도 요소를 만듭니다.
 * 공전 속도는 케플러 제3법칙(P = a^1.5년)을 따르므로,
 * 학생이 a를 조절하면 1년의 길이가 실제 물리 법칙대로 변합니다.
 */
export function makeCustomElements(aAU, e) {
  return {
    a: [aAU, 0],
    e: [e, 0],
    I: [0, 0],
    L: [0, 36000 / Math.pow(aAU, 1.5)], // 세기당 평균 경도 변화율(도) = 360 × 100 / P(년)
    peri: [0, 0],
    node: [0, 0],
  };
}

/**
 * 궤도선(타원)을 그리기 위한 점 배열을 계산합니다.
 * 현재 날짜를 기준으로 한 공전 주기 전체를 표본화합니다.
 * @returns {Array<[number,number,number]>} 씬 좌표 점 목록 (닫힌 곡선)
 */
export function orbitPoints(el, dateMs, pretty, segments = 180) {
  const date = new Date(dateMs);
  const periodMs = orbitalPeriodDays(el, date) * 86400000;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = new Date(dateMs + (i / segments) * periodMs);
    points.push(toScenePosition(positionAtDate(el, t), pretty));
  }
  return points;
}
