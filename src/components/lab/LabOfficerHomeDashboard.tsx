import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { format, startOfDay, isAfter } from "date-fns";
import {
  FlaskConical,
  LayoutDashboard,
  Plus,
  ClipboardList,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  BarChart3,
  Bell,
  AlertTriangle,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function LabOfficerHomeDashboard() {
  const navigate = useNavigate();
  const { user } = useUserRole();

  const { data: labReports, isLoading } = useQuery({
    queryKey: ["lab-home-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lab_reports")
        .select("id, test_name, status, created_at, updated_at, student_id")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const todayStart = startOfDay(new Date());
  const allReports = labReports || [];
  const todayReports = allReports.filter(r => isAfter(new Date(r.created_at), todayStart));
  const pendingReports = allReports.filter(r => r.status === "pending");
  const completedReports = allReports.filter(r => r.status === "completed");
  const todayCompleted = completedReports.filter(r => isAfter(new Date(r.updated_at), todayStart));
  const completionRate = allReports.length > 0 
    ? Math.round((completedReports.length / allReports.length) * 100) 
    : 0;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Lab Officer";

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-[#1e3a8a]/10 via-[#3b82f6]/5 to-[#1e3a8a]/10 border-[#1e3a8a]/20">
        <CardContent className="py-6 px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center shadow-md">
                <FlaskConical className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Welcome, {displayName}
                </h1>
                <p className="text-muted-foreground">
                  Lab Officer • NIT Warangal Health Centre
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/lab/dashboard")} className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </Button>
              <Button onClick={() => navigate("/lab/dashboard")} className="gap-2 bg-[#1e3a8a] hover:bg-[#1e3a8a]/90">
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-[#1e3a8a]"
          onClick={() => navigate("/lab/dashboard")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{todayReports.length}</p>
                <p className="text-sm text-muted-foreground">Samples Today</p>
              </div>
              <FlaskConical className="h-8 w-8 text-[#1e3a8a]/60" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
          onClick={() => navigate("/lab/dashboard")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingReports.length}</p>
                <p className="text-sm text-muted-foreground">Pending Tests</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-emerald-500"
          onClick={() => navigate("/lab/dashboard")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{todayCompleted.length}</p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
            pendingReports.length > 5 ? "border-l-destructive" : "border-l-[#3b82f6]"
          }`}
          onClick={() => navigate("/lab/dashboard")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
              <BarChart3 className={`h-8 w-8 ${pendingReports.length > 5 ? "text-destructive/60" : "text-[#3b82f6]/60"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-[#1e3a8a]" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common laboratory workflows</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate("/lab/dashboard")}
            >
              <Plus className="h-6 w-6 text-[#1e3a8a]" />
              <span className="text-xs font-medium">Register Sample</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate("/lab/dashboard")}
            >
              <ClipboardList className="h-6 w-6 text-amber-600" />
              <span className="text-xs font-medium">Processing Queue</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate("/lab/dashboard")}
            >
              <Users className="h-6 w-6 text-emerald-600" />
              <span className="text-xs font-medium">Student Records</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate("/lab/dashboard")}
            >
              <BarChart3 className="h-6 w-6 text-[#3b82f6]" />
              <span className="text-xs font-medium">Analytics</span>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Completions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Recent Completions
                </CardTitle>
                <CardDescription>Latest completed lab reports</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/lab/dashboard")}>
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {completedReports.length > 0 ? (
              <div className="space-y-3">
                {completedReports.slice(0, 4).map(report => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{report.test_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.updated_at), "dd MMM yyyy, hh:mm a")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs text-emerald-700 bg-emerald-50">
                      Completed
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FlaskConical className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No completed reports yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Alert */}
      {pendingReports.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-sm text-amber-900">
                  {pendingReports.length} test{pendingReports.length !== 1 ? "s" : ""} pending results
                </p>
                <p className="text-xs text-amber-700">Head to the processing queue to enter results</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100" onClick={() => navigate("/lab/dashboard")}>
              Process Now
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />
      <div className="text-center">
        <Button variant="outline" onClick={() => navigate("/lab/dashboard")} className="gap-2">
          <LayoutDashboard className="h-4 w-4" />
          Open Full Lab Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
