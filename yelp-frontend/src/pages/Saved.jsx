import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Saved() {
  const navigate = useNavigate();
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadFavorites() {
    const token = localStorage.getItem("token");
    if (!token) {
      setFavs([]);
      setLoading(false);
      return;
    }

    const res = await fetch("http://127.0.0.1:8000/api/favorites/", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      setFavs([]);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setFavs(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  async function removeFavorite(restId) {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`http://127.0.0.1:8000/api/favorites/${restId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      alert(`Remove failed: ${res.status} ${text}`);
      return;
    }

    setFavs((prev) => prev.filter((r) => r.id !== restId));
  }

  return (
    <div className="page" style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 16 }}>Saved Restaurants</h1>

      {loading ? (
        <p style={{ opacity: 0.7 }}>Loading...</p>
      ) : favs.length === 0 ? (
        <p style={{ opacity: 0.7 }}>You haven’t saved any restaurants yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {favs.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#f5f5f5",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: 600,
              }}
            >
              <span>{r.name}</span>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  View
                </button>

                <button
                  type="button"
                  style={{ color: "#ff2d55" }}
                  onClick={() => removeFavorite(r.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}