import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function MyReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [restaurantNames, setRestaurantNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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

            return (
              <div key={rev.id} className="mr-card">
                {/* Top row */}
                <div className="mr-card-top">
                  <div className="mr-restaurant-name"
                    onClick={() => navigate(`/restaurants/${rev.restaurant_id}`)}
                  >
                    {name}
                  </div>
                  <button
                    className="mr-delete"
                    onClick={() => removeReview(rev.id)}
                    disabled={deletingId === rev.id}
                    aria-label="Delete review"
                  >
                    {deletingId === rev.id ? "…" : "✕"}
                  </button>
                </div>

                {/* Stars + label */}
                <div className="mr-stars-row">
                  <span className="mr-stars">
                    {[1,2,3,4,5].map((v) => (
                      <span key={v} style={{ color: v <= rev.rating ? "#ff2d55" : "rgba(0,0,0,0.13)" }}>★</span>
                    ))}
                  </span>
                  {label && <span className="mr-rating-label">{label}</span>}
                  {date && <span className="mr-date">{date}</span>}
                </div>

                {/* Comment */}
                {rev.comment && (
                  <p className="mr-comment">{rev.comment}</p>
                )}

                {/* Footer */}
                <div className="mr-card-footer">
                  <button
                    className="mr-view-btn"
                    onClick={() => navigate(`/restaurants/${rev.restaurant_id}`)}
                  >
                    View restaurant →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
