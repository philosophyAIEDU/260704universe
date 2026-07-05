// UI 문구 사전 (한국어 / English)
// 모든 화면 텍스트는 여기서만 가져온다.

import { loadPref, savePref } from './storage.js';

const DICT = {
  ko: {
    appTitle: '문장나무',
    analyzeLangLabel: '분석',
    langKo: '국어',
    langEn: '영어',
    levelBeginner: '초급',
    levelIntermediate: '중급',
    levelAdvanced: '고급',
    library: '문장 라이브러리',
    presentMode: '수업 모드',
    presentExit: '수업 모드 끝내기',
    settings: '설정',

    inputPlaceholder: '분석할 문장을 입력하세요 (예: 나는 사과를 먹는다)',
    analyzeBtn: '분석하기',
    stepReveal: '단계별 펼치기',
    stepNext: '다음 ▶',
    stepHint: '‘다음’을 누르면 성분이 하나씩 나타나요',
    showAll: '전체 보기',
    quizModeBtn: '퀴즈 모드',
    orderModeBtn: '어순 연습',
    exportPng: 'PNG 저장',
    legendToggle: '범례 켜기/끄기',
    aiPrecise: '✨ AI 정밀 분석',
    compareToggle: '로컬 분석 결과 보기',
    treeEmpty: '문장을 입력하고 ‘분석하기’를 눌러 보세요 🌱',
    noSentence: '먼저 문장을 입력해 주세요!',
    moreExamples: '🔄 다른 예문 보기',
    enParseNote: '※ 영어 자동 분석은 근사치예요. 더 정확한 분석은 ✨ AI 정밀 분석을 눌러 보세요.',
    aiParseDone: '✨ AI 정밀 분석 결과로 바꿨어요. 로컬 결과와 비교하려면 체크박스를 사용하세요.',

    role_sentence: '문장',
    role_subject: '주어',
    role_predicate: '서술어',
    role_object: '목적어',
    role_complement: '보어',
    role_adverbial: '부사어',
    role_determiner: '관형어',
    role_other: '기타',

    pos_noun: '명사',
    pos_verb: '동사',
    pos_adj: '형용사',
    pos_adv: '부사',
    pos_josa: '조사',
    pos_det: '관형사',
    pos_pron: '대명사',
    pos_prep: '전치사',
    pos_num: '수사',
    pos_copula: '체언+이다',
    pos_aux: '조동사',
    pos_art: '관사',
    pos_unknown: '미상',

    translationBtn: '🌍 문장 전체 번역 보기',
    grammarBtn: '💡 핵심 문법 포인트',
    aiPanelTitle: 'AI 교수님',
    explainBtn: '이 문장 설명해줘',
    similarBtn: '비슷한 예문 3개',
    quizAiBtn: '이 문장으로 퀴즈 내줘',
    askPlaceholder: '자유롭게 질문해 보세요 (예: 왜 ‘를’이 붙어요?)',
    askBtn: '질문',
    aiThinking: 'AI 교수님이 생각 중이에요… 🤔',
    aiNeedsKey: 'AI 기능은 ⚙️ 설정에서 Gemini API 키를 넣으면 켜집니다.',
    aiMeaningNeedsKey: 'AI 뜻보기는 설정에서 키를 넣으면 켜집니다.',
    aiErrKey: 'API 키가 올바르지 않은 것 같아요. ⚙️ 설정에서 키를 다시 확인해 주세요.',
    aiErrQuota: '오늘 사용량이 많아 잠시 쉬어야 해요. 조금 뒤에 다시 시도해 주세요.',
    aiErrNetwork: '인터넷 연결이 불안정해요. 로컬 분석 기능은 계속 쓸 수 있어요.',
    aiErrParse: 'AI 응답을 읽지 못했어요. 로컬 분석 결과를 그대로 보여드릴게요.',
    aiDisclaimer: 'ℹ️ AI 번역·뜻풀이는 참고용이며 가끔 부정확할 수 있어요. AI 사용 시 문장이 구글 서버로 전송됩니다.',
    meaningLoading: '뜻을 찾는 중…',

    quizIntro: '트리에서 ‘?’ 노드를 누르고, 어떤 성분인지 아래에서 골라 보세요!',
    quizPickRole: '“{text}” — 이 부분은 무슨 성분일까요?',
    quizCorrect: ['정답이에요! 🎉 잘했어요!', '맞아요! 👏 대단한데요?', '딩동댕! 정확해요! 🌟'],
    quizWrong: '음, 다시 볼까요? 힌트: 조사(단어 끝)와 위치를 살펴보세요 🙂',
    quizDone: '모든 성분을 다 맞혔어요! 🏆 정말 훌륭해요!',
    exitPractice: '돌아가기',

    orderIntro: '카드를 끌어서(또는 두 카드를 차례로 눌러서) 바른 어순으로 만들어 보세요.',
    orderCheck: '확인',
    orderShuffle: '다시 섞기',
    orderCorrect: '완벽해요! 🎉 바른 어순이에요. 정답 트리를 보여드릴게요.',
    orderWrong: '조금 아쉬워요! 초록색은 맞은 자리, 빨간색은 다시 생각해 볼 자리예요 🙂',

    settingsTitle: '⚙️ 설정',
    apiKeyLabel: 'Gemini API 키 (선택)',
    apiKeyPlaceholder: 'AIza… 로 시작하는 키를 붙여넣으세요',
    apiKeyPrivacy: '🔒 키는 이 브라우저에만 저장되며 구글 외 어디에도 전송되지 않습니다.',
    aiLevelLabel: 'AI 설명 수준',
    saveBtn: '저장',
    closeBtn: '닫기',
    savedMsg: '저장했어요! ✅',
    privacyWarn: '⚠️ AI 기능을 쓰면 입력한 문장이 구글(Gemini) 서버로 전송됩니다. 학생 이름 등 개인정보는 예문에 넣지 마세요.',

    libraryTitle: '📚 문장 라이브러리',
    saveCurrentBtn: '현재 문장 저장',
    namePrompt: '이름표 (예: 3반 수업)',
    loadBtn: '불러오기',
    deleteBtn: '삭제',
    libraryEmpty: '아직 저장한 문장이 없어요. 문장을 분석한 뒤 저장해 보세요!',
    savedToLibrary: '라이브러리에 저장했어요! 📚',
  },

  en: {
    appTitle: 'SentenceTree',
    analyzeLangLabel: 'Analyze',
    langKo: 'Korean',
    langEn: 'English',
    levelBeginner: 'Beginner',
    levelIntermediate: 'Intermediate',
    levelAdvanced: 'Advanced',
    library: 'Sentence Library',
    presentMode: 'Class Mode',
    presentExit: 'Exit Class Mode',
    settings: 'Settings',

    inputPlaceholder: 'Type a sentence to analyze (e.g., 나는 사과를 먹는다)',
    analyzeBtn: 'Analyze',
    stepReveal: 'Step by Step',
    stepNext: 'Next ▶',
    stepHint: 'Press “Next” to reveal one part at a time',
    showAll: 'Show All',
    quizModeBtn: 'Quiz Mode',
    orderModeBtn: 'Word Order Practice',
    exportPng: 'Save as PNG',
    legendToggle: 'Legend On/Off',
    aiPrecise: '✨ AI Deep Parse',
    compareToggle: 'Show local parse',
    treeEmpty: 'Type a sentence and press “Analyze” 🌱',
    noSentence: 'Please type a sentence first!',
    moreExamples: '🔄 More examples',
    enParseNote: '※ The built-in parser is approximate. Try ✨ AI Deep Parse for better accuracy.',
    aiParseDone: '✨ Switched to the AI parse. Use the checkbox to compare with the local parse.',

    role_sentence: 'Sentence',
    role_subject: 'Subject',
    role_predicate: 'Predicate',
    role_object: 'Object',
    role_complement: 'Complement',
    role_adverbial: 'Adverbial',
    role_determiner: 'Modifier',
    role_other: 'Other',

    pos_noun: 'Noun',
    pos_verb: 'Verb',
    pos_adj: 'Adjective',
    pos_adv: 'Adverb',
    pos_josa: 'Particle',
    pos_det: 'Determiner',
    pos_pron: 'Pronoun',
    pos_prep: 'Preposition',
    pos_num: 'Numeral',
    pos_copula: 'Noun + -ida (copula)',
    pos_aux: 'Auxiliary',
    pos_art: 'Article',
    pos_unknown: 'Unknown',

    translationBtn: '🌍 Translate this sentence',
    grammarBtn: '💡 Key grammar point',
    aiPanelTitle: 'AI Professor',
    explainBtn: 'Explain this sentence',
    similarBtn: '3 similar examples',
    quizAiBtn: 'Make a quiz from this',
    askPlaceholder: 'Ask anything (e.g., why is “를” attached here?)',
    askBtn: 'Ask',
    aiThinking: 'The AI professor is thinking… 🤔',
    aiNeedsKey: 'AI features turn on when you add a Gemini API key in ⚙️ Settings.',
    aiMeaningNeedsKey: 'AI word meanings turn on when you add a key in Settings.',
    aiErrKey: 'The API key looks invalid. Please check it in ⚙️ Settings.',
    aiErrQuota: 'The AI has hit its usage limit for now. Please try again a bit later.',
    aiErrNetwork: 'Network trouble. Local analysis keeps working offline.',
    aiErrParse: 'Could not read the AI response. Showing the local parse instead.',
    aiDisclaimer: 'ℹ️ AI translations and meanings are for reference and may occasionally be inaccurate. Using AI sends your sentence to Google.',
    meaningLoading: 'Looking up the meaning…',

    quizIntro: 'Tap a “?” node in the tree, then pick which part of the sentence it is!',
    quizPickRole: '“{text}” — which part of the sentence is this?',
    quizCorrect: ['Correct! 🎉 Great job!', 'Yes! 👏 Impressive!', 'Exactly right! 🌟'],
    quizWrong: 'Hmm, want to look again? Hint: check the particle (word ending) and position 🙂',
    quizDone: 'You got every part right! 🏆 Wonderful!',
    exitPractice: 'Back',

    orderIntro: 'Drag the cards (or tap two cards to swap) to build the correct word order.',
    orderCheck: 'Check',
    orderShuffle: 'Shuffle again',
    orderCorrect: 'Perfect! 🎉 That is the right order. Here comes the answer tree.',
    orderWrong: 'Almost! Green cards are in the right place, red ones need another look 🙂',

    settingsTitle: '⚙️ Settings',
    apiKeyLabel: 'Gemini API key (optional)',
    apiKeyPlaceholder: 'Paste a key starting with AIza…',
    apiKeyPrivacy: '🔒 Your key is stored only in this browser and is never sent anywhere except Google.',
    aiLevelLabel: 'AI explanation level',
    saveBtn: 'Save',
    closeBtn: 'Close',
    savedMsg: 'Saved! ✅',
    privacyWarn: '⚠️ Using AI features sends your sentence to Google (Gemini). Do not include personal information such as student names.',

    libraryTitle: '📚 Sentence Library',
    saveCurrentBtn: 'Save current sentence',
    namePrompt: 'Label (e.g., Class 3)',
    loadBtn: 'Load',
    deleteBtn: 'Delete',
    libraryEmpty: 'No saved sentences yet. Analyze a sentence, then save it!',
    savedToLibrary: 'Saved to the library! 📚',
  },
};

let current = 'ko';

export function initI18n() {
  const saved = loadPref('uiLang', null);
  if (saved && DICT[saved]) {
    current = saved;
  } else {
    const nav = (navigator.language || 'ko').toLowerCase();
    current = nav.startsWith('ko') ? 'ko' : 'en';
  }
  return current;
}

export function getUiLang() { return current; }

export function setUiLang(lang) {
  if (!DICT[lang]) return;
  current = lang;
  savePref('uiLang', lang);
}

export function t(key, vars) {
  let value = DICT[current][key];
  if (value === undefined) value = DICT.ko[key];
  if (value === undefined) return key;
  if (Array.isArray(value)) return value;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(`{${k}}`, v);
    }
  }
  return value;
}

// 무작위 격려 문구 등 배열 항목에서 하나 뽑기
export function tPick(key) {
  const value = t(key);
  if (Array.isArray(value)) return value[Math.floor(Math.random() * value.length)];
  return value;
}

// data-i18n / data-i18n-placeholder 속성이 붙은 요소를 모두 갱신
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}
