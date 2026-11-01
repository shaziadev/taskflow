import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../../api/client";
import { tokenStorage } from "../../api/tokenStorage";

const errorMessage = (err) =>
  err.response?.data?.detail ||
  Object.values(err.response?.data || {}).flat()[0] ||
  "Something went wrong";

export const login = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/login/", credentials);
    tokenStorage.set(data.access, data.refresh);
    const me = await api.get("/auth/me/");
    return me.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

export const register = createAsyncThunk("auth/register", async (payload, { dispatch, rejectWithValue }) => {
  try {
    await api.post("/auth/register/", payload);
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
  // Log the new user straight in.
  return dispatch(login({ username: payload.username, password: payload.password })).unwrap();
});

export const fetchMe = createAsyncThunk("auth/me", async () => (await api.get("/auth/me/")).data);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    // If tokens exist we optimistically treat the user as logged in until /me/ says otherwise.
    isAuthenticated: Boolean(tokenStorage.getAccess()),
    status: "idle",
    error: null,
  },
  reducers: {
    logout(state) {
      tokenStorage.clear();
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "idle";
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
