import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AIAssistant from "../components/chat/AIAssistant";
import { api } from "../services/api";

const PRICE_OPTIONS = ["$", "$$", "$$$", "$$$$"];
const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "rating", label: "Top Rated" },
  { value: "name", label: "Name A–Z" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

const PRICE_ORDER = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };

export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const isTopRated = searchParams.get("filter") === "top";
  const urlQuery = searchParams.get("q") || "";

  const [restaurants, setRestaurants] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search / filter state
  const [query, setQuery] = useState(urlQuery);
  const [cityInput, setCityInput] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [sortBy, setSortBy] = useState(isTopRated ? "rating" : "");

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Debounce timer for backend search
  const debounceRef = useRef(null);

  async function fetchRestaurants(params = {}) {
    setLoading(true);
    try {
      const res = await api.get("/restaurants/", {
        params: { page: 1, limit: 100, ...params },
      });
      const data = res.data;
      setRestaurants(Array.isArray(data) ? data : data?.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadFavorites() {
    if (!localStorage.getItem("token")) { setSavedIds([]); return; }
    try {
      const res = await api.get("/favorites/");
      const favs = res.data;
      setSavedIds(Array.isArray(favs) ? favs.map((r) => r.id) : []);
    } catch (e) {
      console.error(e);
    }
  }

  // Initial load — respect ?q= param from navbar search
  useEffect(() => {
    (async () => {
      const params = {};
      if (urlQuery) params.keywords = urlQuery;
      await fetchRestaurants(params);
      await loadFavorites();
    })();
  }, [location.key]);

  // Debounced backend search when query or city changes
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = {};
      if (query.trim()) params.keywords = query.trim();
      if (cityInput.trim()) params.city = cityInput.trim();
      fetchRestaurants(params);
      // Update suggestions
      if (query.trim()) {
        setSuggestions(
          restaurants
            .filter((r) =>
              (r.name || "").toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 6)
        );
      } else {
        setSuggestions([]);
      }
    }, 300);
  }, [query, cityInput]);

  async function toggleSave(restId) {
    if (!localStorage.getItem("token")) {
      navigate("/login", { state: { message: "Please log in to save restaurants." } });
      return;
    }
    const isSaved = savedIds.includes(restId);
    try {
      if (isSaved) {
        await api.delete(`/favorites/${restId}`);
        setSavedIds((prev) => prev.filter((x) => x !== restId));
      } else {
        await api.post(`/favorites/${restId}`);
        setSavedIds((prev) => (prev.includes(restId) ? prev : [...prev, restId]));
      }
    } catch (err) {
      console.error(err);
      await loadFavorites();
    }
  }

  function clearFilters() {
    setQuery("");
    setCityInput("");
    setPriceFilter("");
    setSortBy(isTopRated ? "rating" : "");
    setSuggestions([]);
    fetchRestaurants();
  }

  const hasFilters = query || cityInput || priceFilter || sortBy;

  // Client-side price filter + sort
  const filtered = useMemo(() => {
    let list = [...restaurants];

    if (priceFilter) {
      list = list.filter((r) => r.pricing_tier === priceFilter);
    }

    switch (sortBy) {
      case "rating":
        list.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case "name":
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "price_asc":
        list.sort(
          (a, b) =>
            (PRICE_ORDER[a.pricing_tier] || 99) -
            (PRICE_ORDER[b.pricing_tier] || 99)
        );
        break;
      case "price_desc":
        list.sort(
          (a, b) =>
            (PRICE_ORDER[b.pricing_tier] || 0) -
            (PRICE_ORDER[a.pricing_tier] || 0)
        );
        break;
      default:
        break;
    }

    return list;
  }, [restaurants, priceFilter, sortBy]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="explore-wrap">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="explore-title" style={{ marginBottom: 6 }}>
          {isTopRated ? "Top Rated" : "Explore"}
        </h1>
        <p className="explore-subtitle" style={{ marginBottom: 22 }}>
          {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""} found
        </p>

        {/* ── Search card ── */}
        <div className="search-card2" style={{ marginBottom: 20 }}>
          {/* Top row: keyword + city + search button */}
          <div className="search-row2">
            {/* Keyword input with autocomplete */}
            <div ref={searchRef} style={{ position: "relative" }}>
              <input
                className="search-input2"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search by name, cuisine, or keyword…"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  borderRadius: 14,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.10)",
                  boxShadow: "0 14px 40px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                }}>
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: "11px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                        fontWeight: 750,
                        color: "#1a1a22",
                        fontSize: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onMouseDown={() => {
                        setQuery(s.name);
                        setShowSuggestions(false);
                        navigate(`/restaurants/${s.id}`);
                      }}
                    >
                      <span>{s.name}</span>
                      {s.cuisine_type && (
                        <span style={{ color: "#999", fontWeight: 600, fontSize: 12 }}>
                          {s.cuisine_type}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              className="search-input2"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="City…"
            />

            {hasFilters && (
              <button className="clear2" onClick={clearFilters} type="button">
                Clear
              </button>
            )}
          </div>

          {/* Filter row: price chips + sort */}
          <div className="filter-row2">
            <span style={{ fontWeight: 800, color: "#5a5a66", fontSize: 13 }}>
              Price:
            </span>
            {PRICE_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriceFilter(priceFilter === p ? "" : p)}
                style={{
                  borderRadius: 999,
                  padding: "7px 14px",
                  fontWeight: 850,
                  fontSize: 13,
                  border: priceFilter === p
                    ? "none"
                    : "1px solid rgba(0,0,0,0.12)",
                  background: priceFilter === p
                    ? "linear-gradient(90deg,#ff2d55,#ff7a18)"
                    : "rgba(255,255,255,0.96)",
                  color: priceFilter === p ? "#fff" : "#1b1b24",
                  cursor: "pointer",
                  boxShadow: priceFilter === p
                    ? "0 6px 18px rgba(255,45,85,0.22)"
                    : "none",
                  transition: "all 160ms ease",
                }}
              >
                {p}
              </button>
            ))}

            <select
              className="select2"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ marginLeft: "auto" }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Two-column layout: cards + assistant ── */}
        <div className="explore-grid">
          {/* Cards */}
          <div>
            {loading ? (
              <p style={{ color: "#888", fontWeight: 700 }}>Loading…</p>
            ) : filtered.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#888",
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
                <div style={{ fontWeight: 900, fontSize: 20, color: "#1a1a22", marginBottom: 8 }}>
                  No restaurants found
                </div>
                <p style={{ fontWeight: 600 }}>
                  Try a different keyword, city, or clear the filters.
                </p>
                <button className="btn2 primary" style={{ marginTop: 16 }} onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="cards-grid2">
                {filtered.map((r) => {
                  const isSaved = savedIds.includes(r.id);
                  const rating = Number(r.average_rating || 0);

                  return (
                    <article key={r.id} className="rest-card2">
                      <div className="rest-top2">
                        <div
                          className="rest-name2"
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/restaurants/${r.id}`)}
                        >
                          {r.name}
                        </div>
                        {rating > 0 && (
                          <div className="rest-rating2">
                            ★ {rating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      <div className="rest-sub2">
                        {r.cuisine_type && (
                          <span className="pill2">{r.cuisine_type}</span>
                        )}
                        {r.pricing_tier && (
                          <span className="pill2">{r.pricing_tier}</span>
                        )}
                        {r.city && (
                          <span className="pill2">
                            📍 {r.city}{r.state ? `, ${r.state}` : ""}
                          </span>
                        )}
                      </div>

                      <div className="rest-actions2">
                        <button
                          className="btn2 primary"
                          onClick={() => navigate(`/restaurants/${r.id}`)}
                        >
                          View Details
                        </button>
                        <button
                          className="btn2 ghost"
                          onClick={() => toggleSave(r.id)}
                        >
                          {isSaved ? "❤️ Saved" : "♡ Save"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Assistant */}
          <div>
            <AIAssistant compact />
          </div>
        </div>
      </div>
    </div>
  );
}
