import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function OwnerDashboard() {
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
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 20,
      }}
    >
      <h1 style={{ marginBottom: 10 }}>Owner Dashboard</h1>
      <p style={{ opacity: 0.6, marginBottom: 20 }}>
        Manage your restaurants and track activity
      </p>

      {error && (
        <div
          style={{
            background: "#ffe5e5",
            color: "#b00020",
            padding: 10,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {restaurants.length === 0 ? (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "#fafafa",
            textAlign: "center",
            opacity: 0.7,
          }}
        >
          No restaurants yet — add your first one ✨
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {restaurants.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 18,
                borderRadius: 16,
                background: "linear-gradient(135deg, #ffffff, #f8f8f8)",
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0px)")
              }
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {r.name}
              </div>

              <div style={{ opacity: 0.6, marginTop: 4 }}>
                {r.city}
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                  background: "#ffe8dc",
                  color: "#ff6b3d",
                }}
              >
                Managed by you
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}