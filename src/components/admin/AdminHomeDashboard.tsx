import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import {
  Shield,
  Users,
  Stethoscope,
  GraduationCap,
  UserCheck,
  Calendar,
  Activity,
  ArrowRight,
  ClipboardList,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Building,
  Settings,
  Link2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AdminProfileCard from "@/components/profile/AdminProfileCard";

export default function AdminHomeDashboard() {
  const navigate = useNavigate();
  const { user } = useUserRole();

  // Fetch system stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-home-stats"],
    queryFn: async () => {
      const [usersRes, doctorsRes, mentorsRes, studentsRes, medOfficersRes, visitingRes] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "doctor"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "mentor"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("medical_officers").select("id", { count: "exact", head: true }),
        supabase.from("visiting_doctors").select("id", { count: "exact", head: true }),
      ]);
      return {
        totalUsers: usersRes.count || 0,
        totalDoctors: doctorsRes.count || 0,
        totalMentors: mentorsRes.count || 0,
        totalStudents: studentsRes.count || 0,
        medicalOfficers: medOfficersRes.count || 0,
        visitingDoctors: visitingRes.count || 0,
      };
    },
  });

  // Fetch today's appointments
  const { data: todayAppointments, isLoading: loadingAppts } = useQuery({
    queryKey: ["admin-home-today-appointments"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("appointments")
        .select("id, status")
        .eq("appointment_date", today);
      return data || [];
    },
  });

  // Fetch active medical leaves
  const { data: activeLeaves, isLoading: loadingLeaves } = useQuery({
    queryKey: ["admin-home-active-leaves"],
    queryFn: async () => {
      const { data } = await supabase
        .from("medical_leave_requests")
        .select("id, status, health_priority")
        .in("status", ["doctor_referred", "student_form_pending", "on_leave", "return_pending"]);
      return data || [];
    },
  });

  // Fetch recent security events
  const { data: recentSecurityEvents, isLoading: loadingSecurity } = useQuery({
    queryKey: ["admin-home-security-events"],
    queryFn: async () => {
      const { count } = await supabase
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("success", false)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      return count || 0;
    },
  });

  const pendingAppts = todayAppointments?.filter(a => a.status === "pending").length || 0;
  const confirmedAppts = todayAppointments?.filter(a => a.status === "confirmed").length || 0;
  const urgentLeaves = activeLeaves?.filter(l => l.health_priority === "urgent" || l.health_priority === "critical").length || 0;

  const quickActions = [
    {
      title: "Admin Dashboard",
      description: "Manage users, roles, doctors & system settings",
      icon: Settings,
      color: "text-primary",
      bg: "bg-primary/10",
      onClick: () => navigate("/admin/dashboard"),
    },
    {
      title: "Medical Team",
      description: "View all medical officers & visiting doctors",
      icon: Stethoscope,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      onClick: () => navigate("/medical-team"),
    },
    {
      title: "Appointments",
      description: "View and manage all appointments",
      icon: Calendar,
      color: "text-green-600",
      bg: "bg-green-500/10",
      onClick: () => navigate("/appointments"),
    },
    {
      title: "Medical Leave",
      description: "Monitor active medical leave requests",
      icon: FileText,
      color: "text-orange-600",
      bg: "bg-orange-500/10",
      onClick: () => navigate("/medical-leave"),
    },
    {
      title: "Emergency Services",
      description: "Ambulance dispatch & emergency cases",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-500/10",
      onClick: () => navigate("/emergency"),
    },
    {
      title: "Health Dashboard",
      description: "Overall health centre analytics",
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      onClick: () => navigate("/health-dashboard"),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Welcome, {user?.user_metadata?.full_name || "Administrator"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(), "EEEE, MMMM d, yyyy")} — System overview & quick actions
            </p>
          </div>

          {/* Live Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="border-primary/20">
              <CardContent className="pt-4 pb-3 text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                {loadingStats ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats?.totalUsers}</p>
                )}
                <p className="text-xs text-muted-foreground">Total Users</p>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20">
              <CardContent className="pt-4 pb-3 text-center">
                <Stethoscope className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                {loadingStats ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats?.medicalOfficers}</p>
                )}
                <p className="text-xs text-muted-foreground">Medical Officers</p>
              </CardContent>
            </Card>

            <Card className="border-green-500/20">
              <CardContent className="pt-4 pb-3 text-center">
                <GraduationCap className="w-5 h-5 text-green-600 mx-auto mb-1" />
                {loadingStats ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats?.totalStudents}</p>
                )}
                <p className="text-xs text-muted-foreground">Students</p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20">
              <CardContent className="pt-4 pb-3 text-center">
                <Calendar className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                {loadingAppts ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{todayAppointments?.length || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Today's Appointments</p>
              </CardContent>
            </Card>

            <Card className="border-red-500/20">
              <CardContent className="pt-4 pb-3 text-center">
                <FileText className="w-5 h-5 text-red-600 mx-auto mb-1" />
                {loadingLeaves ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{activeLeaves?.length || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Active Leaves</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/20">
              <CardContent className="pt-4 pb-3 text-center">
                <ShieldAlert className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                {loadingSecurity ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{recentSecurityEvents}</p>
                )}
                <p className="text-xs text-muted-foreground">Failed Logins (24h)</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Profile Card */}
        <div className="w-full lg:w-96 shrink-0">
          <AdminProfileCard
            profile={{
              email: user?.email || "",
              name: user?.user_metadata?.full_name || "Administrator",
              lastSignIn: user?.last_sign_in_at
                ? format(new Date(user.last_sign_in_at), "MMM d, yyyy h:mm a")
                : undefined,
            }}
            stats={stats ? {
              totalUsers: stats.totalUsers,
              totalDoctors: stats.totalDoctors,
              totalMentors: stats.totalMentors,
              totalStudents: stats.totalStudents,
            } : undefined}
          />
        </div>
      </div>

      {/* Alerts Section */}
      {(urgentLeaves > 0 || pendingAppts > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {urgentLeaves > 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">
                    {urgentLeaves} urgent medical leave{urgentLeaves > 1 ? "s" : ""} require attention
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/medical-leave")} className="shrink-0">
                  View <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}
          {pendingAppts > 0 && (
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="pt-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-orange-600 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">
                    {pendingAppts} pending appointment{pendingAppts > 1 ? "s" : ""} today
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/appointments")} className="shrink-0">
                  View <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={action.onClick}
            >
              <CardContent className="pt-5 pb-4 flex items-start gap-4">
                <div className={`p-3 rounded-xl ${action.bg} shrink-0`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground flex items-center gap-1">
                    {action.title}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
