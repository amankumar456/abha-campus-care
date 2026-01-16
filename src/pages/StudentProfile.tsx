import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Calendar, Phone, Mail, GraduationCap, Activity, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import VisitPatternAnalysis from '@/components/health/VisitPatternAnalysis';

interface Student {
  id: string;
  roll_number: string;
  full_name: string;
  program: string;
  batch: string;
  email: string | null;
  phone: string | null;
  mentors: {
    name: string;
    department: string;
  } | null;
}

interface HealthVisit {
  id: string;
  visit_date: string;
  reason_category: string;
  reason_subcategory: string | null;
  reason_notes: string | null;
  diagnosis: string | null;
  prescription: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  medical_officers: {
    name: string;
    designation: string;
  } | null;
}

const StudentProfile = () => {
  const { rollNumber } = useParams<{ rollNumber: string }>();
  const navigate = useNavigate();
  const { user, isDoctor, isMentor, loading: roleLoading } = useUserRole();
  const [student, setStudent] = useState<Student | null>(null);
  const [visits, setVisits] = useState<HealthVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!roleLoading && !user) {
      navigate('/auth');
    }
  }, [user, roleLoading, navigate]);

  useEffect(() => {
    if (rollNumber && !roleLoading && user) {
      fetchStudentData();
    }
  }, [rollNumber, roleLoading, user]);

  const fetchStudentData = async () => {
    try {
      // Fetch student info
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          roll_number,
          full_name,
          program,
          batch,
          email,
          phone,
          mentors (
            name,
            department
          )
        `)
        .eq('roll_number', rollNumber)
        .single();

      if (studentError || !studentData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setStudent(studentData as Student);

      // Fetch health visits
      const { data: visitsData } = await supabase
        .from('health_visits')
        .select(`
          id,
          visit_date,
          reason_category,
          reason_subcategory,
          reason_notes,
          diagnosis,
          prescription,
          follow_up_required,
          follow_up_date,
          medical_officers (
            name,
            designation
          )
        `)
        .eq('student_id', studentData.id)
        .order('visit_date', { ascending: false });

      setVisits(visitsData as HealthVisit[] || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatReasonCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getReasonBadgeVariant = (category: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (category) {
      case 'medical_illness': return 'default';
      case 'injury': return 'destructive';
      case 'mental_wellness': return 'secondary';
      case 'vaccination': return 'outline';
      default: return 'secondary';
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Student Not Found</CardTitle>
            <CardDescription>
              No student found with roll number: {rollNumber}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/health-dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
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
              You don't have permission to view student health records.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-8 space-y-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/health-dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Student Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{student?.full_name}</CardTitle>
                  <CardDescription className="text-lg">{student?.roll_number}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                {visits.length} Total Visits
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Program</p>
                  <p className="font-medium">{student?.program}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Batch</p>
                  <p className="font-medium">{student?.batch}</p>
                </div>
              </div>
              {student?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-sm">{student.email}</p>
                  </div>
                </div>
              )}
              {student?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{student.phone}</p>
                  </div>
                </div>
              )}
            </div>
            {student?.mentors && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Assigned Mentor</p>
                <p className="font-medium">{student.mentors.name} ({student.mentors.department})</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Visit History and Analysis */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Visit History
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Visit Pattern Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Health Visit History</CardTitle>
                <CardDescription>
                  {isDoctor ? 'Complete visit records' : 'Limited view - detailed clinical notes hidden'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {visits.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No visit records found</p>
                ) : (
                  <div className="space-y-4">
                    {visits.map((visit) => (
                      <div key={visit.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getReasonBadgeVariant(visit.reason_category)}>
                                {formatReasonCategory(visit.reason_category)}
                              </Badge>
                              {visit.reason_subcategory && (
                                <span className="text-sm text-muted-foreground">
                                  - {visit.reason_subcategory}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(visit.visit_date), 'MMMM d, yyyy - h:mm a')}
                            </p>
                          </div>
                          <div className="text-right">
                            {visit.medical_officers && (
                              <p className="text-sm font-medium">{visit.medical_officers.name}</p>
                            )}
                            {visit.follow_up_required && (
                              <Badge variant="outline" className="mt-1">
                                Follow-up: {visit.follow_up_date ? format(new Date(visit.follow_up_date), 'MMM d') : 'Required'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Only show detailed info for doctors */}
                        {isDoctor && (
                          <>
                            {visit.reason_notes && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                                <p className="text-sm">{visit.reason_notes}</p>
                              </div>
                            )}
                            {visit.diagnosis && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Diagnosis</p>
                                <p className="text-sm">{visit.diagnosis}</p>
                              </div>
                            )}
                            {visit.prescription && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Prescription</p>
                                <p className="text-sm">{visit.prescription}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <VisitPatternAnalysis visits={visits} studentName={student?.full_name || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentProfile;
