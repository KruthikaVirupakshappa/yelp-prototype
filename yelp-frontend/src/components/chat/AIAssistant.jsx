import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatWithAssistant } from "../../services/aiAssistant";

export default function AIAssistant() {
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const text = input.trim();
    const userMessage = { role: "user", content: text };

    // Clear input right away for better UX
    setInput("");

    // Build the history we will send (avoid stale state issues)
    const historyToSend = [...messages, userMessage];

    // Show user message immediately
    setMessages(historyToSend);
    setLoading(true);

    try {
      const data = await chatWithAssistant(text, historyToSend);

      // Add assistant reply
      const assistantMessage = {
        role: "assistant",
        content: data?.reply ?? "No reply received.",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Store recommendations (if any)
      setRecs(Array.isArray(data?.recommendations) ? data.recommendations : []);
    } catch (err) {
      console.error("AI error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry — AI request failed." },
      ]);
      setRecs([]);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setInput("");
    setMessages([]);
    setRecs([]);
  }

  return (
    <div style={{ marginTop: 30 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Ask Assistant</h2>
        <button type="button" onClick={handleClear}>
          Clear
        </button>
      </div>

      <div
        style={{
          minHeight: 150,
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 10,
          marginBottom: 10,
          background: "#fafafa",
        }}
      >
        {messages.length === 0 && (
          <div style={{ opacity: 0.6 }}>
            Try: "romantic dinner near San Jose"
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: 8 }}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ marginBottom: 8 }}>Recommendations</h3>

          <div style={{ display: "grid", gap: 10 }}>
            {recs.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/restaurants/${r.id}`)}
                style={{
                  cursor: "pointer",
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 10,
                  background: "white",
                }}
              >
                <div style={{ fontWeight: 700 }}>{r.name}</div>
                <div style={{ opacity: 0.8 }}>
                  {(r.cuisine_type || r.cuisine || "Cuisine") + " · "}
                  ★ {Number(r.average_rating ?? r.rating ?? 0).toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSend} style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for recommendations..."
          style={{ flex: 1, padding: 10, borderRadius: 8 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}