import { useState, useEffect, useRef } from "react";
import {
  X, CheckCircle2, Circle, Flag, Calendar, User, FileText,
  MessageSquare, Paperclip, Trash2, Send, ChevronDown,
} from "lucide-react";
import { cn } from "../lib/utils";
import { request } from "../lib/api";

const PRIORITY = {
  4: { label: "Urgent", color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/40" },
  3: { label: "High",   color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/40" },
  2: { label: "Medium", color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/40" },
  1: { label: "Low",    color: "text-gray-500",   bg: "bg-gray-500/10",   border: "border-gray-500/40" },
};

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function TaskDrawer({ task: initialTask, clients = [], onClose, onUpdate, onDelete }) {
  const [task, setTask]         = useState(initialTask);
  const [comments, setComments] = useState(initialTask?.comments || []);
  const [newComment, setComment]= useState("");
  const [saving, setSaving]     = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const titleRef = useRef(null);

  // Load full task detail (with comments) on open
  useEffect(() => {
    if (!initialTask?.id) return;
    request(`/tasks/${initialTask.id}`)
      .then(data => { setTask(data); setComments(data.comments || []); })
      .catch(() => {});
  }, [initialTask?.id]);

  useEffect(() => {
    if (editTitle && titleRef.current) titleRef.current.focus();
  }, [editTitle]);

  if (!task) return null;

  const p = PRIORITY[task.priority] || PRIORITY[2];

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

  const handleDeleteComment = async (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    try { await request(`/tasks/${task.id}/comments/${commentId}`, { method: "DELETE" }); } catch {}
  };

  const clientName = clients.find(c => c.id === task.client_id)?.name || task.owner || "";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-surface-base border-l border-border-subtle z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium border", p.bg, p.color, p.border)}>
              {p.label}
            </span>
            {clientName && (
              <span className="text-xs text-text-muted">{clientName}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="rounded-lg p-1.5 text-text-muted hover:text-red-400 transition-colors" title="Delete task">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:text-text-primary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Title */}
          <div>
            {editTitle ? (
              <input
                ref={titleRef}
                value={task.content}
                onChange={e => setTask(t => ({ ...t, content: e.target.value }))}
                onBlur={() => { setEditTitle(false); save({ content: task.content }); }}
                onKeyDown={e => e.key === "Enter" && titleRef.current?.blur()}
                className="w-full text-lg font-semibold text-text-primary bg-transparent border-b border-brand-gold focus:outline-none pb-1"
              />
            ) : (
              <h2
                className="text-lg font-semibold text-text-primary cursor-text hover:text-brand-gold transition-colors"
                onClick={() => setEditTitle(true)}
                title="Click to edit"
              >
                {task.content}
              </h2>
            )}
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Priority</label>
              <div className="flex gap-1.5">
                {[4,3,2,1].map(p => (
                  <button key={p} onClick={() => save({ priority: p })}
                    className={cn("rounded px-2 py-1 text-xs font-medium border transition-colors",
                      task.priority === p ? `${PRIORITY[p].bg} ${PRIORITY[p].color} ${PRIORITY[p].border}` : "border-border-default text-text-muted hover:text-text-primary"
                    )}>
                    {PRIORITY[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Due Date</label>
              <input
                type="date"
                value={task.due_date || ""}
                onChange={e => save({ due_date: e.target.value || null })}
                className="rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold w-full"
              />
            </div>

            {/* Client */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Client</label>
              <select
                value={task.client_id || ""}
                onChange={e => {
                  const c = clients.find(c => c.id === e.target.value);
                  save({ client_id: e.target.value || null, owner: c?.name || task.owner });
                }}
                className="rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold w-full"
              >
                <option value="">— Unassigned —</option>
                {clients.filter(c => c.status !== "contact").map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-1.5">
              <FileText className="h-3.5 w-3.5" /> Description
            </label>
            <textarea
              value={task.description || ""}
              onChange={e => setTask(t => ({ ...t, description: e.target.value }))}
              onBlur={() => save({ description: task.description })}
              rows={3}
              placeholder="Add a description…"
              className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold resize-none placeholder:text-text-muted/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-1.5">
              <Paperclip className="h-3.5 w-3.5" /> Notes / Documents
            </label>
            <textarea
              value={task.notes || ""}
              onChange={e => setTask(t => ({ ...t, notes: e.target.value }))}
              onBlur={() => save({ notes: task.notes })}
              rows={3}
              placeholder="Paste links, reference notes, document URLs…"
              className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold resize-none placeholder:text-text-muted/50"
            />
          </div>

          {/* Comments */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-2">
              <MessageSquare className="h-3.5 w-3.5" /> Comments
            </label>
            <div className="space-y-2.5 mb-3">
              {comments.length === 0 && (
                <p className="text-xs text-text-muted italic">No comments yet.</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="group flex gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-brand-gold/20 flex items-center justify-center text-xs font-bold text-brand-gold shrink-0 mt-0.5">
                    {(c.author || "D")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-text-primary">{c.author || "David"}</span>
                      <span className="text-[11px] text-text-muted">{formatDateTime(c.created_at)}</span>
                      <button onClick={() => handleDeleteComment(c.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all text-[11px]">
                        Delete
                      </button>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                value={newComment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold placeholder:text-text-muted/50"
              />
              <button type="submit" disabled={saving || !newComment.trim()}
                className="rounded-lg px-3 py-2 bg-surface-raised text-text-muted hover:text-brand-gold border border-border-default disabled:opacity-40 transition-colors">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Complete button — pinned to bottom */}
        <div className="shrink-0 px-5 py-4 border-t border-border-subtle">
          <button
            onClick={handleComplete}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors"
          >
            <CheckCircle2 className="h-5 w-5" />
            Mark Complete
          </button>
          <p className="text-center text-xs text-text-muted mt-2">Completed tasks move to client history</p>
        </div>
      </div>
    </>
  );
}
