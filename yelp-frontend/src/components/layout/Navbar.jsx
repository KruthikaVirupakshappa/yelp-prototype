import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { api } from "../../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  useLocation(); // subscribe to route changes so token/user are re-read after login/logout

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  // Hide suggestions on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowSug(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Debounced fetch suggestions
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get("/restaurants/", {
          params: { keywords: query.trim(), limit: 6 },
        });
        const data = res.data;
        setSuggestions(Array.isArray(data) ? data : data?.items || []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  }, [query]);

  // Clear search when route changes
  useEffect(() => {
    setQuery("");
    setSuggestions([]);
    setShowSug(false);
  }, [location.pathname]);

  function handleKey(e) {
    if (e.key === "Enter" && query.trim()) {
      setShowSug(false);
      navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === "Escape") {
      setShowSug(false);
    }
  }

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  // Don't show search bar on auth pages
  const hideSearch = ["/login", "/signup"].includes(location.pathname);

  return (
    <header className="nav">
      <div className="nav-inner">
        {/* Brand */}
        <NavLink to="/" className="nav-brand">
          <span className="brand-main">Fork & Fire</span>
        </NavLink>

        {/* Search bar */}
        {!hideSearch && (
          <div className="nav-search-wrap" ref={wrapRef}>
            <div className="nav-search-box">
              <span className="nav-search-icon">🔍</span>
              <input
                className="nav-search-input"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSug(true); }}
                onFocus={() => query.trim() && setShowSug(true)}
                onKeyDown={handleKey}
                placeholder="Search restaurants…"
              />
              {query && (
                <button
                  className="nav-search-clear"
                  type="button"
                  onClick={() => { setQuery(""); setSuggestions([]); setShowSug(false); }}
                >
                  ✕
                </button>
              )}
            </div>

            {showSug && suggestions.length > 0 && (
              <div className="nav-suggestions">
                {suggestions.map((r) => (
                  <div
                    key={r.id}
                    className="nav-sug-item"
                    onMouseDown={() => {
                      setShowSug(false);
                      setQuery("");
                      navigate(`/restaurants/${r.id}`);
                    }}
                  >
                    <div className="nav-sug-name">{r.name}</div>
                    <div className="nav-sug-meta">
                      {r.cuisine_type && <span>{r.cuisine_type}</span>}
                      {r.city && <span>📍 {r.city}</span>}
                    </div>
                  </div>
                ))}
                <div
                  className="nav-sug-all"
                  onMouseDown={() => {
                    setShowSug(false);
                    navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
                  }}
                >
                  See all results for "{query}" →
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nav links */}
        <nav className="nav-links">
          <NavLink to="/" className="nav-link">Home</NavLink>

          {token && (
            <>
              <NavLink to="/explore" className="nav-link">Explore</NavLink>
              <NavLink to="/add-restaurant" className="nav-link">Add Restaurant</NavLink>
              <NavLink to="/saved" className="nav-link">Saved</NavLink>
              <NavLink to="/my-reviews" className="nav-link">My Reviews</NavLink>
              <NavLink to="/profile" className="nav-link">Profile</NavLink>

              {user?.role === "owner" && (
                <NavLink to="/owner" className="nav-link">Owner</NavLink>
              )}

              <button onClick={handleLogout} className="nav-link">Log Out</button>
            </>
          )}

          {!token && (
            <>
              <NavLink to="/signup" className="nav-link">Sign Up</NavLink>
              <NavLink to="/login" className="nav-link">Log In</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
