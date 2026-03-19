import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AIAssistant from "../components/chat/AIAssistant";
import { api } from "../services/api";

export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();

  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const isTopRated =
    new URLSearchParams(location.search).get("filter") === "top";

  async function loadRestaurants() {
    const res = await api.get("/restaurants", {
      params: { page: 1, limit: 50 },
    });
    const data = res.data;
    setRestaurants(Array.isArray(data) ? data : data?.items || []);
  }

  async function loadFavorites() {
    const token = localStorage.getItem("token");

    if (!token) {
      setSavedIds([]);
      return;
    }

    const res = await api.get("/favorites");
    const favs = res.data;
    const ids = Array.isArray(favs) ? favs.map((r) => r.id) : [];
    setSavedIds(ids);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadRestaurants();
        await loadFavorites();
      } catch (e) {
        console.error(e);
      }
    })();
  }, [location.key]);

  async function toggleSave(restId) {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in first.");
      return;
    }

    const isSaved = savedIds.includes(restId);

    try {
      if (isSaved) {
        await api.delete(`/favorites/${restId}`);
        setSavedIds((prev) => prev.filter((x) => x !== restId));
      } else {
        await api.post(`/favorites/${restId}`);
        setSavedIds((prev) =>
          prev.includes(restId) ? prev : [...prev, restId]
        );
      }
    } catch (err) {
      console.error(err);
      await loadFavorites();
      alert("Could not update favorites.");
    }
  }

  const filtered = useMemo(() => {
    let list = [...restaurants];

    if (isTopRated) {
      list = list
        .filter((r) => r.average_rating !== null)
        .sort(
          (a, b) => (b.average_rating || 0) - (a.average_rating || 0)
        );
    }

    const q = query.toLowerCase().trim();

    if (!q) return list;

    return list.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.cuisine_type || "").toLowerCase().includes(q)
    );
  }, [restaurants, query, isTopRated]);

  function handleSearch(value) {
    setQuery(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const matches = restaurants
      .filter((r) =>
        (r.name || "").toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 5);

    setSuggestions(matches);
  }

  return (
    <div className="explore-wrap">
      <h1 className="explore-title">
        {isTopRated ? "Top Rated Restaurants" : "Explore"}
      </h1>

      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search restaurants..."
        style={{ marginBottom: 10, padding: 8, width: "100%" }}
      />

      {suggestions.length > 0 && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "white",
            marginBottom: 20,
          }}
        >
          {suggestions.map((s) => (
            <div
              key={s.id}
              style={{
                padding: 8,
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
              onClick={() => {
                setQuery(s.name);
                setSuggestions([]);
                navigate(`/restaurants/${s.id}`);
              }}
            >
              {s.name}
            </div>
          ))}
        </div>
      )}

      <div className="cards-grid2">
        {filtered.map((r) => {
          const isSaved = savedIds.includes(r.id);

          return (
            <article key={r.id} className="rest-card2">
              <div className="rest-name2">{r.name}</div>

              <div>
                ★ {Number(r.average_rating || 0).toFixed(1)}
              </div>

              <button
                className="btn2 primary"
                onClick={() => navigate(`/restaurants/${r.id}`)}
              >
                View Details
              </button>

              <button
                className="btn2 ghost"
                onClick={() => toggleSave(r.id)}
              >
                {isSaved ? "❤️ Saved" : "♡ Save"}
              </button>
            </article>
          );
        })}
      </div>

      <AIAssistant />
    </div>
  );
}