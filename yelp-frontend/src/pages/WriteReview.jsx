import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function WriteReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return rating > 0 && comment.trim().length >= 10 && !submitting;
  }, [rating, comment, submitting]);

  const onPickPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotos(files.slice(0, 6));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);

    try {
      const newReview = {
        id: Date.now(),
        rating,
        title,
        text: comment,
        photos,
      };

      const raw = localStorage.getItem("reviewsByRestaurant");
      const store = raw ? JSON.parse(raw) : {};

      if (!store[id]) {
        store[id] = [];
      }

      store[id].unshift(newReview);

      localStorage.setItem("reviewsByRestaurant", JSON.stringify(store));

      await new Promise((r) => setTimeout(r, 500));
      navigate(`/restaurants/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="write-wrap">
        <div className="write-card">
          <div className="write-top">
            <div>
              <div className="write-eyebrow">Review</div>
              <h1 className="write-title">Write a Review</h1>
              <div className="write-meta">Restaurant ID: {id}</div>
            </div>

            <button
              className="write-back"
              type="button"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>

          <form className="write-form" onSubmit={onSubmit}>
            <div className="field">
              <label className="label">Your rating</label>

              <div className="stars">
                {Array.from({ length: 5 }).map((_, i) => {
                  const v = i + 1;
                  const active = (hover || rating) >= v;

                  return (
                    <button
                      key={v}
                      type="button"
                      className={`star ${active ? "is-on" : ""}`}
                      onMouseEnter={() => setHover(v)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(v)}
                    >
                      ★
                    </button>
                  );
                })}

                <span className="stars-text">
                  {rating ? `${rating}/5` : "Select"}
                </span>
              </div>
            </div>

            <div className="field">
              <label className="label">Title (optional)</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Amazing food!"
              />
            </div>

            <div className="field">
              <label className="label">Your review</label>
              <textarea
                className="textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
              />
              <div className="hint">
                {comment.trim().length < 10
                  ? "Minimum 10 characters."
                  : "Looks good."}
              </div>
            </div>

            <div className="field">
              <label className="label">Photos (optional)</label>
              <div className="upload">
                <input
                  className="file"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPickPhotos}
                />
                <div className="upload-right">
                  <div className="upload-title">Add up to 6 photos</div>
                  <div className="upload-sub">JPG/PNG/HEIC supported</div>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="photo-grid">
                  {photos.map((f) => (
                    <div className="photo-pill" key={f.name}>
                      <span className="dot" />
                      <span className="name">{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="write-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate(`/restaurants/${id}`)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={!canSubmit}
              >
                {submitting ? "Posting..." : "Post Review"}
              </button>
            </div>
          </form>
        </div>

        <div className="write-side">
          <div className="side-card">
            <div className="side-title">Quick tips</div>
            <ul className="side-list">
              <li>Talk about the dish you ordered</li>
              <li>Mention service & wait time</li>
              <li>Describe the ambiance</li>
            </ul>
          </div>

          <div className="side-card">
            <div className="side-title">Preview</div>
            <div className="preview">
              <div className="preview-stars">
                {"★★★★★".slice(0, rating || 0)}
                <span className="preview-muted">
                  {"★★★★★".slice(0, 5 - (rating || 0))}
                </span>
              </div>

              <div className="preview-h">
                {title.trim()
                  ? title
                  : "Your title will appear here"}
              </div>

              <div className="preview-p">
                {comment.trim()
                  ? comment
                  : "Your review text will appear here once you start typing."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}