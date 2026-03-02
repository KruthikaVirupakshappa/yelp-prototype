import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import AddRestaurant from "./pages/AddRestaurant.jsx";

import Home from "./pages/Home.jsx";
import Explore from "./pages/Explore.jsx";
import RestaurantDetails from "./pages/RestaurantDetails.jsx";
import WriteReview from "./pages/WriteReview.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Saved from "./pages/Saved.jsx";
import MyReviews from "./pages/MyReviews.jsx";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/restaurants/:id" element={<RestaurantDetails />} />
        <Route path="/restaurants/:id/review" element={<WriteReview />} />
        <Route path="/add-restaurant" element={<AddRestaurant />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/my-reviews" element={<MyReviews />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>

      <Footer />
    </>
  );
}