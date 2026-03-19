import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/owner/restaurants");
        setRestaurants(res.data || []);
      } catch (err) {
        setError("You must be logged in as an owner.");
        console.error(err);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 30, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 10 }}>Owner Dashboard</h1>
      <p style={{ opacity: 0.6, marginBottom: 20 }}>
        Manage your restaurants and track activity
      </p>

      {error && (
        <div style={{ color: "red", marginBottom: 20 }}>{error}</div>
      )}

      {restaurants.length === 0 ? (
        <p>No restaurants found.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {restaurants.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 16,
                borderRadius: 14,
                background: "#f8f8f8",
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {r.name}
                </div>
                <div style={{ opacity: 0.6 }}>{r.city}</div>
                <div
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: "#ff7a59",
                  }}
                >
                  Managed by you
                </div>
              </div>

              <button
                onClick={() => navigate(`/restaurants/${r.id}`)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "#ff7a59",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                View Reviews
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}