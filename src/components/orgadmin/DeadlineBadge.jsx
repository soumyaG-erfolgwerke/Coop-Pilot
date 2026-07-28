import { DateTime } from "luxon";
import { CalendarDays } from "lucide-react";

export default function DeadlineBadge({ date, warningDays = 6 }) {
  if (!date) {
    return (
      <div className="flex items-center justify-center gap-2 text-slate-500">
        <CalendarDays className="w-4 h-4" />
        <span>Not Set</span>
      </div>
    );
  }

  const deadline = DateTime.fromISO(date);
  const daysRemaining = Math.ceil(
    deadline.startOf("day").diff(
      DateTime.now().startOf("day"),
      "days"
    ).days
  );

  const styles =
    daysRemaining < 0
      ? "bg-red-100 text-red-700 border-red-200"
      : daysRemaining <= warningDays
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-green-100 text-green-700 border-green-200";

  return (
    <div className="flex items-center justify-center">
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${styles}`}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        {deadline.toFormat("dd LLL yyyy")}
        {daysRemaining >= 0 && ` (${daysRemaining}d)`}
      </span>
    </div>
  );
}