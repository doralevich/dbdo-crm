import { useState, useEffect, useRef } from "react";
import {
  X, CheckCircle2, Trash2, Send, FileText,
  MessageSquare, Paperclip, ChevronRight,
} from "lucide-react";
import { cn } from "../lib/utils";
import { request } from "../lib/api";

const PRIORITY = {
  4: { label: "Urgent", dot: "bg-red-500",    ring: "ring-red-500",    text: "text-red-400",    badge: "bg-red-500/15 text-red-400 border-red-500/30" },
  3: { label: "High",   dot: "bg-orange-400", ring: "ring-orange-400", text: "text-orange-400", badge: "bg-orange-400/15 text-orange-400 border-orange-400/30" },
  2: { label: "Medium", dot: "bg-blue-400",   ring: "ring-blue-400",   text: "text-blue-400",   badge: "bg-blue-400/15 text-blue-400 border-blue-400/30" },
  1: { label: "Low",    dot: "bg-gray-500",   ring: "ring-gray-500",   text: "text-gray-400",   badge: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

function formatTs(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function TaskDrawer({ task: initialTask, clients = [], onClose, onUpdate, onDelete }) {
  const [task, setTask]         = useState(initialTask);
  const [comments, setComments] = useState(initialTask?.comments || []);
  const [newComment, setComment]= useState("");
  const [saving, setSaving]     = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!initialTask?.id) return;
    request(`/tasks/${initialTask.id}`)
      .then(d => { setTask(d); setComments(d.comments || []); })
      .catch(() => {});
  }, [initialTask?.id]);

  if (!task) return null;

  const p = PRIORITY[task.priority] || PRIORITY[2];
  const clientName = clients.find(c => c.id === task.client_id)?.name || task.owner || "";

  const save = async (updates) => {
    const merged = { ...task, ...updates };
    setTask(merged);
    try { await request(`/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(updates) }); }
    catch {}
    onUpdate?.(merged);
  };

  const handleComplete = async () => {
    await save({ is_completed: true, completed_at: new Date().toISOString() });
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    try { await request(`/tasks/${task.id}`, { method: "DELETE" }); } catch {}
    onDelete?.(task.id);
    onClose();
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSaving(true);
    try {
      const { comment } = await request(`/tasks/${task.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment.trim(), author: "David" }),
      });
      setComments(prev => [...prev, comment]);
      setComment("");
    } catch {}
    setSaving(false);
  };

  return (
    <>
      {/* Translucent backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] z-50 flex flex-col"
        style={{ background: "var(--color-surface-base, #0f1117)", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", p.badge)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", p.dot)} />
              {p.label}
            </span>
            {clientName && (
              <span className="text-xs text-text-muted">{clientName}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleDelete}
              className="rounded-lg p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Title */}
          <div className="px-5 pt-5 pb-4">
            <textarea
              ref={titleRef}
              value={task.content}
              onChange={e => setTask(t => ({ ...t, content: e.target.value }))}
              onBlur={() => save({ content: task.content })}
              rows={2}
              className="w-full bg-transparent text-lg font-semibold text-text-primary resize-none focus:outline-none leading-snug placeholder:text-text-muted/40"
              placeholder="Task name…"
            />
          </div>

          {/* Meta grid */}
          <div className="px-5 pb-4 grid grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">Priority</p>
              <div className="flex gap-1">
                {[4,3,2,1].map(n => (
                  <button key={n} onClick={() => save({ priority: n })}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-[11px] font-medium transition-all border",
                      task.priority === n
                        ? `${PRIORITY[n].badge}`
                        : "border-white/8 text-text-muted hover:border-white/20 hover:text-text-secondary"
                    )}>
                    {PRIORITY[n].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">Due Date</p>
              <input type="date" value={task.due_date || ""}
                onChange={e => save({ due_date: e.target.value || null })}
                className="w-full rounded-md border border-white/8 bg-white/5 px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            {/* Client — full width */}
            <div className="col-span-2">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">Client</p>
              <select value={task.client_id || ""}
                onChange={e => {
                  const c = clients.find(c => c.id === e.target.value);
                  save({ client_id: e.target.value || null, owner: c?.name || task.owner });
                }}
                className="w-full rounded-md border border-white/8 bg-white/5 px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold">
                <option value="">— Unassigned —</option>
                {[...clients].sort((a,b)=>a.name.localeCompare(b.name))
                  .filter(c => !["contact","lead"].includes(c.type))
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-white/8 mx-5" />

          {/* Description */}
          <div className="px-5 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">
              <FileText className="h-3 w-3" /> Description
            </p>
            <textarea value={task.description || ""}
              onChange={e => setTask(t => ({ ...t, description: e.target.value }))}
              onBlur={() => save({ description: task.description })}
              rows={3} placeholder="Add a description…"
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold resize-none placeholder:text-text-muted/40"
            />
          </div>

          {/* Notes / Documents */}
          <div className="px-5 pb-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">
              <Paperclip className="h-3 w-3" /> Notes / Documents
            </p>
            <textarea value={task.notes || ""}
              onChange={e => setTask(t => ({ ...t, notes: e.target.value }))}
              onBlur={() => save({ notes: task.notes })}
              rows={3} placeholder="Paste links, document URLs, reference notes…"
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold resize-none placeholder:text-text-muted/40"
            />
          </div>

          {/* Comments */}
          <div className="border-t border-white/8 mx-5" />
          <div className="px-5 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-3">
              <MessageSquare className="h-3 w-3" /> Comments {comments.length > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[10px] normal-case">{comments.length}</span>}
            </p>

            {comments.length === 0 && (
              <p className="text-xs text-text-muted/50 italic mb-3">No comments yet.</p>
            )}

            <div className="space-y-3 mb-3">
              {comments.map(c => (
                <div key={c.id} className="group flex gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-brand-gold/20 flex items-center justify-center text-[11px] font-bold text-brand-gold shrink-0 mt-0.5">
                    {(c.author || "D")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/8 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold text-text-primary">{c.author || "David"}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-muted">{formatTs(c.created_at)}</span>
                        <button
                          onClick={() => {
                            setComments(prev => prev.filter(x => x.id !== c.id));
                            request(`/tasks/${task.id}/comments/${c.id}`, { method: "DELETE" }).catch(() => {});
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-text-muted hover:text-red-400 transition-all">
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <form onSubmit={handleComment} className="flex gap-2 items-center">
              <input value={newComment} onChange={e => setComment(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold placeholder:text-text-muted/40"
              />
              <button type="submit" disabled={saving || !newComment.trim()}
                className="rounded-lg p-2 bg-brand-gold text-brand-navy disabled:opacity-40 hover:bg-brand-gold/90 transition-colors">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Spacer for pinned button */}
          <div className="h-24" />
        </div>

        {/* Complete — pinned */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-white/8"
          style={{ background: "var(--color-surface-base, #0f1117)" }}>
          <button onClick={handleComplete}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors">
            <CheckCircle2 className="h-4.5 w-4.5" />
            Mark Complete
          </button>
          <p className="text-center text-[11px] text-text-muted mt-1.5">Stays in client history when complete</p>
        </div>
      </div>
    </>
  );
}
