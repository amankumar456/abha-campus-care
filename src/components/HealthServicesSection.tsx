import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  FileHeart, 
  Stethoscope, 
  ClipboardList, 
  UserCheck,
  FileText,
  ArrowRight,
  Clock,
  User,
  CheckCircle,
  Download,
  Eye,
  Printer,
  Activity,
  Shield,
  Syringe,
  Heart,
  Brain,
  Loader2,
  Pill
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";

const ServiceCard = ({ 
  icon: Icon, 
  title, 
  description, 
  color, 
  children,
  href 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  color: string;
  children?: React.ReactNode;
  href?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (href) {
    return (
      <Link to={href}>
        <Card className="h-full hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5">
              View Details
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="h-full hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5">
              View Details
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
              <Icon className="h-5 w-5" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
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

const HealthServicesSection = () => {
  const { user } = useUserRole();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [visitCount, setVisitCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRealData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRealData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch upcoming appointments
      const { data: aptData } = await supabase
        .from('appointments')
        .select(`
          id, appointment_date, appointment_time, reason, status,
          medical_officers(name, designation),
          visiting_doctors(name, specialization)
        `)
        .eq('patient_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .limit(4);

      setAppointments(aptData || []);

      // Get student id
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (student) {
        // Fetch recent visits
        const { data: visitData } = await supabase
          .from('health_visits')
          .select('id, visit_date, reason_category, reason_notes, diagnosis, prescription, follow_up_required, doctor_id')
          .eq('student_id', student.id)
          .order('visit_date', { ascending: false })
          .limit(4);

        if (visitData && visitData.length > 0) {
          const doctorIds = visitData.filter(v => v.doctor_id).map(v => v.doctor_id!);
          let doctorMap: Record<string, string> = {};
          if (doctorIds.length > 0) {
            const { data: docs } = await supabase.from('medical_officers').select('id, name').in('id', doctorIds);
            docs?.forEach(d => { doctorMap[d.id] = d.name; });
          }
          setVisits(visitData.map(v => ({
            ...v,
            doctor_name: v.doctor_id ? doctorMap[v.doctor_id] || 'Doctor' : 'Health Centre',
          })));
        } else {
          // Fallback: show completed appointments as visits
          const { data: completedAppts } = await supabase
            .from('appointments')
            .select('id, appointment_date, reason, medical_officers(name)')
            .eq('patient_id', user.id)
            .eq('status', 'completed')
            .order('appointment_date', { ascending: false })
            .limit(4);

          setVisits((completedAppts || []).map(a => ({
            id: a.id,
            visit_date: a.appointment_date,
            reason_category: 'routine_checkup',
            reason_notes: a.reason,
            diagnosis: null,
            prescription: null,
            follow_up_required: false,
            doctor_name: (a as any).medical_officers?.name || 'Doctor',
          })));
        }

        // Count total visits
        const { count: vCount } = await supabase
          .from('health_visits')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', student.id);
        setVisitCount(vCount || 0);

        // Count prescriptions
        const { count: pCount } = await supabase
          .from('prescriptions')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', student.id);
        setPrescriptionCount(pCount || 0);
      }
    } catch (error) {
      console.error('Error fetching health services data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20" id="health-services">
      <div className="container mx-auto px-4 bg-white/92 backdrop-blur-sm rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
            Health Services
          </span>
          <h2 className="section-title">Your Health Dashboard</h2>
          <p className="section-subtitle">
            Access all your health services, records, and appointments in one place
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Book Appointment */}
          <ServiceCard
            icon={Calendar}
            title="Book Appointment"
            description="Schedule OPD visits with doctors"
            color="bg-blue-100 text-blue-600"
            href="/appointments"
          >
            {null}
          </ServiceCard>

          {/* Health Records - Real Data */}
          <ServiceCard
            icon={FileHeart}
            title="Health Records"
            description="View your medical history"
            color="bg-rose-100 text-rose-600"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Your Records Summary</h4>
              {!user ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FileHeart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Sign in to view your health records</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <Stethoscope className="h-6 w-6 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold text-primary">{visitCount}</p>
                      <p className="text-xs font-medium">Health Visits</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <Pill className="h-6 w-6 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold text-primary">{prescriptionCount}</p>
                      <p className="text-xs font-medium">Prescriptions</p>
                    </div>
                  </div>
                  {visits.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Recent activity</p>
                      {visits.slice(0, 3).map(v => (
                        <div key={v.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                          <span className="font-medium truncate max-w-[180px]">
                            {v.reason_notes || formatReasonCategory(v.reason_category)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(v.visit_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/health-dashboard">View All Records</Link>
              </Button>
            </div>
          </ServiceCard>

          {/* Visit History - Real Data */}
          <ServiceCard
            icon={Stethoscope}
            title="Visit History"
            description="Track your health centre visits"
            color="bg-purple-100 text-purple-600"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Recent Visits</h4>
              {!user ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Sign in to view your visit history</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading...
                </div>
              ) : visits.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No visit history yet</p>
                </div>
              ) : (
                visits.map((visit) => (
                  <div key={visit.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {visit.reason_notes || formatReasonCategory(visit.reason_category)}
                        </p>
                        <p className="text-sm text-muted-foreground">{visit.doctor_name}</p>
                      </div>
                      <Badge variant="outline">
                        {format(new Date(visit.visit_date), 'MMM d, yyyy')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Diagnosis:</span>{' '}
                        {visit.diagnosis || 'Pending'}
                      </p>
                      {visit.follow_up_required && (
                        <Badge variant="secondary">Follow-up Required</Badge>
                      )}
                    </div>
                    {visit.prescription && (
                      <p className="text-xs text-muted-foreground mt-1">Rx: {visit.prescription}</p>
                    )}
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/health-dashboard">View All Visits</Link>
              </Button>
            </div>
          </ServiceCard>

          {/* My Appointments - Real Data */}
          <ServiceCard
            icon={ClipboardList}
            title="My Appointments"
            description="View upcoming appointments"
            color="bg-amber-100 text-amber-600"
          >
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold">Upcoming Appointments</h4>
              {!user ? (
                <div className="text-center py-6 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Sign in to view appointments</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading...
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No upcoming appointments</p>
                  <Button variant="link" asChild className="mt-2 text-xs">
                    <Link to="/appointments">Book one now →</Link>
                  </Button>
                </div>
              ) : (
                appointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 text-primary bg-primary/10 p-1.5 rounded-full" />
                      <div>
                        <p className="font-medium">
                          {apt.medical_officers?.name || apt.visiting_doctors?.name || 'Doctor'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.medical_officers?.designation || apt.visiting_doctors?.specialization || ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{format(new Date(apt.appointment_date), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(apt.appointment_time)}</p>
                      <Badge variant={apt.status === "confirmed" ? "default" : "secondary"} className="mt-1">
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
              <div className="flex gap-2">
                <Button className="flex-1" asChild>
                  <Link to="/appointments">Book New</Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/my-appointments">View All</Link>
                </Button>
              </div>
            </div>
          </ServiceCard>

          {/* Health Check-ups */}
          <ServiceCard
            icon={UserCheck}
            title="Health Check-ups"
            description="Preventive care programs"
            color="bg-green-100 text-green-600"
            href="/health-dashboard"
          >
            {null}
          </ServiceCard>

          {/* Go to Profile */}
          <ServiceCard
            icon={Shield}
            title="My Profile"
            description="Manage your health profile"
            color="bg-indigo-100 text-indigo-600"
            href="/student/profile"
          >
            {null}
          </ServiceCard>
        </div>
      </div>
    </section>
  );
};

export default HealthServicesSection;
