import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
import boardsReducer from "../features/boards/boardsSlice";

export function makeStore(preloadedState) {
  return configureStore({
    reducer: { auth: authReducer, boards: boardsReducer },
    preloadedState,
  });
}

export const store = makeStore();
