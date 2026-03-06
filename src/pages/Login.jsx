import { useEffect } from "react";

export default function Login({ onLogin }) {
  useEffect(() => {
    // Auto-authenticate in static mode
    localStorage.setItem("crm_token", "static-" + Date.now());
    onLogin("static-" + Date.now());
  }, [onLogin]);

  return (
    <div className="min-h-screen bg-surface-raised flex items-center justify-center">
      <div className="text-text-primary text-lg">Loading CRM...</div>
    </div>
  );
}
