import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Stethoscope, Mail, Phone, Building2, Calendar, Shield, Edit,
  CheckCircle2, Settings, Bell, Clock, Activity, Save, ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DoctorProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, doctorId, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const defaultTab = searchParams.get("tab") === "settings" ? "settings" : "profile";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    leaveAlerts: true,
    autoApproveFollowups: false,
    defaultSlotDuration: "15",
  });

  useEffect(() => {
    if (!roleLoading && !user) navigate("/auth");
  }, [user, roleLoading, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["doctor-profile-full", doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_officers")
        .select("*")
        .eq("id", doctorId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!doctorId,
  });

  const { data: appointmentStats } = useQuery({
    queryKey: ["doctor-profile-stats", doctorId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: todayApts } = await supabase
        .from("appointments")
        .select("id")
        .eq("medical_officer_id", doctorId)
        .eq("appointment_date", today)
        .neq("status", "cancelled");
      const { data: pendingApts } = await supabase
        .from("appointments")
        .select("id")
        .eq("medical_officer_id", doctorId)
        .eq("status", "pending");
      const { data: allPatients } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("medical_officer_id", doctorId);
      const uniquePatients = new Set(allPatients?.map((a) => a.patient_id) || []);
      return {
        todayCount: todayApts?.length || 0,
        pendingCount: pendingApts?.length || 0,
        totalPatients: uniquePatients.size,
      };
    },
    enabled: !!doctorId,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    phone_office: "",
    phone_mobile_0: "",
  });

  useEffect(() => {
    if (profile) {
      setEditForm({
        phone_office: profile.phone_office || "",
        phone_mobile_0: profile.phone_mobile?.[0] || "",
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("medical_officers")
        .update({
          phone_office: editForm.phone_office || null,
          phone_mobile: editForm.phone_mobile_0 ? [editForm.phone_mobile_0] : null,
        })
        .eq("id", doctorId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully", {
        description: `Office: ${editForm.phone_office || '—'} | Mobile: ${editForm.phone_mobile_0 || '—'}`,
      });
      queryClient.invalidateQueries({ queryKey: ["doctor-profile-full"] });
      setIsEditing(false);
      setShowSaveConfirmation(true);
    },
    onError: () => toast.error("Failed to update profile"),
  });

  // Profile completion calculation
  const getCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.name, profile.designation, profile.qualification,
      profile.email, profile.phone_office, profile.phone_mobile?.length,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completion = getCompletion();

  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate("/doctor/dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-xs grid-cols-2 mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="space-y-6">
              {/* Header with completion */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <User className="h-5 w-5" /> My Profile
                    </CardTitle>
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={() => isEditing ? updateMutation.mutate() : setIsEditing(true)}
                    >
                      {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                      {isEditing ? "Save" : "Edit"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 ${completion === 100 ? "text-green-500" : "text-amber-500"}`} />
                      Profile Completion
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${completion === 100 ? "text-green-500" : "text-amber-500"}`}>
                        {completion}%
                      </span>
                      {completion === 100 && <Badge className="bg-green-500 text-white">Complete</Badge>}
                    </div>
                  </div>
                  <Progress value={completion} className="h-2 mt-1" />
                </CardHeader>
              </Card>

              {/* Save Confirmation */}
              {showSaveConfirmation && (
                <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-800 dark:text-green-200">Profile Saved Successfully</p>
                        <div className="mt-2 text-sm space-y-1 text-green-700 dark:text-green-300">
                          <p><strong>Name:</strong> {profile?.name}</p>
                          <p><strong>Designation:</strong> {profile?.designation}</p>
                          <p><strong>Email:</strong> {profile?.email || '—'}</p>
                          <p><strong>Office Phone:</strong> {editForm.phone_office || '—'}</p>
                          <p><strong>Mobile:</strong> {editForm.phone_mobile_0 || '—'}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-green-700 hover:text-green-900"
                          onClick={() => setShowSaveConfirmation(false)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        <Stethoscope className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-foreground">{profile?.name || "Doctor"}</h2>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline" className="text-primary border-primary">
                          {profile?.designation || "Medical Officer"}
                        </Badge>
                        {profile?.is_senior && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200">
                            <User className="h-3 w-3 mr-1" /> Senior
                          </Badge>
                        )}
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{profile?.qualification || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${profile?.email}`} className="text-primary hover:underline">
                            {profile?.email || "—"}
                          </a>
                        </div>
                        {isEditing ? (
                          <>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <Input
                                value={editForm.phone_office}
                                onChange={(e) => setEditForm((p) => ({ ...p, phone_office: e.target.value }))}
                                placeholder="Office phone"
                                className="h-8 w-48"
                              />
                              <span className="text-xs text-muted-foreground">(Office)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <Input
                                value={editForm.phone_mobile_0}
                                onChange={(e) => setEditForm((p) => ({ ...p, phone_mobile_0: e.target.value }))}
                                placeholder="Mobile phone"
                                className="h-8 w-48"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>{profile?.phone_office || "—"} (Office)</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{profile?.phone_mobile?.[0] || "—"}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Overview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Today's Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{appointmentStats?.todayCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Appointments</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{appointmentStats?.pendingCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{appointmentStats?.totalPatients || 0}</p>
                      <p className="text-xs text-muted-foreground">Patients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Health Centre */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Health Centre</p>
                    <p className="text-xs text-muted-foreground">NIT Warangal Health Centre • General OPD</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5" /> Notification Preferences
                  </CardTitle>
                  <CardDescription>Control how you receive alerts and updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive appointment updates via email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(v) => setSettings((s) => ({ ...s, emailNotifications: v }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">SMS Notifications</Label>
                      <p className="text-xs text-muted-foreground">Get urgent alerts via SMS</p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(v) => setSettings((s) => ({ ...s, smsNotifications: v }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Appointment Reminders</Label>
                      <p className="text-xs text-muted-foreground">Remind you 30 minutes before appointments</p>
                    </div>
                    <Switch
                      checked={settings.appointmentReminders}
                      onCheckedChange={(v) => setSettings((s) => ({ ...s, appointmentReminders: v }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Medical Leave Alerts</Label>
                      <p className="text-xs text-muted-foreground">Notify when students return from medical leave</p>
                    </div>
                    <Switch
                      checked={settings.leaveAlerts}
                      onCheckedChange={(v) => setSettings((s) => ({ ...s, leaveAlerts: v }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Appointment Settings
                  </CardTitle>
                  <CardDescription>Configure your consultation preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Default Slot Duration</Label>
                      <p className="text-xs text-muted-foreground">Time allocated per appointment</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.defaultSlotDuration}
                        onChange={(e) => setSettings((s) => ({ ...s, defaultSlotDuration: e.target.value }))}
                        className="w-20 h-8 text-center"
                        min="5"
                        max="60"
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Auto-approve Follow-ups</Label>
                      <p className="text-xs text-muted-foreground">Automatically confirm follow-up appointments</p>
                    </div>
                    <Switch
                      checked={settings.autoApproveFollowups}
                      onCheckedChange={(v) => setSettings((s) => ({ ...s, autoApproveFollowups: v }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  className="gap-2"
                  onClick={() => toast.success("Settings saved successfully")}
                >
                  <Save className="h-4 w-4" /> Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
