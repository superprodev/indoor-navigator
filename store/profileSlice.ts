
import { createSlice } from '@reduxjs/toolkit';
import { WifiEntry } from 'react-native-wifi-reborn';

export interface Fingerprint{
  detail: string,
  x: number, 
  y: number
}

export interface ProfileState {
  loading: boolean,
  error: string,
  points: Array<Fingerprint>
}

const initialState: ProfileState = {
  loading: false,
  error: "",
  points: []
}

export const profileSlice = createSlice({
  name: 'profile', // The name of the slice
  initialState,
  reducers: {
    // Redux Toolkit allows writing 'mutating' logic thanks to Immer
    insert: (state, action) => {
      let { points } = action.payload;
      points.forEach((element: any) => {
        state.points.push(element);
      });
      state.loading = false;
    },
    clear: (state) => {
      state.points = [];
      state.loading = false;
      state.error = "";
    },
    start: (state) => {
      state.loading = true;
      state.error = "";
    }
  },
});

