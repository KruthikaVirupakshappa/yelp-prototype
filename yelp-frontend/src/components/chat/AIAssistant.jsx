import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatWithAssistant } from "../../services/aiAssistant";
import React from "react";

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

    setInput("");
    const historyToSend = [...messages, userMessage];
    setMessages(historyToSend);
    setLoading(true);

    try {
      const data = await chatWithAssistant(text, historyToSend);

      const assistantMessage = {
        role: "assistant",
        content: data?.reply || "No reply",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setRecs(Array.isArray(data?.recommendations) ? data.recommendations : []);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong." },
      ]);
      setRecs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: 30,
        maxWidth: 500,
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 12,
        background: "#fff",
      }}
    >
      <h3 style={{ marginBottom: 10 }}>Ask Assistant</h3>

      <div
        style={{
          maxHeight: 150,
          overflowY: "auto",
          fontSize: 14,
          marginBottom: 10,
        }}
      >
        {messages.length === 0 && (
          <div style={{ opacity: 0.6 }}>
            Try: "best Italian in San Jose"
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      {recs.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {recs.map((r) => (
            <div
              key={r.id}
              onClick={() => navigate(`/restaurants/${r.id}`)}
              style={{
                cursor: "pointer",
                fontSize: 13,
                padding: "4px 0",
              }}
            >
              {r.name} — ★ {Number(r.average_rating || 0).toFixed(1)}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} style={{ display: "flex", gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask..."
          style={{
            flex: 1,
            padding: 6,
            fontSize: 14,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}