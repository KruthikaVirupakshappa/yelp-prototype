
import { useEffect, useState } from "react";

export default function ImageCarousel({ images = [], interval = 3000 }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!images.length) return;
    const id = setInterval(() => setIdx(i => (i + 1) % images.length), interval);
    return () => clearInterval(id);
  }, [images, interval]);

  return (
    <div className="carousel">
      {images.map((src, i) => (
        <div
          key={src + i}
          className={`carousel-slide ${i === idx ? "active" : ""}`}
          style={{ backgroundImage: `url(${src})` }}
          role="img"
          aria-hidden={i === idx ? "false" : "true"}
        />
      ))}
    </div>
  );
}