import { useState } from "react";

export default function AddTaskForm({ members = [], onSubmit }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", priority: "medium", assignee_id: "", due_date: "" });

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await onSubmit({
      title: form.title.trim(),
      priority: form.priority,
      assignee_id: form.assignee_id || null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
    });
    setForm({ title: "", priority: "medium", assignee_id: "", due_date: "" });
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="w-full rounded-md py-2 text-sm text-slate-500 hover:bg-slate-200" onClick={() => setOpen(true)}>
        + Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md bg-white p-2 shadow-sm">
      <input name="title" className="input" placeholder="Task title" value={form.title} onChange={update} autoFocus />
      <select name="priority" className="input" value={form.priority} onChange={update} aria-label="Priority">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <select name="assignee_id" className="input" value={form.assignee_id} onChange={update} aria-label="Assignee">
        <option value="">Unassigned</option>
        {members.map((m) => (
          <option key={m.user.id} value={m.user.id}>
            {m.user.username}
          </option>
        ))}
      </select>
      <input name="due_date" type="datetime-local" className="input" value={form.due_date} onChange={update} aria-label="Due date" />
      <div className="flex gap-2">
        <button type="submit" className="btn">Add</button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
