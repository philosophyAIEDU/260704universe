import { useRef, useState, useEffect } from 'react';

const LEVELS = ['초등', '중등', '고등'];
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

function formatDate(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

/**
 * AI 천문학 교수님 채팅 패널.
 * API 키와 모델명은 React 상태(브라우저 메모리)에만 저장되며,
 * 질문 시 구글 Gemini API로만 전송됩니다. 별도 서버로 보내지 않습니다.
 */
export default function AIProfessor({ selectedPlanet, dateMs }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [level, setLevel] = useState('초등');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const ask = async () => {
    const question = input.trim();
    if (!question || !apiKey || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    const systemPrompt =
      `당신은 친절한 천문학 교수님입니다. ${level} 학생 눈높이에 맞춰 한국어로 쉽고 정확하게 답하세요.\n` +
      `현재 학생이 보고 있는 행성: ${selectedPlanet ? selectedPlanet.nameKo : '없음'}, ` +
      `화면 날짜: ${formatDate(dateMs)}.\n` +
      `너무 길지 않게, 격려하는 말투로 설명하세요.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: question }] }],
          }),
        }
      );

      if (!res.ok) {
        let reason = `오류 코드 ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error?.message) reason = errData.error.message;
        } catch {
          /* JSON이 아닌 오류 응답은 무시 */
        }
        const hint =
          res.status === 400 || res.status === 401 || res.status === 403
            ? 'API 키를 확인해 주세요.'
            : res.status === 404
              ? '모델명을 확인해 주세요.'
              : '잠시 후 다시 시도해 주세요.';
        setMessages((prev) => [
          ...prev,
          { role: 'error', text: `앗, 답변을 가져오지 못했어요. ${hint} (${reason})` },
        ]);
        return;
      }

      const data = await res.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      setMessages((prev) => [
        ...prev,
        answer
          ? { role: 'assistant', text: answer }
          : { role: 'error', text: '응답이 비어 있어요. 질문을 조금 바꿔서 다시 물어봐 주세요.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'error', text: '네트워크 오류가 발생했어요. 인터넷 연결과 API 키를 확인해 주세요.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <div className={`panel ai-panel ${collapsed ? 'ai-collapsed' : ''}`}>
      <div className="ai-header" onClick={() => setCollapsed(!collapsed)}>
        <h2>👩‍🏫 AI 천문학 교수님</h2>
        <button className="btn btn-close" aria-label={collapsed ? '펼치기' : '접기'}>
          {collapsed ? '▲' : '▼'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="ai-settings">
            <label>
              Gemini API 키
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API 키를 붙여넣으세요"
                autoComplete="off"
              />
            </label>
            <p className="ai-key-note">
              🔒 이 키는 이 브라우저 안에만 저장되며 구글에만 전송됩니다.
            </p>
            <div className="ai-settings-row">
              <label>
                모델명
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={DEFAULT_MODEL}
                />
              </label>
              <label>
                설명 난이도
                <select value={level} onChange={(e) => setLevel(e.target.value)}>
                  {LEVELS.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="ai-messages" ref={listRef}>
            {messages.length === 0 && !loading && (
              <p className="ai-empty">
                {apiKey
                  ? selectedPlanet
                    ? `${selectedPlanet.nameKo}에 대해 무엇이든 물어보세요!`
                    : '행성을 클릭한 뒤 궁금한 것을 물어보세요!'
                  : 'AI 교수님을 쓰려면 위에 Gemini API 키를 입력하세요'}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ai-msg-${m.role}`}>
                {m.role === 'user' ? '🙋 ' : m.role === 'assistant' ? '👩‍🏫 ' : '⚠️ '}
                {m.text}
              </div>
            ))}
            {loading && <div className="ai-msg ai-msg-loading">👩‍🏫 교수님이 생각 중이에요…</div>}
          </div>

          <div className="ai-input-row">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={apiKey ? '질문을 입력하세요 (Enter로 전송)' : '먼저 API 키를 입력하세요'}
              disabled={!apiKey || loading}
            />
            <button
              className="btn btn-primary"
              onClick={ask}
              disabled={!apiKey || loading || !input.trim()}
            >
              질문
            </button>
          </div>
        </>
      )}
    </div>
  );
}
