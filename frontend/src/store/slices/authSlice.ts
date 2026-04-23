import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, UserRole } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  role: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.user.role;
      state.isAuthenticated = true;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
    },
    setEmailVerified(state, action: PayloadAction<boolean>) {
      if (state.user) {
        state.user = { ...state.user, emailVerified: action.payload };
      }
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { setCredentials, setLoading, setError, logout, clearError, setEmailVerified } = authSlice.actions;
export default authSlice.reducer;
