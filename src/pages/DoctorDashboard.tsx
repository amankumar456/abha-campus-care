import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { isToday, parseISO } from "date-fns";
import {
  Users,
  Calendar,
  FileCheck,
  Bell,
  Stethoscope,
  Shield,
  Activity,
  AlertTriangle,
  FileText,
  LogOut,
  Settings,
  User,
  UserSearch,
  ClipboardList,
  LayoutDashboard,
  HeartPulse,
  Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudentSearchPanel from "@/components/doctor/StudentSearchPanel";

import DoctorAppointmentsList from "@/components/doctor/DoctorAppointmentsList";
import PendingAccessRequests from "@/components/doctor/PendingAccessRequests";
import MedicalLeaveTab from "@/components/doctor/MedicalLeaveTab";
import ScheduleFollowupDialog from "@/components/doctor/ScheduleFollowupDialog";
import IssueCertificateDialog from "@/components/doctor/IssueCertificateDialog";
import PendingFollowupsList from "@/components/doctor/PendingFollowupsList";
import MedicalLeaveStudentsOverview from "@/components/medical-leave/MedicalLeaveStudentsOverview";
import DoctorHealthOverview from "@/components/doctor/DoctorHealthOverview";
import DoctorTreatmentOverview from "@/components/doctor/DoctorTreatmentOverview";
import EmergencyPage from "@/pages/EmergencyPage";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, doctorId, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardSubTab, setDashboardSubTab] = useState("my-dashboard");
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  // Fetch real appointment stats
  const { data: appointmentStats } = useQuery({
    queryKey: ["doctor-appointment-stats", doctorId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data: todayApts } = await supabase
        .from("appointments")
        .select("id, health_priority")
        .eq("medical_officer_id", doctorId!)
        .eq("appointment_date", today)
        .neq("status", "cancelled");

      const { data: pendingApts } = await supabase
        .from("appointments")
        .select("id")
        .eq("medical_officer_id", doctorId!)
        .eq("status", "pending");

      const { data: allPatients } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("medical_officer_id", doctorId!);

      const uniquePatients = new Set(allPatients?.map(a => a.patient_id) || []);
      const highPriorityCount = todayApts?.filter(a => a.health_priority === "high").length || 0;

      return {
        todayCount: todayApts?.length || 0,
        pendingCount: pendingApts?.length || 0,
        totalPatients: uniquePatients.size,
        urgentAlerts: highPriorityCount,
      };
    },
    enabled: !!doctorId,
  });

  const stats = [
    { label: "Today's Appointments", value: String(appointmentStats?.todayCount || 0), icon: Calendar, color: "text-primary", action: () => { /* scroll to appointments section below */ const el = document.getElementById('doctor-appointments-section'); el?.scrollIntoView({ behavior: 'smooth' }); } },
    { label: "Pending Approvals", value: String(appointmentStats?.pendingCount || 0), icon: FileCheck, color: "text-amber-500", action: () => { const el = document.getElementById('doctor-appointments-section'); el?.scrollIntoView({ behavior: 'smooth' }); } },
    { label: "Active Patients", value: String(appointmentStats?.totalPatients || 0), icon: Users, color: "text-secondary", action: () => setDashboardSubTab("health-dashboard") },
    { label: "High Priority", value: String(appointmentStats?.urgentAlerts || 0), icon: AlertTriangle, color: "text-destructive", action: () => navigate("/medical-leave") },
  ];

  useEffect(() => {
    if (!roleLoading && !user) {
      navigate('/auth');
    }
  }, [user, roleLoading, navigate]);

  useEffect(() => {
    if (doctorId) {
      fetchDoctorProfile();
    }
  }, [doctorId]);

  const fetchDoctorProfile = async () => {
    try {
      const { data } = await supabase
        .from('medical_officers')
        .select('*')
        .eq('id', doctorId)
        .maybeSingle();

      if (data) {
        setDoctorProfile({
          name: data.name,
          designation: data.designation,
          qualification: data.qualification,
          email: data.email,
          phoneOffice: data.phone_office,
          phoneMobile: data.phone_mobile,
          isSenior: data.is_senior,
        });
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {doctorProfile?.name || 'Doctor'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {doctorProfile?.designation || 'Medical Officer'} • {doctorProfile?.qualification || ''}
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex items-center gap-2">
              <Siren className="w-4 h-4" />
              Emergency
            </TabsTrigger>
            <TabsTrigger value="medical-leave" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Medical Leave
            </TabsTrigger>
            <TabsTrigger value="student-search" className="flex items-center gap-2">
              <UserSearch className="w-4 h-4" />
              Records
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            {/* Sub-tabs: My Dashboard & Health Dashboard */}
            <div className="mb-6">
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setDashboardSubTab("my-dashboard")}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    dashboardSubTab === "my-dashboard"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  My Dashboard
                </button>
                <button
                  onClick={() => setDashboardSubTab("health-dashboard")}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    dashboardSubTab === "health-dashboard"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <HeartPulse className="w-4 h-4" />
                  Health Dashboard
                </button>
              </div>
            </div>

            {dashboardSubTab === "my-dashboard" ? (
              <>
                {/* Treatment Overview Section */}
                <div className="mb-8">
                  <DoctorTreatmentOverview doctorId={doctorId} />
                </div>

                {/* Medical Leave Students Overview */}
                <div className="mb-8">
                  <MedicalLeaveStudentsOverview doctorId={doctorId} />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {stats.map((stat) => (
                    <Card
                      key={stat.label}
                      className="border cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                      onClick={stat.action}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                          </div>
                          <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Left Column - Appointments */}
                  <div className="lg:col-span-2" id="doctor-appointments-section">
                    {doctorId && <DoctorAppointmentsList doctorId={doctorId} />}
                  </div>

                  {/* Right Column - Quick Actions */}
                  <div className="space-y-6">
                    {/* Pending Follow-ups */}
                    <PendingFollowupsList doctorId={doctorId} />



                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start gap-2" asChild>
                          <Link to="/medical-leave">
                            <FileText className="w-4 h-4 text-primary" />
                            Issue Medical Leave
                          </Link>
                        </Button>
                        <ScheduleFollowupDialog
                          doctorId={doctorId}
                          trigger={
                            <Button variant="outline" className="w-full justify-start gap-2">
                              <Calendar className="w-4 h-4 text-secondary" />
                              Schedule Follow-up
                            </Button>
                          }
                        />
                        <IssueCertificateDialog
                          doctorId={doctorId}
                          doctorProfile={doctorProfile}
                          trigger={
                            <Button variant="outline" className="w-full justify-start gap-2">
                              <FileCheck className="w-4 h-4 text-muted-foreground" />
                              Issue Medical Certificate
                            </Button>
                          }
                        />
                      </CardContent>
                    </Card>

                    {/* Security Reminder */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Security Reminder</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Always verify patient identity before accessing or modifying medical records.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            ) : (
              <DoctorHealthOverview />
            )}
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="emergency">
            <EmergencyPage />
          </TabsContent>

          {/* Medical Leave Tab */}
          <TabsContent value="medical-leave">
            <MedicalLeaveTab />
          </TabsContent>

          {/* Student Search Tab */}
          <TabsContent value="student-search">
            <StudentSearchPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
