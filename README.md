# 🌌 실시간 3D 태양계 오러리 + AI 천문학 교수님

케플러 궤도 계산(JPL 근사식)으로 1800년~2050년 사이 아무 날짜의 실제 행성 위치를 3D로 보여주고,
Gemini API 기반 "AI 천문학 교수님"에게 한국어로 질문할 수 있는 교육용 웹 앱입니다.

## 주요 기능

- 태양 + 8개 행성 3D 렌더링 (토성 고리, 지구·화성·목성·토성 대표 위성 포함)
- 실제 공전 주기 비율 공전 + 실제 자전축 기울기 자전, 궤도선 표시, 별 배경
- 날짜 슬라이더(1800~2050년), 재생/일시정지, 속도 선택(1일·10일·1개월·1년/초), "지금" 버튼
- 행성 클릭 시 물리 데이터 팝업 (지름·질량·공전/자전 주기·기울기·위성 수·거리·흥미 사실)
- 크기·거리 표시 토글: [사실적 비율] / [보기 좋게] (어느 모드든 궤도상 위치는 실제 계산값)
- AI 천문학 교수님 채팅 (Gemini API, 난이도 초등/중등/고등 선택)

> ※ 행성 크기와 거리는 보기 좋게 조정된 값이며 실제 비율이 아닙니다.
> 위치는 1800~2050년 구간에서 근사적으로 정확합니다.

## 기술 스택

Vite + React (JavaScript), three / @react-three/fiber / @react-three/drei.
백엔드·DB 없음 — 모든 데이터(API 키 포함)는 브라우저 메모리에만 존재합니다.

## 1. 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 을 엽니다.

프로덕션 빌드는:

```bash
npm run build   # dist/ 폴더 생성
npm run preview # 빌드 결과 미리보기
```

## 2. Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/apikey) 에 접속해 구글 계정으로 로그인
2. **API 키 만들기(Create API key)** 클릭 → 발급된 키 복사
3. 앱 화면 우측 하단 "AI 천문학 교수님" 패널의 API 키 입력창에 붙여넣기

키는 브라우저 메모리에만 저장되고 구글 API 서버로만 전송됩니다.
**코드나 저장소에 API 키를 절대 넣지 마세요** (공개 배포 시 키가 노출됩니다).

## 3. Netlify 배포

### 방법 A (쉬움) — 드래그 앤 드롭

1. `npm run build` 로 `dist` 폴더 생성 (이 저장소에는 미리 빌드된 `dist`가 포함되어 있습니다)
2. [app.netlify.com/drop](https://app.netlify.com/drop) 접속
3. `dist` 폴더를 통째로 드래그 앤 드롭 → 즉시 배포 완료

### 방법 B — GitHub 저장소 연결 (자동 배포)

1. 이 프로젝트를 GitHub에 푸시
2. [Netlify](https://app.netlify.com)에서 **Add new site → Import an existing project** 선택
3. GitHub 저장소 연결 — 루트의 `netlify.toml` 덕분에 빌드 명령(`npm run build`)과
   배포 폴더(`dist`)가 자동으로 인식됩니다
4. **Deploy** 클릭 → 이후 커밋을 푸시할 때마다 자동으로 재배포

## 프로젝트 구조

```
├── index.html
├── package.json
├── vite.config.js        # base: './' (경로 문제로 인한 빈 화면 예방)
├── netlify.toml          # Netlify 빌드/리다이렉트 설정
└── src
    ├── main.jsx
    ├── App.jsx           # 상태 관리(날짜·재생·선택 행성·표시 모드)
    ├── styles.css
    ├── data/planets.js   # 행성 물리 데이터 + JPL 케플러 궤도 요소
    ├── utils/kepler.js   # 날짜 → 행성 위치 계산 (케플러 방정식)
    └── components
        ├── SolarSystem.jsx  # 3D 씬 (태양·궤도선·별 배경·카메라)
        ├── Planet.jsx       # 행성·위성·고리·라벨
        ├── TimeControls.jsx # 날짜 슬라이더/재생/속도/지금
        ├── InfoPanel.jsx    # 행성 정보 팝업
        └── AIProfessor.jsx  # AI 교수님 채팅 + API 키 입력
```
