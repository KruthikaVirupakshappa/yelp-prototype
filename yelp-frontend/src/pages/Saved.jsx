import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

export default function Saved() {
  const navigate = useNavigate();
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  async function loadFavorites() {
    if (!localStorage.getItem("token")) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/favorites/");
      setFavs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err?.response?.status === 401) { navigate("/login"); return; }
      setError("Failed to load saved restaurants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFavorites(); }, []);

  async function removeFavorite(restId) {
    setConfirmRemoveId(null);
    setRemovingId(restId);
    try {
      await api.delete(`/favorites/${restId}`);
      setFavs((prev) => prev.filter((r) => r.id !== restId));
    } catch (err) {
      const msg = err?.response?.data?.detail || "Remove failed.";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="sv-page">
        <div className="sv-header">
          <h1 className="sv-title">Saved</h1>
        </div>
        <div className="sv-empty">Loading your saved restaurants…</div>
      </div>
    );
  }

  return (
    <div className="sv-page">
      <div className="sv-header">
        <div>
          <h1 className="sv-title">Saved</h1>
          {favs.length > 0 && (
            <p className="sv-subtitle">{favs.length} restaurant{favs.length !== 1 ? "s" : ""} saved</p>
          )}
        </div>
      </div>

      {error && <div className="auth-alert" style={{ maxWidth: 760, margin: "0 auto 20px" }}>{error}</div>}

      {favs.length === 0 ? (
        <div className="sv-empty">
          <div className="sv-empty-icon">🔖</div>
          <div className="sv-empty-title">Nothing saved yet</div>
          <p className="sv-empty-sub">Tap the heart on any restaurant in Explore to save it here for later.</p>
          <button className="sv-cta" onClick={() => navigate("/explore")}>Explore restaurants</button>
        </div>
      ) : (
        <div className="sv-grid">
          {favs.map((r) => (
            <div key={r.id} className="sv-card">
              <div className="sv-card-top">
                <div className="sv-name" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  {r.name}
                </div>
                <button
                  className="sv-remove"
                  onClick={() => setConfirmRemoveId(r.id)}
                  disabled={removingId === r.id}
                  aria-label="Remove from saved"
                >
                  {removingId === r.id ? "…" : "✕"}
                </button>
              </div>

              <div className="sv-meta">
                {r.cuisine_type && (
                  <span className="sv-pill">{r.cuisine_type}</span>
                )}
                {r.pricing_tier && (
                  <span className="sv-pill">{r.pricing_tier}</span>
                )}
                {r.average_rating > 0 && (
                  <span className="sv-pill sv-pill-rating">
                    ★ {Number(r.average_rating).toFixed(1)}
                  </span>
                )}
              </div>

              {r.city && (
                <div className="sv-location">📍 {r.city}{r.state ? `, ${r.state}` : ""}</div>
              )}

              <div className="sv-card-footer">
                <button className="sv-view-btn" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  View details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmRemoveId && (
        <ConfirmModal
          message="Remove from saved?"
          subtext={`"${favs.find((r) => r.id === confirmRemoveId)?.name}" will be removed from your saved list.`}
          confirmLabel="Remove"
          onConfirm={() => removeFavorite(confirmRemoveId)}
          onCancel={() => setConfirmRemoveId(null)}
        />
      )}
    </div>
  );
}
