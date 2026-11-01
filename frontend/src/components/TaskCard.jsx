const PRIORITY_STYLES = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

export default function TaskCard({ task, onDelete }) {
  const due = task.due_date ? new Date(task.due_date) : null;
  const overdue = due && due < new Date();

  return (
    <div className="group rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{task.title}</p>
        {onDelete && (
          <button
            aria-label={`Delete ${task.title}`}
            className="invisible text-xs text-slate-400 hover:text-rose-600 group-hover:visible"
            onClick={() => onDelete(task.id)}
          >
            ✕
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded px-2 py-0.5 ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
        {task.assignee && <span className="text-slate-500">@{task.assignee.username}</span>}
        {due && (
          <span className={overdue ? "text-rose-600" : "text-slate-500"}>
            Due {due.toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
