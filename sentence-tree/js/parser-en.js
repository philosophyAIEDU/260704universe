// 영어 문장 구조 분석 (간단한 SVO/구 구조 휴리스틱)
// 첫 명사구=주어, 본동사=서술어, 뒤 명사구=목적어(또는 보어),
// 전치사구/부사=부사어, 명사 앞 수식어=관형어.
// 근사치이며, 정밀 분석은 AI 정밀 분석에 맡긴다.

const ARTICLES = new Set(['the', 'a', 'an']);
const DETERMINERS = new Set([
  'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its',
  'our', 'their', 'some', 'any', 'every', 'each', 'no', 'last', 'next',
]);
const PRONOUNS = new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'us', 'them']);
const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'to', 'with', 'from', 'for', 'of', 'by', 'about',
  'under', 'over', 'near', 'into', 'after', 'before', 'around', 'behind',
  'between', 'during', 'through', 'without',
]);
const BE_VERBS = new Set(['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);
const LINKING = new Set(['become', 'became', 'becomes', 'becoming', 'seem', 'seems', 'seemed', 'look', 'looks', 'looked', 'feel', 'feels', 'felt']);
const AUXILIARIES = new Set([
  'will', 'would', 'can', 'could', 'may', 'might', 'must', 'shall', 'should',
  'do', 'does', 'did', 'have', 'has', 'had', 'not', "don't", "doesn't", "didn't",
]);
const ADVERBS = new Set([
  'very', 'always', 'often', 'never', 'sometimes', 'usually', 'now', 'today',
  'yesterday', 'tomorrow', 'here', 'there', 'well', 'fast', 'hard', 'together',
  'again', 'soon', 'early', 'late', 'too', 'also',
]);
const TIME_NOUNS = new Set(['day', 'days', 'week', 'weeks', 'weekend', 'morning', 'afternoon', 'evening', 'night', 'year', 'years', 'month', 'months', 'time']);

// -ly로 끝나지만 부사가 아닌 단어들
const NOT_ADVERBS = new Set([
  'family', 'fly', 'italy', 'july', 'only', 'ugly', 'lovely', 'friendly',
  'lonely', 'silly', 'jelly', 'belly', 'butterfly', 'supply', 'reply', 'apply', 'lily',
]);

function isAdverbToken(wordLower) {
  return ADVERBS.has(wordLower) || (wordLower.endsWith('ly') && !NOT_ADVERBS.has(wordLower));
}

const VERB_BASES = new Set([
  'fly', 'run', 'eat', 'read', 'play', 'give', 'study', 'smile', 'rise', 'sing',
  'visit', 'explain', 'go', 'come', 'see', 'watch', 'like', 'love', 'make',
  'take', 'teach', 'learn', 'write', 'walk', 'jump', 'sleep', 'drink', 'buy',
  'help', 'open', 'close', 'clean', 'cook', 'meet', 'call', 'live', 'work',
  'know', 'think', 'say', 'tell', 'want', 'need', 'find', 'sit', 'stand',
  'swim', 'dance', 'laugh', 'cry', 'listen', 'speak', 'wash', 'draw', 'build',
  'kick', 'shine', 'smile',
]);

const IRREGULAR_PAST = {
  ate: 'eat', ran: 'run', flew: 'fly', gave: 'give', sang: 'sing', went: 'go',
  came: 'come', saw: 'see', made: 'make', took: 'take', taught: 'teach',
  wrote: 'write', slept: 'sleep', drank: 'drink', bought: 'buy', met: 'meet',
  knew: 'know', thought: 'think', said: 'say', told: 'tell', found: 'find',
  sat: 'sit', stood: 'stand', swam: 'swim', rose: 'rise', spoke: 'speak',
};

function verbBase(wordLower) {
  if (VERB_BASES.has(wordLower)) return wordLower;
  if (IRREGULAR_PAST[wordLower]) return IRREGULAR_PAST[wordLower];
  // 규칙 활용: -s / -es / -ed / -ing
  const tries = [];
  if (wordLower.endsWith('ies')) tries.push(wordLower.slice(0, -3) + 'y');
  if (wordLower.endsWith('es')) tries.push(wordLower.slice(0, -2));
  if (wordLower.endsWith('s')) tries.push(wordLower.slice(0, -1));
  if (wordLower.endsWith('ied')) tries.push(wordLower.slice(0, -3) + 'y');
  if (wordLower.endsWith('ed')) { tries.push(wordLower.slice(0, -2)); tries.push(wordLower.slice(0, -1)); }
  if (wordLower.endsWith('ing')) { tries.push(wordLower.slice(0, -3)); tries.push(wordLower.slice(0, -3) + 'e'); }
  for (const cand of tries) {
    if (VERB_BASES.has(cand)) return cand;
  }
  return null;
}

function isMainVerb(wordLower) {
  return BE_VERBS.has(wordLower) || LINKING.has(wordLower) || verbBase(wordLower) !== null;
}

function posOf(wordLower, inNp) {
  if (ARTICLES.has(wordLower)) return 'pos_art';
  if (DETERMINERS.has(wordLower)) return 'pos_det';
  if (PRONOUNS.has(wordLower)) return 'pos_pron';
  if (PREPOSITIONS.has(wordLower)) return 'pos_prep';
  if (BE_VERBS.has(wordLower) || LINKING.has(wordLower) || verbBase(wordLower)) return 'pos_verb';
  if (AUXILIARIES.has(wordLower)) return 'pos_aux';
  if (isAdverbToken(wordLower)) return 'pos_adv';
  if (inNp) return 'pos_noun';
  return 'pos_unknown';
}

const PUNCT_RE = /[.,!?;:"()]/g;

// 명사구를 [수식어(관형어) 노드] + [머리 명사 노드]로 나눈다
function splitNounPhrase(np, headRole) {
  const comps = [];
  if (np.length === 0) return comps;
  if (np.length > 1) {
    const modifiers = np.slice(0, -1);
    comps.push({
      role: 'determiner',
      text: modifiers.join(' '),
      words: modifiers.map((w) => {
        const lower = w.toLowerCase();
        let pos = 'pos_adj';
        if (ARTICLES.has(lower)) pos = 'pos_art';
        else if (DETERMINERS.has(lower)) pos = 'pos_det';
        else if (lower.endsWith("'s")) pos = 'pos_noun';
        return { word: w, josa: '', pos };
      }),
    });
  }
  const head = np[np.length - 1];
  comps.push({
    role: headRole,
    text: head,
    words: [{ word: head, josa: '', pos: PRONOUNS.has(head.toLowerCase()) ? 'pos_pron' : 'pos_noun' }],
  });
  return comps;
}

// 시간 표현 명사구인지 ("every day", "last weekend" 등)
function isTimePhrase(np) {
  return np.some((w) => TIME_NOUNS.has(w.toLowerCase()));
}

// 문장 → { components: [{ role, text, words }] , approximate: true }
export function parseEn(sentence) {
  const tokens = sentence.trim().split(/\s+/)
    .map((tk) => tk.replace(PUNCT_RE, ''))
    .filter(Boolean);
  if (tokens.length === 0) return { components: [], approximate: true };

  const lower = tokens.map((tk) => tk.toLowerCase());
  const components = [];

  // 1) 본동사 위치 찾기 (첫 단어는 주어일 가능성이 높아 두 번째부터 우선 탐색)
  let verbIdx = -1;
  for (let i = 1; i < tokens.length; i++) {
    if (isMainVerb(lower[i]) || AUXILIARIES.has(lower[i])) { verbIdx = i; break; }
  }
  if (verbIdx === -1 && isMainVerb(lower[0])) verbIdx = 0; // 명령문 등
  if (verbIdx === -1) {
    // 동사를 못 찾으면 전체를 '기타'로
    return {
      components: [{
        role: 'other',
        text: tokens.join(' '),
        words: tokens.map((w) => ({ word: w, josa: '', pos: posOf(w.toLowerCase(), false) })),
      }],
      approximate: true,
    };
  }

  // 2) 주어 명사구 (동사 앞) — 부사는 부사어로 분리
  const subjNp = [];
  for (let i = 0; i < verbIdx; i++) {
    if (isAdverbToken(lower[i])) {
      components.push({ role: 'adverbial', text: tokens[i], words: [{ word: tokens[i], josa: '', pos: 'pos_adv' }] });
    } else {
      subjNp.push(tokens[i]);
    }
  }
  components.push(...splitNounPhrase(subjNp, 'subject'));

  // 3) 서술어(동사 묶음): 조동사 + 본동사 (+not)
  const verbCluster = [tokens[verbIdx]];
  let vEnd = verbIdx;
  while (vEnd + 1 < tokens.length &&
         (isMainVerb(lower[vEnd + 1]) || AUXILIARIES.has(lower[vEnd + 1])) &&
         !PREPOSITIONS.has(lower[vEnd + 1])) {
    vEnd += 1;
    verbCluster.push(tokens[vEnd]);
  }
  const mainVerbLower = lower[vEnd];
  const isLinkingVerb = BE_VERBS.has(mainVerbLower) || LINKING.has(mainVerbLower);
  components.push({
    role: 'predicate',
    text: verbCluster.join(' '),
    words: verbCluster.map((w, k) => ({
      word: w,
      josa: '',
      pos: (verbCluster.length > 1 && k < verbCluster.length - 1) ? 'pos_aux' : 'pos_verb',
    })),
  });

  // 4) 동사 뒤: 명사구/전치사구/부사 분류
  let i = vEnd + 1;
  let firstNpDone = false;
  while (i < tokens.length) {
    const w = lower[i];

    if (PREPOSITIONS.has(w)) {
      // 전치사구 전체 = 부사어
      const pp = [tokens[i]];
      i += 1;
      while (i < tokens.length && !PREPOSITIONS.has(lower[i]) &&
             !(isAdverbToken(lower[i]))) {
        pp.push(tokens[i]);
        i += 1;
      }
      components.push({
        role: 'adverbial',
        text: pp.join(' '),
        words: pp.map((word, k) => ({ word, josa: '', pos: k === 0 ? 'pos_prep' : posOf(word.toLowerCase(), true) })),
      });
      continue;
    }

    if (isAdverbToken(w)) {
      // 연속된 부사("very hard")는 하나의 부사어로 묶는다
      const advGroup = [tokens[i]];
      i += 1;
      while (i < tokens.length && isAdverbToken(lower[i])) {
        advGroup.push(tokens[i]);
        i += 1;
      }
      components.push({
        role: 'adverbial',
        text: advGroup.join(' '),
        words: advGroup.map((word) => ({ word, josa: '', pos: 'pos_adv' })),
      });
      continue;
    }

    // 명사구 수집 (대명사는 그 자체로 완결된 명사구: "He teaches us math")
    const np = [tokens[i]];
    const startedWithPronoun = PRONOUNS.has(lower[i]);
    i += 1;
    while (!startedWithPronoun && i < tokens.length && !PREPOSITIONS.has(lower[i]) &&
           !(isAdverbToken(lower[i]))) {
      // 새 명사구의 시작(관사/지시어)이면 끊는다
      if (ARTICLES.has(lower[i]) || DETERMINERS.has(lower[i])) break;
      np.push(tokens[i]);
      i += 1;
    }

    if (isTimePhrase(np)) {
      // "every day" 같은 시간 표현 = 부사어
      components.push({
        role: 'adverbial',
        text: np.join(' '),
        words: np.map((word) => ({ word, josa: '', pos: posOf(word.toLowerCase(), true) })),
      });
    } else if (!firstNpDone) {
      // be동사/become류 뒤 첫 명사구(또는 형용사) = 보어, 그 외 = 목적어
      const role = isLinkingVerb ? 'complement' : 'object';
      if (np.length === 1 && isLinkingVerb) {
        components.push({
          role: 'complement',
          text: np[0],
          words: [{ word: np[0], josa: '', pos: PRONOUNS.has(np[0].toLowerCase()) ? 'pos_pron' : 'pos_adj' }],
        });
      } else {
        components.push(...splitNounPhrase(np, role));
      }
      firstNpDone = true;
    } else {
      // 두 번째 명사구: 수여동사의 직접목적어로 본다 (He gives me a present)
      components.push(...splitNounPhrase(np, 'object'));
    }
  }

  return { components, approximate: true };
}
