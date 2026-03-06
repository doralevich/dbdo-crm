import { useState } from "react";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("crm_token", data.token);
        onLogin(data.token);
      } else {
        setError(data.message || "Invalid password");
      }
    } catch {
      setError("Server unavailable — check connection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-raised flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-border-subtle rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold font-bold text-brand-navy text-lg">
                D
              </div>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Donna CRM</h1>
            <p className="text-text-muted text-sm">DBDO Agency - Authorized Access Only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-surface-raised border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-brand-gold hover:bg-brand-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-brand-navy font-medium rounded-lg transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
