import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

function starsText(rating) {
  const full = Math.max(0, Math.min(5, Math.floor(rating)));
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rid = Number(id);

  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [restRes, revRes] = await Promise.all([
          api.get(`/restaurants/${rid}`),
          api.get(`/reviews/restaurant/${rid}`),
        ]);
        setRestaurant(restRes.data);
        setReviews(Array.isArray(revRes.data) ? revRes.data : []);
      } catch (err) {
        console.error(err);
      }

      // Check if favorited (only when logged in)
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const favRes = await api.get("/favorites/");
          const favIds = Array.isArray(favRes.data)
            ? favRes.data.map((r) => r.id)
            : [];
          setIsSaved(favIds.includes(rid));
        } catch {
          setIsSaved(false);
        }
      }
    }
    load();
  }, [rid]);

  async function toggleSave() {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to save restaurants.");
      return;
    }

    setSaveLoading(true);
    try {
      if (isSaved) {
        await api.delete(`/favorites/${rid}`);
        setIsSaved(false);
      } else {
        await api.post(`/favorites/${rid}`);
        setIsSaved(true);
      }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Could not update favorites.");
    } finally {
      setSaveLoading(false);
    }
  }

  if (!restaurant) {
    return (
      <div className="page">
        <h2>Loading...</h2>
      </div>
    );
  }

  const rating = restaurant.average_rating ?? 0;

  const photos =
    Array.isArray(restaurant.photos) &&
    restaurant.photos.length > 0 &&
    restaurant.photos.some((p) => p)
      ? restaurant.photos
      : [
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
          "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
          "https://images.unsplash.com/photo-1551218808-94e220e084d2",
        ];

  return (
    <div className="details-page">
      <div className="details-shell">
        <header className="details-hero">
          <div className="details-heroTop">
            <div>
              <h1 className="details-name">{restaurant.name}</h1>

              <div className="details-line">
                <span className="details-star">★ {Number(rating).toFixed(1)}</span>
                <span className="details-dot">•</span>
                <span className="details-muted">{restaurant.review_count || 0} reviews</span>
                <span className="details-dot">•</span>
                <span className="details-muted">{restaurant.pricing_tier}</span>
                <span className="details-dot">•</span>
                <span className="details-muted">{restaurant.cuisine_type}</span>
              </div>

              <div className="details-line2">
                <span className="details-muted">📍 {restaurant.address}</span>
                {restaurant.phone && (
                  <>
                    <span className="details-dot">•</span>
                    <span className="details-muted">{restaurant.phone}</span>
                  </>
                )}
              </div>

              {restaurant.description && (
                <p style={{ marginTop: 10, opacity: 0.8 }}>{restaurant.description}</p>
              )}
            </div>

            <button
              className="details-save"
              onClick={toggleSave}
              disabled={saveLoading}
            >
              {isSaved ? "❤️ Saved" : "♡ Save"}
            </button>
          </div>

          <div className="details-actions">
            <button
              className="details-primary"
              onClick={() => navigate(`/restaurants/${rid}/review`)}
            >
              Write a Review
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Photos</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
              }}
            >
              {photos.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt="restaurant"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1504674900247-0877df9cc836";
                  }}
                  style={{
                    width: "100%",
                    height: 140,
                    objectFit: "cover",
                    borderRadius: 14,
                  }}
                />
              ))}
            </div>
          </div>
        </header>

        <main className="details-content">
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontWeight: 900, marginBottom: 16 }}>
              Reviews ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <p style={{ opacity: 0.6 }}>No reviews yet. Be the first!</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {reviews.map((rev) => (
                  <div key={rev.id} className="reviewItem">
                    <div className="reviewHead">
                      <span style={{ fontWeight: 800 }}>{rev.user_name || "Anonymous"}</span>
                      <span className="reviewStars">{starsText(rev.rating)}</span>
                      {rev.created_at && (
                        <span style={{ fontSize: 12, opacity: 0.5, marginLeft: "auto" }}>
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {rev.comment && (
                      <div className="reviewText">{rev.comment}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="details-right">
            <div className="sideBox">
              <div className="sideTitle">Quick info</div>
              {restaurant.address && <div>Address: {restaurant.address}</div>}
              {restaurant.phone && <div>Phone: {restaurant.phone}</div>}
              {restaurant.hours_of_operation && (
                <div>Hours: {restaurant.hours_of_operation}</div>
              )}
              {restaurant.website && (
                <div>
                  Website:{" "}
                  <a href={restaurant.website} target="_blank" rel="noreferrer">
                    {restaurant.website}
                  </a>
                </div>
              )}
            </div>

            <button onClick={() => navigate("/explore")}>Back to results</button>
          </aside>
        </main>
      </div>
    </div>
  );
}
