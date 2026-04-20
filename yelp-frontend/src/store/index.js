import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import restaurantsReducer from "./restaurantsSlice";
import reviewsReducer from "./reviewsSlice";
import favoritesReducer from "./favoritesSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurants: restaurantsReducer,
    reviews: reviewsReducer,
    favorites: favoritesReducer,
  },
});

export default store;
