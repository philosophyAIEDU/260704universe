// SVG 인터랙티브 트리 렌더러 (외부 라이브러리 없이 직접 그린다)
// - 노드 클릭 = 펼치기/접기(성분 노드) 또는 단어 콜백
// - 노드 드래그 = 이동, 배경 드래그 = 화면 이동, 휠 = 확대/축소
// - 단계별 펼치기(revealNext) / 전체 보기(revealAll)
// - PNG 내보내기 (SVG → canvas)

import { ROLE_COLORS, REVEAL_ORDER } from './data.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

// 대략적인 텍스트 폭 계산 (한글 등 전각 문자는 fontSize, 그 외 0.58배)
function textWidth(text, fontSize) {
  let w = 0;
  for (const ch of String(text)) {
    w += ch.charCodeAt(0) > 0x2e80 ? fontSize : fontSize * 0.58;
  }
  return w;
}

export class TreeRenderer {
  constructor(svg) {
    this.svg = svg;
    this.view = { x: 0, y: 0, k: 1 };
    this.nodes = new Map(); // id → {g, x, y, w, h, dx, dy, parentId, childIds, role, data}
    this.edges = [];        // {path, fromId, toId}
    this.fontScale = 1;
    this.opts = {};
    this._bindPanZoom();
  }

  // tree = { sentence, components:[{role, text, words:[{word, josa, pos, roman}]}] }
  // opts = { roleLabel(role), posLabel(pos), stepMode, quizMode, onWordClick, onRoleClick, showRoman }
  render(tree, opts = {}) {
    this.opts = opts;
    this.tree = tree;
    this.nodes.clear();
    this.edges = [];
    this.svg.innerHTML = '';
    this.revealIdx = 0;

    const fs = 18 * this.fontScale;      // 기본 글자 크기
    const fsSmall = fs * 0.72;
    const gapX = 18 * this.fontScale;
    const rootY = 20;
    const roleY = rootY + fs * 2 + 70;
    const wordY = roleY + fs * 2.4 + 70;

    this.viewport = el('g', { class: 'viewport' });
    this.edgeLayer = el('g');
    this.nodeLayer = el('g');
    this.viewport.appendChild(this.edgeLayer);
    this.viewport.appendChild(this.nodeLayer);
    this.svg.appendChild(this.viewport);

    // ----- 노드 크기 계산 -----
    const comps = tree.components;
    const roleBoxes = comps.map((comp, idx) => {
      const label = opts.quizMode ? '?' : (opts.roleLabel ? opts.roleLabel(comp.role) : comp.role);
      const w1 = textWidth(label, fs) + 28;
      const w2 = textWidth(comp.text, fsSmall) + 28;
      return { idx, comp, label, w: Math.max(w1, w2, 64), h: fs + fsSmall + 26 };
    });

    const wordBoxes = comps.map((comp) => comp.words.map((word) => {
      const line1 = word.word + (word.josa ? ' + ' + word.josa : '');
      const line2 = opts.posLabel ? opts.posLabel(word.pos) : word.pos;
      const line3 = opts.showRoman && word.roman ? word.roman : '';
      let h = fs + 22;
      if (line2) h += fsSmall + 4;
      if (line3) h += fsSmall + 4;
      const w = Math.max(textWidth(line1, fs), textWidth(line2, fsSmall), textWidth(line3, fsSmall)) + 26;
      return { word, line1, line2, line3, w: Math.max(w, 56), h };
    }));

    // ----- 가로 배치 -----
    let x = 20;
    roleBoxes.forEach((rb, i) => {
      const wordsW = wordBoxes[i].reduce((sum, wb) => sum + wb.w, 0) + gapX * Math.max(0, wordBoxes[i].length - 1);
      const groupW = Math.max(rb.w, wordsW);
      rb.x = x + (groupW - rb.w) / 2;
      let wx = x + (groupW - wordsW) / 2;
      wordBoxes[i].forEach((wb) => { wb.x = wx; wx += wb.w + gapX; });
      x += groupW + gapX * 1.6;
    });
    const totalW = x - gapX * 1.6 + 20;

    // ----- 루트(문장) 노드 -----
    const rootLabel = opts.roleLabel ? opts.roleLabel('sentence') : 'Sentence';
    const rootTextW = Math.max(textWidth(tree.sentence, fs) + 30, textWidth(rootLabel, fsSmall) + 30, 80);
    const rootX = totalW / 2 - rootTextW / 2;
    this._makeNode('root', {
      x: rootX, y: rootY, w: rootTextW, h: fs + fsSmall + 26,
      color: ROLE_COLORS.sentence, role: 'sentence',
      lines: [
        { text: rootLabel, size: fsSmall, fill: '#ffffff', dy: fsSmall + 8, opacity: 0.85 },
        { text: tree.sentence, size: fs, fill: '#ffffff', dy: fsSmall + fs + 14, bold: true },
      ],
      filled: true,
    });

    // ----- 성분 노드 + 단어 노드 -----
    roleBoxes.forEach((rb, i) => {
      const color = ROLE_COLORS[rb.comp.role] || ROLE_COLORS.other;
      const roleId = `role-${i}`;
      this._makeNode(roleId, {
        x: rb.x, y: roleY, w: rb.w, h: rb.h,
        color, role: rb.comp.role, parentId: 'root', data: rb.comp,
        lines: [
          { text: rb.label, size: fs, fill: '#ffffff', dy: fs + 8, bold: true },
          { text: rb.comp.text, size: fsSmall, fill: '#ffffff', dy: fs + fsSmall + 14, opacity: 0.9 },
        ],
        filled: true,
      });
      this._makeEdge('root', roleId, color);

      wordBoxes[i].forEach((wb, j) => {
        const wordId = `word-${i}-${j}`;
        const lines = [{ text: wb.line1, size: fs, fill: '#1e293b', dy: fs + 10, bold: true }];
        let dy = fs + 10;
        if (wb.line2) { dy += fsSmall + 4; lines.push({ text: wb.line2, size: fsSmall, fill: color, dy }); }
        if (wb.line3) { dy += fsSmall + 4; lines.push({ text: wb.line3, size: fsSmall, fill: '#64748b', dy, italic: true }); }
        this._makeNode(wordId, {
          x: wb.x, y: wordY, w: wb.w, h: wb.h,
          color, role: rb.comp.role, parentId: roleId, isWord: true,
          data: { ...wb.word, componentRole: rb.comp.role },
          lines,
          filled: false,
        });
        this._makeEdge(roleId, wordId, color);
      });
    });

    this._updateAllEdges();

    // ----- 초기 뷰: 내용을 가운데에 맞춤 -----
    const box = this.svg.getBoundingClientRect();
    const contentH = wordY + 120;
    const k = Math.min(1, (box.width - 40) / totalW, (box.height - 40) / contentH);
    this.view = {
      k: Math.max(0.35, k),
      x: (box.width - totalW * Math.max(0.35, k)) / 2,
      y: 16,
    };
    this._applyView();

    // ----- 단계별 모드: 성분들을 숨겨 놓는다 -----
    if (opts.stepMode) {
      this.revealSequence = this._buildRevealSequence();
      this.revealSequence.forEach((ids) => ids.forEach((id) => this._setNodeVisible(id, false)));
    } else {
      this.revealSequence = [];
    }
  }

  // ---------- 노드/엣지 생성 ----------
  _makeNode(id, cfg) {
    const g = el('g', { class: 'node', 'data-id': id });
    g.setAttribute('transform', `translate(${cfg.x},${cfg.y})`);

    const rect = el('rect', {
      width: cfg.w, height: cfg.h, rx: 10, ry: 10,
      fill: cfg.filled ? cfg.color : '#ffffff',
      stroke: cfg.color, 'stroke-width': 2.5,
    });
    g.appendChild(rect);

    for (const line of cfg.lines) {
      if (!line.text) continue;
      const txt = el('text', {
        x: cfg.w / 2, y: line.dy,
        'text-anchor': 'middle',
        'font-size': line.size,
        fill: line.fill,
        'font-family': 'inherit',
      });
      if (line.bold) txt.setAttribute('font-weight', '700');
      if (line.italic) txt.setAttribute('font-style', 'italic');
      if (line.opacity) txt.setAttribute('opacity', line.opacity);
      txt.textContent = line.text;
      g.appendChild(txt);
    }

    this.nodeLayer.appendChild(g);
    const node = {
      id, g, rect,
      x: cfg.x, y: cfg.y, w: cfg.w, h: cfg.h, dx: 0, dy: 0,
      parentId: cfg.parentId || null, childIds: [],
      role: cfg.role, isWord: !!cfg.isWord, data: cfg.data,
      color: cfg.color, collapsed: false, visible: true,
    };
    this.nodes.set(id, node);
    if (cfg.parentId && this.nodes.has(cfg.parentId)) {
      this.nodes.get(cfg.parentId).childIds.push(id);
    }
    this._bindNodeDrag(node);
    return node;
  }

  _makeEdge(fromId, toId, color) {
    const path = el('path', {
      fill: 'none', stroke: color, 'stroke-width': 2, opacity: 0.55,
    });
    this.edgeLayer.appendChild(path);
    this.edges.push({ path, fromId, toId });
  }

  _updateAllEdges() {
    for (const edge of this.edges) this._updateEdge(edge);
  }

  _updateEdge(edge) {
    const a = this.nodes.get(edge.fromId);
    const b = this.nodes.get(edge.toId);
    if (!a || !b) return;
    const x1 = a.x + a.dx + a.w / 2;
    const y1 = a.y + a.dy + a.h;
    const x2 = b.x + b.dx + b.w / 2;
    const y2 = b.y + b.dy;
    const my = (y1 + y2) / 2;
    edge.path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`);
  }

  // ---------- 화면 이동/확대 ----------
  _applyView() {
    this.viewport.setAttribute(
      'transform',
      `translate(${this.view.x},${this.view.y}) scale(${this.view.k})`,
    );
  }

  _bindPanZoom() {
    let panning = null;

    this.svg.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.node')) return; // 노드 드래그는 별도 처리
      panning = { px: ev.clientX, py: ev.clientY, vx: this.view.x, vy: this.view.y };
      this.svg.setPointerCapture(ev.pointerId);
    });
    this.svg.addEventListener('pointermove', (ev) => {
      if (!panning) return;
      this.view.x = panning.vx + (ev.clientX - panning.px);
      this.view.y = panning.vy + (ev.clientY - panning.py);
      this._applyView();
    });
    const stop = () => { panning = null; };
    this.svg.addEventListener('pointerup', stop);
    this.svg.addEventListener('pointercancel', stop);

    this.svg.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const rect = this.svg.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;
      const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
      const k2 = Math.min(3.5, Math.max(0.25, this.view.k * factor));
      // 커서 위치를 중심으로 확대/축소
      this.view.x = mx - ((mx - this.view.x) / this.view.k) * k2;
      this.view.y = my - ((my - this.view.y) / this.view.k) * k2;
      this.view.k = k2;
      this._applyView();
    }, { passive: false });
  }

  _bindNodeDrag(node) {
    let drag = null;

    node.g.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      drag = { px: ev.clientX, py: ev.clientY, dx: node.dx, dy: node.dy, moved: false };
      node.g.setPointerCapture(ev.pointerId);
    });

    node.g.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const mx = (ev.clientX - drag.px) / this.view.k;
      const my = (ev.clientY - drag.py) / this.view.k;
      if (Math.abs(mx) > 3 || Math.abs(my) > 3) drag.moved = true;
      if (!drag.moved) return;
      node.dx = drag.dx + mx;
      node.dy = drag.dy + my;
      node.g.setAttribute('transform', `translate(${node.x + node.dx},${node.y + node.dy})`);
      for (const edge of this.edges) {
        if (edge.fromId === node.id || edge.toId === node.id) this._updateEdge(edge);
      }
    });

    const finish = (ev) => {
      if (!drag) return;
      const wasClick = !drag.moved;
      drag = null;
      if (!wasClick) return;
      // 클릭: 단어 노드 → 콜백 / 성분 노드 → 접기·펼치기 또는 퀴즈 콜백
      if (node.isWord) {
        if (this.opts.onWordClick) this.opts.onWordClick(node.data, ev, node);
      } else if (node.id !== 'root') {
        if (this.opts.quizMode) {
          if (this.opts.onRoleClick) this.opts.onRoleClick(node, ev);
        } else {
          this.toggleCollapse(node.id);
        }
      }
    };
    node.g.addEventListener('pointerup', finish);
    node.g.addEventListener('pointercancel', () => { drag = null; });
  }

  // ---------- 접기/펼치기 ----------
  toggleCollapse(id) {
    const node = this.nodes.get(id);
    if (!node || node.childIds.length === 0) return;
    node.collapsed = !node.collapsed;
    for (const cid of node.childIds) {
      this._setNodeVisible(cid, !node.collapsed);
    }
    node.rect.setAttribute('stroke-dasharray', node.collapsed ? '6 4' : '');
  }

  _setNodeVisible(id, visible) {
    const node = this.nodes.get(id);
    if (!node) return;
    node.visible = visible;
    node.g.style.display = visible ? '' : 'none';
    if (visible) {
      node.g.classList.remove('node-appear');
      // 리플로 강제로 다시 애니메이션 적용
      void node.g.getBoundingClientRect();
      node.g.classList.add('node-appear');
    }
    for (const edge of this.edges) {
      if (edge.toId === id) {
        edge.path.style.display = visible ? '' : 'none';
      }
      if (edge.fromId === id) {
        // 자식 엣지도 함께 숨김/표시 (자식 노드 상태 따라)
        const child = this.nodes.get(edge.toId);
        edge.path.style.display = (visible && child && child.visible) ? '' : 'none';
      }
    }
    // 자식 노드도 연쇄 처리
    for (const cid of node.childIds) {
      this._setNodeVisible(cid, visible && !node.collapsed);
    }
  }

  // ---------- 단계별 펼치기 ----------
  _buildRevealSequence() {
    // 주어 → 서술어 → 목적어 → 나머지 순으로, 성분 노드(+그 단어들)를 묶는다
    const groups = [];
    const used = new Set();
    for (const role of REVEAL_ORDER) {
      for (const [id, node] of this.nodes) {
        if (id === 'root' || node.isWord || used.has(id)) continue;
        if (node.role === role) {
          used.add(id);
          groups.push([id, ...node.childIds]);
        }
      }
    }
    return groups;
  }

  revealNext() {
    if (!this.revealSequence || this.revealIdx >= this.revealSequence.length) return false;
    const ids = this.revealSequence[this.revealIdx];
    ids.forEach((id) => this._setNodeVisible(id, true));
    this.revealIdx += 1;
    return this.revealIdx < this.revealSequence.length;
  }

  revealAll() {
    if (!this.revealSequence) return;
    this.revealSequence.forEach((ids) => ids.forEach((id) => this._setNodeVisible(id, true)));
    this.revealIdx = this.revealSequence.length;
  }

  // ---------- 퀴즈 지원 ----------
  roleNodes() {
    return [...this.nodes.values()].filter((n) => n.id !== 'root' && !n.isWord);
  }

  revealRoleLabel(id, label) {
    const node = this.nodes.get(id);
    if (!node) return;
    const firstText = node.g.querySelector('text');
    if (firstText) firstText.textContent = label;
    node.rect.setAttribute('fill', node.color);
  }

  markQuizPending(id) {
    const node = this.nodes.get(id);
    if (!node) return;
    node.rect.setAttribute('fill', '#94a3b8');
  }

  highlightNode(id, on) {
    const node = this.nodes.get(id);
    if (!node) return;
    node.rect.setAttribute('stroke-width', on ? 5 : 2.5);
  }

  // ---------- PNG 내보내기 ----------
  exportPng(filename = 'sentence-tree.png') {
    const vb = this.viewport.getBBox();
    const pad = 30;
    const w = vb.width + pad * 2;
    const h = vb.height + pad * 2;

    const clone = this.svg.cloneNode(true);
    clone.setAttribute('xmlns', SVG_NS);
    clone.setAttribute('width', w);
    clone.setAttribute('height', h);
    clone.setAttribute('viewBox', `${vb.x - pad} ${vb.y - pad} ${w} ${h}`);
    const cloneViewport = clone.querySelector('.viewport');
    if (cloneViewport) cloneViewport.setAttribute('transform', '');
    // 배경 흰색
    const bg = el('rect', { x: vb.x - pad, y: vb.y - pad, width: w, height: h, fill: '#ffffff' });
    clone.insertBefore(bg, clone.firstChild);
    // 글꼴 지정 (inherit는 이미지 변환 시 사라지므로)
    clone.querySelectorAll('text').forEach((txt) => {
      txt.setAttribute('font-family', 'Apple SD Gothic Neo, Malgun Gothic, sans-serif');
    });

    const xml = new XMLSerializer().serializeToString(clone);
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    const img = new Image();
    img.onload = () => {
      const scale = 2; // 고해상도
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }, 'image/png');
    };
    img.src = svgUrl;
  }
}
