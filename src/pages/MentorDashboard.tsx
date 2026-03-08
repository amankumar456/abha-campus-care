import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import MenteeCard from "@/components/mentor/MenteeCard";
// MentorProfileCard removed - profile is now in /mentor/profile page
import RecentVisitsList from "@/components/mentor/RecentVisitsList";
import { 
  Users, 
  AlertCircle, 
  Activity,
  UserCheck,
  ArrowRight,
  Search,
  HeartPulse
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
  branch: string | null;
  year_of_study: string | null;
}

interface HealthVisit {
  id: string;
  visit_date: string;
  reason_category: string;
  student_id: string;
  follow_up_required?: boolean;
  follow_up_date?: string | null;
}

interface MentorProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  department: string;
}

export default function MentorDashboard() {
  const navigate = useNavigate();
  const { user, isMentor, loading: roleLoading, mentorId } = useUserRole();
  const [students, setStudents] = useState<Student[]>([]);
  const [recentVisits, setRecentVisits] = useState<HealthVisit[]>([]);
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentVisitCounts, setStudentVisitCounts] = useState<Record<string, number>>({});

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
        // Fetch mentor profile
        const { data: mentorData, error: mentorError } = await supabase
          .from('mentors')
          .select('id, name, email, phone, department')
          .eq('id', mentorId)
          .maybeSingle();

        if (mentorError) throw mentorError;
        setMentorProfile(mentorData);

        // Fetch students assigned to this mentor (by mentor_id, mentor_email, or mentor_name)
        let allStudents: Student[] = [];

        // Query by mentor_id
        const { data: byId } = await supabase
          .from('students')
          .select('id, full_name, roll_number, email, phone, program, batch, branch, year_of_study')
          .eq('mentor_id', mentorId)
          .order('full_name');
        
        allStudents = byId || [];

        // Also query by mentor_email if mentor has email
        if (mentorData?.email) {
          const { data: byEmail } = await supabase
            .from('students')
            .select('id, full_name, roll_number, email, phone, program, batch, branch, year_of_study')
            .eq('mentor_email', mentorData.email)
            .order('full_name');
          
          if (byEmail) {
            const existingIds = new Set(allStudents.map(s => s.id));
            byEmail.forEach(s => { if (!existingIds.has(s.id)) allStudents.push(s); });
          }
        }

        // Also query by mentor_name
        if (mentorData?.name) {
          const { data: byName } = await supabase
            .from('students')
            .select('id, full_name, roll_number, email, phone, program, batch, branch, year_of_study')
            .ilike('mentor_name', mentorData.name)
            .order('full_name');
          
          if (byName) {
            const existingIds = new Set(allStudents.map(s => s.id));
            byName.forEach(s => { if (!existingIds.has(s.id)) allStudents.push(s); });
          }
        }

        setStudents(allStudents);

        // Fetch recent health visits for assigned students
        if (allStudents.length > 0) {
          const studentIds = allStudents.map(s => s.id);
          const { data: visitsData, error: visitsError } = await supabase
            .from('health_visits')
            .select('id, visit_date, reason_category, student_id, follow_up_required, follow_up_date')
            .in('student_id', studentIds)
            .order('visit_date', { ascending: false })
            .limit(15);

          if (visitsError) throw visitsError;
          setRecentVisits(visitsData || []);

          // Calculate visit counts per student
          const counts: Record<string, number> = {};
          (visitsData || []).forEach(visit => {
            counts[visit.student_id] = (counts[visit.student_id] || 0) + 1;
          });
          setStudentVisitCounts(counts);
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

  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const wellnessVisitsCount = recentVisits.filter(v => v.reason_category === 'mental_wellness').length;
  const followUpRequiredCount = recentVisits.filter(v => v.follow_up_required).length;

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid md:grid-cols-4 gap-6">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
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
            {mentorProfile ? `Welcome, ${mentorProfile.name}` : 'Monitor your mentees\' health visits and wellbeing'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{recentVisits.length}</p>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <HeartPulse className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{wellnessVisitsCount}</p>
                  <p className="text-sm text-muted-foreground">Wellness Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{followUpRequiredCount}</p>
                  <p className="text-sm text-muted-foreground">Need Follow-up</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Mentees Section */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    My Mentees
                  </CardTitle>
                  <CardDescription>Students assigned to you with full contact details</CardDescription>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, roll number, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{searchQuery ? "No mentees match your search" : "No students assigned yet"}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <MenteeCard
                      key={student.id}
                      student={student}
                      visitCount={studentVisitCounts[student.id] || 0}
                      onViewProfile={() => navigate(`/student-profile/${student.roll_number}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Health Visits */}
          <RecentVisitsList visits={recentVisits} students={students} />
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
