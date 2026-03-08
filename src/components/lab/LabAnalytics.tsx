import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, TrendingUp } from "lucide-react";

interface LabReport {
  id: string;
  test_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  reports: LabReport[];
}

export default function LabAnalytics({ reports }: Props) {
  // Group by test type
  const testStats = new Map<string, { total: number; completed: number; pending: number; avgTat: number }>();
  reports.forEach(r => {
    const existing = testStats.get(r.test_name) || { total: 0, completed: 0, pending: 0, avgTat: 0 };
    existing.total++;
    if (r.status === "completed") {
      existing.completed++;
      const tat = (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 3600000;
      existing.avgTat = (existing.avgTat * (existing.completed - 1) + tat) / existing.completed;
    } else {
      existing.pending++;
    }
    testStats.set(r.test_name, existing);
  });

  const stats = Array.from(testStats.entries()).sort((a, b) => b[1].total - a[1].total);
  const totalCompleted = reports.filter(r => r.status === "completed").length;
  const totalPending = reports.filter(r => r.status === "pending").length;
  const completionRate = reports.length > 0 ? Math.round((totalCompleted / reports.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-500" />
        Lab Analytics
      </h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{reports.length}</p>
            <p className="text-xs text-muted-foreground">Total Tests</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalPending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Test-wise breakdown */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">Test-wise Breakdown</h3>
          {stats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-medium">Test Type</th>
                    <th className="text-center p-3 font-medium">Total</th>
                    <th className="text-center p-3 font-medium">Completed</th>
                    <th className="text-center p-3 font-medium">Pending</th>
                    <th className="text-center p-3 font-medium">Avg TAT</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map(([name, s]) => (
                    <tr key={name} className="border-t">
                      <td className="p-3 font-medium">{name}</td>
                      <td className="p-3 text-center">{s.total}</td>
                      <td className="p-3 text-center"><Badge className="bg-emerald-100 text-emerald-700">{s.completed}</Badge></td>
                      <td className="p-3 text-center">{s.pending > 0 ? <Badge className="bg-amber-100 text-amber-700">{s.pending}</Badge> : "—"}</td>
                      <td className="p-3 text-center text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />{s.avgTat > 0 ? `${Math.round(s.avgTat)}h` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
