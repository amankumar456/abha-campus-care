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

// Dummy upcoming appointment slots
const DUMMY_SLOTS = [
  { time: '09:00 AM', doctor: 'Dr. Rajesh Kumar', available: 3 },
  { time: '10:00 AM', doctor: 'Dr. Priya Sharma', available: 2 },
  { time: '11:00 AM', doctor: 'Dr. Suresh Menon (Ortho)', available: 5 },
  { time: '02:00 PM', doctor: 'Dr. Anil Reddy', available: 4 },
  { time: '03:00 PM', doctor: 'Dr. Lakshmi Devi (Derma)', available: 1 },
];

// Dummy student appointments
const DUMMY_STUDENT_APPOINTMENTS = [
  { id: '1', date: '2026-01-20', time: '10:00 AM', doctor: 'Dr. Rajesh Kumar', type: 'General Checkup', status: 'confirmed' },
  { id: '2', date: '2026-01-25', time: '02:30 PM', doctor: 'Dr. Priya Sharma', type: 'Follow-up', status: 'pending' },
];

// Dummy student visits
const DUMMY_STUDENT_VISITS = [
  { id: '1', date: '2026-01-05', reason: 'Fever & Cold', doctor: 'Dr. Rajesh Kumar', prescription: 'Paracetamol, Rest' },
  { id: '2', date: '2025-12-15', reason: 'Routine Checkup', doctor: 'Dr. Priya Sharma', prescription: 'Vitamin supplements' },
  { id: '3', date: '2025-11-20', reason: 'Sports Injury', doctor: 'Dr. Suresh Menon', prescription: 'Physiotherapy' },
];

// Dummy mentor portal - recent visits with detailed info
const DUMMY_MENTOR_RECENT_VISITS = [
  { 
    id: '1', 
    visit_date: '2026-01-18T10:30:00', 
    reason_category: 'medical_illness',
    reason_notes: 'High fever (102°F) with cold symptoms for 3 days',
    diagnosis: 'Viral infection',
    prescription: 'Paracetamol 500mg, Cetirizine, Rest for 3 days',
    follow_up_required: true,
    follow_up_date: '2026-01-25',
    students: { roll_number: '22EI1001', full_name: 'Priya Sharma', email: 'priya.22ei1001@student.nitw.ac.in', phone: '+91 9876543001' }
  },
  { 
    id: '2', 
    visit_date: '2026-01-19T09:00:00', 
    reason_category: 'mental_wellness',
    reason_notes: 'Academic stress and anxiety, difficulty sleeping',
    diagnosis: 'Mild anxiety disorder',
    prescription: 'Counseling session scheduled, relaxation techniques advised',
    follow_up_required: true,
    follow_up_date: '2026-01-26',
    students: { roll_number: '22EI1002', full_name: 'Arjun Kumar', email: 'arjun.22ei1002@student.nitw.ac.in', phone: '+91 9876543002' }
  },
  { 
    id: '3', 
    visit_date: '2026-01-15T11:30:00', 
    reason_category: 'injury',
    reason_notes: 'Ankle sprain during basketball practice',
    diagnosis: 'Grade 1 ankle sprain',
    prescription: 'Ice pack, compression bandage, avoid sports for 2 weeks',
    follow_up_required: false,
    follow_up_date: null,
    students: { roll_number: '22EI1003', full_name: 'Ananya Reddy', email: 'ananya.22ei1003@student.nitw.ac.in', phone: '+91 9876543003' }
  },
  { 
    id: '4', 
    visit_date: '2026-01-20T15:00:00', 
    reason_category: 'vaccination',
    reason_notes: 'COVID-19 booster dose administered',
    diagnosis: 'Vaccination completed',
    prescription: 'Monitor for side effects, paracetamol if fever occurs',
    follow_up_required: false,
    follow_up_date: null,
    students: { roll_number: '23EI1001', full_name: 'Vikash Singh', email: 'vikash.23ei1001@student.nitw.ac.in', phone: '+91 9876543004' }
  },
  { 
    id: '5', 
    visit_date: '2026-01-17T16:30:00', 
    reason_category: 'mental_wellness',
    reason_notes: 'Feeling overwhelmed with project deadlines',
    diagnosis: 'Situational stress',
    prescription: 'Time management counseling, breathing exercises',
    follow_up_required: true,
    follow_up_date: '2026-01-24',
    students: { roll_number: '23EI1002', full_name: 'Meera Patel', email: 'meera.23ei1002@student.nitw.ac.in', phone: '+91 9876543005' }
  }
];

// Dummy mentor portal - students needing attention with detailed health patterns
const DUMMY_STUDENTS_NEEDING_ATTENTION = [
  { 
    student_id: '1', 
    roll_number: '22EI1002', 
    full_name: 'Arjun Kumar',
    email: 'arjun.22ei1002@student.nitw.ac.in',
    phone: '+91 9876543002',
    batch: '2022',
    branch: 'Electronics & Instrumentation',
    visit_count: 5, 
    primary_concern: 'Mental Wellness',
    last_visit: '2026-01-19',
    risk_level: 'high',
    notes: 'Multiple stress-related visits, recommend regular counseling'
  },
  { 
    student_id: '2', 
    roll_number: '23EI1002', 
    full_name: 'Meera Patel',
    email: 'meera.23ei1002@student.nitw.ac.in',
    phone: '+91 9876543005',
    batch: '2023',
    branch: 'Electronics & Instrumentation',
    visit_count: 4, 
    primary_concern: 'Mental Wellness',
    last_visit: '2026-01-17',
    risk_level: 'medium',
    notes: 'Academic pressure related stress, follow-up scheduled'
  },
  { 
    student_id: '3', 
    roll_number: '22EI1001', 
    full_name: 'Priya Sharma',
    email: 'priya.22ei1001@student.nitw.ac.in',
    phone: '+91 9876543001',
    batch: '2022',
    branch: 'Electronics & Instrumentation',
    visit_count: 3, 
    primary_concern: 'Recurring Illness',
    last_visit: '2026-01-18',
    risk_level: 'medium',
    notes: 'Frequent fever episodes, immunity check recommended'
  },
  { 
    student_id: '4', 
    roll_number: '22EI1003', 
    full_name: 'Ananya Reddy',
    email: 'ananya.22ei1003@student.nitw.ac.in',
    phone: '+91 9876543003',
    batch: '2022',
    branch: 'Electronics & Instrumentation',
    visit_count: 3, 
    primary_concern: 'Sports Injuries',
    last_visit: '2026-01-15',
    risk_level: 'low',
    notes: 'Active in sports, proper warm-up guidance needed'
  }
];

const HealthDashboard = () => {
  const navigate = useNavigate();
  const { user, isDoctor, isMentor, loading: roleLoading, mentorId } = useUserRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRoll, setSearchRoll] = useState('');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [studentHealthStats, setStudentHealthStats] = useState<any>(null);

  useEffect(() => {
    if (!roleLoading && !user) {
      navigate('/auth');
    }
  }, [user, roleLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && user) {
      if (isDoctor || isMentor) {
        fetchDashboardData();
      } else {
        // Student view - fetch student profile
        fetchStudentProfile();
      }
    }
  }, [roleLoading, user, isDoctor, isMentor, mentorId]);

  const fetchStudentProfile = async () => {
    try {
      // Fetch student profile
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
      // Fetch students count
      const { data: students, count: studentCount } = await supabase
        .from('students')
        .select('id, roll_number, full_name', { count: 'exact' });

      // Fetch today's visits
      const today = new Date().toISOString().split('T')[0];
      const { data: todayVisits } = await supabase
        .from('health_visits')
        .select('id')
        .gte('visit_date', today);

      // Fetch pending follow-ups
      const { data: followUps } = await supabase
        .from('health_visits')
        .select('id')
        .eq('follow_up_required', true)
        .gte('follow_up_date', today);

      // Fetch recent visits
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

      // Calculate frequent visitors
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
                <div className="text-2xl font-bold">{DUMMY_STUDENT_APPOINTMENTS.length}</div>
                <p className="text-xs text-muted-foreground">Scheduled visits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                <Heart className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{DUMMY_STUDENT_VISITS.length}</div>
                <p className="text-xs text-muted-foreground">This year</p>
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
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Documents available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">Jan 20</div>
                <p className="text-xs text-muted-foreground">10:00 AM - Dr. Rajesh</p>
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
                  <div className="space-y-4">
                    {DUMMY_STUDENT_APPOINTMENTS.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Stethoscope className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{apt.doctor}</p>
                            <p className="text-sm text-muted-foreground">{apt.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{format(new Date(apt.date), 'MMM d, yyyy')}</p>
                          <p className="text-sm text-muted-foreground">{apt.time}</p>
                          <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'} className="mt-1">
                            {apt.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <div className="space-y-4">
                    {DUMMY_STUDENT_VISITS.map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{visit.reason}</p>
                          <p className="text-sm text-muted-foreground">{visit.doctor}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{format(new Date(visit.date), 'MMM d, yyyy')}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Pill className="h-3 w-3" />
                            {visit.prescription}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

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

          {/* Today's Available Slots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Today's Available Appointment Slots
              </CardTitle>
              <CardDescription>Quick view of available slots for {format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {DUMMY_SLOTS.map((slot, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => navigate('/appointments')}
                  >
                    <p className="font-semibold text-lg">{slot.time}</p>
                    <p className="text-sm text-muted-foreground mb-2">{slot.doctor}</p>
                    <Badge variant={slot.available > 2 ? "secondary" : "destructive"}>
                      {slot.available} slots left
                    </Badge>
                  </div>
                ))}
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
          {/* Recent Visits - Enhanced for Mentor Portal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Visits
              </CardTitle>
              <CardDescription>Latest health centre visits by your mentees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isMentor ? (
                  DUMMY_MENTOR_RECENT_VISITS.map((visit) => (
                    <div
                      key={visit.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground">{visit.students.full_name}</p>
                          <p className="text-sm text-muted-foreground">{visit.students.roll_number}</p>
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
                      
                      <div className="bg-muted/30 rounded-md p-3 space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Complaint:</span>
                          <span className="ml-2 text-foreground">{visit.reason_notes}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Diagnosis:</span>
                          <span className="ml-2 text-foreground">{visit.diagnosis}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prescription:</span>
                          <span className="ml-2 text-foreground">{visit.prescription}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex items-center gap-4 text-xs">
                          <a href={`mailto:${visit.students.email}`} className="text-primary hover:underline flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email
                          </a>
                          <a href={`tel:${visit.students.phone}`} className="text-primary hover:underline flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call
                          </a>
                        </div>
                        {visit.follow_up_required ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Follow-up: {format(new Date(visit.follow_up_date!), 'MMM d')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-600">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
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

          {/* Students Needing Attention - Enhanced for Mentor Portal */}
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
                  DUMMY_STUDENTS_NEEDING_ATTENTION.map((student) => (
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
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Branch:</span>
                          <span className="text-foreground">{student.branch}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Primary Concern:</span>
                          <Badge variant="outline" className="text-xs">{student.primary_concern}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Last Visit:</span>
                          <span className="text-foreground">{format(new Date(student.last_visit), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded p-2 text-sm">
                        <span className="text-muted-foreground">Notes: </span>
                        <span className="text-foreground">{student.notes}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs">
                        <a href={`mailto:${student.email}`} className="text-primary hover:underline flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {student.email}
                        </a>
                        <a href={`tel:${student.phone}`} className="text-primary hover:underline flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {student.phone}
                        </a>
                      </div>
                    </div>
                  ))
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

        {/* Today's Available Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Available Appointment Slots
            </CardTitle>
            <CardDescription>Quick view of available slots for {format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {DUMMY_SLOTS.map((slot, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border text-center hover:border-primary transition-colors"
                >
                  <p className="font-semibold text-lg">{slot.time}</p>
                  <p className="text-sm text-muted-foreground mb-2">{slot.doctor}</p>
                  <Badge variant={slot.available > 2 ? "secondary" : "destructive"}>
                    {slot.available} slots left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default HealthDashboard;
