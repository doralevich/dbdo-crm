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
  const [dueDate,  setDueDate]  = useState(new Date().toISOString().split("T")[0]);
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
        <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.12)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <h2 className="text-base font-semibold text-white tracking-tight">New Task</h2>
            <button onClick={onClose} className="rounded-full p-1.5 text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
            {error && <p className="text-xs text-red-400">{error}</p>}

            {/* Task name */}
            <input autoFocus value={content} onChange={e => setContent(e.target.value)}
              placeholder="Task name…"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
            />

            {/* Priority */}
            <div>
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2">Priority</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[4,3,2,1].map(p => (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className={cn("rounded-xl py-2 text-[12px] font-semibold transition-all",
                      priority === p
                        ? `${PRIORITY[p].bg} ${PRIORITY[p].color} ${PRIORITY[p].border} border`
                        : "text-white/40 hover:text-white/70 border border-transparent hover:border-white/10"
                    )} style={priority !== p ? { background: "rgba(255,255,255,0.05)" } : {}}>
                    {PRIORITY[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Client + Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2">Client</p>
                <select value={clientId} onChange={e => setClientId(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <option value="">— None —</option>
                  {[...clients].sort((a,b)=>a.name.localeCompare(b.name))
                    .filter(c => !["contact"].includes(c.type))
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2">Due Date</p>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-medium text-white/40 hover:text-white/70 transition-colors"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                Cancel
              </button>
              <button type="submit" disabled={saving || !content.trim()}
                className="flex-1 rounded-xl py-2.5 bg-brand-gold text-black text-[13px] font-semibold hover:bg-brand-gold/90 active:scale-95 disabled:opacity-40 transition-all">
                {saving ? "Adding…" : "Add Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
