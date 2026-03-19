const restaurants = [
  {
    id: 1,
    name: "Pasta Paradise",
    cuisine: "Italian",
    rating: 4.6,
    reviewsCount: 214,
    price: "$$",
    location: "San Jose",
    address: "123 Market St, San Jose, CA 95112",
    phone: "(408) 555-0199",
    chips: ["Cozy", "Date night", "Vegetarian options", "Outdoor seating"],
    tags: ["Cozy", "Date night"],
    photos: [
      "https://images.unsplash.com/photo-1548365328-9f547fb0953a",
      "https://images.unsplash.com/photo-1521389508051-d7ffb5dc8d5f",
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601"
    ]
  },
  {
    id: 2,
    name: "Green Leaf Café",
    cuisine: "Vegan",
    rating: 4.5,
    reviewsCount: 188,
    price: "$$",
    location: "Santa Clara",
    address: "55 El Camino Real, Santa Clara, CA 95051",
    phone: "(408) 555-0133",
    chips: ["Casual", "Healthy", "Plant-based", "Quick bites"],
    tags: ["Casual", "Healthy"],
    photos: [
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
      "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af"
    ]
  },
  {
    id: 3,
    name: "Sunset Terrace",
    cuisine: "Californian",
    rating: 4.7,
    reviewsCount: 302,
    price: "$$$",
    location: "Mountain View",
    address: "900 Skyline Blvd, Mountain View, CA 94040",
    phone: "(650) 555-0101",
    chips: ["Views", "Romantic", "Cocktails", "Reservations recommended"],
    tags: ["Views", "Romantic"],
    photos: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      "https://images.unsplash.com/photo-1555992336-03a23c6a6d93",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe"
    ]
  },
  {
    id: 4,
    name: "Spice Route",
    cuisine: "Indian",
    rating: 4.4,
    reviewsCount: 156,
    price: "$$",
    location: "San Jose",
    address: "44 Santa Teresa Blvd, San Jose, CA 95123",
    phone: "(408) 555-0144",
    chips: ["Family-friendly", "Vegetarian options", "Spicy", "Comfort food"],
    tags: ["Family-friendly", "Vegetarian options"],
    photos: [
      "https://images.unsplash.com/photo-1601050690597-df0568f70950",
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe",
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641"
    ]
  },
  {
    id: 5,
    name: "Taqueria Fiesta",
    cuisine: "Mexican",
    rating: 4.3,
    reviewsCount: 98,
    price: "$",
    location: "Sunnyvale",
    address: "8 Murphy Ave, Sunnyvale, CA 94086",
    phone: "(408) 555-0166",
    chips: ["Quick", "Street tacos", "Late night", "Casual"],
    tags: ["Quick", "Street tacos"],
    photos: [
      "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
      "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85",
      "https://images.unsplash.com/photo-1617196034731-2c06f3f3d9a2"
    ]
  },
  {
    id: 6,
    name: "Sushi Bloom",
    cuisine: "Japanese",
    rating: 4.6,
    reviewsCount: 176,
    price: "$$$",
    location: "Cupertino",
    address: "777 De Anza Blvd, Cupertino, CA 95014",
    phone: "(408) 555-0188",
    chips: ["Fresh", "Modern", "Omakase", "Reservations"],
    tags: ["Fresh", "Modern"],
    photos: [
      "https://images.unsplash.com/photo-1562158070-622a29b49c5b",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c"
    ]
  }
];

export default restaurants;