import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { createBoard, fetchBoards } from "../features/boards/boardsSlice";

export default function BoardsPage() {
  const dispatch = useDispatch();
  const { list, status } = useSelector((state) => state.boards);
  const [name, setName] = useState("");

  useEffect(() => {
    dispatch(fetchBoards());
  }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await dispatch(createBoard({ name: name.trim() }));
    setName("");
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Your boards</h1>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input className="input" placeholder="New board name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn" type="submit">Create</button>
        </form>
      </div>

      {status === "loading" && list.length === 0 && <p className="text-slate-500">Loading…</p>}
      {status !== "loading" && list.length === 0 && (
        <p className="text-slate-500">No boards yet. Create your first one above.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((board) => (
          <Link
            key={board.id}
            to={`/boards/${board.id}`}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">{board.name}</h2>
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{board.my_role}</span>
            </div>
            {board.description && <p className="mt-1 text-sm text-slate-500">{board.description}</p>}
            <p className="mt-3 text-xs text-slate-400">{board.task_count} tasks</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
