import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const TABS = ["Overview", "My Restaurants", "Reviews", "Claim"];

const CUISINES = [
  "American","BBQ","Breakfast","Burgers","Chinese","Ethiopian",
  "Filipino","French","Greek","Indian","Italian","Japanese",
  "Korean","Mediterranean","Mexican","Middle Eastern","Pakistani",
  "Pizza","Seafood","Spanish","Sushi","Thai","Turkish",
  "Vegan / Vegetarian","Vietnamese","Other",
];
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

const SENTIMENT_COLOR = {
  "Excellent": "#15803d",
  "Great": "#2563eb",
  "Good": "#7c3aed",
  "Mixed": "#d97706",
  "Needs Improvement": "#dc2626",
};

function StarRow({ rating }) {
  return (
    <span className="od-stars">
      {[1,2,3,4,5].map((v) => (
        <span key={v} style={{ color: v <= Math.round(rating) ? "#ff2d55" : "rgba(0,0,0,0.13)" }}>★</span>
      ))}
    </span>
  );
}

function RatingsBar({ distribution, total }) {
  return (
    <div className="od-dist">
      {[5,4,3,2,1].map((star) => {
        const count = distribution[star] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="od-dist-row">
            <span className="od-dist-label">{star}★</span>
            <div className="od-dist-bar-wrap">
              <div className="od-dist-bar" style={{ width: `${pct}%` }} />
            </div>
            <span className="od-dist-count">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Overview data
  const [dash, setDash] = useState(null);

  // My Restaurants
  const [restaurants, setRestaurants] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Reviews tab
  const [selectedRestId, setSelectedRestId] = useState("all");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [starFilter, setStarFilter] = useState(0);
  const [sortReviews, setSortReviews] = useState("date_desc");

  // Claim tab
  const [claimSearch, setClaimSearch] = useState("");
  const [unclaimed, setUnclaimed] = useState([]);
  const [claimingId, setClaimingId] = useState(null);
  const [claimMsg, setClaimMsg] = useState("");
  const claimDebounce = useRef(null);

  // Auth guard + initial load
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { state: { message: "Please log in to access the owner dashboard." } });
      return;
    }
    loadAll();
  }, [navigate]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [dashRes, restRes] = await Promise.all([
        api.get("/owner/dashboard"),
        api.get("/owner/restaurants"),
      ]);
      setDash(dashRes.data);
      setRestaurants(Array.isArray(restRes.data) ? restRes.data : []);
    } catch (err) {
      if (err?.response?.status === 403) setError("Owner access required.");
      else setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  // Load reviews whenever selected restaurant or tab changes
  useEffect(() => {
    if (tab !== 2) return;
    loadReviews();
  }, [tab, selectedRestId]);

  async function loadReviews() {
    setReviewsLoading(true);
    try {
      if (selectedRestId === "all") {
        // Gather reviews for all restaurants
        const all = await Promise.all(
          restaurants.map((r) =>
            api.get(`/owner/restaurants/${r.id}/reviews`)
              .then((res) => res.data.map((rv) => ({ ...rv, _restaurant_name: r.name })))
              .catch(() => [])
          )
        );
        setReviews(all.flat());
      } else {
        const res = await api.get(`/owner/restaurants/${selectedRestId}/reviews`);
        const rest = restaurants.find((r) => r.id === Number(selectedRestId));
        setReviews(res.data.map((rv) => ({ ...rv, _restaurant_name: rest?.name || "" })));
      }
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  // Claim search debounce
  useEffect(() => {
    if (tab !== 3) return;
    clearTimeout(claimDebounce.current);
    claimDebounce.current = setTimeout(async () => {
      try {
        const res = await api.get("/owner/unclaimed", { params: { search: claimSearch || undefined } });
        setUnclaimed(Array.isArray(res.data) ? res.data : []);
      } catch {
        setUnclaimed([]);
      }
    }, 300);
  }, [claimSearch, tab]);

  // Edit restaurant
  function startEdit(r) {
    setEditingId(r.id);
    setEditForm({
      name: r.name || "",
      cuisine_type: r.cuisine_type || "",
      description: r.description || "",
      address: r.address || "",
      city: r.city || "",
      state: r.state || "",
      zip_code: r.zip_code || "",
      country: r.country || "",
      phone: r.phone || "",
      email: r.email || "",
      website: r.website || "",
      hours_of_operation: r.hours_of_operation || "",
      pricing_tier: r.pricing_tier || "$$",
      amenities: r.amenities || "",
    });
  }

  async function saveEdit(restId) {
    setSaving(true);
    try {
      await api.put(`/restaurants/${restId}`, editForm);
      setEditingId(null);
      await loadAll();
    } catch (err) {
      alert(err?.response?.data?.detail || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function claimRestaurant(restId) {
    setClaimingId(restId);
    setClaimMsg("");
    try {
      await api.post(`/restaurants/${restId}/claim`);
      setClaimMsg("Restaurant claimed successfully!");
      setUnclaimed((prev) => prev.filter((r) => r.id !== restId));
      await loadAll();
    } catch (err) {
      setClaimMsg(err?.response?.data?.detail || "Claim failed.");
    } finally {
      setClaimingId(null);
    }
  }

  // Filtered + sorted reviews
  const filteredReviews = reviews
    .filter((r) => starFilter === 0 || Math.round(r.rating) === starFilter)
    .sort((a, b) => {
      if (sortReviews === "date_desc") return new Date(b.created_at) - new Date(a.created_at);
      if (sortReviews === "date_asc") return new Date(a.created_at) - new Date(b.created_at);
      if (sortReviews === "rating_desc") return b.rating - a.rating;
      if (sortReviews === "rating_asc") return a.rating - b.rating;
      return 0;
    });

  if (loading) {
    return (
      <div className="od-page">
        <div className="od-loading">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="od-page">
      <div className="od-wrap">
        {/* Header */}
        <div className="od-header">
          <div>
            <h1 className="od-title">Owner Dashboard</h1>
            <p className="od-subtitle">Manage your restaurants and track performance</p>
          </div>
          <button className="od-add-btn" onClick={() => navigate("/add-restaurant")}>
            + Add Restaurant
          </button>
        </div>

        {error && <div className="auth-alert" style={{ marginBottom: 20 }}>{error}</div>}

        {/* Tab nav */}
        <div className="od-tabs">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`od-tab${tab === i ? " od-tab--active" : ""}`}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Tab 0: Overview ── */}
        {tab === 0 && dash && (
          <div className="od-panel">
            {/* Stat cards */}
            <div className="od-stats">
              <div className="od-stat-card">
                <div className="od-stat-value">{dash.total_restaurants}</div>
                <div className="od-stat-label">Restaurants</div>
              </div>
              <div className="od-stat-card">
                <div className="od-stat-value">{dash.total_reviews}</div>
                <div className="od-stat-label">Total Reviews</div>
              </div>
              <div className="od-stat-card">
                <div className="od-stat-value">
                  {dash.average_rating > 0 ? `★ ${Number(dash.average_rating).toFixed(1)}` : "—"}
                </div>
                <div className="od-stat-label">Avg Rating</div>
              </div>
              <div className="od-stat-card">
                <div className="od-stat-value" style={{ color: SENTIMENT_COLOR[dash.sentiment] || "#333" }}>
                  {dash.sentiment}
                </div>
                <div className="od-stat-label">Sentiment</div>
              </div>
            </div>

            <div className="od-overview-grid">
              {/* Ratings distribution */}
              <div className="od-section-card">
                <div className="od-section-title">Ratings Distribution</div>
                {dash.total_reviews > 0 ? (
                  <RatingsBar distribution={dash.ratings_distribution} total={dash.total_reviews} />
                ) : (
                  <p className="od-empty-sub">No reviews yet.</p>
                )}
              </div>

              {/* Recent reviews */}
              <div className="od-section-card">
                <div className="od-section-title">Recent Reviews</div>
                {dash.recent_reviews.length === 0 ? (
                  <p className="od-empty-sub">No reviews yet.</p>
                ) : (
                  <div className="od-recent-list">
                    {dash.recent_reviews.map((rev, i) => (
                      <div key={i} className="od-recent-item">
                        <div className="od-recent-top">
                          <span className="od-recent-rest">{rev.restaurant_name}</span>
                          <StarRow rating={rev.rating} />
                        </div>
                        <div className="od-recent-user">{rev.user_name}</div>
                        {rev.comment && <p className="od-recent-comment">{rev.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 1: My Restaurants ── */}
        {tab === 1 && (
          <div className="od-panel">
            {restaurants.length === 0 ? (
              <div className="od-empty">
                <div className="od-empty-icon">🍽️</div>
                <div className="od-empty-title">No restaurants yet</div>
                <p className="od-empty-sub">Add your first restaurant or claim an existing one.</p>
                <button className="od-cta" onClick={() => navigate("/add-restaurant")}>Add Restaurant</button>
              </div>
            ) : (
              <div className="od-rest-list">
                {restaurants.map((r) => (
                  <div key={r.id} className="od-rest-card">
                    <div className="od-rest-top">
                      <div>
                        <div className="od-rest-name">{r.name}</div>
                        <div className="od-rest-meta">
                          {r.cuisine_type && <span className="od-pill">{r.cuisine_type}</span>}
                          {r.pricing_tier && <span className="od-pill">{r.pricing_tier}</span>}
                          {r.city && <span className="od-pill">📍 {r.city}{r.state ? `, ${r.state}` : ""}</span>}
                          {r.average_rating > 0 && (
                            <span className="od-pill od-pill--rating">★ {Number(r.average_rating).toFixed(1)} ({r.review_count})</span>
                          )}
                        </div>
                      </div>
                      <div className="od-rest-actions">
                        <button
                          className="od-btn od-btn--ghost"
                          onClick={() => navigate(`/restaurants/${r.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="od-btn od-btn--primary"
                          onClick={() => editingId === r.id ? setEditingId(null) : startEdit(r)}
                        >
                          {editingId === r.id ? "Cancel" : "Edit"}
                        </button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {editingId === r.id && (
                      <div className="od-edit-form">
                        <div className="od-section-title" style={{ marginBottom: 16 }}>Edit Restaurant</div>
                        <div className="od-form-grid">
                          <div className="od-field">
                            <label className="od-label">Name</label>
                            <input className="od-input" value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
                          </div>
                          <div className="od-field">
                            <label className="od-label">Cuisine</label>
                            <select className="od-input" value={editForm.cuisine_type} onChange={(e) => setEditForm(p => ({ ...p, cuisine_type: e.target.value }))}>
                              {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="od-field">
                            <label className="od-label">Price Range</label>
                            <select className="od-input" value={editForm.pricing_tier} onChange={(e) => setEditForm(p => ({ ...p, pricing_tier: e.target.value }))}>
                              <option value="$">$ — Budget</option>
                              <option value="$$">$$ — Moderate</option>
                              <option value="$$$">$$$ — Upscale</option>
                              <option value="$$$$">$$$$ — Fine Dining</option>
                            </select>
                          </div>
                          <div className="od-field">
                            <label className="od-label">Phone</label>
                            <input className="od-input" value={editForm.phone} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="(408) 555-0000" />
                          </div>
                          <div className="od-field">
                            <label className="od-label">Email</label>
                            <input className="od-input" value={editForm.email} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} placeholder="contact@restaurant.com" />
                          </div>
                          <div className="od-field">
                            <label className="od-label">Website</label>
                            <input className="od-input" value={editForm.website} onChange={(e) => setEditForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                          </div>
                          <div className="od-field">
                            <label className="od-label">City</label>
                            <input className="od-input" value={editForm.city} onChange={(e) => setEditForm(p => ({ ...p, city: e.target.value }))} />
                          </div>
                          <div className="od-field">
                            <label className="od-label">State</label>
                            <select className="od-input" value={editForm.state} onChange={(e) => setEditForm(p => ({ ...p, state: e.target.value }))}>
                              <option value="">-- State --</option>
                              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="od-field">
                            <label className="od-label">Address</label>
                            <input className="od-input" value={editForm.address} onChange={(e) => setEditForm(p => ({ ...p, address: e.target.value }))} />
                          </div>
                          <div className="od-field">
                            <label className="od-label">ZIP Code</label>
                            <input className="od-input" value={editForm.zip_code} onChange={(e) => setEditForm(p => ({ ...p, zip_code: e.target.value }))} />
                          </div>
                          <div className="od-field">
                            <label className="od-label">Hours</label>
                            <input className="od-input" value={editForm.hours_of_operation} onChange={(e) => setEditForm(p => ({ ...p, hours_of_operation: e.target.value }))} placeholder="Mon–Fri 11am–10pm" />
                          </div>
                          <div className="od-field">
                            <label className="od-label">Amenities</label>
                            <input className="od-input" value={editForm.amenities} onChange={(e) => setEditForm(p => ({ ...p, amenities: e.target.value }))} placeholder="Outdoor seating, Wi-Fi…" />
                          </div>
                        </div>
                        <div className="od-field" style={{ gridColumn: "1/-1" }}>
                          <label className="od-label">Description</label>
                          <textarea className="od-textarea" value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="About this restaurant…" />
                        </div>
                        <div className="od-edit-footer">
                          <button className="od-btn od-btn--ghost" onClick={() => setEditingId(null)}>Cancel</button>
                          <button className="od-btn od-btn--primary" onClick={() => saveEdit(r.id)} disabled={saving}>
                            {saving ? "Saving…" : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Reviews ── */}
        {tab === 2 && (
          <div className="od-panel">
            <div className="od-reviews-filters">
              <select className="od-input" style={{ maxWidth: 260 }} value={selectedRestId} onChange={(e) => setSelectedRestId(e.target.value)}>
                <option value="all">All Restaurants</option>
                {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>

              <div className="od-star-filters">
                {[0,5,4,3,2,1].map((s) => (
                  <button
                    key={s}
                    className={`od-star-chip${starFilter === s ? " active" : ""}`}
                    onClick={() => setStarFilter(s)}
                  >
                    {s === 0 ? "All" : `${s}★`}
                  </button>
                ))}
              </div>

              <select className="od-input" style={{ maxWidth: 180, marginLeft: "auto" }} value={sortReviews} onChange={(e) => setSortReviews(e.target.value)}>
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
                <option value="rating_desc">Rating: High → Low</option>
                <option value="rating_asc">Rating: Low → High</option>
              </select>
            </div>

            {reviewsLoading ? (
              <p className="od-loading">Loading reviews…</p>
            ) : filteredReviews.length === 0 ? (
              <div className="od-empty">
                <div className="od-empty-icon">✍️</div>
                <div className="od-empty-title">No reviews found</div>
                <p className="od-empty-sub">Try changing the filters above.</p>
              </div>
            ) : (
              <>
                <p style={{ color: "#888", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
                  {filteredReviews.length} review{filteredReviews.length !== 1 ? "s" : ""}
                </p>
                <div className="od-review-list">
                  {filteredReviews.map((rev) => {
                    const date = rev.created_at
                      ? new Date(rev.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : null;
                    return (
                      <div key={rev.id} className="od-review-card">
                        <div className="od-review-top">
                          <div>
                            <div className="od-review-rest">{rev._restaurant_name}</div>
                            <div className="od-review-user">{rev.user_name || "Anonymous"}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <StarRow rating={rev.rating} />
                            <div className="od-review-label">{RATING_LABELS[Math.round(rev.rating)] || ""}</div>
                            {date && <div className="od-review-date">{date}</div>}
                          </div>
                        </div>
                        {rev.comment && <p className="od-review-comment">{rev.comment}</p>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab 3: Claim ── */}
        {tab === 3 && (
          <div className="od-panel">
            <div className="od-section-title" style={{ marginBottom: 6 }}>Claim a Restaurant</div>
            <p className="od-empty-sub" style={{ marginBottom: 20 }}>
              Search for restaurants that haven't been claimed yet and take ownership.
            </p>

            <input
              className="od-input"
              style={{ maxWidth: 420, marginBottom: 20 }}
              value={claimSearch}
              onChange={(e) => setClaimSearch(e.target.value)}
              placeholder="Search by name, city, or cuisine…"
            />

            {claimMsg && (
              <div className={`auth-alert${claimMsg.includes("success") ? " auth-alert--success" : ""}`} style={{ marginBottom: 16 }}>
                {claimMsg}
              </div>
            )}

            {unclaimed.length === 0 ? (
              <div className="od-empty">
                <div className="od-empty-icon">🔍</div>
                <div className="od-empty-title">No unclaimed restaurants found</div>
                <p className="od-empty-sub">Try a different search term.</p>
              </div>
            ) : (
              <div className="od-rest-list">
                {unclaimed.map((r) => (
                  <div key={r.id} className="od-rest-card">
                    <div className="od-rest-top">
                      <div>
                        <div className="od-rest-name">{r.name}</div>
                        <div className="od-rest-meta">
                          {r.cuisine_type && <span className="od-pill">{r.cuisine_type}</span>}
                          {r.pricing_tier && <span className="od-pill">{r.pricing_tier}</span>}
                          {r.city && <span className="od-pill">📍 {r.city}{r.state ? `, ${r.state}` : ""}</span>}
                          {r.average_rating > 0 && (
                            <span className="od-pill od-pill--rating">★ {Number(r.average_rating).toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        className="od-btn od-btn--primary"
                        onClick={() => claimRestaurant(r.id)}
                        disabled={claimingId === r.id}
                      >
                        {claimingId === r.id ? "Claiming…" : "Claim"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
