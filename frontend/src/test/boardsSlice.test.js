import { describe, expect, it } from "vitest";

import reducer, { applyMove, taskMovedLocally } from "../features/boards/boardsSlice";

const makeBoard = () => ({
  id: 1,
  columns: [
    { id: 10, title: "To Do", tasks: [{ id: 1, title: "A" }, { id: 2, title: "B" }, { id: 3, title: "C" }] },
    { id: 20, title: "Done", tasks: [{ id: 4, title: "X" }] },
  ],
});

describe("applyMove", () => {
  it("reorders tasks inside the same column", () => {
    const { columns } = makeBoard();
    applyMove(columns, { taskId: 3, fromColumnId: 10, toColumnId: 10, position: 0 });
    expect(columns[0].tasks.map((t) => t.title)).toEqual(["C", "A", "B"]);
    expect(columns[0].tasks.map((t) => t.position)).toEqual([0, 1, 2]);
  });

  it("moves a task to another column", () => {
    const { columns } = makeBoard();
    applyMove(columns, { taskId: 2, fromColumnId: 10, toColumnId: 20, position: 0 });
    expect(columns[0].tasks.map((t) => t.title)).toEqual(["A", "C"]);
    expect(columns[1].tasks.map((t) => t.title)).toEqual(["B", "X"]);
    expect(columns[1].tasks[0].column).toBe(20);
  });
});

describe("boards reducer", () => {
  it("applies an optimistic move to the current board", () => {
    const state = { list: [], current: makeBoard(), status: "idle", error: null };
    const next = reducer(state, taskMovedLocally({ taskId: 1, fromColumnId: 10, toColumnId: 20, position: 1 }));
    expect(next.current.columns[1].tasks.map((t) => t.title)).toEqual(["X", "A"]);
    // The original state object is untouched (Immer produces a new one).
    expect(state.current.columns[1].tasks).toHaveLength(1);
  });
});
