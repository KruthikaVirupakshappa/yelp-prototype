import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Explore() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(
        "http://127.0.0.1:8000/api/restaurants/?page=1&limit=50"
      );
      if (!res.ok) return;
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    })();
  }, []);

  async function loadFavorites() {
    const token = localStorage.getItem("token");
    if (!token) {
      setSavedIds([]);
      return;
    }

    const res = await fetch("http://127.0.0.1:8000/api/favorites/", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const favs = await res.json();
    const ids = Array.isArray(favs) ? favs.map((r) => r.id) : [];
    setSavedIds(ids);
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  async function toggleFavoriteBackend(restId, shouldSave) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("NO_TOKEN");

    const method = shouldSave ? "POST" : "DELETE";

    const res = await fetch(`http://127.0.0.1:8000/api/favorites/${restId}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) return;

    if (method === "DELETE" && res.status === 404) return;

    const text = await res.text().catch(() => "");
    throw new Error(`Favorites ${method} failed: ${res.status} ${text}`);
  }

  async function toggleSave(restId) {
    const isSaved = savedIds.includes(restId);

    try {
      await toggleFavoriteBackend(restId, !isSaved);

      setSavedIds((prev) => {
        if (isSaved) return prev.filter((x) => x !== restId);
        if (prev.includes(restId)) return prev;
        return [...prev, restId];
      });
    } catch (err) {
      if (String(err?.message) === "NO_TOKEN") {
        alert("Please log in first.");
        return;
      }
      console.error(err);
      await loadFavorites();
      alert("Could not update favorites.");
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return restaurants.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.cuisine_type || "").toLowerCase().includes(q)
    );
  }, [restaurants, query]);

  return (
    <div className="explore-wrap">
      <h1 className="explore-title">Explore</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search restaurants..."
        style={{ marginBottom: 20, padding: 8, width: "100%" }}
      />

      <div className="cards-grid2">
        {filtered.map((r) => {
          const isSaved = savedIds.includes(r.id);

          return (
            <article key={r.id} className="rest-card2">
              <div className="rest-name2">{r.name}</div>
              <div>★ {Number(r.average_rating || 0).toFixed(1)}</div>

              <button
                className="btn2 primary"
                onClick={() => navigate(`/restaurants/${r.id}`)}
              >
                View Details
              </button>

              <button className="btn2 ghost" onClick={() => toggleSave(r.id)}>
                {isSaved ? "❤️ Saved" : "♡ Save"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}