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

// Dummy health records data
const DUMMY_HEALTH_RECORDS = [
  {
    id: '1',
    title: 'Annual Health Checkup Report',
    date: '2026-01-10',
    type: 'Medical Report',
    student: 'Rahul Sharma (21CS1001)',
    pdfUrl: '#'
  },
  {
    id: '2',
    title: 'Blood Test Results',
    date: '2026-01-08',
    type: 'Lab Report',
    student: 'Priya Patel (21EC2002)',
    pdfUrl: '#'
  },
  {
    id: '3',
    title: 'Vaccination Certificate - COVID-19',
    date: '2025-12-15',
    type: 'Certificate',
    student: 'Arun Kumar (22ME3003)',
    pdfUrl: '#'
  },
  {
    id: '4',
    title: 'Fitness Certificate for Sports',
    date: '2025-12-10',
    type: 'Certificate',
    student: 'Sneha Reddy (22CE4004)',
    pdfUrl: '#'
  },
  {
    id: '5',
    title: 'Mental Wellness Assessment',
    date: '2025-11-28',
    type: 'Assessment',
    student: 'Vikram Singh (23EE5005)',
    pdfUrl: '#'
  }
];

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

const HealthDashboard = () => {
  const navigate = useNavigate();
  const { user, isDoctor, isMentor, loading: roleLoading, mentorId } = useUserRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRoll, setSearchRoll] = useState('');

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
        // Student view - just set loading to false
        setLoading(false);
      }
    }
  }, [roleLoading, user, isDoctor, isMentor, mentorId]);

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

  const getRecordTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Medical Report': return 'bg-blue-100 text-blue-800';
      case 'Lab Report': return 'bg-purple-100 text-purple-800';
      case 'Certificate': return 'bg-green-100 text-green-800';
      case 'Assessment': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Health Records</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          {/* Recent Visits */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Visits</CardTitle>
              <CardDescription>Latest health centre visits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentVisits.length === 0 ? (
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
                )}
              </div>
            </CardContent>
          </Card>

          {/* Frequent Visitors Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Students Needing Attention
              </CardTitle>
              <CardDescription>Students with frequent health visits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.frequentVisitors.length === 0 ? (
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
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health Records Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Health Records & Documents
            </CardTitle>
            <CardDescription>Recent medical reports, certificates, and assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DUMMY_HEALTH_RECORDS.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{record.title}</p>
                      <p className="text-sm text-muted-foreground">{record.student}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecordTypeBadgeColor(record.type)}`}>
                      {record.type}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(record.date), 'MMM d, yyyy')}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
