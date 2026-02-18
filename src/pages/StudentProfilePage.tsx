import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  User, Mail, Phone, GraduationCap, Building2, Calendar, Users,
  Activity, AlertCircle, Settings, Bell, Shield, Heart,
  Droplets, Edit3, Save, X, CheckCircle, BookOpen, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileCompletionIndicator from '@/components/profile/ProfileCompletionIndicator';

interface StudentData {
  id: string;
  full_name: string;
  roll_number: string;
  email: string | null;
  phone: string | null;
  program: string;
  branch: string | null;
  batch: string;
  year_of_study: string | null;
  mentor_name: string | null;
  mentor_email: string | null;
  mentor_contact: string | null;
  mentors: { name: string; email: string | null; phone: string | null; department: string } | null;
}

interface StudentHealthProfile {
  blood_group: string | null;
  known_allergies: string | null;
  current_medications: string | null;
  has_previous_health_issues: boolean | null;
  previous_health_details: string | null;
  emergency_contact: string | null;
  emergency_relationship: string | null;
  father_name: string | null;
  father_contact: string | null;
  mother_name: string | null;
  mother_contact: string | null;
  covid_vaccination_status: string | null;
}

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'settings' ? 'settings' : 'profile';
  const { user, loading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [healthProfile, setHealthProfile] = useState<StudentHealthProfile | null>(null);
  const [healthStats, setHealthStats] = useState({ totalVisits: 0, thisMonthVisits: 0, pendingFollowups: 0, lastVisitDate: null as string | null });
  const [loading, setLoading] = useState(true);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Settings state
  const [notifAppointments, setNotifAppointments] = useState(true);
  const [notifFollowups, setNotifFollowups] = useState(true);
  const [notifLeave, setNotifLeave] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [language, setLanguage] = useState('en');
  const [privacyMentor, setPrivacyMentor] = useState(true);

  useEffect(() => {
    if (!roleLoading && !user) navigate('/auth');
  }, [user, roleLoading, navigate]);

  useEffect(() => {
    if (user && !roleLoading) fetchData();
  }, [user, roleLoading]);

  const fetchData = async () => {
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select(`
          id, full_name, roll_number, email, phone, program, branch, batch, year_of_study,
          mentor_name, mentor_email, mentor_contact,
          mentors ( name, email, phone, department )
        `)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (studentData) {
        setStudent(studentData as StudentData);
        setEditPhone(studentData.phone || '');
        setEditEmail(studentData.email || '');

        const [profileRes, visitsRes] = await Promise.all([
          supabase.from('student_profiles').select('*').eq('student_id', studentData.id).maybeSingle(),
          supabase.from('health_visits').select('id, visit_date, follow_up_required').eq('student_id', studentData.id).order('visit_date', { ascending: false }),
        ]);

        setHealthProfile(profileRes.data as StudentHealthProfile | null);

        const visits = visitsRes.data || [];
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        setHealthStats({
          totalVisits: visits.length,
          thisMonthVisits: visits.filter(v => new Date(v.visit_date) >= firstDayOfMonth).length,
          pendingFollowups: visits.filter(v => v.follow_up_required).length,
          lastVisitDate: visits[0]?.visit_date ? format(new Date(visits[0].visit_date), 'MMM d, yyyy') : null,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async () => {
    if (!student) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ phone: editPhone, email: editEmail })
        .eq('id', student.id);

      if (error) throw error;
      setStudent(prev => prev ? { ...prev, phone: editPhone, email: editEmail } : null);
      setIsEditing(false);
      toast({ title: 'Profile Updated', description: 'Your contact details have been saved.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const profileFields = student ? [
    { name: 'fullName', label: 'Full Name', filled: !!student.full_name, required: true },
    { name: 'rollNumber', label: 'Roll Number', filled: !!student.roll_number, required: true },
    { name: 'email', label: 'Email', filled: !!student.email, required: true },
    { name: 'phone', label: 'Phone', filled: !!student.phone, required: true },
    { name: 'program', label: 'Program', filled: !!student.program, required: true },
    { name: 'batch', label: 'Batch', filled: !!student.batch, required: true },
    { name: 'branch', label: 'Branch/Department', filled: !!student.branch, required: false },
    { name: 'yearOfStudy', label: 'Year of Study', filled: !!student.year_of_study, required: false },
    { name: 'mentorName', label: 'Mentor Name', filled: !!(student.mentors?.name || student.mentor_name), required: true },
  ] : [];

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  const mentorName = student?.mentors?.name || student?.mentor_name;
  const mentorEmail = student?.mentors?.email || student?.mentor_email;
  const mentorPhone = student?.mentors?.phone || student?.mentor_contact;
  const mentorDept = student?.mentors?.department;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your personal information and preferences</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/health-dashboard">← Dashboard</Link>
          </Button>
        </div>

        {/* Profile Hero */}
        <Card className="bg-gradient-to-br from-primary/5 via-primary/8 to-primary/12 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{student?.full_name || 'Student'}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="text-sm">
                    {student?.program}{student?.batch ? ` - ${student.batch}` : ''}
                  </Badge>
                  {student?.year_of_study && (
                    <Badge variant="outline">{student.year_of_study} Year</Badge>
                  )}
                  {student?.branch && (
                    <Badge variant="outline">{student.branch}</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-2">Roll No: <span className="font-semibold text-foreground">{student?.roll_number}</span></p>
              </div>
              {/* Health Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                <div className="p-3 rounded-lg bg-background/60 border text-center min-w-[80px]">
                  <p className="text-2xl font-bold text-foreground">{healthStats.totalVisits}</p>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                </div>
                <div className="p-3 rounded-lg bg-background/60 border text-center min-w-[80px]">
                  <p className="text-2xl font-bold text-foreground">{healthStats.thisMonthVisits}</p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
                {healthStats.pendingFollowups > 0 && (
                  <div className="col-span-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {healthStats.pendingFollowups} Pending Follow-up
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* ── PROFILE TAB ── */}
          <TabsContent value="profile" className="mt-4 space-y-4">
            {/* Profile Completion */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Profile Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileCompletionIndicator fields={profileFields} />
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/student/register">
                    <Edit3 className="w-3 h-3 mr-1" />
                    Update Full Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Personal Information
                  </CardTitle>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit3 className="w-3 h-3 mr-1" />Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveContact} disabled={saving}>
                        <Save className="w-3 h-3 mr-1" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditPhone(student?.phone || ''); setEditEmail(student?.email || ''); }}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Roll Number</p>
                      <p className="font-medium">{student?.roll_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Program / Batch</p>
                      <p className="font-medium">{student?.program} · {student?.batch}</p>
                    </div>
                  </div>
                  {student?.branch && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Branch / Department</p>
                        <p className="font-medium">{student.branch}</p>
                      </div>
                    </div>
                  )}
                  {student?.year_of_study && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Year of Study</p>
                        <p className="font-medium">Year {student.year_of_study}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email Address
                    </Label>
                    {isEditing ? (
                      <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="your@email.com" />
                    ) : (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium text-sm">{student?.email || <span className="text-muted-foreground italic">Not provided</span>}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone Number
                    </Label>
                    {isEditing ? (
                      <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+91 XXXXXXXXXX" />
                    ) : (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium text-sm">{student?.phone || <span className="text-muted-foreground italic">Not provided</span>}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Faculty Mentor */}
            {mentorName && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Faculty Mentor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-lg">{mentorName}</p>
                      {mentorDept && <p className="text-sm text-muted-foreground">{mentorDept}</p>}
                      <div className="mt-2 space-y-1">
                        {mentorEmail && (
                          <a href={`mailto:${mentorEmail}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                            <Mail className="w-3 h-3" />{mentorEmail}
                          </a>
                        )}
                        {mentorPhone && (
                          <a href={`tel:${mentorPhone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                            <Phone className="w-3 h-3" />{mentorPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medical Info */}
            {healthProfile && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="w-4 h-4 text-destructive" />
                    Medical Information
                  </CardTitle>
                  <CardDescription>Basic health data on record</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {healthProfile.blood_group && (
                      <div className="p-3 rounded-lg bg-destructive/5 border text-center">
                        <Droplets className="h-5 w-5 text-destructive mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Blood Group</p>
                        <p className="font-bold text-lg">{healthProfile.blood_group}</p>
                      </div>
                    )}
                    {healthProfile.covid_vaccination_status && (
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border text-center">
                        <Shield className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">COVID Vaccine</p>
                        <p className="font-medium text-sm">{healthProfile.covid_vaccination_status}</p>
                      </div>
                    )}
                    {healthProfile.emergency_contact && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border text-center">
                        <AlertCircle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Emergency</p>
                        <p className="font-medium text-sm truncate">{healthProfile.emergency_contact}</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-muted/50 border text-center">
                      <Activity className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Last Visit</p>
                      <p className="font-medium text-sm">{healthStats.lastVisitDate || '—'}</p>
                    </div>
                  </div>
                  {healthProfile.known_allergies && (
                    <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <p className="text-xs font-medium text-destructive mb-1">⚠ Known Allergies</p>
                      <p className="text-sm">{healthProfile.known_allergies}</p>
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link to="/student/register">Update Medical Info</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── SETTINGS TAB ── */}
          <TabsContent value="settings" className="mt-4 space-y-4">
            {/* Notification Preferences */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what updates you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Appointment Reminders', desc: 'Get reminded about upcoming appointments', value: notifAppointments, set: setNotifAppointments },
                  { label: 'Follow-up Alerts', desc: 'Alerts when a follow-up is scheduled', value: notifFollowups, set: setNotifFollowups },
                  { label: 'Medical Leave Updates', desc: 'Status changes on your leave applications', value: notifLeave, set: setNotifLeave },
                  { label: 'Email Notifications', desc: 'Receive notifications via email', value: notifEmail, set: setNotifEmail },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={item.value} onCheckedChange={item.set} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>Control who can view your health information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">Share health summary with Mentor</p>
                    <p className="text-xs text-muted-foreground">Allow your faculty mentor to view your health visit history</p>
                  </div>
                  <Switch checked={privacyMentor} onCheckedChange={setPrivacyMentor} />
                </div>
                <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Your medical details (diagnoses, prescriptions) are always confidential and only accessible to medical staff.
                </div>
              </CardContent>
            </Card>

            {/* Language & Display */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  Display Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Language</p>
                    <p className="text-xs text-muted-foreground">Select your preferred language</p>
                  </div>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="te">Telugu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/student/register">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Update Full Registration Profile
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/my-appointments">
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Appointments
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/medical-leave">
                    <FileText className="w-4 h-4 mr-2" />
                    Medical Leave Applications
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
