import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, Calendar, AlertTriangle, Activity, Plus, Search, FileText, Download, Eye,
  CalendarCheck, Heart, ClipboardList, Pill, Stethoscope, Clock, ArrowRight, User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StudentProfileCard from '@/components/profile/StudentProfileCard';
import HealthRecordsSection from '@/components/health/HealthRecordsSection';
import StudentMedicalLeaveSection from '@/components/medical-leave/StudentMedicalLeaveSection';

interface DashboardStats {
  totalStudents: number;
  visitsToday: number;
  pendingFollowUps: number;
  frequentVisitors: Array<{
    student_id: string;
    roll_number: string;
    full_name: string;
    visit_count: number;
  }>;
}

interface RecentVisit {
  id: string;
  visit_date: string;
  reason_category: string;
  students: {
    roll_number: string;
    full_name: string;
  };
}

interface StudentAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string;
  doctor_name: string | null;
}

interface StudentVisit {
  id: string;
  visit_date: string;
  reason_category: string;
  reason_notes: string | null;
  diagnosis: string | null;
  prescription: string | null;
  doctor_name: string | null;
}

interface MentorVisit {
  id: string;
  visit_date: string;
  reason_category: string;
  reason_notes: string | null;
  diagnosis: string | null;
  prescription: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  student_name: string;
  student_roll: string;
  student_email: string | null;
  student_phone: string | null;
}

interface AttentionStudent {
  student_id: string;
  roll_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  batch: string;
  branch: string | null;
  visit_count: number;
  primary_concern: string;
  last_visit: string;
  risk_level: 'high' | 'medium' | 'low';
}

const HealthDashboard = () => {
  const navigate = useNavigate();
  const { user, isDoctor, isMentor, loading: roleLoading, mentorId } = useUserRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRoll, setSearchRoll] = useState('');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [studentHealthStats, setStudentHealthStats] = useState<any>(null);

  // Real data states for student view
  const [studentAppointments, setStudentAppointments] = useState<StudentAppointment[]>([]);
  const [studentVisits, setStudentVisits] = useState<StudentVisit[]>([]);

  // Real data states for mentor view
  const [mentorRecentVisits, setMentorRecentVisits] = useState<MentorVisit[]>([]);
  const [studentsNeedingAttention, setStudentsNeedingAttention] = useState<AttentionStudent[]>([]);

  useEffect(() => {
    if (!roleLoading && !user) {
      navigate('/auth');
    }
  }, [user, roleLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && user) {
      if (isDoctor || isMentor) {
        fetchDashboardData();
        if (isMentor) {
          fetchMentorData();
        }
      } else {
        fetchStudentProfile();
        fetchStudentAppointments();
        fetchStudentVisits();
      }
    }
  }, [roleLoading, user, isDoctor, isMentor, mentorId]);

  const fetchStudentAppointments = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          reason,
          status,
          medical_officer_id,
          visiting_doctor_id
        `)
        .eq('patient_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .order('appointment_date', { ascending: true })
        .limit(5);

      if (data) {
        // Fetch doctor names
        const moIds = data.filter(a => a.medical_officer_id).map(a => a.medical_officer_id!);
        const vdIds = data.filter(a => a.visiting_doctor_id).map(a => a.visiting_doctor_id!);
        
        let moMap: Record<string, string> = {};
        let vdMap: Record<string, string> = {};

        if (moIds.length > 0) {
          const { data: mos } = await supabase.from('medical_officers').select('id, name').in('id', moIds);
          mos?.forEach(mo => { moMap[mo.id] = mo.name; });
        }
        if (vdIds.length > 0) {
          const { data: vds } = await supabase.from('visiting_doctors').select('id, name').in('id', vdIds);
          vds?.forEach(vd => { vdMap[vd.id] = vd.name; });
        }

        setStudentAppointments(data.map(a => ({
          id: a.id,
          appointment_date: a.appointment_date,
          appointment_time: a.appointment_time,
          reason: a.reason,
          status: a.status || 'pending',
          doctor_name: a.medical_officer_id ? moMap[a.medical_officer_id] || null : a.visiting_doctor_id ? vdMap[a.visiting_doctor_id] || null : null,
        })));
      }
    } catch (error) {
      console.error('Error fetching student appointments:', error);
    }
  };

  const fetchStudentVisits = async () => {
    if (!user) return;
    try {
      // Get student id first
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!student) return;

      const { data } = await supabase
        .from('health_visits')
        .select(`
          id,
          visit_date,
          reason_category,
          reason_notes,
          diagnosis,
          prescription,
          doctor_id
        `)
        .eq('student_id', student.id)
        .order('visit_date', { ascending: false })
        .limit(5);

      if (data) {
        const doctorIds = data.filter(v => v.doctor_id).map(v => v.doctor_id!);
        let doctorMap: Record<string, string> = {};
        if (doctorIds.length > 0) {
          const { data: docs } = await supabase.from('medical_officers').select('id, name').in('id', doctorIds);
          docs?.forEach(d => { doctorMap[d.id] = d.name; });
        }

        setStudentVisits(data.map(v => ({
          id: v.id,
          visit_date: v.visit_date,
          reason_category: v.reason_category,
          reason_notes: v.reason_notes,
          diagnosis: v.diagnosis,
          prescription: v.prescription,
          doctor_name: v.doctor_id ? doctorMap[v.doctor_id] || null : null,
        })));
      }
    } catch (error) {
      console.error('Error fetching student visits:', error);
    }
  };

  const fetchMentorData = async () => {
    if (!mentorId) return;
    try {
      // Get mentor's students
      const { data: mentorStudents } = await supabase
        .from('students')
        .select('id, full_name, roll_number, email, phone, batch, branch')
        .eq('mentor_id', mentorId);

      if (!mentorStudents || mentorStudents.length === 0) return;

      const studentIds = mentorStudents.map(s => s.id);
      const studentMap = new Map(mentorStudents.map(s => [s.id, s]));

      // Fetch recent health visits for mentees
      const { data: visits } = await supabase
        .from('health_visits')
        .select(`
          id,
          visit_date,
          reason_category,
          reason_notes,
          diagnosis,
          prescription,
          follow_up_required,
          follow_up_date,
          student_id
        `)
        .in('student_id', studentIds)
        .order('visit_date', { ascending: false })
        .limit(10);

      if (visits) {
        setMentorRecentVisits(visits.map(v => {
          const s = studentMap.get(v.student_id);
          return {
            id: v.id,
            visit_date: v.visit_date,
            reason_category: v.reason_category,
            reason_notes: v.reason_notes,
            diagnosis: v.diagnosis,
            prescription: v.prescription,
            follow_up_required: v.follow_up_required || false,
            follow_up_date: v.follow_up_date,
            student_name: s?.full_name || 'Unknown',
            student_roll: s?.roll_number || 'N/A',
            student_email: s?.email || null,
            student_phone: s?.phone || null,
          };
        }));
      }

      // Calculate students needing attention (3+ visits in last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: allVisits } = await supabase
        .from('health_visits')
        .select('id, student_id, visit_date, reason_category')
        .in('student_id', studentIds)
        .gte('visit_date', threeMonthsAgo.toISOString());

      if (allVisits) {
        const visitsByStudent = new Map<string, { count: number; reasons: string[]; lastVisit: string }>();
        allVisits.forEach(v => {
          const existing = visitsByStudent.get(v.student_id);
          if (existing) {
            existing.count++;
            existing.reasons.push(v.reason_category);
            if (v.visit_date > existing.lastVisit) existing.lastVisit = v.visit_date;
          } else {
            visitsByStudent.set(v.student_id, { count: 1, reasons: [v.reason_category], lastVisit: v.visit_date });
          }
        });

        const attention: AttentionStudent[] = [];
        visitsByStudent.forEach((data, studentId) => {
          if (data.count >= 2) {
            const s = studentMap.get(studentId);
            if (!s) return;
            // Determine primary concern from most frequent reason
            const reasonCounts: Record<string, number> = {};
            data.reasons.forEach(r => { reasonCounts[r] = (reasonCounts[r] || 0) + 1; });
            const primaryReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';
            
            attention.push({
              student_id: studentId,
              roll_number: s.roll_number,
              full_name: s.full_name,
              email: s.email,
              phone: s.phone,
              batch: s.batch,
              branch: s.branch,
              visit_count: data.count,
              primary_concern: formatReasonCategory(primaryReason),
              last_visit: data.lastVisit,
              risk_level: data.count >= 5 ? 'high' : data.count >= 3 ? 'medium' : 'low',
            });
          }
        });

        setStudentsNeedingAttention(attention.sort((a, b) => b.visit_count - a.visit_count));
      }
    } catch (error) {
      console.error('Error fetching mentor data:', error);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          roll_number,
          email,
          phone,
          program,
          branch,
          batch,
          year_of_study,
          mentor_name,
          mentor_email,
          mentor_contact,
          mentors (
            name,
            email,
            phone
          )
        `)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (studentData) {
        setStudentProfile({
          fullName: studentData.full_name,
          rollNumber: studentData.roll_number,
          email: studentData.email,
          phone: studentData.phone,
          program: studentData.program,
          branch: studentData.branch,
          batch: studentData.batch,
          yearOfStudy: studentData.year_of_study,
          mentorName: studentData.mentors?.name || studentData.mentor_name,
          mentorEmail: studentData.mentors?.email || studentData.mentor_email,
          mentorPhone: studentData.mentors?.phone || studentData.mentor_contact,
        });

        // Fetch health stats
        const currentMonth = new Date();
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

        const { data: visits } = await supabase
          .from('health_visits')
          .select('id, visit_date, follow_up_required')
          .eq('student_id', studentData.id)
          .order('visit_date', { ascending: false });

        const thisMonthVisits = visits?.filter(v => 
          new Date(v.visit_date) >= firstDayOfMonth
        ).length || 0;

        const pendingFollowups = visits?.filter(v => v.follow_up_required).length || 0;

        setStudentHealthStats({
          totalVisits: visits?.length || 0,
          thisMonthVisits,
          pendingFollowups,
          lastVisitDate: visits?.[0]?.visit_date 
            ? format(new Date(visits[0].visit_date), 'MMM d, yyyy')
            : null
        });
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: students, count: studentCount } = await supabase
        .from('students')
        .select('id, roll_number, full_name', { count: 'exact' });

      const today = new Date().toISOString().split('T')[0];
      const { data: todayVisits } = await supabase
        .from('health_visits')
        .select('id')
        .gte('visit_date', today);

      const { data: followUps } = await supabase
        .from('health_visits')
        .select('id')
        .eq('follow_up_required', true)
        .gte('follow_up_date', today);

      const { data: recent } = await supabase
        .from('health_visits')
        .select(`
          id,
          visit_date,
          reason_category,
          students (
            roll_number,
            full_name
          )
        `)
        .order('visit_date', { ascending: false })
        .limit(5);

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: allVisits } = await supabase
        .from('health_visits')
        .select(`
          student_id,
          students (
            roll_number,
            full_name
          )
        `)
        .gte('visit_date', threeMonthsAgo.toISOString());

      const visitCounts = new Map<string, { roll_number: string; full_name: string; count: number }>();
      allVisits?.forEach((visit: any) => {
        if (visit.students) {
          const key = visit.student_id;
          const existing = visitCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            visitCounts.set(key, {
              roll_number: visit.students.roll_number,
              full_name: visit.students.full_name,
              count: 1
            });
          }
        }
      });

      const frequentVisitors = Array.from(visitCounts.entries())
        .filter(([_, data]) => data.count >= 3)
        .map(([studentId, data]) => ({
          student_id: studentId,
          roll_number: data.roll_number,
          full_name: data.full_name,
          visit_count: data.count
        }))
        .sort((a, b) => b.visit_count - a.visit_count);

      setStats({
        totalStudents: studentCount || 0,
        visitsToday: todayVisits?.length || 0,
        pendingFollowUps: followUps?.length || 0,
        frequentVisitors
      });

      setRecentVisits(recent as RecentVisit[] || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchRoll.trim()) {
      navigate(`/student-profile/${searchRoll.trim()}`);
    }
  };

  const formatReasonCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Student Dashboard View
  if (!isDoctor && !isMentor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome, {getUserDisplayName()}!</h1>
              <p className="text-muted-foreground mt-1">
                Your personal health dashboard
              </p>
            </div>
            <Button asChild>
              <Link to="/appointments">
                <CalendarCheck className="h-4 w-4 mr-2" />
                Book Appointment
              </Link>
            </Button>
          </div>

          {/* Quick Stats for Students */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/my-appointments')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentAppointments.length}</div>
                <p className="text-xs text-muted-foreground">Scheduled visits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                <Heart className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentHealthStats?.totalVisits || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  const element = document.getElementById('health-services');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Health Records</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentVisits.length}</div>
                <p className="text-xs text-muted-foreground">Documents available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {studentAppointments.length > 0 ? (
                  <>
                    <div className="text-lg font-bold">
                      {format(new Date(studentAppointments[0].appointment_date), 'MMM d')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(studentAppointments[0].appointment_time)}
                      {studentAppointments[0].doctor_name ? ` - ${studentAppointments[0].doctor_name}` : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold text-muted-foreground">—</div>
                    <p className="text-xs text-muted-foreground">No upcoming</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Profile Card */}
            <div className="lg:col-span-1">
              {studentProfile ? (
                <StudentProfileCard 
                  profile={studentProfile}
                  healthStats={studentHealthStats}
                />
              ) : (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5 text-primary" />
                      My Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Complete your profile to see your details here</p>
                    <Button asChild>
                      <Link to="/student/register">Complete Profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Appointments & Visits */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5 text-primary" />
                        Upcoming Appointments
                      </CardTitle>
                      <CardDescription>Your scheduled visits</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/my-appointments">View All <ArrowRight className="h-4 w-4 ml-1" /></Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {studentAppointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No upcoming appointments</p>
                      <Button variant="link" asChild className="mt-2">
                        <Link to="/appointments">Book one now</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {studentAppointments.map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Stethoscope className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{apt.doctor_name || 'Doctor'}</p>
                              <p className="text-sm text-muted-foreground">{apt.reason || 'General Consultation'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{format(new Date(apt.appointment_date), 'MMM d, yyyy')}</p>
                            <p className="text-sm text-muted-foreground">{formatTime(apt.appointment_time)}</p>
                            <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'} className="mt-1">
                              {apt.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Visit History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Recent Visit History
                  </CardTitle>
                  <CardDescription>Your past health centre visits</CardDescription>
                </CardHeader>
                <CardContent>
                  {studentVisits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No visit history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {studentVisits.map((visit) => (
                        <div key={visit.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div>
                            <p className="font-medium">
                              {visit.reason_notes || formatReasonCategory(visit.reason_category)}
                            </p>
                            <p className="text-sm text-muted-foreground">{visit.doctor_name || 'Health Centre'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{format(new Date(visit.visit_date), 'MMM d, yyyy')}</p>
                            {visit.prescription && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Pill className="h-3 w-3" />
                                {visit.prescription.length > 40 ? visit.prescription.slice(0, 40) + '...' : visit.prescription}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Medical Leave Section */}
          {user && <StudentMedicalLeaveSection userId={user.id} />}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks you can do</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
                  <Link to="/appointments">
                    <CalendarCheck className="h-6 w-6" />
                    <span>Book Appointment</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
                  <Link to="/my-appointments">
                    <Calendar className="h-6 w-6" />
                    <span>My Appointments</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
                  <Link to="/medical-team">
                    <Stethoscope className="h-6 w-6" />
                    <span>Medical Team</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
                  <Link to="/student/register">
                    <User className="h-6 w-6" />
                    <span>Update Profile</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Doctor/Mentor Dashboard View
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Health Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {isDoctor ? 'Doctor Portal' : 'Mentor Portal'} - Student Health Records
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search by Roll Number"
                value={searchRoll}
                onChange={(e) => setSearchRoll(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-48"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {isDoctor && (
              <Button onClick={() => navigate('/new-visit')}>
                <Plus className="h-4 w-4 mr-2" />
                New Visit
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">
                {isMentor ? 'Assigned to you' : 'In the system'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Visits Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.visitsToday || 0}</div>
              <p className="text-xs text-muted-foreground">Health centre visits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{stats?.pendingFollowUps || 0}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Frequent Visitors</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.frequentVisitors.length || 0}</div>
              <p className="text-xs text-muted-foreground">3+ visits in 3 months</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Visits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Visits
              </CardTitle>
              <CardDescription>Latest health centre visits{isMentor ? ' by your mentees' : ''}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isMentor ? (
                  mentorRecentVisits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No recent visits by your mentees</p>
                    </div>
                  ) : (
                    mentorRecentVisits.map((visit) => (
                      <div
                        key={visit.id}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-foreground">{visit.student_name}</p>
                            <p className="text-sm text-muted-foreground">{visit.student_roll}</p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant="secondary"
                              className={
                                visit.reason_category === 'mental_wellness' 
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                                  : visit.reason_category === 'medical_illness'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : visit.reason_category === 'injury'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }
                            >
                              {formatReasonCategory(visit.reason_category)}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(visit.visit_date), 'MMM d, yyyy • h:mm a')}
                            </p>
                          </div>
                        </div>
                        
                        {(visit.reason_notes || visit.diagnosis || visit.prescription) && (
                          <div className="bg-muted/30 rounded-md p-3 space-y-2 text-sm">
                            {visit.reason_notes && (
                              <div>
                                <span className="text-muted-foreground">Complaint:</span>
                                <span className="ml-2 text-foreground">{visit.reason_notes}</span>
                              </div>
                            )}
                            {visit.diagnosis && (
                              <div>
                                <span className="text-muted-foreground">Diagnosis:</span>
                                <span className="ml-2 text-foreground">{visit.diagnosis}</span>
                              </div>
                            )}
                            {visit.prescription && (
                              <div>
                                <span className="text-muted-foreground">Prescription:</span>
                                <span className="ml-2 text-foreground">{visit.prescription}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-4 text-xs">
                            {visit.student_email && (
                              <a href={`mailto:${visit.student_email}`} className="text-primary hover:underline flex items-center gap-1">
                                Email
                              </a>
                            )}
                            {visit.student_phone && (
                              <a href={`tel:${visit.student_phone}`} className="text-primary hover:underline flex items-center gap-1">
                                Call
                              </a>
                            )}
                          </div>
                          {visit.follow_up_required ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-600">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Follow-up: {visit.follow_up_date ? format(new Date(visit.follow_up_date), 'MMM d') : 'TBD'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-600">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  recentVisits.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No recent visits</p>
                  ) : (
                    recentVisits.map((visit) => (
                      <div
                        key={visit.id}
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/student-profile/${visit.students?.roll_number}`)}
                      >
                        <div>
                          <p className="font-medium">{visit.students?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{visit.students?.roll_number}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {formatReasonCategory(visit.reason_category)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(visit.visit_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Students Needing Attention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Students Needing Attention
              </CardTitle>
              <CardDescription>Students requiring your attention based on health patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isMentor ? (
                  studentsNeedingAttention.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No students require attention currently</p>
                    </div>
                  ) : (
                    studentsNeedingAttention.map((student) => (
                      <div
                        key={student.student_id}
                        className={`p-4 rounded-lg border-l-4 ${
                          student.risk_level === 'high' 
                            ? 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10' 
                            : student.risk_level === 'medium'
                            ? 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10'
                            : 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{student.full_name}</p>
                              <Badge 
                                variant={student.risk_level === 'high' ? 'destructive' : student.risk_level === 'medium' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {student.risk_level === 'high' ? 'High Priority' : student.risk_level === 'medium' ? 'Medium' : 'Low'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{student.roll_number} • {student.batch}</p>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {student.visit_count} visits
                          </Badge>
                        </div>
                        
                        <div className="space-y-1.5 text-sm mb-3">
                          {student.branch && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Branch:</span>
                              <span className="text-foreground">{student.branch}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Primary Concern:</span>
                            <Badge variant="outline" className="text-xs">{student.primary_concern}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Last Visit:</span>
                            <span className="text-foreground">{format(new Date(student.last_visit), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs">
                          {student.email && (
                            <a href={`mailto:${student.email}`} className="text-primary hover:underline">
                              {student.email}
                            </a>
                          )}
                          {student.phone && (
                            <a href={`tel:${student.phone}`} className="text-primary hover:underline">
                              {student.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  stats?.frequentVisitors.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No alerts</p>
                  ) : (
                    stats?.frequentVisitors.slice(0, 5).map((student) => (
                      <div
                        key={student.student_id}
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/student-profile/${student.roll_number}`)}
                      >
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                        </div>
                        <Badge variant="destructive">
                          {student.visit_count} visits
                        </Badge>
                      </div>
                    ))
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health Records Section */}
        <HealthRecordsSection />
      </div>
      <Footer />
    </div>
  );
};

export default HealthDashboard;
