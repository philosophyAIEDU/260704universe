// 어순 연습 모드 + 퀴즈 모드
// - 어순 연습: 단어 카드를 섞어 보여주고 드래그(또는 탭 2번 스왑)로 배열
// - 퀴즈: 트리의 '?' 성분 노드를 눌러 성분 이름 맞히기

import { t, tPick } from './i18n.js';
import { ROLE_COLORS, LEGEND_ROLES } from './data.js';

// ============ 어순 연습 ============

let orderState = null;

export function startOrderPractice(container, tokens, { onSolved } = {}) {
  // 원본과 다른 순서가 나올 때까지 섞는다 (단어 2개 이상일 때)
  let shuffled = [...tokens];
  if (tokens.length > 1) {
    let guard = 0;
    do {
      shuffled = shuffle([...tokens]);
      guard += 1;
    } while (shuffled.join(' ') === tokens.join(' ') && guard < 20);
  }
  orderState = { answer: tokens, onSolved, selected: null };
  renderCards(container, shuffled);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderCards(container, words) {
  container.innerHTML = '';
  words.forEach((word) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'order-card';
    card.textContent = word;
    container.appendChild(card);
    bindCard(card, container);
  });
}

function bindCard(card, container) {
  // 탭 2번으로 두 카드 자리 바꾸기 (터치 기기에서도 확실히 동작)
  card.addEventListener('click', () => {
    if (!orderState) return;
    clearMarks(container);
    if (orderState.selected === card) {
      card.classList.remove('selected');
      orderState.selected = null;
      return;
    }
    if (orderState.selected) {
      swapCards(orderState.selected, card);
      orderState.selected.classList.remove('selected');
      orderState.selected = null;
    } else {
      orderState.selected = card;
      card.classList.add('selected');
    }
  });

  // HTML5 드래그로 순서 바꾸기 (데스크톱)
  card.draggable = true;
  card.addEventListener('dragstart', (ev) => {
    card.classList.add('dragging');
    ev.dataTransfer.effectAllowed = 'move';
  });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));
  card.addEventListener('dragover', (ev) => {
    ev.preventDefault();
    const dragging = container.querySelector('.dragging');
    if (!dragging || dragging === card) return;
    const rect = card.getBoundingClientRect();
    const before = ev.clientX < rect.left + rect.width / 2;
    container.insertBefore(dragging, before ? card : card.nextSibling);
  });
}

function swapCards(a, b) {
  const marker = document.createElement('span');
  a.parentNode.insertBefore(marker, a);
  b.parentNode.insertBefore(a, b);
  marker.parentNode.insertBefore(b, marker);
  marker.remove();
}

function clearMarks(container) {
  container.querySelectorAll('.order-card').forEach((card) => {
    card.classList.remove('correct', 'wrong');
  });
}

// 확인 → 정답이면 true (호출한 쪽에서 정답 트리를 펼친다)
export function checkOrder(container, msgEl) {
  if (!orderState) return false;
  const cards = [...container.querySelectorAll('.order-card')];
  const current = cards.map((c) => c.textContent);
  let allCorrect = true;
  cards.forEach((card, i) => {
    const ok = current[i] === orderState.answer[i];
    card.classList.toggle('correct', ok);
    card.classList.toggle('wrong', !ok);
    if (!ok) allCorrect = false;
  });
  msgEl.textContent = allCorrect ? t('orderCorrect') : t('orderWrong');
  if (allCorrect && orderState.onSolved) {
    setTimeout(() => orderState.onSolved(), 900);
  }
  return allCorrect;
}

export function reshuffleOrder(container, msgEl) {
  if (!orderState) return;
  msgEl.textContent = t('orderIntro');
  renderCards(container, shuffle([...orderState.answer]));
}

export function endOrderPractice() {
  orderState = null;
}

// ============ 퀴즈 모드 ============

let quizState = null;

// renderer: TreeRenderer 인스턴스 (quizMode로 렌더된 상태)
export function startQuiz(renderer, choicesEl, msgEl, roleLabel) {
  const targets = renderer.roleNodes();
  targets.forEach((node) => renderer.markQuizPending(node.id));
  quizState = {
    renderer, choicesEl, msgEl, roleLabel,
    remaining: new Set(targets.map((n) => n.id)),
    currentId: null,
  };
  msgEl.textContent = t('quizIntro');
  choicesEl.innerHTML = '';
}

// 트리에서 성분 노드를 눌렀을 때 (app.js가 onRoleClick으로 연결)
export function quizPickNode(node) {
  if (!quizState) return;
  if (!quizState.remaining.has(node.id)) return; // 이미 맞힌 노드
  if (quizState.currentId) quizState.renderer.highlightNode(quizState.currentId, false);
  quizState.currentId = node.id;
  quizState.renderer.highlightNode(node.id, true);
  quizState.msgEl.textContent = t('quizPickRole', { text: node.data ? node.data.text : '' });
  renderChoices(node);
}

function renderChoices(node) {
  const { choicesEl } = quizState;
  choicesEl.innerHTML = '';
  const roles = [...LEGEND_ROLES];
  if (!roles.includes(node.role)) roles.push(node.role); // '기타'도 정답이 될 수 있게
  for (const role of roles) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = quizState.roleLabel(role);
    btn.style.borderColor = ROLE_COLORS[role];
    btn.addEventListener('click', () => answer(node, role));
    choicesEl.appendChild(btn);
  }
}

function answer(node, role) {
  if (!quizState) return;
  if (role === node.role) {
    quizState.renderer.revealRoleLabel(node.id, quizState.roleLabel(node.role));
    quizState.renderer.highlightNode(node.id, false);
    quizState.remaining.delete(node.id);
    quizState.currentId = null;
    quizState.choicesEl.innerHTML = '';
    quizState.msgEl.textContent = quizState.remaining.size === 0 ? t('quizDone') : tPick('quizCorrect');
  } else {
    quizState.msgEl.textContent = t('quizWrong');
  }
}

export function endQuiz() {
  quizState = null;
}
