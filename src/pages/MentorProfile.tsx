import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, User, Phone, Mail, Building2, Users, Edit, Settings, Shield, Bell, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileCompletionIndicator from "@/components/profile/ProfileCompletionIndicator";

const DEPARTMENTS = [
  "Biotechnology", "BSc-BEd", "Chemical Engineering", "Chemistry",
  "Civil Engineering", "Computer Science & Engineering", "Electrical Engineering",
  "Electronics & Communication Engineering", "Mathematics", "Mechanical Engineering",
  "Metallurgical & Materials Engineering", "Physics", "School of Management",
];

const mentorProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number").optional().or(z.literal("")),
  department: z.string().min(1, "Please select a department"),
});

type MentorProfileForm = z.infer<typeof mentorProfileSchema>;

interface MentorData {
  name: string;
  email: string | null;
  phone: string | null;
  department: string;
}

export default function MentorProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  const { isMentor, loading: roleLoading, mentorId, user } = useUserRole();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [mentorData, setMentorData] = useState<MentorData | null>(null);
  const [menteeCount, setMenteeCount] = useState(0);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [healthAlerts, setHealthAlerts] = useState(true);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const form = useForm<MentorProfileForm>({
    resolver: zodResolver(mentorProfileSchema),
    defaultValues: { name: "", email: "", phone: "", department: "" },
    mode: "onChange",
  });

  const { register, setValue, watch, formState: { errors } } = form;

  useEffect(() => {
    if (!roleLoading && !isMentor) {
      toast({ title: "Access Denied", description: "You don't have mentor access.", variant: "destructive" });
      navigate("/auth");
    }
  }, [roleLoading, isMentor, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!mentorId) return;
      try {
        const [profileRes, countRes] = await Promise.all([
          supabase.from('mentors').select('name, email, phone, department').eq('id', mentorId).maybeSingle(),
          supabase.from('students').select('id', { count: 'exact', head: true }).eq('mentor_id', mentorId),
        ]);

        if (profileRes.error) throw profileRes.error;
        if (profileRes.data) {
          const d = profileRes.data;
          setMentorData(d);
          setValue("name", d.name || "");
          setValue("email", d.email || "");
          setValue("phone", d.phone || "");
          setValue("department", d.department || "");
        }
        setMenteeCount(countRes.count || 0);
      } catch (error) {
        console.error('Error fetching mentor profile:', error);
        toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (mentorId) fetchProfile();
    else if (!roleLoading) setLoading(false);
  }, [mentorId, roleLoading, setValue]);

  const onSubmit = async (data: MentorProfileForm) => {
    if (!mentorId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('mentors')
        .update({ name: data.name, email: data.email || null, phone: data.phone || null, department: data.department, updated_at: new Date().toISOString() })
        .eq('id', mentorId);
      if (error) throw error;
      setMentorData({ name: data.name, email: data.email || null, phone: data.phone || null, department: data.department });
      setIsEditing(false);
      setShowSaveConfirmation(true);
      toast({ title: "✅ Profile Saved Successfully", description: `Name: ${data.name} | Dept: ${data.department}` });
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const profileFields = [
    { name: "name", label: "Full Name", filled: !!mentorData?.name, required: true },
    { name: "department", label: "Department", filled: !!mentorData?.department, required: true },
    { name: "email", label: "Email", filled: !!mentorData?.email, required: false },
    { name: "phone", label: "Phone", filled: !!mentorData?.phone, required: false },
  ];

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/mentor/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Profile & Settings</h1>
        </div>

        {/* Profile Summary Card */}
        {mentorData && (
          <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <ProfileCompletionIndicator fields={profileFields} showMissingFields={false} className="mb-4" />
              <Separator className="mb-4" />
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-foreground">{mentorData.name}</h3>
                  <Badge variant="secondary" className="mt-1 mb-3">Faculty Mentor</Badge>
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{mentorData.department}</span>
                    </div>
                    {mentorData.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <a href={`mailto:${mentorData.email}`} className="text-primary hover:underline truncate">{mentorData.email}</a>
                      </div>
                    )}
                    {mentorData.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <a href={`tel:${mentorData.phone}`} className="text-primary hover:underline">{mentorData.phone}</a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{menteeCount} mentee{menteeCount !== 1 ? 's' : ''} assigned</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" /> Settings</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {/* Save Confirmation */}
            {showSaveConfirmation && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-800 dark:text-green-200">Profile Saved Successfully</p>
                      <div className="mt-2 text-sm space-y-1 text-green-700 dark:text-green-300">
                        <p><strong>Name:</strong> {mentorData?.name}</p>
                        <p><strong>Department:</strong> {mentorData?.department}</p>
                        <p><strong>Email:</strong> {mentorData?.email || '—'}</p>
                        <p><strong>Phone:</strong> {mentorData?.phone || '—'}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowSaveConfirmation(false)}>Dismiss</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Edit className="w-5 h-5 text-primary" /> Edit Profile</CardTitle>
                    <CardDescription>Update your mentor information visible to students</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="name" placeholder="Prof. / Dr. Full Name" disabled={!isEditing}
                        className={`pl-10 ${errors.name ? "border-destructive" : ""}`} {...register("name")} />
                    </div>
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <Label>Department *</Label>
                    <Select value={watch("department")} onValueChange={(v) => setValue("department", v, { shouldValidate: true })} disabled={!isEditing}>
                      <SelectTrigger className={`mt-1 ${errors.department ? "border-destructive" : ""}`}>
                        <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.department && <p className="text-sm text-destructive mt-1">{errors.department.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="mentor@nitw.ac.in" disabled={!isEditing}
                        className={`pl-10 ${errors.email ? "border-destructive" : ""}`} {...register("email")} />
                    </div>
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">Contact Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="phone" type="tel" placeholder="10-digit mobile number" disabled={!isEditing}
                        className={`pl-10 ${errors.phone ? "border-destructive" : ""}`} {...register("phone")} />
                    </div>
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsEditing(false);
                        if (mentorData) {
                          setValue("name", mentorData.name);
                          setValue("email", mentorData.email || "");
                          setValue("phone", mentorData.phone || "");
                          setValue("department", mentorData.department);
                        }
                      }}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting} className="gap-2">
                        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Profile</>}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Notification Preferences</CardTitle>
                <CardDescription>Control how you receive updates about your mentees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email alerts for mentee health visits</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Health Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when a mentee has 3+ visits in 3 months</p>
                  </div>
                  <Switch checked={healthAlerts} onCheckedChange={setHealthAlerts} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Medical Leave Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when a mentee is granted medical leave</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Account & Security</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Login Email</Label>
                    <p className="text-sm text-muted-foreground">{user?.email || "Not available"}</p>
                  </div>
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Change Password</Label>
                    <p className="text-sm text-muted-foreground">Update your login password</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={async () => {
                    if (user?.email) {
                      await supabase.auth.resetPasswordForEmail(user.email);
                      toast({ title: "Password Reset", description: "Check your email for a password reset link." });
                    }
                  }}>
                    Reset Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
