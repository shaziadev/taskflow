import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../../api/client";

export const fetchBoards = createAsyncThunk("boards/fetchAll", async () => (await api.get("/boards/")).data);

export const createBoard = createAsyncThunk("boards/create", async (payload) =>
  (await api.post("/boards/", payload)).data
);

export const fetchBoard = createAsyncThunk("boards/fetchOne", async (id) =>
  (await api.get(`/boards/${id}/`)).data
);

export const createTask = createAsyncThunk("boards/createTask", async (payload) =>
  (await api.post("/tasks/", payload)).data
);

export const deleteTask = createAsyncThunk("boards/deleteTask", async (taskId) => {
  await api.delete(`/tasks/${taskId}/`);
  return taskId;
});

/**
 * Drag-and-drop: we update the UI immediately (optimistic update via the
 * `taskMovedLocally` reducer) and then persist with the API. If the API call
 * fails we reload the board from the server to undo the change.
 */
export const moveTask = createAsyncThunk(
  "boards/moveTask",
  async ({ taskId, toColumnId, position, boardId }, { dispatch, rejectWithValue }) => {
    try {
      return (await api.post(`/tasks/${taskId}/move/`, { column: toColumnId, position })).data;
    } catch (err) {
      dispatch(fetchBoard(boardId));
      return rejectWithValue(err.response?.data);
    }
  }
);

/** Pure helper (exported for tests): move a task between column task lists. */
export function applyMove(columns, { taskId, fromColumnId, toColumnId, position }) {
  const from = columns.find((c) => c.id === fromColumnId);
  const to = columns.find((c) => c.id === toColumnId);
  if (!from || !to) return;
  const index = from.tasks.findIndex((t) => t.id === taskId);
  if (index === -1) return;
  const [task] = from.tasks.splice(index, 1);
  task.column = toColumnId;
  to.tasks.splice(position, 0, task);
  from.tasks.forEach((t, i) => (t.position = i));
  to.tasks.forEach((t, i) => (t.position = i));
}

const boardsSlice = createSlice({
  name: "boards",
  initialState: { list: [], current: null, status: "idle", error: null },
  reducers: {
    taskMovedLocally(state, action) {
      if (state.current) applyMove(state.current.columns, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.status = "idle";
        state.list = action.payload;
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(fetchBoard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        state.status = "idle";
        state.current = action.payload;
      })
      .addCase(fetchBoard.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.error.message;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        const column = state.current?.columns.find((c) => c.id === action.payload.column);
        column?.tasks.push(action.payload);
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.current?.columns.forEach((c) => {
          c.tasks = c.tasks.filter((t) => t.id !== action.payload);
        });
      });
  },
});

export const { taskMovedLocally } = boardsSlice.actions;
export default boardsSlice.reducer;
