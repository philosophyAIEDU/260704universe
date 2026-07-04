// localStorage 저장/불러오기 (앱의 모든 저장은 이 파일을 통해서만)

const PREFIX = 'sentenceTree.';

export function loadPref(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function savePref(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 저장 공간 부족 등 — 조용히 무시 (앱은 계속 동작)
  }
}

// ----- API 키 -----
export function getApiKey() { return loadPref('apiKey', ''); }
export function setApiKey(key) { savePref('apiKey', (key || '').trim()); }

// ----- 문장 라이브러리 -----
export function getLibrary() { return loadPref('library', []); }

export function addToLibrary(name, sentence, lang) {
  const list = getLibrary();
  list.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name || sentence.slice(0, 20),
    sentence,
    lang,
    ts: Date.now(),
  });
  savePref('library', list);
  return list;
}

export function removeFromLibrary(id) {
  const list = getLibrary().filter((item) => item.id !== id);
  savePref('library', list);
  return list;
}
