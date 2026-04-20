import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function WriteReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { state: { message: "Please log in to write a review." } });
      return;
    }
    // Prevent owner from reviewing their own restaurant
    async function checkOwnership() {
      try {
        const res = await api.get(`/restaurants/${id}`);
        const currentUser = JSON.parse(localStorage.getItem("user") || "null");
        if (currentUser && res.data.owner_id === currentUser.id) {
          navigate(`/restaurants/${id}`, { replace: true });
        }
      } catch {
        // ignore — backend will also block the POST
      }
    }
    checkOwnership();
  }, [navigate, id]);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const active = hover || rating;
  const charCount = comment.trim().length;
  const canSubmit = useMemo(
    () => rating > 0 && charCount >= 10 && !submitting,
    [rating, charCount, submitting]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post("/reviews/", {
        restaurant_id: Number(id),
        rating,
        comment: comment.trim(),
      });
      navigate(`/restaurants/${id}`);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to submit review.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wr-page">
      <div className="wr-wrap">

        {/* ── Main form card ── */}
        <div className="wr-card">
          <div className="wr-top">
            <div>
              <div className="wr-eyebrow">Restaurant Review</div>
              <h1 className="wr-title">Write a Review</h1>
            </div>
            <button className="wr-back" type="button" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>

          {error && <div className="auth-alert" style={{ marginBottom: 24 }}>{error}</div>}

          <form onSubmit={onSubmit}>
            {/* Star rating */}
            <div className="wr-field">
              <label className="wr-label">Your rating</label>
              <div className="wr-stars">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`wr-star${active >= v ? " on" : ""}`}
                    onMouseEnter={() => setHover(v)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(v)}
                    aria-label={`${v} star${v > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
                {active > 0 && (
                  <span className="wr-rating-label">{LABELS[active]}</span>
                )}
              </div>
            </div>

            {/* Text */}
            <div className="wr-field">
              <label className="wr-label">Your experience</label>
              <textarea
                className="wr-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you love (or not love)? Mention the food, service, ambiance…"
                rows={5}
              />
              <div className={`wr-hint${charCount >= 10 ? " ok" : ""}`}>
                {charCount < 10
                  ? `${10 - charCount} more character${10 - charCount !== 1 ? "s" : ""} needed`
                  : `${charCount} characters — looks good`}
              </div>
            </div>

            <div className="wr-actions">
              <button
                type="button"
                className="wr-cancel"
                onClick={() => navigate(`/restaurants/${id}`)}
              >
                Cancel
              </button>
              <button type="submit" className="wr-submit" disabled={!canSubmit}>
                {submitting ? "Posting…" : "Post Review"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Sidebar ── */}
        <aside className="wr-side">
          {/* Tips */}
          <div className="wr-side-card">
            <div className="wr-side-title">Writing tips</div>
            <ul className="wr-tips">
              <li>Mention specific dishes you tried</li>
              <li>Describe the service and wait time</li>
              <li>Share the vibe — cozy, loud, romantic?</li>
              <li>Would you go back? Why or why not?</li>
            </ul>
          </div>

          {/* Live preview */}
          <div className="wr-side-card">
            <div className="wr-side-title">Live preview</div>
            <div className="wr-preview-stars">
              {[1,2,3,4,5].map((v) => (
                <span key={v} style={{ color: v <= rating ? "#ff2d55" : "rgba(0,0,0,0.12)" }}>
                  ★
                </span>
              ))}
              {rating > 0 && (
                <span className="wr-preview-rating">{LABELS[rating]}</span>
              )}
            </div>
            <p className="wr-preview-text">
              {comment.trim() || <span className="wr-preview-placeholder">Your review will appear here as you type…</span>}
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
