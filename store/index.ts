import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  persistCombineReducers,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileSlice } from './profileSlice';

// --- 1. Define Secure Storage Engine ---
// By default, keys are stored with SecureStore.WHEN_UNLOCKED
const config = {
  key: "root",
  storage: AsyncStorage,
  whitelist: []
};


const rootReducer = persistCombineReducers(config, {
    profile: profileSlice.reducer
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
