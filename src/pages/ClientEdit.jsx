import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Card from "../components/Card";
import { PageLoader } from "../components/Spinner";
import { fetchClients, updateClient, deleteClient } from "../lib/api";
import { cn } from "../lib/utils";

const STATUS_OPTIONS = ["active", "retainer", "lead", "inactive", "contact"];
const TYPE_OPTIONS   = ["client", "contact", "lead"];

function Field({ label, name, value, onChange, type = "text", options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      {options ? (
        <select
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold"
        >
          {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold"
        />
      )}
    </div>
  );
}

export default function ClientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClients().then(clients => {
      const c = clients.find(c => String(c.id) === String(id));
      if (c) setForm({ ...c });
      else setError("Client not found");
    });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateClient(id, {
        name:           form.name,
        contact_name:   form.contact_name,
        contact_email:  form.contact_email,
        contact_phone:  form.contact_phone,
        website:        form.website,
        status:         form.status,
        type:           form.type,
        monthly_value:  form.monthly_value ? parseFloat(form.monthly_value) : null,
        notes:          form.notes,
      });
      navigate("/clients");
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${form?.name}"? This cannot be undone.`)) return;
    try {
      await deleteClient(id);
      navigate("/clients");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!form) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/clients" className="rounded-lg p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Edit Client</h1>
            <p className="text-xs text-text-muted">{form.name}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-400/10 border border-red-400/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Company / Primary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company / Name *" name="name" value={form.name} onChange={handleChange} />
          <Field label="Website" name="website" value={form.website} onChange={handleChange} />
          <Field label="Status" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
          <Field label="Type" name="type" value={form.type} onChange={handleChange} options={TYPE_OPTIONS} />
          <Field label="Monthly Value ($)" name="monthly_value" type="number" value={form.monthly_value} onChange={handleChange} />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Contact Person</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Contact Name" name="contact_name" value={form.contact_name} onChange={handleChange} />
          <Field label="Email" name="contact_email" type="email" value={form.contact_email} onChange={handleChange} />
          <Field label="Phone" name="contact_phone" value={form.contact_phone} onChange={handleChange} />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Notes</h2>
        <textarea
          name="notes"
          value={form.notes || ""}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold resize-none"
          placeholder="Internal notes..."
        />
      </Card>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-brand-gold/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
