import { useState, useEffect } from "react";
import {
  UsersRound,
  CheckSquare,
  Users,
  Zap,
  Circle,
} from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { fetchTeam } from "../lib/api";
import { cn } from "../lib/utils";

export default function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam()
      .then(setTeam)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Team</h1>
        <p className="text-sm text-text-muted mt-1">
          Agent assignments and active tasks
        </p>
      </div>

      {team.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No team members"
          description="Team data will appear here."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {team.map((member) => (
            <Card key={member.id} className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold",
                    member.avatar === "DO"
                      ? "bg-brand-gold/20 text-brand-gold"
                      : "bg-violet-500/20 text-violet-400"
                  )}
                >
                  {member.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-text-primary truncate">
                      {member.name}
                    </h3>
                    <Circle
                      className={cn(
                        "h-2 w-2 shrink-0",
                        member.status === "active"
                          ? "text-emerald-400 fill-emerald-400"
                          : "text-gray-500 fill-gray-500"
                      )}
                    />
                  </div>
                  <p className="text-sm text-text-muted">{member.role}</p>
                </div>
              </div>

              {/* Current Tasks */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="h-3.5 w-3.5 text-text-muted" />
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Current Tasks
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {member.current_tasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-surface-raised px-3 py-2"
                    >
                      <Zap className="h-3 w-3 text-brand-gold shrink-0" />
                      <span className="text-sm text-text-secondary">
                        {task}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Clients */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-3.5 w-3.5 text-text-muted" />
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Active Clients
                  </h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {member.active_clients.map((client, i) => (
                    <Badge key={i} className="bg-brand-navy-lighter text-text-secondary">
                      {client}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
