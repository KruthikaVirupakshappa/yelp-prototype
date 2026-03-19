import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const images = useMemo(() => {
    const modules = import.meta.glob("../assets/*.avif", { eager: true, import: "default" });
    return Object.entries(modules)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([, src]) => src);
  }, []);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images.length) return;
    const id = setInterval(() => setIndex((p) => (p + 1) % images.length), 3500);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="hero-container">
      {images.map((img, i) => (
        <div
          key={`${img}-${i}`}
          className={`hero-slide ${i === index ? "active" : ""}`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}

      <div className="hero-overlay">
        <div className="hero-inner">
          <h1 className="hero-title">
            Discover Your <span className="hero-accent">Next</span>
            <br />
            Favorite <span className="hero-accent2">Bite</span>
          </h1>

          <p className="hero-subtitle">Exceptional dining experiences, curated for you.</p>

          <div className="hero-actions">
            <button className="hero-cta" type="button" onClick={() => navigate("/explore")}>
              Explore Now
            </button>
            <button className="hero-cta-alt" type="button" onClick={() => navigate("/explore")}>
              Top Rated
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}