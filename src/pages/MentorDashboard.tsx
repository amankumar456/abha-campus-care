import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  AlertCircle, 
  Calendar, 
  Activity,
  UserCheck,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  BookOpen
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  email: string | null;
  phone: string | null;
  program: string;
  batch: string;
}

interface HealthVisit {
  id: string;
  visit_date: string;
  reason_category: string;
  student_id: string;
}

export default function MentorDashboard() {
  const navigate = useNavigate();
  const { user, isMentor, loading: roleLoading, mentorId } = useUserRole();
  const [students, setStudents] = useState<Student[]>([]);
  const [recentVisits, setRecentVisits] = useState<HealthVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isMentor) {
      toast({
        title: "Access Denied",
        description: "You don't have mentor access.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [roleLoading, isMentor, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!mentorId) return;
      
      try {
        // Fetch students assigned to this mentor
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('mentor_id', mentorId);

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

        // Fetch recent health visits for assigned students
        if (studentsData && studentsData.length > 0) {
          const studentIds = studentsData.map(s => s.id);
          const { data: visitsData, error: visitsError } = await supabase
            .from('health_visits')
            .select('id, visit_date, reason_category, student_id')
            .in('student_id', studentIds)
            .order('visit_date', { ascending: false })
            .limit(10);

          if (visitsError) throw visitsError;
          setRecentVisits(visitsData || []);
        }
      } catch (error) {
        console.error('Error fetching mentor data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (mentorId) {
      fetchData();
    } else if (!roleLoading) {
      setLoading(false);
    }
  }, [mentorId, roleLoading]);

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      medical_illness: "Medical Illness",
      injury: "Injury",
      mental_wellness: "Mental Wellness",
      vaccination: "Vaccination",
      routine_checkup: "Routine Checkup",
      other: "Other",
    };
    return labels[reason] || reason;
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.full_name || "Unknown Student";
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid md:grid-cols-3 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mentor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your mentees' health visits and wellbeing
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-sm text-muted-foreground">Total Mentees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{recentVisits.length}</p>
                  <p className="text-sm text-muted-foreground">Recent Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {recentVisits.filter(v => v.reason_category === 'mental_wellness').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Wellness Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Assigned Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                My Mentees
              </CardTitle>
              <CardDescription>Students assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No students assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {student.program} - {student.batch}
                            </span>
                          </div>
                          {student.email && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </p>
                          )}
                          {student.phone && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {student.phone}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">{student.batch}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Health Visits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" />
                Recent Health Visits
              </CardTitle>
              <CardDescription>Latest health centre visits by your mentees</CardDescription>
            </CardHeader>
            <CardContent>
              {recentVisits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent visits</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{getStudentName(visit.student_id)}</p>
                          <Badge variant="secondary" className="mt-1">
                            {getReasonLabel(visit.reason_category)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(visit.visit_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => navigate("/health-dashboard")}>
                <Activity className="w-4 h-4 mr-2" />
                View Health Analytics
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/medical-team")}>
                <Users className="w-4 h-4 mr-2" />
                Contact Medical Team
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}