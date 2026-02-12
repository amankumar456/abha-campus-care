import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, Calendar, AlertTriangle, Activity, Plus, Search
} from 'lucide-react';
import { format } from 'date-fns';
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

const DUMMY_SLOTS = [
  { time: '09:00 AM', doctor: 'Dr. Rajesh Kumar', available: 3 },
  { time: '10:00 AM', doctor: 'Dr. Priya Sharma', available: 2 },
  { time: '11:00 AM', doctor: 'Dr. Suresh Menon (Ortho)', available: 5 },
  { time: '02:00 PM', doctor: 'Dr. Anil Reddy', available: 4 },
  { time: '03:00 PM', doctor: 'Dr. Lakshmi Devi (Derma)', available: 1 },
];

const DUMMY_MENTOR_RECENT_VISITS = [
  { 
    id: '1', visit_date: '2026-01-18T10:30:00', reason_category: 'medical_illness',
    reason_notes: 'High fever (102°F) with cold symptoms for 3 days', diagnosis: 'Viral infection',
    prescription: 'Paracetamol 500mg, Cetirizine, Rest for 3 days', follow_up_required: true,
    follow_up_date: '2026-01-25',
    students: { roll_number: '22EI1001', full_name: 'Priya Sharma', email: 'priya.22ei1001@student.nitw.ac.in', phone: '+91 9876543001' }
  },
  { 
    id: '2', visit_date: '2026-01-19T09:00:00', reason_category: 'mental_wellness',
    reason_notes: 'Academic stress and anxiety, difficulty sleeping', diagnosis: 'Mild anxiety disorder',
    prescription: 'Counseling session scheduled, relaxation techniques advised', follow_up_required: true,
    follow_up_date: '2026-01-26',
    students: { roll_number: '22EI1002', full_name: 'Arjun Kumar', email: 'arjun.22ei1002@student.nitw.ac.in', phone: '+91 9876543002' }
  },
  { 
    id: '3', visit_date: '2026-01-15T11:30:00', reason_category: 'injury',
    reason_notes: 'Ankle sprain during basketball practice', diagnosis: 'Grade 1 ankle sprain',
    prescription: 'Ice pack, compression bandage, avoid sports for 2 weeks', follow_up_required: false,
    follow_up_date: null,
    students: { roll_number: '22EI1003', full_name: 'Ananya Reddy', email: 'ananya.22ei1003@student.nitw.ac.in', phone: '+91 9876543003' }
  },
  { 
    id: '4', visit_date: '2026-01-20T15:00:00', reason_category: 'vaccination',
    reason_notes: 'COVID-19 booster dose administered', diagnosis: 'Vaccination completed',
    prescription: 'Monitor for side effects, paracetamol if fever occurs', follow_up_required: false,
    follow_up_date: null,
    students: { roll_number: '23EI1001', full_name: 'Vikash Singh', email: 'vikash.23ei1001@student.nitw.ac.in', phone: '+91 9876543004' }
  },
  { 
    id: '5', visit_date: '2026-01-17T16:30:00', reason_category: 'mental_wellness',
    reason_notes: 'Feeling overwhelmed with project deadlines', diagnosis: 'Situational stress',
    prescription: 'Time management counseling, breathing exercises', follow_up_required: true,
    follow_up_date: '2026-01-24',
    students: { roll_number: '23EI1002', full_name: 'Meera Patel', email: 'meera.23ei1002@student.nitw.ac.in', phone: '+91 9876543005' }
  }
];

const DUMMY_STUDENTS_NEEDING_ATTENTION = [
  { student_id: '1', roll_number: '22EI1002', full_name: 'Arjun Kumar', email: 'arjun.22ei1002@student.nitw.ac.in', phone: '+91 9876543002', batch: '2022', branch: 'Electronics & Instrumentation', visit_count: 5, primary_concern: 'Mental Wellness', last_visit: '2026-01-19', risk_level: 'high', notes: 'Multiple stress-related visits, recommend regular counseling' },
  { student_id: '2', roll_number: '23EI1002', full_name: 'Meera Patel', email: 'meera.23ei1002@student.nitw.ac.in', phone: '+91 9876543005', batch: '2023', branch: 'Electronics & Instrumentation', visit_count: 4, primary_concern: 'Mental Wellness', last_visit: '2026-01-17', risk_level: 'medium', notes: 'Academic pressure related stress, follow-up scheduled' },
  { student_id: '3', roll_number: '22EI1001', full_name: 'Priya Sharma', email: 'priya.22ei1001@student.nitw.ac.in', phone: '+91 9876543001', batch: '2022', branch: 'Electronics & Instrumentation', visit_count: 3, primary_concern: 'Recurring Illness', last_visit: '2026-01-18', risk_level: 'medium', notes: 'Frequent fever episodes, immunity check recommended' },
  { student_id: '4', roll_number: '22EI1003', full_name: 'Ananya Reddy', email: 'ananya.22ei1003@student.nitw.ac.in', phone: '+91 9876543003', batch: '2022', branch: 'Electronics & Instrumentation', visit_count: 3, primary_concern: 'Sports Injuries', last_visit: '2026-01-15', risk_level: 'low', notes: 'Active in sports, proper warm-up guidance needed' }
];

export default function DoctorHealthOverview() {
  const navigate = useNavigate();
  const { user, isDoctor, isMentor, loading: roleLoading, mentorId } = useUserRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRoll, setSearchRoll] = useState('');

  useEffect(() => {
    if (!roleLoading && user) {
      fetchDashboardData();
    }
  }, [roleLoading, user, mentorId]);

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
        .select(`id, visit_date, reason_category, students (roll_number, full_name)`)
        .order('visit_date', { ascending: false })
        .limit(5);

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: allVisits } = await supabase
        .from('health_visits')
        .select(`student_id, students (roll_number, full_name)`)
        .gte('visit_date', threeMonthsAgo.toISOString());

      const visitCounts = new Map<string, { roll_number: string; full_name: string; count: number }>();
      allVisits?.forEach((visit: any) => {
        if (visit.students) {
          const key = visit.student_id;
          const existing = visitCounts.get(key);
          if (existing) { existing.count++; } 
          else { visitCounts.set(key, { roll_number: visit.students.roll_number, full_name: visit.students.full_name, count: 1 }); }
        }
      });

      const frequentVisitors = Array.from(visitCounts.entries())
        .filter(([_, data]) => data.count >= 3)
        .map(([studentId, data]) => ({ student_id: studentId, roll_number: data.roll_number, full_name: data.full_name, visit_count: data.count }))
        .sort((a, b) => b.visit_count - a.visit_count);

      setStats({ totalStudents: studentCount || 0, visitsToday: todayVisits?.length || 0, pendingFollowUps: followUps?.length || 0, frequentVisitors });
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

  return (
    <div className="space-y-8">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Health Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overall Student Health Records & Analytics</p>
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
          <Button onClick={() => navigate('/new-visit')}>
            <Plus className="h-4 w-4 mr-2" />
            New Visit
          </Button>
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
            <p className="text-xs text-muted-foreground">In the system</p>
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

      {/* Recent Visits & Students Needing Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Visits
            </CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Students Needing Attention
            </CardTitle>
            <CardDescription>Students requiring attention based on health patterns</CardDescription>
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
  );
}
