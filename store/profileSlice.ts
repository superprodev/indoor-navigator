
import { createSlice } from '@reduxjs/toolkit';

export interface ProfileState {
    scale: number,
    x: number,
    y: number,
    angle: number,
    points: Array<ProfileState>
}

const initialState: ProfileState = {
    scale: 1.0,
    x: 0,
    y: 0,
    angle: 0,
    points: []
}

export const profileSlice = createSlice({
  name: 'profile', // The name of the slice
  initialState,
  reducers: {
    // Redux Toolkit allows writing 'mutating' logic thanks to Immer
    move: (state, action) => {
      state.x = action.payload.x;
      state.y = action.payload.y;
    },
    zoom: (state, action) => {
        state.scale = action.payload.scale;
    },
    rotate: (state, action) => {
        state.scale = action.payload.angle;
    },
    insert: (state, action) => {
        state.points.push(action.payload.point);
    }
  },
});

