import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

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

const COUNTRIES = [
  "United States","Canada","United Kingdom","Australia",
  "India","Germany","France","Japan","China","Brazil",
  "Mexico","South Korea","Singapore","UAE","Other",
];

export default function AddRestaurant() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { state: { message: "Please log in to add a restaurant." } });
    }
  }, [navigate]);

  const [form, setForm] = useState({
    name: "", cuisine: "", price: "$$", location: "",
    address: "", zip_code: "", state: "", country: "United States",
    phone: "", amenities: "", photoFiles: [], photoPreviews: [],
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []);
    const previews = files.map((file) => URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, photoFiles: files, photoPreviews: previews }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.cuisine || !form.location.trim()) {
      setError("Name, Cuisine, and City are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/restaurants/", {
        name: form.name.trim(),
        cuisine_type: form.cuisine,
        city: form.location.trim(),
        pricing_tier: form.price,
        address: form.address.trim() || null,
        zip_code: form.zip_code.trim() || null,
        state: form.state || null,
        country: form.country || null,
        phone: form.phone.trim() || null,
        amenities: form.amenities.trim() || null,
        hours_of_operation: null,
        website: null,
        email: null,
      });

      const restaurantId = res.data?.id;
      if (restaurantId && form.photoFiles.length > 0) {
        await Promise.all(
          form.photoFiles.map((file) => {
            const fd = new FormData();
            fd.append("file", file);
            return api.post(`/restaurants/${restaurantId}/photos`, fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          })
        );
      }

      navigate("/explore");
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Failed to add restaurant.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ar-page">
      <div className="ar-wrap">

        {/* ── Main card ── */}
        <div className="ar-card">
          <div className="ar-top">
            <div>
              <div className="ar-eyebrow">New listing</div>
              <h1 className="ar-title">Add a Restaurant</h1>
            </div>
            <button className="ar-back" type="button" onClick={() => navigate(-1)}>← Back</button>
          </div>

          {error && <div className="auth-alert" style={{ marginBottom: 24 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="ar-section-label">Essential info</div>

            <div className="ar-field">
              <label className="ar-label">Name <span className="ar-req">*</span></label>
              <input className="ar-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Golden Spoon" />
            </div>

            <div className="ar-row">
              <div className="ar-field">
                <label className="ar-label">Cuisine <span className="ar-req">*</span></label>
                <select className="ar-input" name="cuisine" value={form.cuisine} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="ar-field">
                <label className="ar-label">Price range</label>
                <select className="ar-input" name="price" value={form.price} onChange={handleChange}>
                  <option value="$">$ — Budget</option>
                  <option value="$$">$$ — Moderate</option>
                  <option value="$$$">$$$ — Upscale</option>
                  <option value="$$$$">$$$$ — Fine Dining</option>
                </select>
              </div>
            </div>

            <div className="ar-section-label" style={{ marginTop: 28 }}>Location</div>

            <div className="ar-row">
              <div className="ar-field" style={{ flex: 2 }}>
                <label className="ar-label">City <span className="ar-req">*</span></label>
                <input className="ar-input" name="location" value={form.location} onChange={handleChange} placeholder="e.g. San Jose" />
              </div>
              <div className="ar-field">
                <label className="ar-label">State</label>
                <select className="ar-input" name="state" value={form.state} onChange={handleChange}>
                  <option value="">-- State --</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="ar-row">
              <div className="ar-field" style={{ flex: 2 }}>
                <label className="ar-label">Street address</label>
                <input className="ar-input" name="address" value={form.address} onChange={handleChange} placeholder="e.g. 123 Main St" />
              </div>
              <div className="ar-field">
                <label className="ar-label">ZIP code</label>
                <input className="ar-input" name="zip_code" value={form.zip_code} onChange={handleChange} placeholder="e.g. 95112" />
              </div>
            </div>

            <div className="ar-field">
              <label className="ar-label">Country</label>
              <select className="ar-input" name="country" value={form.country} onChange={handleChange}>
                <option value="">-- Country --</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="ar-section-label" style={{ marginTop: 28 }}>Contact & extras</div>

            <div className="ar-row">
              <div className="ar-field">
                <label className="ar-label">Phone</label>
                <input className="ar-input" name="phone" value={form.phone} onChange={handleChange} placeholder="(408) 555-0000" />
              </div>
              <div className="ar-field">
                <label className="ar-label">Amenities</label>
                <input className="ar-input" name="amenities" value={form.amenities} onChange={handleChange} placeholder="Outdoor seating, Valet…" />
              </div>
            </div>

            <div className="ar-field">
              <label className="ar-label">Photos</label>
              <label className="ar-file-label">
                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} style={{ display: "none" }} />
                <span className="ar-file-btn">📷 Choose photos</span>
                <span className="ar-file-hint">{form.photoFiles.length > 0 ? `${form.photoFiles.length} selected` : "Optional"}</span>
              </label>
              {form.photoPreviews.length > 0 && (
                <div className="ar-previews">
                  {form.photoPreviews.map((src, i) => (
                    <img key={i} src={src} alt={`Preview ${i + 1}`} className="ar-preview-img" />
                  ))}
                </div>
              )}
            </div>

            <div className="ar-actions">
              <button type="button" className="ar-cancel" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="ar-submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add Restaurant"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Sidebar ── */}
        <aside className="ar-side">
          <div className="ar-side-card">
            <div className="ar-side-title">Tips for a great listing</div>
            <ul className="ar-tips">
              <li>Use the restaurant's official name</li>
              <li>Pick the most specific cuisine type</li>
              <li>Include the full street address for better discoverability</li>
              <li>Add amenities like parking, Wi-Fi, or outdoor seating</li>
              <li>Upload a few photos to attract more visitors</li>
            </ul>
          </div>

          <div className="ar-side-card ar-side-card--info">
            <div className="ar-side-title">What happens next?</div>
            <p className="ar-side-body">
              Once submitted, the restaurant appears on Explore immediately and users can start leaving reviews.
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
