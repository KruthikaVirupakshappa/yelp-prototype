import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function MyReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [restaurantNames, setRestaurantNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: "" });
  const [savingId, setSavingId] = useState(null);

  async function loadReviews() {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/reviews/user/history");
      const data = Array.isArray(res.data) ? res.data : [];
      setReviews(data);

      const uniqueIds = [...new Set(data.map((r) => r.restaurant_id))];
      const nameMap = {};
      await Promise.all(
        uniqueIds.map(async (rid) => {
          try {
            const r = await api.get(`/restaurants/${rid}`);
            nameMap[rid] = r.data?.name || `Restaurant #${rid}`;
          } catch {
            nameMap[rid] = `Restaurant #${rid}`;
          }
        })
      );
      setRestaurantNames(nameMap);
    } catch (err) {
      if (err?.response?.status === 401) { navigate("/login"); return; }
      setError("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReviews(); }, []);

  async function removeReview(reviewId) {
    setDeletingId(reviewId);
    setConfirmDeleteId(null);
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to delete review.";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(rev) {
    setEditingId(rev.id);
    setEditForm({ rating: rev.rating, comment: rev.comment || "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ rating: 5, comment: "" });
  }

  async function saveEdit(reviewId) {
    setSavingId(reviewId);
    try {
      const res = await api.put(`/reviews/${reviewId}`, {
        rating: editForm.rating,
        comment: editForm.comment,
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, ...res.data } : r))
      );
      setEditingId(null);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to update review.";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mr-page">
        <div className="mr-header">
          <h1 className="mr-title">My Reviews</h1>
        </div>
        <div className="mr-empty">Loading your reviews…</div>
      </div>
    );
  }

  return (
    <div className="mr-page">
      <div className="mr-header">
        <div>
          <h1 className="mr-title">My Reviews</h1>
          {reviews.length > 0 && (
            <p className="mr-subtitle">{reviews.length} review{reviews.length !== 1 ? "s" : ""} posted</p>
          )}
        </div>
      </div>

      {error && <div className="auth-alert" style={{ maxWidth: 720, margin: "0 auto 20px" }}>{error}</div>}

      {reviews.length === 0 ? (
        <div className="mr-empty">
          <div className="mr-empty-icon">✍️</div>
          <div className="mr-empty-title">No reviews yet</div>
          <p className="mr-empty-sub">Head to Explore → View Details → Write a Review to share your experience.</p>
          <button className="mr-cta" onClick={() => navigate("/explore")}>Explore restaurants</button>
        </div>
      ) : (
        <div className="mr-grid">
          {reviews.map((rev) => {
            const name = restaurantNames[rev.restaurant_id] || `Restaurant #${rev.restaurant_id}`;
            const date = rev.created_at
              ? new Date(rev.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : null;
            const label = RATING_LABELS[Math.round(rev.rating)] || "";
            const isEditing = editingId === rev.id;

            return (
              <div key={rev.id} className="mr-card">
                {/* Top row */}
                <div className="mr-card-top">
                  <div className="mr-restaurant-name"
                    onClick={() => navigate(`/restaurants/${rev.restaurant_id}`)}
                  >
                    {name}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {!isEditing && (
                      <button
                        className="mr-edit"
                        onClick={() => startEdit(rev)}
                        aria-label="Edit review"
                        style={{
                          background: "none", border: "1px solid rgba(0,0,0,0.15)",
                          borderRadius: 6, padding: "2px 10px", cursor: "pointer",
                          fontSize: 13, color: "#555",
                        }}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      className="mr-delete"
                      onClick={() => setConfirmDeleteId(rev.id)}
                      disabled={deletingId === rev.id || isEditing}
                      aria-label="Delete review"
                    >
                      {deletingId === rev.id ? "…" : "✕"}
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  /* ── Edit mode ── */
                  <div style={{ marginTop: 10 }}>
                    {/* Star picker */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Rating</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[1,2,3,4,5].map((v) => (
                          <span
                            key={v}
                            onClick={() => setEditForm((f) => ({ ...f, rating: v }))}
                            style={{
                              fontSize: 26, cursor: "pointer",
                              color: v <= editForm.rating ? "#ff2d55" : "rgba(0,0,0,0.13)",
                            }}
                          >★</span>
                        ))}
                        <span style={{ fontSize: 13, alignSelf: "center", marginLeft: 6, color: "#555" }}>
                          {RATING_LABELS[editForm.rating]}
                        </span>
                      </div>
                    </div>

                    {/* Comment textarea */}
                    <textarea
                      value={editForm.comment}
                      onChange={(e) => setEditForm((f) => ({ ...f, comment: e.target.value }))}
                      rows={3}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)",
                        padding: "8px 10px", fontSize: 14, resize: "vertical",
                      }}
                      placeholder="Update your review…"
                    />

                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => saveEdit(rev.id)}
                        disabled={savingId === rev.id}
                        style={{
                          background: "#ff2d55", color: "#fff", border: "none",
                          borderRadius: 7, padding: "6px 18px", cursor: "pointer",
                          fontWeight: 700, fontSize: 13,
                        }}
                      >
                        {savingId === rev.id ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          background: "none", border: "1px solid rgba(0,0,0,0.15)",
                          borderRadius: 7, padding: "6px 14px", cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Read mode ── */
                  <>
                    <div className="mr-stars-row">
                      <span className="mr-stars">
                        {[1,2,3,4,5].map((v) => (
                          <span key={v} style={{ color: v <= rev.rating ? "#ff2d55" : "rgba(0,0,0,0.13)" }}>★</span>
                        ))}
                      </span>
                      {label && <span className="mr-rating-label">{label}</span>}
                      {date && <span className="mr-date">{date}</span>}
                    </div>

                    {rev.comment && (
                      <p className="mr-comment">{rev.comment}</p>
                    )}

                    {rev.photo_url && (
                      <img
                        src={rev.photo_url}
                        alt="review"
                        style={{ marginTop: 8, width: "100%", height: 160, objectFit: "cover", borderRadius: 10 }}
                      />
                    )}

                    <div className="mr-card-footer">
                      <button
                        className="mr-view-btn"
                        onClick={() => navigate(`/restaurants/${rev.restaurant_id}`)}
                      >
                        View restaurant →
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message="Delete this review?"
          subtext="This can't be undone."
          confirmLabel="Delete"
          onConfirm={() => removeReview(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
