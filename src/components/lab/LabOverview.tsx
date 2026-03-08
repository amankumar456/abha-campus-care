import { Card, CardContent } from "@/components/ui/card";
import { TestTubes, Clock, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface LabOverviewProps {
  totalToday: number;
  pending: number;
  completed: number;
  critical: number;
  recentUpdates: Array<{ time: string; text: string; type: "success" | "info" | "warning" }>;
}

const statCards = [
  { key: "totalToday", label: "Samples Today", icon: TestTubes, color: "bg-blue-50 border-blue-200", iconColor: "text-blue-600" },
  { key: "pending", label: "Pending Processing", icon: Clock, color: "bg-amber-50 border-amber-200", iconColor: "text-amber-600" },
  { key: "completed", label: "Completed Today", icon: CheckCircle2, color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600" },
  { key: "critical", label: "Critical Values", icon: AlertTriangle, color: "bg-red-50 border-red-200", iconColor: "text-red-600" },
] as const;

export default function LabOverview({ totalToday, pending, completed, critical, recentUpdates }: LabOverviewProps) {
  const values = { totalToday, pending, completed, critical };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Today's Overview</h2>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Lab operational</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.key} className={`${s.color} border`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                {s.key === "critical" && values.critical > 0 && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">⚠️</span>
                )}
              </div>
              <p className="text-2xl font-bold">{values[s.key]}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Updates Timeline */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Lab Report Updates
          </h3>
          <div className="space-y-3">
            {recentUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent updates today</p>
            ) : (
              recentUpdates.map((u, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    u.type === "success" ? "bg-emerald-500" : u.type === "warning" ? "bg-amber-500" : "bg-blue-500"
                  }`} />
                  <span className="text-muted-foreground min-w-[70px]">{u.time}</span>
                  <span>{u.text}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
