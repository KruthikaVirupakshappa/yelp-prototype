import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const BACKEND_URL = "http://127.0.0.1:8000";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const COUNTRIES = [
  "United States","Canada","United Kingdom","Australia",
  "India","Germany","France","Japan","China","Brazil",
  "Mexico","South Korea","Singapore","UAE","Other",
];

const CUISINES = [
  "American","BBQ","Breakfast","Burgers","Chinese","Ethiopian",
  "Filipino","French","Greek","Indian","Italian","Japanese",
  "Korean","Mediterranean","Mexican","Middle Eastern","Pakistani",
  "Pizza","Seafood","Spanish","Sushi","Thai","Turkish",
  "Vegan / Vegetarian","Vietnamese","Other",
];

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
    sort_preference: "",
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const picInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const userRes = await api.get("/users/me");
        const prefRes = await api.get("/preferences/");

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
          sort_preference: p.sort_preference || "",
        });
        if (u.profile_picture) setProfilePicture(u.profile_picture);
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

  async function handlePictureChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/users/me/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfilePicture(res.data.profile_picture);
    } catch (err) {
      setError("Failed to upload profile picture.");
    } finally {
      setUploadingPic(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.put("/users/me", {
        name: form.name,
        phone: form.phone,
        about_me: form.about,
        city: form.city,
        state: form.state || null,
        country: form.country || null,
        languages: form.languages,
        gender: form.gender || null,
      });

      await api.put("/preferences/", {
        cuisine_preferences: form.cuisine,
        price_range: form.price,
        dietary_needs: form.dietary,
        ambiance_preferences: form.ambiance,
        sort_preference: form.sort_preference || null,
      });

      alert("Profile updated successfully!");
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Session expired. Please log in again.");
        navigate("/login");
        return;
      }
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
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper" onClick={() => picInputRef.current?.click()}>
              {profilePicture ? (
                <img
                  src={`${BACKEND_URL}${profilePicture}`}
                  alt="Profile"
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {form.name ? form.name[0].toUpperCase() : "?"}
                </div>
              )}
              <div className="profile-avatar-overlay">
                {uploadingPic ? "Uploading..." : "Change Photo"}
              </div>
            </div>
            <input
              ref={picInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePictureChange}
            />
          </div>

          <div className="profile-section">
            <h3>Basic Information</h3>

            <div className="profile-row">
              <div className="profile-field">
                <label>Name</label>
                <input className="profile-input" name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
              </div>
              <div className="profile-field">
                <label>Email</label>
                <input className="profile-input" name="email" value={form.email} disabled placeholder="Email" />
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label>Phone</label>
                <input className="profile-input" name="phone" value={form.phone} onChange={handleChange} placeholder="(408) 555-0000" />
              </div>
              <div className="profile-field">
                <label>Gender</label>
                <select className="profile-input" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="profile-field">
              <label>About me</label>
              <textarea className="profile-textarea" name="about" value={form.about} onChange={handleChange} placeholder="Tell others a bit about yourself…" />
            </div>

            <div className="profile-row">
              <div className="profile-field" style={{ flex: 2 }}>
                <label>City</label>
                <input className="profile-input" name="city" value={form.city} onChange={handleChange} placeholder="e.g. San Jose" />
              </div>
              <div className="profile-field">
                <label>State</label>
                <select className="profile-input" name="state" value={form.state} onChange={handleChange}>
                  <option value="">-- State --</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label>Country</label>
                <select className="profile-input" name="country" value={form.country} onChange={handleChange}>
                  <option value="">-- Country --</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="profile-field">
                <label>Languages</label>
                <input className="profile-input" name="languages" value={form.languages} onChange={handleChange} placeholder="e.g. English, Spanish" />
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>AI Preferences</h3>

            <div className="profile-row">
              <div className="profile-field">
                <label>Preferred cuisine</label>
                <select className="profile-input" name="cuisine" value={form.cuisine} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="profile-field">
                <label>Price range</label>
                <select className="profile-input" name="price" value={form.price} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="$">$ — Budget</option>
                  <option value="$$">$$ — Moderate</option>
                  <option value="$$$">$$$ — Upscale</option>
                  <option value="$$$$">$$$$ — Fine Dining</option>
                </select>
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label>Dietary needs</label>
                <input className="profile-input" name="dietary" value={form.dietary} onChange={handleChange} placeholder="e.g. Vegetarian, Gluten-free" />
              </div>
              <div className="profile-field">
                <label>Ambiance</label>
                <input className="profile-input" name="ambiance" value={form.ambiance} onChange={handleChange} placeholder="e.g. Casual, Romantic" />
              </div>
            </div>

            <div className="profile-field">
              <label>Sort preference</label>
              <select className="profile-input" name="sort_preference" value={form.sort_preference} onChange={handleChange}>
                <option value="">Default</option>
                <option value="rating">Rating</option>
                <option value="distance">Distance</option>
                <option value="popularity">Popularity</option>
                <option value="price">Price</option>
              </select>
            </div>
          </div>

          <button className="profile-save" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}