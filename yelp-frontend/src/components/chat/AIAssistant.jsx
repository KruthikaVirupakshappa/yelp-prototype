import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { chatWithAssistant } from "../../services/aiAssistant";

const PROMPTS = [
  "Best Italian in San Jose",
  "Cheap sushi spots",
  "Romantic dinner ideas",
  "Top rated brunch",
];

function TypingDots() {
  return (
    <div className="ai-typing">
      <span /><span /><span />
    </div>
  );
}

function ReplyText({ text }) {
  const lines = text.split("\n").filter((l) => l.trim());
  const allBullets = lines.length > 1 && lines.every((l) => /^[-•*]/.test(l.trim()));

  if (allBullets) {
    return (
      <ul className="ai-reply-list">
        {lines.map((l, i) => (
          <li key={i}>{l.replace(/^[-•*]\s*/, "")}</li>
        ))}
      </ul>
    );
  }

  return (
    <>
      {text.split(/\n\s*\n/).filter(Boolean).map((p, i) => (
        <p key={i} className="ai-reply-para">{p.trim()}</p>
      ))}
    </>
  );
}

export default function AIAssistant({ compact = false }) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [recs, setRecs] = useState([]);
  const [source, setSource] = useState(null); // "llm" | "template" | null
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSend(text) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
    setInput("");
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    setRecs([]);

    try {
      const data = await chatWithAssistant(trimmed, history);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data?.reply || "No reply." },
      ]);
      setRecs(Array.isArray(data?.recommendations) ? data.recommendations : []);
      setSource(data?.source || "template");
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={`ai-panel${compact ? " ai-panel--compact" : ""}`}>
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-left">
          <div className="ai-avatar">✨</div>
          <div>
            <div className="ai-title">AI Assistant</div>
            <div className="ai-subtitle">Ask me anything about restaurants</div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            className="ai-clear-btn"
            type="button"
            onClick={() => { setMessages([]); setRecs([]); setInput(""); setSource(null); }}
          >
            New chat
          </button>
        )}
      </div>

      {/* Chat body */}
      <div className="ai-body" ref={bodyRef}>
        {messages.length === 0 && !loading ? (
          <div className="ai-empty">
            <div className="ai-empty-icon">🍽️</div>
            <p className="ai-empty-text">
              Tell me what you're craving and I'll find the perfect spot.
            </p>
            <div className="ai-prompts">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  className="ai-prompt-chip"
                  type="button"
                  onClick={() => handleSend(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} className={`ai-bubble-row ${m.role}`}>
                {m.role === "assistant" && (
                  <div className="ai-bubble-avatar">✨</div>
                )}
                <div className={`ai-bubble ai-bubble--${m.role}`}>
                  <ReplyText text={m.content} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-bubble-row assistant">
                <div className="ai-bubble-avatar">✨</div>
                <div className="ai-bubble ai-bubble--assistant">
                  <TypingDots />
                </div>
              </div>
            )}

            {source && (
              <div className="ai-source-badge-row">
                <span className={`ai-source-badge ai-source-badge--${source}`}>
                  {source === "llm" ? "✦ llama3.2 via Ollama" : "⚡ Template reply"}
                </span>
              </div>
            )}

            {recs.length > 0 && (
              <div className="ai-recs">
                <div className="ai-recs-label">Recommended for you</div>
                <div className="ai-recs-list">
                  {recs.map((r) => (
                    <div
                      key={r.id}
                      className="ai-rec-card"
                      onClick={() => navigate(`/restaurants/${r.id}`)}
                    >
                      <div className="ai-rec-body">
                        <div className="ai-rec-name">{r.name}</div>
                        <div className="ai-rec-pills">
                          {r.cuisine_type && <span className="ai-rec-pill">{r.cuisine_type}</span>}
                          {r.pricing_tier && <span className="ai-rec-pill">{r.pricing_tier}</span>}
                          {r.city && <span className="ai-rec-pill">📍 {r.city}</span>}
                        </div>
                      </div>
                      <div className="ai-rec-right">
                        {Number(r.average_rating || 0) > 0 && (
                          <div className="ai-rec-rating">★ {Number(r.average_rating).toFixed(1)}</div>
                        )}
                        <span className="ai-rec-arrow">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="ai-input-row">
        <input
          ref={inputRef}
          className="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="What are you craving tonight?"
          disabled={loading}
        />
        <button
          className="ai-send-btn"
          type="button"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
