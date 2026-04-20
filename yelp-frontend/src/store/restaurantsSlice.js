import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../services/api";

export const fetchRestaurants = createAsyncThunk(
  "restaurants/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/restaurants/", { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch restaurants");
    }
  }
);

export const fetchRestaurantById = createAsyncThunk(
  "restaurants/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/restaurants/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Restaurant not found");
    }
  }
);

export const createRestaurant = createAsyncThunk(
  "restaurants/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/restaurants/", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to create restaurant");
    }
  }
);

const restaurantsSlice = createSlice({
  name: "restaurants",
  initialState: {
    list: [],
    current: null,
    loading: false,
    error: null,
    searchQuery: "",
    filters: {},
  },
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setFilters(state, action) {
      state.filters = action.payload;
    },
    clearCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRestaurantById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchRestaurantById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createRestaurant.fulfilled, (state, action) => {
        state.list.push(action.payload);
      });
  },
});

export const { setSearchQuery, setFilters, clearCurrent } = restaurantsSlice.actions;
export default restaurantsSlice.reducer;
