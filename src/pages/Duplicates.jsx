import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Merge, Trash2, CheckCircle2 } from "lucide-react";
import Card from "../components/Card";
import { PageLoader } from "../components/Spinner";
import { fetchClients, updateClient, deleteClient } from "../lib/api";

// Normalize name for comparison: lowercase, strip punctuation, collapse spaces
function normalize(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Simple similarity: what % of characters match
function similarity(a, b) {
  const na = normalize(a), nb = normalize(b);
  if (na === nb) return 1;
  const longer = na.length > nb.length ? na : nb;
  const shorter = na.length > nb.length ? nb : na;
  if (longer.length === 0) return 1;
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  // Also check if one contains the other
  if (longer.includes(shorter) || shorter.includes(longer.substring(0, Math.floor(longer.length * 0.8)))) return 0.92;
  return matches / longer.length;
}

function findDuplicates(clients) {
  const groups = [];
  const used = new Set();
  for (let i = 0; i < clients.length; i++) {
    if (used.has(clients[i].id)) continue;
    const group = [clients[i]];
    for (let j = i + 1; j < clients.length; j++) {
      if (used.has(clients[j].id)) continue;
      const score = similarity(clients[i].name, clients[j].name);
      if (score >= 0.82) {
        group.push(clients[j]);
        used.add(clients[j].id);
      }
    }
    if (group.length > 1) {
      used.add(clients[i].id);
      groups.push(group);
    }
  }
  return groups;
}

export default function Duplicates() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [resolved, setResolved] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients().then(data => { setClients(data); setLoading(false); });
  }, []);

  const groups = useMemo(() => findDuplicates(clients), [clients]);
  const active  = groups.filter(g => !resolved.has(g[0].id + "_" + g[1].id));

  const handleKeep = async (keepId, deleteIds, groupKey) => {
    for (const did of deleteIds) {
      setClients(prev => prev.filter(c => c.id !== did));
      try { await deleteClient(did); } catch {}
    }
    setResolved(prev => new Set([...prev, groupKey]));
  };

  const handleMerge = async (primary, secondary, groupKey) => {
    // Merge secondary's non-empty fields into primary, then delete secondary
    const merged = { ...primary };
    for (const key of ["contact_name","contact_email","contact_phone","website","notes","monthly_value"]) {
      if (!merged[key] && secondary[key]) merged[key] = secondary[key];
    }
    await updateClient(primary.id, merged);
    setClients(prev => prev.map(c => c.id === primary.id ? merged : c).filter(c => c.id !== secondary.id));
    try { await deleteClient(secondary.id); } catch {}
    setResolved(prev => new Set([...prev, groupKey]));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/clients" className="rounded-lg p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Find Duplicates</h1>
          <p className="text-xs text-text-muted">{active.length} possible duplicate pair{active.length !== 1 && "s"} found</p>
        </div>
      </div>

      {active.length === 0 && (
        <Card className="p-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-text-primary font-semibold">No duplicates found</p>
          <p className="text-sm text-text-muted mt-1">Your client list looks clean.</p>
        </Card>
      )}

      {active.map(group => {
        const [a, b] = group;
        const groupKey = a.id + "_" + b.id;
        return (
          <Card key={groupKey} className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle bg-surface-raised/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-gold uppercase tracking-wide">Possible Match</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMerge(b.name.length > a.name.length ? b : a, b.name.length > a.name.length ? a : b, groupKey)}
                  className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 transition-colors"
                >
                  <Merge className="h-3.5 w-3.5" />
                  Merge (keep longer name)
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
              {[a, b].map((c, idx) => (
                <div key={c.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-text-primary">{c.name}</p>
                    <div className="flex gap-1 shrink-0">
                      <Link to={`/clients/${c.id}/edit`} className="rounded px-2 py-1 text-xs text-text-muted hover:text-brand-gold hover:bg-brand-gold/10 transition-colors">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleKeep(idx === 0 ? a.id : b.id, [idx === 0 ? b.id : a.id], groupKey)}
                        className="rounded px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                      >
                        Keep this
                      </button>
                      <button
                        onClick={() => handleKeep(idx === 0 ? b.id : a.id, [c.id], groupKey)}
                        className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-text-muted space-y-0.5">
                    {c.contact_name && <p>{c.contact_name}</p>}
                    {c.contact_email && <p>{c.contact_email}</p>}
                    {c.contact_phone && <p>{c.contact_phone}</p>}
                    {c.status && <p className="capitalize">{c.status}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
