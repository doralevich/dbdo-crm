import { useState, useEffect, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Card from "../components/Card";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { fetchEvents } from "../lib/api";
import { cn, formatTime } from "../lib/utils";

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  // Group events by day
  const grouped = useMemo(() => {
    const groups = {};
    for (const event of events) {
      const date = new Date(event.start.dateTime);
      const key = date.toDateString();
      if (!groups[key]) groups[key] = { date, events: [] };
      groups[key].events.push(event);
    }
    return Object.values(groups).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [events]);

  if (loading) return <PageLoader />;

  const today = new Date().toDateString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
        <p className="text-sm text-text-muted mt-1">
          Upcoming events from Google Calendar
        </p>
      </div>

      {/* Events by day */}
      {grouped.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No upcoming events"
          description="Your calendar is clear for the next 7 days."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const isToday = group.date.toDateString() === today;
            const isTomorrow =
              group.date.toDateString() ===
              new Date(Date.now() + 86400000).toDateString();
            const dayLabel = isToday
              ? "Today"
              : isTomorrow
              ? "Tomorrow"
              : group.date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                });

            return (
              <div key={group.date.toISOString()}>
                <div className="flex items-center gap-3 mb-3">
                  <h2
                    className={cn(
                      "text-sm font-semibold",
                      isToday ? "text-brand-gold" : "text-text-primary"
                    )}
                  >
                    {dayLabel}
                  </h2>
                  <div className="flex-1 h-px bg-border-subtle" />
                  <span className="text-xs text-text-muted">
                    {group.events.length} event{group.events.length !== 1 && "s"}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.events.map((event) => {
                    const start = new Date(event.start.dateTime);
                    const end = new Date(event.end.dateTime);
                    const durationMins = Math.round(
                      (end - start) / 60000
                    );
                    const durationLabel =
                      durationMins >= 60
                        ? `${Math.round(durationMins / 60 * 10) / 10}h`
                        : `${durationMins}m`;

                    return (
                      <Card
                        key={event.id}
                        className={cn(
                          "flex items-start gap-4",
                          isToday && "border-brand-gold/20"
                        )}
                      >
                        {/* Time column */}
                        <div className="flex flex-col items-center shrink-0 w-16 pt-0.5">
                          <span className="text-sm font-semibold text-text-primary">
                            {formatTime(event.start.dateTime)}
                          </span>
                          <span className="text-[10px] text-text-muted mt-0.5">
                            {durationLabel}
                          </span>
                        </div>

                        {/* Divider */}
                        <div className="w-px self-stretch bg-brand-gold/30 shrink-0" />

                        {/* Event details */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-text-primary">
                            {event.summary}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-text-muted">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatTime(event.start.dateTime)} –{" "}
                                {formatTime(event.end.dateTime)}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.attendees?.length > 0 && (
                              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                <Users className="h-3 w-3" />
                                <span>
                                  {event.attendees
                                    .map((a) => a.email)
                                    .join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
