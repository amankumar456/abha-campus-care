import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar, AlertTriangle, Activity, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

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
    if (!roleLoading && user && (isDoctor || isMentor)) {
      fetchDashboardData();
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

      // Calculate frequent visitors (students with 3+ visits in last 3 months)
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

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isDoctor && !isMentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You don't have permission to access the Health Dashboard. 
              Please contact an administrator to get the appropriate role assigned.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
      </div>
    </div>
  );
};

export default HealthDashboard;
