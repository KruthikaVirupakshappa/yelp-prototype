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
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const res = await api.get(`/restaurants/${rid}`);
        setRestaurant(res.data);
      } catch (err) {
        console.error(err);
        setRestaurant(null);
      }
    }

    loadRestaurant();
  }, [rid]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("savedRestaurants");
      const saved = raw ? JSON.parse(raw) : [];
      setIsSaved(Array.isArray(saved) && saved.includes(rid));
    } catch {
      setIsSaved(false);
    }
  }, [rid]);

  function toggleSave() {
    try {
      const raw = localStorage.getItem("savedRestaurants");
      const saved = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(saved) ? saved : [];

      let updated;
      if (list.includes(rid)) {
        updated = list.filter((x) => x !== rid);
        setIsSaved(false);
      } else {
        updated = [...list, rid];
        setIsSaved(true);
      }

      localStorage.setItem("savedRestaurants", JSON.stringify(updated));
    } catch {}
  }

  if (!restaurant) {
    return (
      <div className="page">
        <h2>Loading...</h2>
      </div>
    );
  }

  const rating =
    restaurant.average_rating ??
    restaurant.rating ??
    0;

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
                <span className="details-star">
                  ★ {Number(rating).toFixed(1)}
                </span>
                <span className="details-dot">•</span>
                <span className="details-muted">
                  {restaurant.review_count || 0} reviews
                </span>
                <span className="details-dot">•</span>
                <span className="details-muted">
                  {restaurant.pricing_tier}
                </span>
                <span className="details-dot">•</span>
                <span className="details-muted">
                  {restaurant.cuisine_type}
                </span>
              </div>

              <div className="details-line2">
                <span className="details-muted">
                  📍 {restaurant.address}
                </span>
                <span className="details-dot">•</span>
                <span className="details-muted">
                  {restaurant.phone}
                </span>
              </div>
            </div>

            <button className="details-save" onClick={toggleSave}>
              {isSaved ? "❤️ Saved" : "♡ Save"}
            </button>
          </div>

          <div className="details-actions">
            <button
              className="details-primary"
              onClick={() =>
                navigate(`/restaurants/${rid}/review`)
              }
            >
              Write a Review
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>
              Photos
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(160px, 1fr))",
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
          <aside className="details-right">
            <div className="sideBox">
              <div className="sideTitle">Quick info</div>

              <div>
                Address: {restaurant.address}
              </div>
              <div>
                Phone: {restaurant.phone}
              </div>
            </div>

            <button onClick={() => navigate("/explore")}>
              Back to results
            </button>
          </aside>
        </main>
      </div>
    </div>
  );
}