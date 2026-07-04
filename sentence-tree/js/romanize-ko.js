// 한글 → 로마자 변환 (국립국어원 로마자 표기법 준용, 학습자용 근사 표기)
// 순수 함수. API 불필요. 자음동화 등 모든 예외까지 반영하지는 않는다.

const CHO = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp',
  's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];

const JUNG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o',
  'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu',
  'eu', 'ui', 'i',
];

// 받침(종성) — 어말/자음 앞 대표음 표기
const JONG = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm',
  'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng',
  't', 't', 'k', 't', 'p', 't',
];

// 받침이 모음(ㅇ 초성) 앞에 올 때 이어 읽는 소리 (연음, 근사)
const JONG_LIAISON = {
  1: 'g',   // ㄱ
  4: 'n',   // ㄴ
  7: 'd',   // ㄷ
  8: 'r',   // ㄹ
  16: 'm',  // ㅁ
  17: 'b',  // ㅂ
  19: 's',  // ㅅ
  20: 'ss', // ㅆ
  22: 'j',  // ㅈ
  23: 'ch', // ㅊ
  24: 'k',  // ㅋ
  25: 't',  // ㅌ
  26: 'p',  // ㅍ
  27: 'h',  // ㅎ
};

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

function decompose(ch) {
  const code = ch.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_END) return null;
  const idx = code - HANGUL_BASE;
  return {
    cho: Math.floor(idx / 588),
    jung: Math.floor((idx % 588) / 28),
    jong: idx % 28,
  };
}

// 한 단어(어절)를 로마자로 변환
export function romanizeKo(text) {
  if (!text) return '';
  const chars = [...text];
  const parts = [];

  for (let i = 0; i < chars.length; i++) {
    const syl = decompose(chars[i]);
    if (!syl) {
      parts.push(chars[i]);
      continue;
    }
    const next = i + 1 < chars.length ? decompose(chars[i + 1]) : null;
    let out = CHO[syl.cho] + JUNG[syl.jung];

    if (syl.jong > 0) {
      // 다음 글자가 모음으로 시작하면(초성 ㅇ) 이어 읽기 시도
      if (next && next.cho === 11 && JONG_LIAISON[syl.jong]) {
        parts.push(out);
        // 연음된 자음은 다음 음절 초성 자리로 넘긴다
        chars[i + 1] = String.fromCharCode(
          HANGUL_BASE + ((liaisonChoIndex(syl.jong)) * 588) + (next.jung * 28) + next.jong,
        );
      } else {
        out += JONG[syl.jong];
        parts.push(out);
      }
    } else {
      parts.push(out);
    }
  }
  return parts.join('');
}

// 연음 시 받침을 다음 음절의 초성 인덱스로 변환 (근사)
function liaisonChoIndex(jong) {
  const map = {
    1: 0,   // ㄱ→g
    4: 2,   // ㄴ→n
    7: 3,   // ㄷ→d
    8: 5,   // ㄹ→r
    16: 6,  // ㅁ→m
    17: 7,  // ㅂ→b
    19: 9,  // ㅅ→s
    20: 10, // ㅆ→ss
    22: 12, // ㅈ→j
    23: 14, // ㅊ→ch
    24: 15, // ㅋ→k
    25: 16, // ㅌ→t
    26: 17, // ㅍ→p
    27: 18, // ㅎ→h
  };
  return map[jong] ?? 11;
}

// 문장 전체를 어절별로 변환
export function romanizeSentence(sentence) {
  return sentence
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => romanizeKo(w.replace(/[.,!?;:"'()]/g, '')))
    .join(' ');
}
