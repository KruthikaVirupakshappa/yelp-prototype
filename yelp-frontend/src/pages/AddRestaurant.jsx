import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function AddRestaurant() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    cuisine: "",
    price: "$$",
    location: "",
    address: "",
    phone: "",
    tags: "",
    chips: "",
    rating: 4.5,
    photos: [],
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []);
    const urls = files.map((file) => URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, photos: urls }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.cuisine.trim() || !form.location.trim()) {
      alert("Please fill at least Name, Cuisine, and Location.");
      return;
    }

    try {
      await api.post("/restaurants/", {
        name: form.name.trim(),
        cuisine_type: form.cuisine.trim(),
        city: form.location.trim(),
        pricing_tier: form.price,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        amenities: form.tags.trim() || null,
        hours_of_operation: null,
        website: null,
        email: null,
        zip_code: null,
        state: null,
        country: null,
      });

      alert("Restaurant added!");
      navigate("/explore");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to add restaurant.";
      alert(msg);
      console.error(err);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Add a Restaurant</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Golden Spoon"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Cuisine *</label>
          <input
            name="cuisine"
            value={form.cuisine}
            onChange={handleChange}
            placeholder="e.g. Italian, Indian..."
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Location (City) *</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. San Jose"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Price</label>
          <select name="price" value={form.price} onChange={handleChange}>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
            <option value="$$$$">$$$$</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Street, City, State ZIP"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="(408) 555-0000"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Tags (comma-separated)</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Cozy, Date night, Family-friendly"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Chips (comma-separated)</label>
          <input
            name="chips"
            value={form.chips}
            onChange={handleChange}
            placeholder="Outdoor seating, Reservations recommended"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Starter Rating</label>
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            name="rating"
            value={form.rating}
            onChange={handleChange}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Photos</label>
          <input type="file" accept="image/*" multiple onChange={handlePhotoChange} />

          {form.photos.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
              {form.photos.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Preview ${index + 1}`}
                  style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 10 }}
                />
              ))}
            </div>
          )}
        </div>

        <button type="submit" style={{ padding: 12, borderRadius: 10 }}>
          Add Restaurant
        </button>
      </form>
    </div>
  );
}