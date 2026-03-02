import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AIAssistant({ restaurants = [] }) {
  const navigate = useNavigate();
  const [assistantQuery, setAssistantQuery] = useState("");
  const [assistantResponse, setAssistantResponse] = useState([]);

  const tips = useMemo(
    () => [
      'Try: "romantic dinner near San Jose"',
      'Try: "vegan casual spots"',
      'Try: "cheap tacos Sunnyvale"',
    ],
    []
  );

  function handleAssistantSend() {
    const q = assistantQuery.trim().toLowerCase();
    if (!q) return;

    const matches = restaurants
      .filter((r) => {
        const name = (r.name || "").toLowerCase();
        const cuisine = (r.cuisine || "").toLowerCase();
        const location = (r.location || "").toLowerCase();
        const tags = (r.tags || []).join(" ").toLowerCase();
        return (
          name.includes(q) ||
          cuisine.includes(q) ||
          location.includes(q) ||
          tags.includes(q)
        );
      })
      .slice(0, 3);

    setAssistantResponse(matches);
  }

  function handleAssistantClear() {
    setAssistantQuery("");
    setAssistantResponse([]);
  }

  return (
    <div className="assistant-panel2">
      <div className="assistant-head2">
        <div className="assistant-title2">Ask Assistant</div>
        <button className="assistant-clear2" type="button" onClick={handleAssistantClear}>
          Clear
        </button>
      </div>

      <div className="assistant-body2">
        {assistantResponse.length === 0 ? (
          <div className="assistant-bubble2">{tips[0]}</div>
        ) : (
          assistantResponse.map((r) => (
            <div
              key={r.id}
              className="assistant-bubble2"
              style={{ marginBottom: 10, cursor: "pointer" }}
              onClick={() => navigate(`/restaurants/${r.id}`)}
            >
              <strong>{r.name}</strong> — {r.cuisine} · {r.price} · ★ {r.rating}
            </div>
          ))
        )}
      </div>

      <div className="assistant-inputRow2">
        <input
          className="assistant-input2"
          value={assistantQuery}
          onChange={(e) => setAssistantQuery(e.target.value)}
          placeholder="Ask for recommendations..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAssistantSend();
          }}
        />
        <button className="assistant-send2" type="button" onClick={handleAssistantSend}>
          Send
        </button>
      </div>
    </div>
  );
}