// 한국어 문장 성분 분석 (조사 기반 휴리스틱, 교육용 단문 중심)
// 어절(띄어쓰기) 단위로 성분을 판정한다. 완벽한 형태소 분석기가 아니라
// 수업용 근사 분석기이며, 정밀 분석은 AI 정밀 분석에 맡긴다.

// 조사 목록 (긴 것 먼저 검사)
const JOSA_LIST = [
  '께서', '에서', '에게', '한테', '부터', '까지', '으로', '처럼', '보다', '마다',
  '와', '과', '의', '에', '로', '이', '가', '은', '는', '을', '를', '도', '만',
];

const ADVERBIAL_JOSA = new Set([
  '에', '에서', '에게', '한테', '로', '으로', '와', '과', '부터', '까지', '처럼', '보다', '마다',
]);

// 자주 나오는 부사
const ADVERBS = new Set([
  '아주', '매우', '잘', '빨리', '천천히', '정말', '너무', '열심히', '같이', '함께',
  '어제', '오늘', '내일', '지금', '항상', '가끔', '먼저', '다시', '곧', '많이',
  '조금', '일찍', '늦게', '높이', '멀리', '가까이', '아름답게', '즐겁게', '크게', '작게',
]);

// 관형사 (체언을 꾸미는 말)
const DETERMINERS = new Set([
  '새', '헌', '옛', '온갖', '모든', '어떤', '무슨', '여러', '다른',
  '이', '그', '저', '한', '두', '세', '네', '다섯', '우리', '저희',
]);

// 흔한 동사 어간 (관형형 -는 판정과 품사 추정용)
const VERB_STEMS = new Set([
  '하', '가', '오', '먹', '자', '보', '읽', '웃', '울', '뛰', '날', '살', '입',
  '마시', '피', '뜨', '달리', '있', '없', '되', '주', '받', '만나', '배우',
  '가르치', '일하', '노래하', '공부하', '좋아하', '사랑하', '방문하', '운동하', '놀',
]);

// 흔한 형용사 어간 (관형형 -ㄴ/-은 판정용)
const ADJ_STEMS = new Set([
  '예쁘', '작', '크', '높', '낮', '좋', '많', '적', '어렵', '쉽', '차갑', '뜨겁',
  '따뜻하', '아름답', '귀엽', '부지런하', '훌륭하', '새롭', '재미있', '즐겁', '슬프',
  '기쁘', '빠르', '느리', '길', '짧', '넓', '좁', '깊', '푸르', '맑', '착하', '친절하',
]);

// 서술어 종결 어미 패턴
const PREDICATE_ENDINGS = /(습니다|입니다|ㅂ니다|어요|아요|여요|예요|이에요|는다|ㄴ다|었다|았다|였다|다|요|까|니|네|자|라|죠|군요|는구나)[.!?]?$/;

const PUNCT_RE = /[.,!?;:"'()~…]/g;

function stripJosa(token) {
  for (const josa of JOSA_LIST) {
    if (token.length > josa.length && token.endsWith(josa)) {
      return { stem: token.slice(0, -josa.length), josa };
    }
  }
  return { stem: token, josa: '' };
}

// 마지막 음절의 종성 확인 (ㄴ=4, ㄹ=8)
function lastJong(word) {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return -1;
  return (code - 0xac00) % 28;
}

// 관형형(용언 + -는/-ㄴ/-은/-운) 여부 판정
function isAdnominal(token) {
  if (token.length < 2) return false;
  // "-는" 관형형: 먹는, 가는, 노래하는 …
  if (token.endsWith('는')) {
    const stem = token.slice(0, -1);
    if (VERB_STEMS.has(stem) || ADJ_STEMS.has(stem)) return true;
    if (stem.endsWith('하') && stem.length >= 2) return true; // ~하는
    return false;
  }
  // "-은" 관형형: 작은, 좋은 …  (어간 = '은' 제거)
  if (token.endsWith('은')) {
    const stem = token.slice(0, -1);
    if (ADJ_STEMS.has(stem) || VERB_STEMS.has(stem)) return true;
  }
  // "-운" 관형형(ㅂ 불규칙): 어려운→어렵, 아름다운→아름답 …
  if (token.endsWith('운')) {
    const restored = restoreBieup(token.slice(0, -1));
    if (restored && (ADJ_STEMS.has(restored) || VERB_STEMS.has(restored))) return true;
  }
  // 종성 ㄴ 관형형: 예쁜→예쁘+ㄴ, 큰→크+ㄴ …
  const jong = lastJong(token);
  if (jong === 4) {
    const last = token[token.length - 1];
    const base = String.fromCharCode(last.charCodeAt(0) - 4); // 종성 ㄴ 제거
    const stem = token.slice(0, -1) + base;
    if (ADJ_STEMS.has(stem) || VERB_STEMS.has(stem)) return true;
  }
  return false;
}

// ㅂ 불규칙 복원: '어려' → '어렵'
function restoreBieup(prefix) {
  if (!prefix) return null;
  const last = prefix[prefix.length - 1];
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  if ((code - 0xac00) % 28 !== 0) return null; // 받침이 있으면 불가
  return prefix.slice(0, -1) + String.fromCharCode(code + 17); // ㅂ 받침(17) 추가
}

function guessPredicatePos(token) {
  if (/(이다|입니다|이에요|예요)[.!?]?$/.test(token)) return 'pos_copula';
  for (const stem of ADJ_STEMS) {
    if (token.startsWith(stem)) return 'pos_adj';
  }
  return 'pos_verb';
}

// 문장 → { components: [{ role, text, words: [{word, josa, pos}] }] }
export function parseKo(sentence) {
  const tokens = sentence.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { components: [] };

  const cleaned = tokens.map((tk) => tk.replace(PUNCT_RE, ''));
  const lastIdx = cleaned.length - 1;
  const lastToken = cleaned[lastIdx];
  // '되다/아니다' 서술어 → 바로 앞 '이/가' 어절은 보어
  const isBecoming = /^(되|아니)/.test(lastToken) || /(되었다|되다|됐다|아니다|아니에요|되었어요)$/.test(lastToken);

  const components = cleaned.map((token, i) => {
    if (!token) return null;

    // 1) 마지막 어절 = 서술어
    if (i === lastIdx) {
      return {
        role: 'predicate',
        text: token,
        words: [{ word: token, josa: '', pos: guessPredicatePos(token) }],
      };
    }

    // 2) 관형사·관형형 → 관형어
    if (DETERMINERS.has(token)) {
      return { role: 'determiner', text: token, words: [{ word: token, josa: '', pos: 'pos_det' }] };
    }
    if (isAdnominal(token)) {
      return { role: 'determiner', text: token, words: [{ word: token, josa: '', pos: 'pos_adj' }] };
    }

    // 3) 조사 기반 판정
    const { stem, josa } = stripJosa(token);
    if (josa) {
      if (josa === '께서') {
        return { role: 'subject', text: token, words: [{ word: stem, josa, pos: 'pos_noun' }] };
      }
      if (josa === '이' || josa === '가') {
        // 되다/아니다 앞의 '이/가'는 보어
        const role = (isBecoming && i === lastIdx - 1) ? 'complement' : 'subject';
        return { role, text: token, words: [{ word: stem, josa, pos: 'pos_noun' }] };
      }
      if (josa === '은' || josa === '는') {
        return { role: 'subject', text: token, words: [{ word: stem, josa, pos: 'pos_noun' }] };
      }
      if (josa === '을' || josa === '를') {
        return { role: 'object', text: token, words: [{ word: stem, josa, pos: 'pos_noun' }] };
      }
      if (josa === '의') {
        return { role: 'determiner', text: token, words: [{ word: stem, josa, pos: 'pos_noun' }] };
      }
      if (ADVERBIAL_JOSA.has(josa)) {
        return { role: 'adverbial', text: token, words: [{ word: stem, josa, pos: 'pos_noun' }] };
      }
    }

    // 4) 부사 → 부사어
    if (ADVERBS.has(token) || /게$|히$/.test(token)) {
      return { role: 'adverbial', text: token, words: [{ word: token, josa: '', pos: 'pos_adv' }] };
    }

    // 5) 판정 불가 → 기타 (트리에는 포함)
    return { role: 'other', text: token, words: [{ word: token, josa: '', pos: 'pos_unknown' }] };
  }).filter(Boolean);

  return { components };
}
