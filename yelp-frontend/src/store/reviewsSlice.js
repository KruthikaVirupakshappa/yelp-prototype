import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../services/api";

export const fetchReviews = createAsyncThunk(
  "reviews/fetchByRestaurant",
  async (restaurantId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/reviews/restaurant/${restaurantId}`);
      return { restaurantId, reviews: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch reviews");
    }
  }
);

export const fetchUserReviews = createAsyncThunk(
  "reviews/fetchByUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/reviews/user/history");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch your reviews");
    }
  }
);

export const submitReview = createAsyncThunk(
  "reviews/submit",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/reviews/", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to submit review");
    }
  }
);

export const updateReview = createAsyncThunk(
  "reviews/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/reviews/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to update review");
    }
  }
);

export const deleteReview = createAsyncThunk(
  "reviews/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/reviews/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to delete review");
    }
  }
);

const reviewsSlice = createSlice({
  name: "reviews",
  initialState: {
    byRestaurant: {},
    userReviews: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => { state.loading = true; })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.byRestaurant[action.payload.restaurantId] = action.payload.reviews;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.userReviews = action.payload;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        const rid = action.payload.restaurant_id;
        if (state.byRestaurant[rid]) {
          state.byRestaurant[rid].unshift(action.payload);
        }
        state.userReviews.unshift(action.payload);
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        const updated = action.payload;
        const rid = updated.restaurant_id;
        if (state.byRestaurant[rid]) {
          state.byRestaurant[rid] = state.byRestaurant[rid].map(r =>
            r.id === updated.id ? updated : r
          );
        }
        state.userReviews = state.userReviews.map(r => r.id === updated.id ? updated : r);
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        const id = action.payload;
        state.userReviews = state.userReviews.filter(r => r.id !== id);
        Object.keys(state.byRestaurant).forEach(rid => {
          state.byRestaurant[rid] = state.byRestaurant[rid].filter(r => r.id !== id);
        });
      });
  },
});

export const { clearError } = reviewsSlice.actions;
export default reviewsSlice.reducer;
