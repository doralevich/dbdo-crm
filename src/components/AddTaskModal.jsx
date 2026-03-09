import { useState } from "react";
import { X, Flag, Calendar } from "lucide-react";
import { cn } from "../lib/utils";
import { request } from "../lib/api";

const PRIORITY = {
  4: { label: "Urgent", color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/40" },
  3: { label: "High",   color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/40" },
  2: { label: "Medium", color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/40" },
  1: { label: "Low",    color: "text-gray-500",   bg: "bg-gray-500/10",   border: "border-gray-500/40" },
};

export default function AddTaskModal({ clients = [], onClose, onAdd }) {
  const [content,  setContent]  = useState("");
  const [priority, setPriority] = useState(2);
  const [dueDate,  setDueDate]  = useState("");
  const [clientId, setClientId] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const client = clients.find(c => c.id === clientId);
      const { task } = await request("/tasks", {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          priority,
          due_date: dueDate || null,
          client_id: clientId || null,
          owner: client?.name || null,
          labels: client?.name ? [client.name] : [],
        }),
      });
      onAdd?.(task);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-surface-base rounded-2xl border border-border-subtle shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <h2 className="text-base font-semibold text-text-primary">Add Task</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:text-text-primary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && <p className="text-xs text-red-400">{error}</p>}

            {/* Task name */}
            <input
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Task name…"
              className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold placeholder:text-text-muted/50"
            />

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Priority</label>
              <div className="flex gap-2">
                {[4,3,2,1].map(p => (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className={cn("flex-1 rounded-lg py-1.5 text-xs font-medium border transition-colors",
                      priority === p ? `${PRIORITY[p].bg} ${PRIORITY[p].color} ${PRIORITY[p].border}` : "border-border-default text-text-muted hover:text-text-primary"
                    )}>
                    {PRIORITY[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Client + Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Client</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)}
                  className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold">
                  <option value="">— None —</option>
                  {[...clients].sort((a,b)=>a.name.localeCompare(b.name)).filter(c => c.status !== "contact").map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving || !content.trim()}
                className="rounded-lg px-5 py-2 bg-brand-gold text-brand-navy text-sm font-semibold hover:bg-brand-gold/90 disabled:opacity-50 transition-colors">
                {saving ? "Adding…" : "Add Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
