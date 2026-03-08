import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TestTubes, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  Plus, Upload, User, Stethoscope, ArrowRight,
  FlaskConical, FileText, Bell
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface LabReport {
  id: string;
  test_name: string;
  notes: string | null;
  status: string;
  report_file_url: string | null;
  report_file_name: string | null;
  created_at: string;
  updated_at: string;
  student_id: string;
  doctor_id: string | null;
  prescription_id: string | null;
  student?: { full_name: string; roll_number: string; branch: string | null; program: string };
  doctor?: { name: string; designation: string };
}

interface LabOverviewProps {
  totalToday: number;
  pending: number;
  completed: number;
  critical: number;
  recentUpdates: Array<{ time: string; text: string; type: "success" | "info" | "warning" }>;
  allReports: LabReport[];
  pendingReports: LabReport[];
  onNavigate: (section: string) => void;
  onRefresh: () => void;
}

const statCards = [
  { key: "totalToday", label: "Samples Today", icon: TestTubes, color: "bg-blue-50 border-blue-200", iconColor: "text-blue-600" },
  { key: "pending", label: "Pending Processing", icon: Clock, color: "bg-amber-50 border-amber-200", iconColor: "text-amber-600" },
  { key: "completed", label: "Completed Today", icon: CheckCircle2, color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600" },
  { key: "critical", label: "Critical Values", icon: AlertTriangle, color: "bg-red-50 border-red-200", iconColor: "text-red-600" },
] as const;

export default function LabOverview({
  totalToday, pending, completed, critical, recentUpdates,
  allReports, pendingReports, onNavigate, onRefresh
}: LabOverviewProps) {
  const values = { totalToday, pending, completed, critical };

  // Test type distribution for all reports
  const testCounts = new Map<string, number>();
  allReports.forEach(r => testCounts.set(r.test_name, (testCounts.get(r.test_name) || 0) + 1));
  const testDistribution = Array.from(testCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Unique students count
  const uniqueStudents = new Set(allReports.map(r => r.student_id)).size;

  // Oldest pending (most urgent)
  const urgentPending = pendingReports
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 4);

  const priorityColor = (createdAt: string) => {
    const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    if (hours > 24) return "border-l-destructive";
    if (hours > 6) return "border-l-amber-500";
    return "border-l-blue-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Today's Overview</h2>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => onNavigate("register")}>
            <Plus className="w-4 h-4 mr-1" />Register New Sample
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Lab operational</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card
            key={s.key}
            className={`${s.color} border cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => {
              if (s.key === "pending") onNavigate("processing");
              else if (s.key === "completed") onNavigate("completed");
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                {s.key === "critical" && values.critical > 0 && (
                  <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full animate-pulse">⚠️</span>
                )}
              </div>
              <p className="text-2xl font-bold">{values[s.key]}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => setRegisterOpen(true)}>
              <Plus className="w-5 h-5 text-primary" />
              <span className="text-xs">New Sample</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => onNavigate("processing")}>
              <Upload className="w-5 h-5 text-amber-600" />
              <span className="text-xs">Upload Reports</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => onNavigate("completed")}>
              <FileText className="w-5 h-5 text-emerald-600" />
              <span className="text-xs">Completed Tests</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => onNavigate("notifications")}>
              <Bell className="w-5 h-5 text-orange-500" />
              <span className="text-xs">Notifications</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Urgent Pending Queue */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Urgent Pending Tests
              </CardTitle>
              {pendingReports.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => onNavigate("processing")}>
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {urgentPending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">🎉 No pending tests — all clear!</p>
            ) : (
              <div className="space-y-2">
                {urgentPending.map(r => (
                  <div key={r.id} className={`border-l-4 ${priorityColor(r.created_at)} bg-muted/30 rounded-r-md p-3 cursor-pointer hover:bg-muted/60 transition-colors`} onClick={() => onNavigate("processing")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{r.student?.full_name}</span>
                        <Badge variant="outline" className="text-[10px]">{r.student?.roll_number}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-blue-100 text-blue-800 text-[10px]">{r.test_name}</Badge>
                      {r.doctor?.name && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Stethoscope className="w-2.5 h-2.5" />Dr. {r.doctor.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Updates Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Recent Completions
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => onNavigate("completed")}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {recentUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent completions</p>
            ) : (
              <div className="space-y-3">
                {recentUpdates.map((u, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      u.type === "success" ? "bg-emerald-500" : u.type === "warning" ? "bg-amber-500" : "bg-blue-500"
                    }`} />
                    <div className="flex-1">
                      <span className="text-foreground">{u.text}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{u.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Test Distribution + Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Test Type Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TestTubes className="w-4 h-4 text-primary" />
              Test Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {testDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tests recorded yet</p>
            ) : (
              <div className="space-y-2">
                {testDistribution.map(([name, count]) => {
                  const pct = Math.round((count / allReports.length) * 100);
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="truncate mr-2">{name}</span>
                        <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lab Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Lab Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{allReports.length}</p>
                <p className="text-xs text-muted-foreground">Total Reports</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{uniqueStudents}</p>
                <p className="text-xs text-muted-foreground">Unique Students</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{allReports.filter(r => r.status === "completed").length}</p>
                <p className="text-xs text-muted-foreground">Reports Completed</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{testCounts.size}</p>
                <p className="text-xs text-muted-foreground">Test Types</p>
              </div>
            </div>
            {pendingReports.length > 0 && (
              <div className="mt-4 p-3 border border-amber-200 bg-amber-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-800 font-medium">{pendingReports.length} tests awaiting processing</span>
                </div>
                <Button variant="outline" size="sm" className="text-xs border-amber-300" onClick={() => onNavigate("processing")}>
                  Process Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RegisterSampleDialog open={registerOpen} onClose={() => setRegisterOpen(false)} onRegistered={onRefresh} />
    </div>
  );
}
