import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import restaurants from "../data/restaurants";

function starsText(rating) {
  const full = Math.max(0, Math.min(5, Math.floor(rating)));
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

export default function MyReviews() {
  const navigate = useNavigate();

  const [refresh, setRefresh] = useState(0);

  
  const allRestaurants = useMemo(() => {
    let custom = [];
    try {
      const raw = localStorage.getItem("customRestaurants");
      const parsed = raw ? JSON.parse(raw) : [];
      custom = Array.isArray(parsed) ? parsed : [];
    } catch {
      custom = [];
    }
    return [...custom, ...restaurants];
  }, [refresh]);

  const reviews = useMemo(() => {
    try {
      const raw = localStorage.getItem("reviewsByRestaurant");
      const store = raw ? JSON.parse(raw) : {};

      const flat = [];
      Object.keys(store || {}).forEach((rid) => {
        const list = Array.isArray(store[rid]) ? store[rid] : [];
        list.forEach((rev) => {
          flat.push({
            restaurantId: Number(rid),
            id: rev.id ?? `${rid}-${Math.random()}`,
            rating: rev.rating ?? 0,
            title: rev.title ?? "",
            text: rev.text ?? "",
            createdAt: rev.createdAt ?? rev.id ?? 0,
          });
        });
      });

      flat.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return flat;
    } catch {
      return [];
    }
  }, [refresh]);

  function removeReview(restaurantId, reviewId) {
    try {
      const raw = localStorage.getItem("reviewsByRestaurant");
      const store = raw ? JSON.parse(raw) : {};
      const key = String(restaurantId);
      const list = Array.isArray(store[key]) ? store[key] : [];
      store[key] = list.filter((r) => r.id !== reviewId);
      localStorage.setItem("reviewsByRestaurant", JSON.stringify(store));
      setRefresh((x) => x + 1);
    } catch {
      setRefresh((x) => x + 1);
    }
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: 12 }}>My Reviews</h1>

      {reviews.length === 0 ? (
        <p style={{ opacity: 0.7 }}>
          You haven’t posted any reviews yet. Go to Explore → View Details → Write
          a Review.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {reviews.map((rev) => {
            const restaurant = allRestaurants.find(
              (r) => Number(r.id) === Number(rev.restaurantId)
            );

            return (
              <div
                key={`${rev.restaurantId}-${rev.id}`}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "#f5f5f5",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>
                    {restaurant ? restaurant.name : "Unknown Restaurant"}
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ fontWeight: 700 }}>{starsText(rev.rating)}</div>

                    <button
                      type="button"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ff2d55",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                      onClick={() => removeReview(rev.restaurantId, rev.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {rev.title ? (
                  <div style={{ marginTop: 8, fontWeight: 700 }}>{rev.title}</div>
                ) : null}

                <div style={{ marginTop: 6, opacity: 0.9 }}>{rev.text}</div>

                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn2 primary"
                    onClick={() => navigate(`/restaurants/${rev.restaurantId}`)}
                  >
                    View Restaurant
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