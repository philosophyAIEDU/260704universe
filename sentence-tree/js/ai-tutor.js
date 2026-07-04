// Gemini 연동: AI 정밀 분석 · 단어 뜻 · 번역 · AI 교수님 · 퀴즈 출제
// 모델: gemini-3.1-flash-lite (정식 버전)
// 키는 사용자가 설정에서 입력한 것만 사용하며, localStorage에만 저장된다.

const MODEL = 'gemini-3.1-flash-lite';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// 공통 호출. 실패 시 code가 붙은 Error를 던진다: 'key' | 'quota' | 'network' | 'parse'
export async function callGemini(apiKey, systemText, userText, { json = false } = {}) {
  if (!apiKey) {
    const err = new Error('no api key');
    err.code = 'key';
    throw err;
  }

  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: { thinkingConfig: { thinkingLevel: 'low' } },
  };
  if (json) body.generationConfig.responseMimeType = 'application/json';

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey, // 쿼리스트링에 키를 넣지 않는다
      },
      body: JSON.stringify(body),
    });
  } catch {
    const err = new Error('network error');
    err.code = 'network';
    throw err;
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    if (res.status === 400 || res.status === 401 || res.status === 403) err.code = 'key';
    else if (res.status === 429) err.code = 'quota';
    else err.code = 'network';
    throw err;
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text || '').join('').trim();
  if (!text) {
    const err = new Error('empty response');
    err.code = 'parse';
    throw err;
  }
  return text;
}

// ----- 시스템 지시 -----
const LANG_NAME = { ko: { ko: '한국어', en: '영어' }, en: { ko: 'Korean', en: 'English' } };
const LEVEL_NAME = {
  ko: { beginner: '초급', intermediate: '중급', advanced: '고급' },
  en: { beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced' },
};

export function tutorSystemPrompt(uiLang, aiLevel) {
  const answerLang = uiLang === 'ko' ? '한국어' : 'English';
  const level = LEVEL_NAME[uiLang]?.[aiLevel] || aiLevel;
  return (
    `너는 친절한 언어 선생님이다. 설정된 수준(${level})에 맞춰 쉬운 말로, ` +
    `반드시 ${answerLang}(학습자의 모국어)로 답한다. ` +
    `각 성분이 왜 그 역할인지 근거(조사·어미·위치·품사)를 2~4문장으로 설명하고, ` +
    `'이런 실수를 자주 해요' 같은 학습자 팁을 한 줄 덧붙인다. ` +
    `어려운 용어는 괄호로 쉬운 풀이를 단다. ` +
    `번역·뜻은 자연스럽되 학습에 도움이 되도록 직역 뉘앙스도 필요하면 함께 제시한다. ` +
    `폭력적이거나 부적절한 예문은 만들지 않는다.`
  );
}

function langName(uiLang, target) {
  return LANG_NAME[uiLang]?.[target] || target;
}

// ----- AI 정밀 분석 (구조화 JSON) -----
export async function aiParseSentence(apiKey, sentence, targetLang, uiLang, aiLevel) {
  const system = tutorSystemPrompt(uiLang, aiLevel) +
    ' 지금은 문장 성분 분석기를 대신한다. 반드시 지정된 JSON 형식으로만 응답한다.';
  const prompt =
    `다음 ${langName(uiLang, targetLang)} 문장을 성분 분석해서 JSON으로만 답하라.\n` +
    `문장: "${sentence}"\n\n` +
    `JSON 형식 (다른 텍스트 금지):\n` +
    `{\n` +
    `  "components": [\n` +
    `    { "role": "subject|predicate|object|complement|adverbial|determiner|other",\n` +
    `      "text": "<해당 어절/구>",\n` +
    `      "words": [ { "word": "<단어>", "josa": "<조사/어미, 없으면 빈 문자열>", "pos": "<품사, ${uiLang === 'ko' ? '한국어로' : 'in English'}>", "meaning": "<${uiLang === 'ko' ? '한국어' : 'English'} 뜻>" } ] }\n` +
    `  ],\n` +
    `  "translation": "<문장 전체 번역 (${uiLang === 'ko' ? '한국어' : 'English'})>",\n` +
    `  "grammarPoint": "<이 문장의 핵심 어순·조사 규칙 1~2줄 (${uiLang === 'ko' ? '한국어' : 'English'})>"\n` +
    `}\n` +
    `components 는 문장에 나온 순서대로 나열한다.`;

  const text = await callGemini(apiKey, system, prompt, { json: true });
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.components)) throw new Error('bad shape');
    return parsed;
  } catch {
    const err = new Error('json parse fail');
    err.code = 'parse';
    throw err;
  }
}

// ----- 단어 뜻 -----
export async function aiWordMeaning(apiKey, word, sentence, targetLang, uiLang, aiLevel) {
  const system = tutorSystemPrompt(uiLang, aiLevel);
  const prompt =
    `문장 "${sentence}" 안의 단어 "${word}"의 뜻을 ` +
    `${uiLang === 'ko' ? '한국어' : 'English'}로 JSON으로만 답하라.\n` +
    `{ "meaning": "<짧은 뜻 (1줄)>", "note": "<이 문장에서의 쓰임 한 줄, 없으면 빈 문자열>" }`;
  const text = await callGemini(apiKey, system, prompt, { json: true });
  try {
    const parsed = JSON.parse(text);
    return parsed.meaning + (parsed.note ? `\n${parsed.note}` : '');
  } catch {
    return text; // JSON이 아니어도 내용은 보여준다
  }
}

// ----- 문장 번역 -----
export async function aiTranslate(apiKey, sentence, targetLang, uiLang, aiLevel) {
  const system = tutorSystemPrompt(uiLang, aiLevel);
  const prompt =
    `다음 문장을 ${uiLang === 'ko' ? '한국어' : 'English'}로 번역해 JSON으로만 답하라.\n` +
    `문장: "${sentence}"\n` +
    `{ "translation": "<자연스러운 번역>", "literal": "<직역 뉘앙스, 도움이 될 때만. 없으면 빈 문자열>" }`;
  const text = await callGemini(apiKey, system, prompt, { json: true });
  try {
    const parsed = JSON.parse(text);
    return parsed.translation + (parsed.literal ? `\n(${parsed.literal})` : '');
  } catch {
    return text;
  }
}

// ----- 핵심 문법 포인트 -----
export async function aiGrammarPoint(apiKey, sentence, targetLang, uiLang, aiLevel) {
  const system = tutorSystemPrompt(uiLang, aiLevel);
  const prompt =
    `문장 "${sentence}"의 핵심 문법 포인트(어순·조사·어미 규칙)를 ` +
    `1~2줄로만 설명하라. ${uiLang === 'ko' ? '한국어로' : 'Answer in English.'}`;
  return callGemini(apiKey, system, prompt);
}

// ----- 이 문장 설명해줘 -----
export async function aiExplain(apiKey, sentence, componentsSummary, targetLang, uiLang, aiLevel) {
  const system = tutorSystemPrompt(uiLang, aiLevel);
  const prompt =
    `다음 ${langName(uiLang, targetLang)} 문장을 학습자에게 설명하라.\n` +
    `문장: "${sentence}"\n` +
    `우리 앱의 분석: ${componentsSummary}\n` +
    `각 성분이 왜 그 역할인지 근거를 들어 설명하고, 학습자가 자주 틀리는 점을 한 줄 덧붙여라. ` +
    `${uiLang === 'ko' ? '한국어로 답하라.' : 'Answer in English.'}`;
  return callGemini(apiKey, system, prompt);
}

// ----- 자유 질문 -----
export async function aiAsk(apiKey, question, sentence, targetLang, uiLang, aiLevel) {
  const system = tutorSystemPrompt(uiLang, aiLevel);
  const prompt =
    (sentence ? `지금 배우는 문장: "${sentence}"\n` : '') +
    `학습자의 질문: ${question}\n` +
    `${uiLang === 'ko' ? '한국어로 답하라.' : 'Answer in English.'}`;
  return callGemini(apiKey, system, prompt);
}

// ----- 비슷한 예문 3개 -----
export async function aiSimilar(apiKey, sentence, targetLang, uiLang, aiLevel) {
  const system = tutorSystemPrompt(uiLang, aiLevel);
  const prompt =
    `문장 "${sentence}"와 구조가 비슷한 ${langName(uiLang, targetLang)} 예문 3개를 만들어라. ` +
    `각 예문 뒤에 ${uiLang === 'ko' ? '한국어' : 'English'} 번역을 괄호로 붙여라. ` +
    `번호를 붙인 3줄로만 답하라.`;
  return callGemini(apiKey, system, prompt);
}

// ----- 퀴즈 출제 (구조화 JSON) -----
export async function aiQuiz(apiKey, sentence, targetLang, uiLang, aiLevel) {
  const system = tutorSystemPrompt(uiLang, aiLevel) + ' 반드시 지정된 JSON 형식으로만 응답한다.';
  const prompt =
    `문장 "${sentence}"로 문장 성분·어순 이해를 확인하는 4지선다 퀴즈 3문제를 만들어 JSON으로만 답하라.\n` +
    `질문과 보기는 ${uiLang === 'ko' ? '한국어' : 'English'}로 쓴다.\n` +
    `{ "questions": [ { "question": "<질문>", "choices": ["<보기1>","<보기2>","<보기3>","<보기4>"], "answerIndex": 0, "explanation": "<한 줄 해설>" } ] }`;
  const text = await callGemini(apiKey, system, prompt, { json: true });
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.questions)) throw new Error('bad shape');
    return parsed.questions;
  } catch {
    const err = new Error('json parse fail');
    err.code = 'parse';
    throw err;
  }
}
