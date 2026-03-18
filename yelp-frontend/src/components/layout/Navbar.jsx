import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="nav-brand">
          <span className="brand-main">Fork & Fire</span>
          <span className="brand-sub">by SK</span>
        </NavLink>

        <nav className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/explore"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Explore
          </NavLink>

          <NavLink
            to="/add-restaurant"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Add Restaurant
          </NavLink>

          <NavLink
            to="/saved"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Saved
          </NavLink>

          <NavLink
            to="/my-reviews"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            My Reviews
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Profile
          </NavLink>

          <NavLink
            to="/owner"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Owner
          </NavLink>

          <NavLink
            to="/signup"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Sign Up
          </NavLink>

          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Log In
          </NavLink>
        </nav>
      </div>
    </header>
  );
}