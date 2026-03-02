import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Profile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    about: "",
    city: "",
    state: "",
    country: "",
    languages: "",
    gender: "",
    cuisine: "",
    price: "",
    dietary: "",
    ambiance: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const userRes = await api.get("/api/users/me");
        const prefRes = await api.get("/api/preferences");

        const u = userRes.data;
        const p = prefRes.data;

        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          about: u.about_me || "",
          city: u.city || "",
          state: u.state || "",
          country: u.country || "",
          languages: u.languages || "",
          gender: u.gender || "",
          cuisine: p.cuisine_preferences || "",
          price: p.price_range || "",
          dietary: p.dietary_needs || "",
          ambiance: p.ambiance_preferences || "",
        });
      } catch (err) {
        if (err?.response?.status === 401) {
          setError("Session expired. Please log in again.");
          navigate("/login");
          return;
        }
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.put("/api/users/me", {
        name: form.name,
        phone: form.phone,
        about_me: form.about,
        city: form.city,
        state: form.state,
        country: form.country,
        languages: form.languages,
        gender: form.gender,
      });

      await api.put("/api/preferences", {
        cuisine_preferences: form.cuisine,
        price_range: form.price,
        dietary_needs: form.dietary,
        ambiance_preferences: form.ambiance,
      });

      alert("Profile updated successfully!");
    } catch (err) {
      setError(err?.response?.data?.detail || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1 className="profile-title">Your Profile</h1>

        {error && <div className="auth-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="profile-section">
            <h3>Basic Information</h3>

            <input className="profile-input" name="name" value={form.name} onChange={handleChange} placeholder="Name" />
            <input className="profile-input" name="email" value={form.email} disabled placeholder="Email" />
            <input className="profile-input" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />
            <textarea className="profile-textarea" name="about" value={form.about} onChange={handleChange} placeholder="About me" />
            <input className="profile-input" name="city" value={form.city} onChange={handleChange} placeholder="City" />
            <input className="profile-input" name="state" value={form.state} onChange={handleChange} maxLength={2} placeholder="State (CA)" />
            <input className="profile-input" name="country" value={form.country} onChange={handleChange} placeholder="Country" />
            <input className="profile-input" name="languages" value={form.languages} onChange={handleChange} placeholder="Languages" />
            <input className="profile-input" name="gender" value={form.gender} onChange={handleChange} placeholder="Gender" />
          </div>

          <div className="profile-section">
            <h3>AI Preferences</h3>

            <input className="profile-input" name="cuisine" value={form.cuisine} onChange={handleChange} placeholder="Cuisine" />
            <input className="profile-input" name="price" value={form.price} onChange={handleChange} placeholder="Price range" />
            <input className="profile-input" name="dietary" value={form.dietary} onChange={handleChange} placeholder="Dietary needs" />
            <input className="profile-input" name="ambiance" value={form.ambiance} onChange={handleChange} placeholder="Ambiance" />
          </div>

          <button className="profile-save" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}