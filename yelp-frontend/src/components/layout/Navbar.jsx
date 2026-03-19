import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="nav-brand">
          <span className="brand-main">Fork & Fire</span>
          <span className="brand-sub">by SK</span>
        </NavLink>

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
                <NavLink to="/owner" className="nav-link">
                  Owner
                </NavLink>
              )}

              <button onClick={handleLogout} className="nav-link">
                Log Out
              </button>
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