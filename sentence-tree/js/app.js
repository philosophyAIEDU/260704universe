// 전체 컨트롤러: 화면 전환, 상태 관리, 각 모듈 연결

import { initI18n, getUiLang, setUiLang, t, applyI18n } from './i18n.js';
import { parseKo } from './parser-ko.js';
import { parseEn } from './parser-en.js';
import { romanizeKo } from './romanize-ko.js';
import { TreeRenderer } from './tree-render.js';
import {
  aiParseSentence, aiWordMeaning, aiTranslate, aiGrammarPoint,
  aiExplain, aiAsk, aiSimilar, aiQuiz,
} from './ai-tutor.js';
import {
  startOrderPractice, checkOrder, reshuffleOrder, endOrderPractice,
  startQuiz, quizPickNode, endQuiz,
} from './practice.js';
import {
  loadPref, savePref, getApiKey, setApiKey,
  getLibrary, addToLibrary, removeFromLibrary,
} from './storage.js';
import { EXAMPLES, ROLE_COLORS, LEGEND_ROLES } from './data.js';

// ---------- 상태 ----------
const state = {
  targetLang: loadPref('targetLang', 'ko'), // 분석 대상 언어
  level: loadPref('level', 'beginner'),
  aiLevel: loadPref('aiLevel', 'beginner'),
  sentence: '',
  localTree: null,   // 로컬 파서 결과
  aiTree: null,      // AI 정밀 분석 결과
  useAi: false,      // 현재 트리가 AI 결과인지
  mode: 'normal',    // normal | step | quiz | order
  legendOn: loadPref('legendOn', true),
  presentation: false,
};

const $ = (id) => document.getElementById(id);
const renderer = new TreeRenderer($('treeSvg'));
const meaningCache = new Map();

// ---------- i18n 라벨 도우미 ----------
const roleLabel = (role) => t(`role_${role}`);
const posLabel = (pos) => (pos && pos.startsWith('pos_') ? t(pos) : (pos || ''));

// ---------- 트리 데이터 만들기 ----------
function buildTree(sentence, parseResult) {
  const components = parseResult.components.map((comp) => ({
    ...comp,
    words: comp.words.map((word) => ({
      ...word,
      roman: state.targetLang === 'ko' ? romanizeKo(word.word + (word.josa || '')) : '',
    })),
  }));
  return { sentence, components };
}

// ---------- 렌더링 ----------
function renderTree(opts = {}) {
  const tree = state.useAi && state.aiTree ? state.aiTree : state.localTree;
  if (!tree) return;
  $('treeEmptyMsg').classList.add('hidden');
  renderer.fontScale = state.presentation ? 1.6 : 1;
  renderer.render(tree, {
    roleLabel,
    posLabel,
    showRoman: state.targetLang === 'ko',
    stepMode: state.mode === 'step',
    quizMode: state.mode === 'quiz',
    onWordClick: handleWordClick,
    onRoleClick: (node) => quizPickNode(node),
    ...opts,
  });
}

function analyze() {
  const input = $('sentenceInput').value.trim();
  if (!input) {
    alert(t('noSentence'));
    return;
  }
  state.sentence = input;
  const parsed = state.targetLang === 'ko' ? parseKo(input) : parseEn(input);
  state.localTree = buildTree(input, parsed);
  state.aiTree = null;
  state.useAi = false;
  $('compareWrap').classList.add('hidden');
  $('compareToggle').checked = false;
  setMode('normal');
  hidePopover();
  $('translationBox').classList.add('hidden');
  $('grammarBox').classList.add('hidden');
  renderTree();
  if (state.targetLang === 'en' && parsed.approximate) {
    showAiOutput(t('enParseNote'));
  }
}

// ---------- 모드 전환 ----------
function setMode(mode) {
  if (state.mode === 'quiz') endQuiz();
  if (state.mode === 'order') endOrderPractice();
  state.mode = mode;

  $('practiceArea').classList.toggle('hidden', mode !== 'quiz' && mode !== 'order');
  $('quizPanel').classList.toggle('hidden', mode !== 'quiz');
  $('orderPanel').classList.toggle('hidden', mode !== 'order');
  $('stepControls').classList.toggle('hidden', mode !== 'step');
  $('quizBtn').classList.toggle('active', mode === 'quiz');
  $('orderBtn').classList.toggle('active', mode === 'order');
  $('stepBtn').classList.toggle('active', mode === 'step');
}

function requireSentence() {
  if (!state.localTree) {
    alert(t('noSentence'));
    return false;
  }
  return true;
}

// 단계별 펼치기
function startStepMode() {
  if (!requireSentence()) return;
  setMode('step');
  renderTree();
}

function showAllMode() {
  if (!requireSentence()) return;
  if (state.mode === 'step') {
    renderer.revealAll();
    setMode('normal');
  } else {
    setMode('normal');
    renderTree();
  }
}

// 퀴즈 모드
function startQuizMode() {
  if (!requireSentence()) return;
  setMode('quiz');
  renderTree();
  startQuiz(renderer, $('quizChoices'), $('quizMsg'), roleLabel);
}

// 어순 연습 모드
function startOrderMode() {
  if (!requireSentence()) return;
  setMode('order');
  renderTree();
  const tokens = state.sentence.split(/\s+/).filter(Boolean);
  startOrderPractice($('orderCards'), tokens, {
    onSolved: () => {
      // 정답 → 정답 트리를 단계별로 펼쳐서 보여준다
      setMode('step');
      renderTree();
      let more = true;
      const timer = setInterval(() => {
        more = renderer.revealNext();
        if (!more) clearInterval(timer);
      }, 700);
    },
  });
}

// ---------- 단어 팝오버 (뜻 보기) ----------
async function handleWordClick(wordData, ev) {
  const pop = $('wordPopover');
  const area = $('treeArea').getBoundingClientRect();
  const x = Math.min(ev.clientX - area.left + 10, area.width - 260);
  const y = Math.min(ev.clientY - area.top + 10, area.height - 120);
  pop.style.left = `${Math.max(6, x)}px`;
  pop.style.top = `${Math.max(6, y)}px`;

  const roman = wordData.roman ? `<div class="pop-roman">${escapeHtml(wordData.roman)}</div>` : '';
  const header = `<div class="pop-word">${escapeHtml(wordData.word)}${wordData.josa ? ' + ' + escapeHtml(wordData.josa) : ''}</div>${roman}`;

  const apiKey = getApiKey();
  if (!apiKey) {
    pop.innerHTML = `${header}<div class="pop-meaning">${escapeHtml(t('aiMeaningNeedsKey'))}</div>`;
    pop.classList.remove('hidden');
    return;
  }

  // AI 정밀 분석 결과에 meaning이 이미 있으면 그대로 사용
  if (wordData.meaning) {
    pop.innerHTML = `${header}<div class="pop-meaning">${escapeHtml(wordData.meaning)}</div>`;
    pop.classList.remove('hidden');
    return;
  }

  const cacheKey = `${state.sentence}|${wordData.word}|${getUiLang()}`;
  if (meaningCache.has(cacheKey)) {
    pop.innerHTML = `${header}<div class="pop-meaning">${escapeHtml(meaningCache.get(cacheKey))}</div>`;
    pop.classList.remove('hidden');
    return;
  }

  pop.innerHTML = `${header}<div class="pop-meaning">${escapeHtml(t('meaningLoading'))}</div>`;
  pop.classList.remove('hidden');
  try {
    const meaning = await aiWordMeaning(apiKey, wordData.word, state.sentence, state.targetLang, getUiLang(), state.aiLevel);
    meaningCache.set(cacheKey, meaning);
    pop.innerHTML = `${header}<div class="pop-meaning">${escapeHtml(meaning)}</div>`;
  } catch (err) {
    pop.innerHTML = `${header}<div class="pop-meaning">${escapeHtml(aiErrorMsg(err))}</div>`;
  }
}

function hidePopover() {
  $('wordPopover').classList.add('hidden');
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// ---------- AI 공통 ----------
function aiErrorMsg(err) {
  const code = err && err.code;
  if (code === 'key') return getApiKey() ? t('aiErrKey') : t('aiNeedsKey');
  if (code === 'quota') return t('aiErrQuota');
  if (code === 'parse') return t('aiErrParse');
  return t('aiErrNetwork');
}

function showAiOutput(text) {
  const out = $('aiOutput');
  out.textContent = text;
  $('aiPanelBody').classList.remove('hidden');
  $('aiPanelArrow').textContent = '▴';
}

async function runAi(button, fn) {
  if (!requireSentence()) return;
  const apiKey = getApiKey();
  if (!apiKey) {
    showAiOutput(t('aiNeedsKey'));
    return;
  }
  showAiOutput(t('aiThinking'));
  if (button) button.disabled = true;
  try {
    await fn(apiKey);
  } catch (err) {
    showAiOutput(aiErrorMsg(err));
  } finally {
    if (button) button.disabled = false;
  }
}

// AI 정밀 분석
function runAiParse() {
  runAi($('aiParseBtn'), async (apiKey) => {
    const result = await aiParseSentence(apiKey, state.sentence, state.targetLang, getUiLang(), state.aiLevel);
    // AI 성분 → 트리 구조로 변환 (role 값 방어 처리)
    const validRoles = new Set(['subject', 'predicate', 'object', 'complement', 'adverbial', 'determiner', 'other']);
    const components = result.components.map((comp) => ({
      role: validRoles.has(comp.role) ? comp.role : 'other',
      text: comp.text || '',
      words: (comp.words || []).map((word) => ({
        word: word.word || '',
        josa: word.josa || '',
        pos: word.pos || '',
        meaning: word.meaning || '',
      })),
    }));
    state.aiTree = buildTree(state.sentence, { components });
    state.useAi = true;
    $('compareWrap').classList.remove('hidden');
    $('compareToggle').checked = false;
    setMode('normal');
    renderTree();
    if (result.translation) {
      $('translationBox').textContent = result.translation;
      $('translationBox').classList.remove('hidden');
    }
    if (result.grammarPoint) {
      $('grammarBox').textContent = result.grammarPoint;
      $('grammarBox').classList.remove('hidden');
    }
    showAiOutput(t('aiParseDone'));
  });
}

// 번역 / 문법 포인트 (접기 가능)
function toggleTranslation() {
  const box = $('translationBox');
  if (!box.classList.contains('hidden')) {
    box.classList.add('hidden');
    return;
  }
  if (!requireSentence()) return;
  const apiKey = getApiKey();
  if (!apiKey) {
    box.textContent = t('aiNeedsKey');
    box.classList.remove('hidden');
    return;
  }
  box.textContent = t('aiThinking');
  box.classList.remove('hidden');
  aiTranslate(apiKey, state.sentence, state.targetLang, getUiLang(), state.aiLevel)
    .then((text) => { box.textContent = text; })
    .catch((err) => { box.textContent = aiErrorMsg(err); });
}

function toggleGrammar() {
  const box = $('grammarBox');
  if (!box.classList.contains('hidden')) {
    box.classList.add('hidden');
    return;
  }
  if (!requireSentence()) return;
  const apiKey = getApiKey();
  if (!apiKey) {
    box.textContent = t('aiNeedsKey');
    box.classList.remove('hidden');
    return;
  }
  box.textContent = t('aiThinking');
  box.classList.remove('hidden');
  aiGrammarPoint(apiKey, state.sentence, state.targetLang, getUiLang(), state.aiLevel)
    .then((text) => { box.textContent = text; })
    .catch((err) => { box.textContent = aiErrorMsg(err); });
}

// AI 퀴즈 (패널 안에 4지선다 렌더)
function runAiQuiz() {
  runAi($('aiQuizBtn'), async (apiKey) => {
    const questions = await aiQuiz(apiKey, state.sentence, state.targetLang, getUiLang(), state.aiLevel);
    const out = $('aiOutput');
    out.innerHTML = '';
    questions.forEach((q, qi) => {
      const wrap = document.createElement('div');
      wrap.className = 'quiz-q';
      const title = document.createElement('div');
      title.textContent = `Q${qi + 1}. ${q.question}`;
      title.style.fontWeight = '700';
      wrap.appendChild(title);
      (q.choices || []).forEach((choice, ci) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-choice';
        btn.textContent = `${ci + 1}) ${choice}`;
        btn.addEventListener('click', () => {
          if (ci === q.answerIndex) {
            btn.classList.add('correct');
            const done = document.createElement('div');
            done.textContent = `✅ ${q.explanation || ''}`;
            done.style.fontSize = '0.9em';
            if (!wrap.querySelector('.quiz-done')) {
              done.className = 'quiz-done';
              wrap.appendChild(done);
            }
          } else {
            btn.classList.add('wrong');
          }
        });
        wrap.appendChild(btn);
      });
      out.appendChild(wrap);
    });
    $('aiPanelBody').classList.remove('hidden');
  });
}

// ---------- 범례 ----------
function renderLegend() {
  const legend = $('legend');
  legend.classList.toggle('hidden', !state.legendOn);
  legend.innerHTML = '';
  for (const role of LEGEND_ROLES) {
    const row = document.createElement('div');
    row.className = 'lg-row';
    const dot = document.createElement('span');
    dot.className = 'lg-dot';
    dot.style.background = ROLE_COLORS[role];
    const label = document.createElement('span');
    label.textContent = roleLabel(role);
    row.appendChild(dot);
    row.appendChild(label);
    legend.appendChild(row);
  }
}

// ---------- 예문 칩 ----------
const CHIP_COUNT = 6; // 한 번에 보여줄 예문 수
let exampleOffset = 0;

function renderExamples(rotate = false) {
  const box = $('exampleChips');
  box.innerHTML = '';
  const list = (EXAMPLES[state.targetLang] || {})[state.level] || [];
  if (rotate) {
    exampleOffset = (exampleOffset + CHIP_COUNT) % Math.max(1, list.length);
  } else {
    exampleOffset = 0;
  }
  // offset부터 CHIP_COUNT개를 순환하며 뽑는다 (예문 전체를 차례로 볼 수 있게)
  const shown = list.length <= CHIP_COUNT
    ? list
    : Array.from({ length: CHIP_COUNT }, (_, k) => list[(exampleOffset + k) % list.length]);
  for (const example of shown) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = example;
    chip.addEventListener('click', () => {
      $('sentenceInput').value = example;
      analyze();
    });
    box.appendChild(chip);
  }
  if (list.length > CHIP_COUNT) {
    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'chip more-chip';
    moreBtn.textContent = t('moreExamples');
    moreBtn.addEventListener('click', () => renderExamples(true));
    box.appendChild(moreBtn);
  }
}

// ---------- 상단 바 ----------
function updateSegButtons() {
  document.querySelectorAll('#targetLangSeg .seg-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === state.targetLang);
  });
  document.querySelectorAll('#levelSeg .seg-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.level === state.level);
  });
  $('uiLangText').textContent = getUiLang() === 'ko' ? '한국어' : 'English';
}

function refreshTexts() {
  applyI18n();
  renderLegend();
  updateSegButtons();
  renderExamples();
  // 트리가 있으면 새 언어 라벨로 다시 그린다
  if (state.localTree && state.mode !== 'quiz' && state.mode !== 'order') {
    renderTree();
    if (state.mode === 'step') renderer.revealAll();
  }
  $('presentBtn').innerHTML = `🖥️ <span>${state.presentation ? t('presentExit') : t('presentMode')}</span>`;
}

// ---------- 수업(발표) 모드 ----------
function togglePresentation() {
  state.presentation = !state.presentation;
  document.body.classList.toggle('presentation', state.presentation);
  if (state.presentation) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
  refreshTexts();
  if (state.localTree) renderTree();
}

// ---------- 설정 모달 ----------
function openSettings() {
  $('apiKeyInput').value = getApiKey();
  $('aiLevelSelect').value = state.aiLevel;
  $('settingsModal').classList.remove('hidden');
}

function saveSettings() {
  setApiKey($('apiKeyInput').value);
  state.aiLevel = $('aiLevelSelect').value;
  savePref('aiLevel', state.aiLevel);
  $('settingsModal').classList.add('hidden');
  showAiOutput(t('savedMsg'));
}

// ---------- 라이브러리 모달 ----------
function openLibrary() {
  renderLibraryList();
  $('libraryModal').classList.remove('hidden');
}

function renderLibraryList() {
  const listEl = $('libList');
  listEl.innerHTML = '';
  const items = getLibrary();
  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'lib-empty';
    li.style.border = 'none';
    li.textContent = t('libraryEmpty');
    listEl.appendChild(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement('li');
    const info = document.createElement('div');
    info.className = 'lib-info';
    info.innerHTML = `<div class="lib-name">${escapeHtml(item.name)}</div>` +
      `<div class="lib-sentence">${escapeHtml(item.sentence)}</div>`;
    const loadBtn = document.createElement('button');
    loadBtn.className = 'tool-btn';
    loadBtn.textContent = t('loadBtn');
    loadBtn.addEventListener('click', () => {
      state.targetLang = item.lang || state.targetLang;
      savePref('targetLang', state.targetLang);
      updateSegButtons();
      renderExamples();
      $('sentenceInput').value = item.sentence;
      $('libraryModal').classList.add('hidden');
      analyze();
    });
    const delBtn = document.createElement('button');
    delBtn.className = 'tool-btn';
    delBtn.textContent = t('deleteBtn');
    delBtn.addEventListener('click', () => {
      removeFromLibrary(item.id);
      renderLibraryList();
    });
    li.appendChild(info);
    li.appendChild(loadBtn);
    li.appendChild(delBtn);
    listEl.appendChild(li);
  }
}

function saveCurrentToLibrary() {
  if (!requireSentence()) return;
  addToLibrary($('libNameInput').value.trim(), state.sentence, state.targetLang);
  $('libNameInput').value = '';
  renderLibraryList();
}

// ---------- 이벤트 연결 ----------
function bindEvents() {
  $('analyzeBtn').addEventListener('click', analyze);
  $('sentenceInput').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') analyze();
  });

  // 🌐 인터페이스 언어 전환 (새로고침 없이 즉시 반영)
  $('uiLangBtn').addEventListener('click', () => {
    setUiLang(getUiLang() === 'ko' ? 'en' : 'ko');
    refreshTexts();
  });

  // 분석 대상 언어
  document.querySelectorAll('#targetLangSeg .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.targetLang = btn.dataset.lang;
      savePref('targetLang', state.targetLang);
      updateSegButtons();
      renderExamples();
    });
  });

  // 레벨
  document.querySelectorAll('#levelSeg .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.level = btn.dataset.level;
      savePref('level', state.level);
      updateSegButtons();
      renderExamples();
    });
  });

  // 모드 버튼들
  $('stepBtn').addEventListener('click', startStepMode);
  $('stepNextBtn').addEventListener('click', () => {
    const more = renderer.revealNext();
    if (!more) setMode('normal');
  });
  $('showAllBtn').addEventListener('click', showAllMode);
  $('quizBtn').addEventListener('click', startQuizMode);
  $('quizExitBtn').addEventListener('click', () => { setMode('normal'); renderTree(); });
  $('orderBtn').addEventListener('click', startOrderMode);
  $('orderExitBtn').addEventListener('click', () => { setMode('normal'); renderTree(); });
  $('orderCheckBtn').addEventListener('click', () => checkOrder($('orderCards'), $('orderMsg')));
  $('orderShuffleBtn').addEventListener('click', () => reshuffleOrder($('orderCards'), $('orderMsg')));

  $('exportBtn').addEventListener('click', () => {
    if (!requireSentence()) return;
    renderer.exportPng('sentence-tree.png');
  });

  $('legendBtn').addEventListener('click', () => {
    state.legendOn = !state.legendOn;
    savePref('legendOn', state.legendOn);
    renderLegend();
  });

  // AI
  $('aiParseBtn').addEventListener('click', runAiParse);
  $('compareToggle').addEventListener('change', (ev) => {
    // 체크 = 로컬 결과 보기, 해제 = AI 결과 보기
    state.useAi = !ev.target.checked;
    setMode('normal');
    renderTree();
  });
  $('translationBtn').addEventListener('click', toggleTranslation);
  $('grammarBtn').addEventListener('click', toggleGrammar);

  $('aiPanelToggle').addEventListener('click', () => {
    const body = $('aiPanelBody');
    body.classList.toggle('hidden');
    $('aiPanelArrow').textContent = body.classList.contains('hidden') ? '▾' : '▴';
  });
  $('aiExplainBtn').addEventListener('click', () => {
    runAi($('aiExplainBtn'), async (apiKey) => {
      const tree = state.useAi && state.aiTree ? state.aiTree : state.localTree;
      const summary = tree.components.map((c) => `[${roleLabel(c.role)}] ${c.text}`).join(' / ');
      const text = await aiExplain(apiKey, state.sentence, summary, state.targetLang, getUiLang(), state.aiLevel);
      showAiOutput(text);
    });
  });
  $('aiSimilarBtn').addEventListener('click', () => {
    runAi($('aiSimilarBtn'), async (apiKey) => {
      const text = await aiSimilar(apiKey, state.sentence, state.targetLang, getUiLang(), state.aiLevel);
      showAiOutput(text);
    });
  });
  $('aiQuizBtn').addEventListener('click', runAiQuiz);
  const ask = () => {
    const question = $('aiAskInput').value.trim();
    if (!question) return;
    const apiKey = getApiKey();
    if (!apiKey) { showAiOutput(t('aiNeedsKey')); return; }
    showAiOutput(t('aiThinking'));
    aiAsk(apiKey, question, state.sentence, state.targetLang, getUiLang(), state.aiLevel)
      .then((text) => showAiOutput(text))
      .catch((err) => showAiOutput(aiErrorMsg(err)));
  };
  $('aiAskBtn').addEventListener('click', ask);
  $('aiAskInput').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') ask(); });

  // 수업 모드 / 설정 / 라이브러리
  $('presentBtn').addEventListener('click', togglePresentation);
  $('settingsBtn').addEventListener('click', openSettings);
  $('settingsSaveBtn').addEventListener('click', saveSettings);
  $('settingsCloseBtn').addEventListener('click', () => $('settingsModal').classList.add('hidden'));
  $('libraryBtn').addEventListener('click', openLibrary);
  $('libraryCloseBtn').addEventListener('click', () => $('libraryModal').classList.add('hidden'));
  $('libSaveBtn').addEventListener('click', saveCurrentToLibrary);

  // 모달 바깥 클릭으로 닫기
  for (const modalId of ['settingsModal', 'libraryModal']) {
    $(modalId).addEventListener('click', (ev) => {
      if (ev.target.id === modalId) $(modalId).classList.add('hidden');
    });
  }

  // 팝오버: 트리 바깥을 누르면 닫기
  document.addEventListener('pointerdown', (ev) => {
    if (!ev.target.closest('#wordPopover') && !ev.target.closest('.node')) hidePopover();
  });

  // 전체화면이 해제되면 수업 모드도 해제
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && state.presentation) {
      state.presentation = false;
      document.body.classList.remove('presentation');
      refreshTexts();
      if (state.localTree) renderTree();
    }
  });
}

// ---------- 시작 ----------
function init() {
  initI18n(); // navigator.language 기반 기본값 + localStorage 기억
  bindEvents();
  refreshTexts();
  renderExamples();
}

init();
