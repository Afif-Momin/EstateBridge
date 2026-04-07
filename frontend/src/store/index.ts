import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

// Load persisted auth state from localStorage
function loadAuthState() {
  try {
    const serialized = localStorage.getItem('auth');
    if (!serialized) return undefined;
    return { auth: JSON.parse(serialized) };
  } catch {
    return undefined;
  }
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  preloadedState: loadAuthState(),
});

// Persist auth state to localStorage on every change
store.subscribe(() => {
  try {
    const { auth } = store.getState();
    localStorage.setItem('auth', JSON.stringify(auth));
  } catch {
    // ignore write errors
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
