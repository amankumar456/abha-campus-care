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

interface TodayScheduleSlot {
  time: string;
  doctor: string;
  totalAppointments: number;
  pendingAppointments: number;
}

export default function DoctorHealthOverview() {
  const navigate = useNavigate();
  const { user, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleSlot[]>([]);
  const [searchRoll, setSearchRoll] = useState('');

  useEffect(() => {
    if (!roleLoading && user) {
      fetchDashboardData();
    }
  }, [roleLoading, user]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const [
        studentsResponse,
        todayVisitsResponse,
        followUpsResponse,
        recentHealthVisitsResponse,
        allVisitsResponse,
        todayAppointmentsResponse,
        recentCompletedAppointmentsResponse,
      ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('health_visits').select('id').gte('visit_date', today),
        supabase.from('health_visits').select('id').eq('follow_up_required', true).gte('follow_up_date', today),
        supabase
          .from('health_visits')
          .select(`id, visit_date, reason_category, students (roll_number, full_name)`)
          .order('visit_date', { ascending: false })
          .limit(5),
        supabase
          .from('health_visits')
          .select(`student_id, students (roll_number, full_name)`)
          .gte('visit_date', threeMonthsAgo.toISOString()),
        supabase
          .from('appointments')
          .select(`id, appointment_time, status, doctor_type, medical_officers (name), visiting_doctors (name, specialization)`)
          .eq('appointment_date', today)
          .neq('status', 'cancelled'),
        supabase
          .from('appointments')
          .select('id, appointment_date, appointment_time, status, doctor_type, patient_id')
          .gte('appointment_date', threeMonthsAgo.toISOString().split('T')[0])
          .eq('status', 'completed')
          .order('appointment_date', { ascending: false })
          .limit(200),
      ]);

      const queryErrors = [
        studentsResponse.error,
        todayVisitsResponse.error,
        followUpsResponse.error,
        recentHealthVisitsResponse.error,
        allVisitsResponse.error,
        todayAppointmentsResponse.error,
        recentCompletedAppointmentsResponse.error,
      ].filter(Boolean);

      if (queryErrors.length > 0) {
        throw queryErrors[0];
      }

      const completedAppointments = recentCompletedAppointmentsResponse.data || [];
      const patientUserIds = Array.from(
        new Set(completedAppointments.map((appointment) => appointment.patient_id).filter((id): id is string => Boolean(id)))
      );

      let studentByUserId = new Map<string, { roll_number: string; full_name: string }>();
      if (patientUserIds.length > 0) {
        const { data: appointmentStudents, error: studentsLookupError } = await supabase
          .from('students')
          .select('user_id, roll_number, full_name, updated_at')
          .in('user_id', patientUserIds)
          .order('updated_at', { ascending: false });

        if (studentsLookupError) {
          throw studentsLookupError;
        }

        studentByUserId = (appointmentStudents || []).reduce((acc, student) => {
          if (student.user_id && !acc.has(student.user_id)) {
            acc.set(student.user_id, {
              roll_number: student.roll_number,
              full_name: student.full_name,
            });
          }
          return acc;
        }, new Map<string, { roll_number: string; full_name: string }>());
      }

      const frequentVisitorMap = new Map<string, { student_id: string; roll_number: string; full_name: string; visit_count: number }>();

      (allVisitsResponse.data || []).forEach((visit: any) => {
        const rollNumber = visit.students?.roll_number;
        const fullName = visit.students?.full_name;
        if (!rollNumber || !fullName) return;

        const existing = frequentVisitorMap.get(rollNumber);
        if (existing) {
          existing.visit_count += 1;
        } else {
          frequentVisitorMap.set(rollNumber, {
            student_id: visit.student_id,
            roll_number: rollNumber,
            full_name: fullName,
            visit_count: 1,
          });
        }
      });

      completedAppointments.forEach((appointment) => {
        const student = studentByUserId.get(appointment.patient_id);
        if (!student) return;

        const existing = frequentVisitorMap.get(student.roll_number);
        if (existing) {
          existing.visit_count += 1;
        } else {
          frequentVisitorMap.set(student.roll_number, {
            student_id: appointment.patient_id,
            roll_number: student.roll_number,
            full_name: student.full_name,
            visit_count: 1,
          });
        }
      });

      const frequentVisitors = Array.from(frequentVisitorMap.values())
        .filter((student) => student.visit_count >= 3)
        .sort((a, b) => b.visit_count - a.visit_count);

      const fallbackRecentVisits: RecentVisit[] = completedAppointments
        .slice(0, 5)
        .map((appointment) => {
          const student = studentByUserId.get(appointment.patient_id);
          if (!student) return null;

          return {
            id: appointment.id,
            visit_date: `${appointment.appointment_date}T${appointment.appointment_time}`,
            reason_category: appointment.doctor_type || 'appointment',
            students: {
              roll_number: student.roll_number,
              full_name: student.full_name,
            },
          };
        })
        .filter((visit): visit is RecentVisit => visit !== null);

      const recentVisitsData = (recentHealthVisitsResponse.data as RecentVisit[] | null) || [];
      setRecentVisits(recentVisitsData.length > 0 ? recentVisitsData : fallbackRecentVisits);

      const todayAppointments = todayAppointmentsResponse.data || [];
      const todayScheduleMap = new Map<string, TodayScheduleSlot>();

      todayAppointments.forEach((appointment: any) => {
        const visitingDoctorName = appointment.visiting_doctors?.name;
        const specialization = appointment.visiting_doctors?.specialization;
        const medicalOfficerName = appointment.medical_officers?.name;

        const doctorName = visitingDoctorName
          ? `${visitingDoctorName}${specialization ? ` (${specialization})` : ''}`
          : medicalOfficerName || 'Health Centre Doctor';

        const key = `${appointment.appointment_time}-${doctorName}`;
        const existing = todayScheduleMap.get(key);

        if (existing) {
          existing.totalAppointments += 1;
          if (appointment.status === 'pending') existing.pendingAppointments += 1;
        } else {
          todayScheduleMap.set(key, {
            time: appointment.appointment_time,
            doctor: doctorName,
            totalAppointments: 1,
            pendingAppointments: appointment.status === 'pending' ? 1 : 0,
          });
        }
      });

      const todaysCompletedOrConfirmed = todayAppointments.filter(
        (appointment) => appointment.status === 'completed' || appointment.status === 'confirmed'
      ).length;

      setTodaySchedule(Array.from(todayScheduleMap.values()).sort((a, b) => a.time.localeCompare(b.time)));

      setStats({
        totalStudents: studentsResponse.count || 0,
        visitsToday: (todayVisitsResponse.data?.length || 0) + todaysCompletedOrConfirmed,
        pendingFollowUps: followUpsResponse.data?.length || 0,
        frequentVisitors,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const formatScheduleTime = (time: string) => {
    if (!time) return 'Time TBD';

    try {
      return format(new Date(`1970-01-01T${time}`), 'hh:mm a');
    } catch {
      return time;
    }
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
                (() => {
                  // Deduplicate: show only the latest visit per student
                  const latestPerStudent = new Map<string, typeof recentVisits[0]>();
                  for (const visit of recentVisits) {
                    const key = visit.students?.roll_number || visit.id;
                    if (!latestPerStudent.has(key)) {
                      latestPerStudent.set(key, visit);
                    }
                  }
                  return Array.from(latestPerStudent.values());
                })().map((visit) => (
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

      {/* Today's Appointment Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Today's Appointment Schedule
          </CardTitle>
          <CardDescription>Live schedule for {format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          {todaySchedule.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No appointments scheduled for today</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {todaySchedule.map((slot) => (
                <div
                  key={`${slot.time}-${slot.doctor}`}
                  className="p-4 rounded-lg border text-center hover:border-primary transition-colors"
                >
                  <p className="font-semibold text-lg">{formatScheduleTime(slot.time)}</p>
                  <p className="text-sm text-muted-foreground mb-2">{slot.doctor}</p>
                  <Badge variant="secondary">{slot.totalAppointments} booked</Badge>
                  {slot.pendingAppointments > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">{slot.pendingAppointments} pending</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
