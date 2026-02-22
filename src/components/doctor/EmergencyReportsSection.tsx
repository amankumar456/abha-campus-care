import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO, startOfDay, endOfDay } from "date-fns";
import {
  BarChart3,
  Siren,
  Clock,
  Ambulance,
  Building2,
  TrendingDown,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EmergencyReportsSection() {
  const [range, setRange] = useState("7");

  const { data: reportData } = useQuery({
    queryKey: ["emergency-reports", range],
    queryFn: async () => {
      const daysAgo = subDays(new Date(), parseInt(range));
      
      const { data: allRequests, error } = await supabase
        .from("ambulance_requests")
        .select("id, priority_level, ambulance_type, status, destination_hospital, created_at, dispatched_at, arrived_at, completed_at, actual_arrival_minutes, estimated_arrival_minutes")
        .gte("created_at", daysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      const requests = allRequests || [];

      const total = requests.length;
      const emergencyCount = requests.filter(r => r.priority_level === "emergency").length;
      const urgentCount = requests.filter(r => r.priority_level === "urgent").length;
      const completedCount = requests.filter(r => r.status === "completed").length;
      const cancelledCount = requests.filter(r => r.status === "cancelled").length;
      
      // Average response time
      const responseTimes = requests
        .filter(r => r.actual_arrival_minutes)
        .map(r => r.actual_arrival_minutes!);
      const avgResponse = responseTimes.length > 0
        ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
        : "—";

      // Hospital breakdown
      const hospitalCounts: Record<string, number> = {};
      requests.forEach(r => {
        hospitalCounts[r.destination_hospital] = (hospitalCounts[r.destination_hospital] || 0) + 1;
      });
      const topHospitals = Object.entries(hospitalCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Ambulance type breakdown
      const typeCounts: Record<string, number> = {};
      requests.forEach(r => {
        typeCounts[r.ambulance_type] = (typeCounts[r.ambulance_type] || 0) + 1;
      });

      return {
        total,
        emergencyCount,
        urgentCount,
        completedCount,
        cancelledCount,
        avgResponse,
        topHospitals,
        typeCounts,
        requests,
      };
    },
  });

  const stats = [
    {
      label: "Total Emergencies",
      value: reportData?.total || 0,
      icon: Siren,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Critical Cases",
      value: reportData?.emergencyCount || 0,
      icon: Activity,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Avg Response Time",
      value: reportData?.avgResponse === "—" ? "—" : `${reportData?.avgResponse} min`,
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Resolved",
      value: reportData?.completedCount || 0,
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Emergency Analytics</h3>
            <p className="text-sm text-muted-foreground">Overview of emergency operations</p>
          </div>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Today</SelectItem>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Hospitals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Top Destination Hospitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData?.topHospitals?.length ? (
              <div className="space-y-3">
                {reportData.topHospitals.map(([hospital, count], i) => (
                  <div key={hospital} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                      <span className="text-sm">{hospital}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Ambulance Type Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ambulance className="h-4 w-4 text-primary" />
              Ambulance Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData?.typeCounts && Object.keys(reportData.typeCounts).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(reportData.typeCounts).map(([type, count]) => {
                  const total = reportData.total || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="uppercase font-medium">{type.replace("_", " ")}</span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Emergency Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData?.requests?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Priority</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Hospital</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Response</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.requests.slice(0, 10).map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-3">{format(parseISO(r.created_at), "MMM d, h:mm a")}</td>
                      <td className="py-2 px-3">
                        <Badge
                          variant={r.priority_level === "emergency" ? "destructive" : r.priority_level === "urgent" ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          {r.priority_level.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 uppercase">{r.ambulance_type.replace("_", " ")}</td>
                      <td className="py-2 px-3 max-w-[150px] truncate">{r.destination_hospital}</td>
                      <td className="py-2 px-3">{r.actual_arrival_minutes ? `${r.actual_arrival_minutes} min` : "—"}</td>
                      <td className="py-2 px-3">
                        <Badge variant={r.status === "completed" ? "outline" : "secondary"} className="text-xs capitalize">
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No emergency cases in selected period</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
