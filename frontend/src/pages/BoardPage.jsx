import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";

import AddTaskForm from "../components/AddTaskForm";
import TaskCard from "../components/TaskCard";
import {
  createTask,
  deleteTask,
  fetchBoard,
  moveTask,
  taskMovedLocally,
} from "../features/boards/boardsSlice";

export default function BoardPage() {
  const { boardId } = useParams();
  const dispatch = useDispatch();
  const board = useSelector((state) => state.boards.current);
  const error = useSelector((state) => state.boards.error);

  useEffect(() => {
    dispatch(fetchBoard(boardId));
  }, [dispatch, boardId]);

  if (!board || String(board.id) !== boardId) {
    if (error) return <p className="text-red-600">Couldn't load this board: {error}</p>;
    return <p className="text-slate-500">Loading board…</p>;
  }

  // Called by @hello-pangea/dnd when a card is dropped.
  const onDragEnd = ({ draggableId, source, destination }) => {
    if (!destination) return; // dropped outside a column
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const move = {
      taskId: Number(draggableId),
      fromColumnId: Number(source.droppableId),
      toColumnId: Number(destination.droppableId),
      position: destination.index,
    };
    dispatch(taskMovedLocally(move)); // optimistic UI update
    dispatch(moveTask({ ...move, boardId: board.id })); // persist to the API
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">← Boards</Link>
        <h1 className="text-2xl font-semibold">{board.name}</h1>
        <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{board.my_role}</span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board.columns.map((column) => (
            <section key={column.id} className="w-72 shrink-0 rounded-lg bg-slate-100 p-3">
              <h2 className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700">
                {column.title}
                <span className="text-xs font-normal text-slate-400">{column.tasks.length}</span>
              </h2>
              <Droppable droppableId={String(column.id)}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[40px] space-y-2 rounded ${snapshot.isDraggingOver ? "bg-indigo-50" : ""}`}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(dragProvided) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                            <TaskCard task={task} onDelete={(id) => dispatch(deleteTask(id))} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <div className="mt-2">
                <AddTaskForm
                  members={board.memberships}
                  onSubmit={(data) => dispatch(createTask({ ...data, column: column.id }))}
                />
              </div>
            </section>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
