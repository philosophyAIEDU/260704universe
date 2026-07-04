// 탐구 미션 정의 — 학생이 앱을 직접 조작해야만 달성되며,
// 달성하는 순간 "배움 포인트"로 관련 천문학 개념을 설명합니다.
//
// progress 필드: visited{행성id}, played, fastPlayed, realScale,
//               pastTravel, marsClose, quizCorrect{행성id}, labTouched

const count = (obj) => Object.keys(obj ?? {}).length;

export const MISSIONS = [
  {
    id: 'explore',
    icon: '🪐',
    title: '행성 탐험가',
    goal: '행성을 3개 이상 클릭해서 정보를 읽어보세요.',
    learn:
      '같은 태양에서 태어난 형제 행성인데도 크기·온도·자전 방향이 전혀 달라요. "왜 이렇게 다를까?"라는 질문이 바로 천문학의 출발점이에요.',
    isDone: (p) => count(p.visited) >= 3,
    progressText: (p) => `${Math.min(3, count(p.visited))}/3`,
  },
  {
    id: 'play',
    icon: '▶️',
    title: '시간의 마법사',
    goal: '▶ 재생 버튼을 눌러 행성들이 도는 모습을 5초 이상 지켜보세요.',
    learn:
      '안쪽 행성일수록 태양의 중력을 강하게 받아 빨리 돌아요. 수성의 1년은 88일, 해왕성의 1년은 무려 165년! 이 규칙을 케플러 제3법칙이라고 해요.',
    isDone: (p) => !!p.played,
  },
  {
    id: 'fast',
    icon: '⏩',
    title: '느림보 해왕성 관찰',
    goal: '속도를 "1년/초"로 바꾸고 재생하면서 해왕성을 지켜보세요.',
    learn:
      '가장 빠른 속도에서도 해왕성은 굼벵이처럼 움직이죠? 1846년에 발견된 해왕성은 2011년에야 발견 후 첫 한 바퀴를 다 돌았어요.',
    isDone: (p) => !!p.fastPlayed,
  },
  {
    id: 'real-scale',
    icon: '📏',
    title: '진짜 우주 느끼기',
    goal: '위쪽의 "사실적 비율" 버튼을 눌러 행성들의 실제 크기 비율을 확인해보세요.',
    learn:
      '우주는 사실 거의 텅 빈 공간이에요. 태양을 축구공 크기로 줄이면 지구는 약 25m 떨어진 곳의 좁쌀 한 톨 크기랍니다.',
    isDone: (p) => !!p.realScale,
  },
  {
    id: 'past',
    icon: '🕰️',
    title: '과거로 시간여행',
    goal: '날짜 슬라이더를 움직여 1900년 이전으로 가보세요.',
    learn:
      '이 앱은 케플러의 궤도 계산으로 과거와 미래의 행성 위치를 재현해요. 천문학자들은 같은 방법으로 수백 년 전 하늘을 "다시 볼" 수 있답니다.',
    isDone: (p) => !!p.pastTravel,
  },
  {
    id: 'mars-close',
    icon: '🔴',
    title: '화성 대접근 발견',
    goal: '화성을 클릭한 뒤 날짜를 조절해 "지구까지" 거리를 7,000만 km 아래로 만들어보세요. (힌트: 대접근은 15~17년마다 — 2018년 여름 근처를 살펴보세요!)',
    learn:
      '2018년 7월 31일, 화성은 지구에서 약 5,760만 km까지 다가왔어요(대접근). 화성 탐사선도 이렇게 가까워지는 시기(약 26개월마다)에 맞춰 발사한답니다.',
    isDone: (p) => !!p.marsClose,
  },
  {
    id: 'quiz',
    icon: '🎯',
    title: '퀴즈 명사수',
    goal: '행성 정보창의 도전 퀴즈를 3개 맞혀보세요.',
    learn:
      '퀴즈 3개 정답, 대단해요! 더 궁금한 것은 AI 천문학 교수님에게 물어보세요. 질문을 많이 하는 사람이 훌륭한 과학자가 된답니다.',
    isDone: (p) => count(p.quizCorrect) >= 3,
    progressText: (p) => `${Math.min(3, count(p.quizCorrect))}/3`,
  },
  {
    id: 'lab',
    icon: '🧪',
    title: '나만의 행성 만들기',
    goal: '궤도 실험실을 열고 슬라이더를 움직여 나만의 행성 궤도를 만들어보세요.',
    learn:
      '거리(a)를 늘리면 1년(P)이 길어지는 걸 발견했나요? P² = a³ — 케플러가 400년 전에 알아낸 우주의 규칙을 방금 직접 실험한 거예요!',
    isDone: (p) => !!p.labTouched,
  },
];
