import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import restaurants from "../data/restaurants";

function starsText(rating) {
  const full = Math.max(0, Math.min(5, Math.floor(rating)));
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rid = Number(id);

  const customRestaurants = useMemo(() => {
    try {
      const raw = localStorage.getItem("customRestaurants");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, []);

  const allRestaurants = useMemo(() => {
    return [...restaurants, ...customRestaurants];
  }, [customRestaurants]);

  const restaurant = useMemo(() => {
    return allRestaurants.find((r) => Number(r.id) === rid);
  }, [allRestaurants, rid]);

  if (!restaurant) {
    return (
      <div className="page">
        <h2>Restaurant not found.</h2>
        <button type="button" onClick={() => navigate("/explore")}>
          Back to Explore
        </button>
      </div>
    );
  }

  const savedReviews = useMemo(() => {
    try {
      const raw = localStorage.getItem("reviewsByRestaurant");
      const store = raw ? JSON.parse(raw) : {};
      return Array.isArray(store[String(rid)]) ? store[String(rid)] : [];
    } catch {
      return [];
    }
  }, [rid]);

  const totalReviewsCount = (restaurant.reviewsCount || 0) + savedReviews.length;

  const [isSaved, setIsSaved] = useState(false);

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
    } catch {
      // ignore
    }
  }

  // ✅ refined: no random picsum; use consistent food placeholders
  const photos =
    Array.isArray(restaurant.photos) && restaurant.photos.length > 0
      ? restaurant.photos
      : [
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=60",
          "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=60",
          "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=60",
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
                  ★ {Number(restaurant.rating || 0).toFixed(1)}
                </span>
                <span className="details-dot">•</span>
                <span className="details-muted">{totalReviewsCount} reviews</span>
                <span className="details-dot">•</span>
                <span className="details-muted">{restaurant.price}</span>
                <span className="details-dot">•</span>
                <span className="details-muted">{restaurant.cuisine}</span>
              </div>

              <div className="details-line2">
                <span className="details-muted">📍 {restaurant.address}</span>
                <span className="details-dot">•</span>
                <span className="details-muted">{restaurant.phone}</span>
              </div>
            </div>

            <button className="details-save" type="button" onClick={toggleSave}>
              {isSaved ? "❤️ Saved" : "♡ Save"}
            </button>
          </div>

          <div className="details-actions">
            <button
              className="details-primary"
              type="button"
              onClick={() => navigate(`/restaurants/${rid}/review`)}
            >
              Write a Review
            </button>
          </div>

          <div className="details-chips">
            {(Array.isArray(restaurant.chips) ? restaurant.chips : []).map((c) => (
              <span key={c} className="details-chip">
                {c}
              </span>
            ))}
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
                  key={`${src}-${idx}`}
                  src={src}
                  alt={`${restaurant.name} photo ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: 140,
                    objectFit: "cover",
                    borderRadius: 14,
                  }}
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </header>

        <main className="details-content">
          <div className="details-left">
            <div className="details-section">
              <div className="details-sectionTitle">Reviews</div>

              <div className="details-card">
                {savedReviews.length === 0 ? (
                  <div style={{ opacity: 0.7, marginBottom: 12 }}>
                    No reviews yet. Be the first!
                  </div>
                ) : (
                  savedReviews.map((rev) => {
                    let profile = null;
                    try {
                      const raw = localStorage.getItem("userProfile");
                      profile = raw ? JSON.parse(raw) : null;
                    } catch {
                      profile = null;
                    }

                    return (
                      <div className="reviewItem" key={rev.id}>
                        <div className="reviewHead">
                          <strong>{profile?.name || "You"}</strong>
                          <span className="reviewStars">{starsText(rev.rating)}</span>
                        </div>

                        {rev.title && (
                          <div className="reviewText">
                            <strong>{rev.title}</strong>
                          </div>
                        )}

                        <div className="reviewText">{rev.text}</div>
                      </div>
                    );
                  })
                )}

                <button
                  className="details-linkBtn"
                  type="button"
                  onClick={() => navigate(`/restaurants/${rid}/review`)}
                >
                  Add your review →
                </button>
              </div>
            </div>
          </div>

          <aside className="details-right">
            <div className="sideBox">
              <div className="sideTitle">Quick info</div>

              <div className="sideRow">
                <span className="sideKey">Address</span>
                <span className="sideVal">{restaurant.address}</span>
              </div>

              <div className="sideRow">
                <span className="sideKey">Phone</span>
                <span className="sideVal">{restaurant.phone}</span>
              </div>
            </div>

            <button
              className="details-back"
              type="button"
              onClick={() => navigate("/explore")}
            >
              Back to results
            </button>
          </aside>
        </main>
      </div>
    </div>
  );
}