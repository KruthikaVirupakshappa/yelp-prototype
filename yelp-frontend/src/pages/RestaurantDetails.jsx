import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import { OpenNowBadge } from "../utils/openNow.jsx";

function starsText(rating) {
  const full = Math.max(0, Math.min(5, Math.floor(rating)));
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

function RatingBreakdown({ reviews }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {counts.map(({ star, count }) => (
        <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <span style={{ width: 16, textAlign: "right", opacity: 0.7 }}>{star}★</span>
          <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 6, height: 8, overflow: "hidden" }}>
            <div
              style={{
                width: `${(count / max) * 100}%`,
                height: "100%",
                background: "var(--grad, #ff2d55)",
                borderRadius: 6,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span style={{ width: 20, opacity: 0.6 }}>{count}</span>
        </div>
      ))}
    </div>
  );
}

function MiniMap({ restaurant }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    const query = [restaurant.address, restaurant.city, restaurant.state, restaurant.zip_code]
      .filter(Boolean)
      .join(", ");
    if (!query) return;

    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
        }
      })
      .catch(() => {});
  }, [restaurant.address, restaurant.city, restaurant.state, restaurant.zip_code]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [restaurant.address, restaurant.city, restaurant.state, restaurant.zip_code].filter(Boolean).join(", ")
  )}`;

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
      {coords ? (
        <iframe
          title="map"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.012},${coords.lat - 0.008},${coords.lon + 0.012},${coords.lat + 0.008}&layer=mapnik&marker=${coords.lat},${coords.lon}`}
          style={{ width: "100%", height: 200, border: 0, display: "block" }}
          loading="lazy"
        />
      ) : (
        <div style={{ height: 200, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, opacity: 0.5 }}>
          {restaurant.city ? "Locating on map…" : "No address available"}
        </div>
      )}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "block", textAlign: "center", padding: "10px",
          fontSize: 13, fontWeight: 600, color: "#ff2d55",
          background: "white", textDecoration: "none",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        Open in Google Maps ↗
      </a>
    </div>
  );
}

function SimilarRestaurants({ cuisineType, currentId }) {
  const [similar, setSimilar] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!cuisineType) return;
    api.get("/restaurants/", { params: { cuisine_type: cuisineType, limit: 5 } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setSimilar(data.filter((r) => r.id !== currentId).slice(0, 4));
      })
      .catch(() => {});
  }, [cuisineType, currentId]);

  if (!similar.length) return null;

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Similar Restaurants</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {similar.map((r) => (
          <div
            key={r.id}
            onClick={() => navigate(`/restaurants/${r.id}`)}
            style={{
              padding: "12px 14px", borderRadius: 12, background: "#fafafa",
              border: "1px solid rgba(0,0,0,0.07)", cursor: "pointer",
              transition: "box-shadow 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
              ★ {Number(r.average_rating || 0).toFixed(1)} · {r.city || ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rid = Number(id);

  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [confirmUnsave, setConfirmUnsave] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // Owner reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Voting state: { [review_id]: "helpful" | "unhelpful" | null }
  const [myVotes, setMyVotes] = useState({});

  // AI summary
  const [aiSummary, setAiSummary] = useState(null);

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

      const token = localStorage.getItem("token");
      if (token) {
        try {
          const favRes = await api.get("/favorites/");
          const favIds = Array.isArray(favRes.data) ? favRes.data.map((r) => r.id) : [];
          setIsSaved(favIds.includes(rid));
        } catch {
          setIsSaved(false);
        }
      }
    }
    load();
  }, [rid]);

  // Fetch AI summary — 8s timeout so it never blocks the page
  useEffect(() => {
    if (reviews.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35000);
    api.get(`/ai-assistant/restaurant/${rid}/summary`, { signal: controller.signal })
      .then((res) => { if (res.data?.summary) setAiSummary(res.data.summary); })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => controller.abort();
  }, [rid, reviews.length]);

  async function doUnsave() {
    setConfirmUnsave(false);
    setSaveLoading(true);
    try {
      await api.delete(`/favorites/${rid}`);
      setIsSaved(false);
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not update favorites.");
    } finally {
      setSaveLoading(false);
    }
  }

  async function toggleSave() {
    if (!localStorage.getItem("token")) {
      alert("Please log in to save restaurants.");
      return;
    }
    if (isSaved) { setConfirmUnsave(true); return; }
    setSaveLoading(true);
    try {
      await api.post(`/favorites/${rid}`);
      setIsSaved(true);
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not update favorites.");
    } finally {
      setSaveLoading(false);
    }
  }

  async function submitReply(reviewId) {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await api.post(`/reviews/${reviewId}/reply`, { reply: replyText });
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, owner_reply: res.data.owner_reply, owner_reply_at: res.data.owner_reply_at } : r));
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to post reply.");
    } finally {
      setSubmittingReply(false);
    }
  }

  async function deleteReply(reviewId) {
    try {
      await api.delete(`/reviews/${reviewId}/reply`);
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, owner_reply: null, owner_reply_at: null } : r));
    } catch {
      alert("Failed to delete reply.");
    }
  }

  async function voteReview(reviewId, vote) {
    if (!localStorage.getItem("token")) { alert("Please log in to vote."); return; }
    try {
      const res = await api.post(`/reviews/${reviewId}/vote`, { vote });
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, helpful_votes: res.data.helpful_votes, unhelpful_votes: res.data.unhelpful_votes } : r));
      setMyVotes((prev) => ({ ...prev, [reviewId]: res.data.your_vote || null }));
    } catch (err) {
      console.error(err);
    }
  }

  // Merge restaurant photos + review photos into one gallery
  const allPhotos = useMemo(() => {
    const restPhotos = (Array.isArray(restaurant?.photos) ? restaurant.photos : [])
      .filter(Boolean)
      .map((src) => ({ src, label: "Restaurant" }));
    const reviewPhotos = reviews
      .filter((r) => r.photo_url)
      .map((r) => ({ src: r.photo_url, label: r.user_name || "Guest" }));
    return [...restPhotos, ...reviewPhotos];
  }, [restaurant, reviews]);

  if (!restaurant) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ opacity: 0.5, fontSize: 16 }}>Loading…</p>
      </div>
    );
  }

  const rating = restaurant.average_rating ?? 0;
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isOwner = currentUser && restaurant.owner_id && restaurant.owner_id === currentUser.id;

  return (
    <div className="details-page">
      {/* Lightbox */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, cursor: "zoom-out",
          }}
        >
          <img src={lightboxSrc} alt="full" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />
        </div>
      )}

      {confirmUnsave && (
        <ConfirmModal
          message="Remove from saved?"
          subtext={`"${restaurant.name}" will be removed from your saved list.`}
          confirmLabel="Remove"
          onConfirm={doUnsave}
          onCancel={() => setConfirmUnsave(false)}
        />
      )}

      <div className="details-shell">
        {/* ── Top nav row ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button className="ar-back" onClick={() => navigate("/explore")}>← Back to results</button>
          <button
            onClick={toggleSave}
            disabled={saveLoading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 20px", borderRadius: 12,
              border: isSaved ? "none" : "1.5px solid rgba(0,0,0,0.12)",
              background: isSaved ? "var(--grad)" : "white",
              color: isSaved ? "white" : "#333",
              fontWeight: 700, fontSize: 14,
              cursor: saveLoading ? "not-allowed" : "pointer",
              opacity: saveLoading ? 0.6 : 1,
              boxShadow: isSaved ? "0 4px 16px rgba(255,45,85,0.25)" : "0 1px 4px rgba(0,0,0,0.07)",
              transition: "all 0.18s ease",
            }}
          >
            {isSaved ? "❤️ Saved" : "♡ Save"}
          </button>
        </div>

        {/* ── Hero card ── */}
        <header className="details-hero">
          {/* Name + rating row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 className="details-name">{restaurant.name}</h1>
              <div className="details-line" style={{ marginTop: 8, flexWrap: "wrap", rowGap: 6 }}>
                <span className="details-star">★ {Number(rating).toFixed(1)}</span>
                <span className="details-dot">•</span>
                <span className="details-muted">{restaurant.review_count || 0} reviews</span>
                <span className="details-dot">•</span>
                <span className="details-muted">{restaurant.pricing_tier}</span>
                <span className="details-dot">•</span>
                <span className="details-muted">{restaurant.cuisine_type}</span>
                {restaurant.hours_of_operation && (
                  <><span className="details-dot">•</span><OpenNowBadge hours={restaurant.hours_of_operation} /></>
                )}
              </div>
            </div>
            <div style={{ flexShrink: 0, paddingTop: 4 }}>
              {!isOwner && (
                <button
                  className="ar-submit"
                  style={{ padding: "11px 24px", fontSize: 14 }}
                  onClick={() => navigate(`/restaurants/${rid}/review`)}
                >
                  ✏️ Write a Review
                </button>
              )}
              {isOwner && (
                <div style={{
                  padding: "9px 16px", borderRadius: 12, fontSize: 13,
                  background: "rgba(255,45,85,0.07)", color: "#ff2d55",
                  fontWeight: 600,
                }}>
                  🏠 You own this restaurant
                </div>
              )}
            </div>
          </div>

          {/* Map + Quick Info side by side */}
          <div style={{ display: "flex", gap: 16, marginTop: 18, flexWrap: "wrap" }}>
            {(restaurant.address || restaurant.city || restaurant.zip_code) && (
              <div style={{ flex: "1 1 55%", minWidth: 260 }}>
                <MiniMap restaurant={restaurant} />
              </div>
            )}
            <div style={{ flex: "1 1 35%", minWidth: 200, borderRadius: 14, padding: "16px 18px", background: "#fafafa", border: "1px solid rgba(0,0,0,0.07)", fontSize: 14, color: "#444", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>Quick info</div>
              {restaurant.address && (
                <div>
                  <span style={{ opacity: 0.5, fontSize: 12 }}>Address</span><br />
                  {restaurant.address}{restaurant.city ? `, ${restaurant.city}` : ""}
                  {restaurant.state ? ` ${restaurant.state}` : ""}
                  {restaurant.zip_code ? ` ${restaurant.zip_code}` : ""}
                </div>
              )}
              {restaurant.phone && <div><span style={{ opacity: 0.5, fontSize: 12 }}>Phone</span><br />{restaurant.phone}</div>}
              {restaurant.hours_of_operation && <div><span style={{ opacity: 0.5, fontSize: 12 }}>Hours</span><br />{restaurant.hours_of_operation}</div>}
              {restaurant.amenities && <div><span style={{ opacity: 0.5, fontSize: 12 }}>Amenities</span><br />{restaurant.amenities}</div>}
              {restaurant.website && (
                <div>
                  <span style={{ opacity: 0.5, fontSize: 12 }}>Website</span><br />
                  <a href={restaurant.website} target="_blank" rel="noreferrer" style={{ color: "#ff2d55", textDecoration: "none", fontWeight: 600 }}>
                    {restaurant.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {restaurant.description && (
            <p style={{ marginTop: 16, opacity: 0.75, lineHeight: 1.6 }}>
              {restaurant.description}
            </p>
          )}

          {/* ── Photo Gallery (restaurant + review photos) ── */}
          {allPhotos.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>
                Photos ({allPhotos.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
                {allPhotos.map(({ src, label }, idx) => (
                  <div key={idx} style={{ position: "relative", cursor: "zoom-in" }} onClick={() => setLightboxSrc(src)}>
                    <img
                      src={src}
                      alt="photo"
                      style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 14, display: "block" }}
                    />
                    {label !== "Restaurant" && (
                      <span style={{
                        position: "absolute", bottom: 6, left: 6,
                        background: "rgba(0,0,0,0.55)", color: "white",
                        fontSize: 11, padding: "2px 7px", borderRadius: 8,
                      }}>
                        {label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* ── Main content ── */}
        <main className="details-content">
          {/* Reviews section */}
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontWeight: 900, marginBottom: 16, fontSize: 20 }}>
              Reviews ({reviews.length})
            </h2>

            {reviews.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <RatingBreakdown reviews={reviews} />
                {aiSummary && (
                  <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 12, background: "linear-gradient(135deg,rgba(255,45,85,0.06),rgba(255,122,24,0.06))", border: "1px solid rgba(255,45,85,0.12)" }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#ff2d55", marginBottom: 4 }}>✨ AI Summary</div>
                    <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{aiSummary}</p>
                  </div>
                )}
              </div>
            )}

            {reviews.length === 0 ? (
              <p style={{ opacity: 0.55, fontSize: 15 }}>No reviews yet — be the first!</p>
            ) : (
              <div style={{ display: "grid", gap: 4 }}>
                {reviews.map((rev) => (
                  <div key={rev.id} className="reviewItem">
                    <div className="reviewHead">
                      <span style={{ fontWeight: 800 }}>{rev.user_name || "Anonymous"}</span>
                      <span className="reviewStars">{starsText(rev.rating)}</span>
                      {rev.created_at && (
                        <span style={{ fontSize: 12, opacity: 0.45, marginLeft: "auto" }}>
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {rev.comment && <div className="reviewText">{rev.comment}</div>}
                    {rev.photo_url && (
                      <img
                        src={rev.photo_url}
                        alt="review"
                        onClick={() => setLightboxSrc(rev.photo_url)}
                        style={{ marginTop: 10, width: "100%", maxWidth: 360, height: 200, objectFit: "cover", borderRadius: 10, cursor: "zoom-in" }}
                      />
                    )}

                    {/* Helpfulness voting */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                      <span style={{ fontSize: 12, opacity: 0.5 }}>Helpful?</span>
                      {["helpful", "unhelpful"].map((vote) => (
                        <button
                          key={vote}
                          onClick={() => voteReview(rev.id, vote)}
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "3px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                            border: "1px solid rgba(0,0,0,0.12)",
                            background: myVotes[rev.id] === vote
                              ? (vote === "helpful" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.08)")
                              : "transparent",
                            fontWeight: myVotes[rev.id] === vote ? 700 : 400,
                          }}
                        >
                          {vote === "helpful" ? "👍" : "👎"}
                          <span style={{ opacity: 0.7 }}>{vote === "helpful" ? (rev.helpful_votes || 0) : (rev.unhelpful_votes || 0)}</span>
                        </button>
                      ))}
                    </div>

                    {/* Owner reply display */}
                    {rev.owner_reply && (
                      <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(255,45,85,0.05)", borderLeft: "3px solid #ff2d55" }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#ff2d55", marginBottom: 4 }}>🏠 Owner replied</div>
                        <div style={{ fontSize: 14, lineHeight: 1.5 }}>{rev.owner_reply}</div>
                        {isOwner && (
                          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                            <button onClick={() => { setReplyingTo(rev.id); setReplyText(rev.owner_reply); }} style={{ fontSize: 12, color: "#666", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Edit</button>
                            <button onClick={() => deleteReply(rev.id)} style={{ fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Delete</button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Owner reply form */}
                    {isOwner && !rev.owner_reply && replyingTo !== rev.id && (
                      <button
                        onClick={() => { setReplyingTo(rev.id); setReplyText(""); }}
                        style={{ marginTop: 10, fontSize: 12, color: "#ff2d55", background: "none", border: "1px solid rgba(255,45,85,0.3)", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}
                      >
                        Reply as owner
                      </button>
                    )}
                    {isOwner && replyingTo === rev.id && (
                      <div style={{ marginTop: 12 }}>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply as the owner…"
                          style={{ width: "100%", minHeight: 80, borderRadius: 10, padding: 10, border: "1.5px solid rgba(255,45,85,0.3)", fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            onClick={() => submitReply(rev.id)}
                            disabled={submittingReply || !replyText.trim()}
                            className="ar-submit"
                            style={{ padding: "8px 20px", fontSize: 13 }}
                          >
                            {submittingReply ? "Posting…" : "Post Reply"}
                          </button>
                          <button
                            onClick={() => setReplyingTo(null)}
                            style={{ padding: "8px 16px", fontSize: 13, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "white", cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sidebar */}
          <aside className="details-right">
            <SimilarRestaurants cuisineType={restaurant.cuisine_type} currentId={rid} />
          </aside>
        </main>
      </div>
    </div>
  );
}
