import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, isToday } from "date-fns";
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Plus,
  XCircle,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface Appointment {
  id: string;
  doctor_type: string;
  medical_officer_id: string | null;
  visiting_doctor_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string | null;
  created_at: string;
  medical_officers?: {
    name: string;
    designation: string;
  } | null;
  visiting_doctors?: {
    name: string;
    specialization: string;
  } | null;
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':
      return <Badge className="bg-success text-success-foreground">Confirmed</Badge>;
    case 'pending':
      return <Badge variant="outline" className="border-warning text-warning">Pending</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function MyAppointments() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['my-appointments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          medical_officers(name, designation),
          visiting_doctors(name, specialization)
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user
  });

  const cancelAppointment = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const upcomingAppointments = appointments?.filter(
    a => a.status !== 'cancelled' && a.status !== 'completed' && !isPast(new Date(`${a.appointment_date}T${a.appointment_time}`))
  ) || [];

  const pastAppointments = appointments?.filter(
    a => a.status === 'completed' || (a.status !== 'cancelled' && isPast(new Date(`${a.appointment_date}T${a.appointment_time}`)))
  ) || [];

  const cancelledAppointments = appointments?.filter(a => a.status === 'cancelled') || [];

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <Calendar className="w-12 h-12 mx-auto text-primary mb-4" />
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to view your appointments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/auth">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const renderAppointmentCard = (appointment: Appointment, showCancel = true) => {
    const doctorName = appointment.medical_officers?.name || appointment.visiting_doctors?.name;
    const doctorInfo = appointment.medical_officers?.designation || appointment.visiting_doctors?.specialization;
    const appointmentDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const canCancel = showCancel && appointment.status !== 'cancelled' && !isPast(appointmentDate);

    return (
      <Card key={appointment.id} className="card-feature">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                appointment.doctor_type === 'medical_officer' ? 'bg-primary/10' : 'bg-secondary/10'
              }`}>
                {appointment.doctor_type === 'medical_officer' 
                  ? <User className="w-6 h-6 text-primary" />
                  : <Stethoscope className="w-6 h-6 text-secondary" />
                }
              </div>
              <div>
                <h3 className="font-semibold">{doctorName}</h3>
                <p className="text-sm text-muted-foreground">{doctorInfo}</p>
              </div>
            </div>
            {getStatusBadge(appointment.status)}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{format(new Date(appointment.appointment_date), 'EEE, MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{formatTime(appointment.appointment_time)}</span>
            </div>
          </div>

          {appointment.reason && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Reason:</strong> {appointment.reason}
              </p>
            </div>
          )}

          {isToday(new Date(appointment.appointment_date)) && appointment.status !== 'cancelled' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-success">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Today's Appointment</span>
            </div>
          )}

          {canCancel && (
            <div className="mt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Appointment
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this appointment with {doctorName} on{' '}
                      {format(new Date(appointment.appointment_date), 'MMMM d, yyyy')} at{' '}
                      {formatTime(appointment.appointment_time)}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelAppointment.mutate(appointment.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Appointments</h1>
              <p className="text-muted-foreground">Manage and view your appointment history</p>
            </div>
            <Button asChild>
              <Link to="/appointments">
                <Plus className="w-4 h-4 mr-2" />
                Book New Appointment
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : appointments && appointments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Appointments Yet</h2>
                <p className="text-muted-foreground mb-6">
                  You haven't booked any appointments. Schedule your first visit today!
                </p>
                <Button asChild>
                  <Link to="/appointments">Book an Appointment</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Upcoming ({upcomingAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Past ({pastAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Cancelled ({cancelledAppointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                {upcomingAppointments.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <p className="text-muted-foreground">No upcoming appointments</p>
                      <Button asChild className="mt-4">
                        <Link to="/appointments">Book an Appointment</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {upcomingAppointments.map(appointment => renderAppointmentCard(appointment))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past">
                {pastAppointments.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <p className="text-muted-foreground">No past appointments</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastAppointments.map(appointment => renderAppointmentCard(appointment, false))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled">
                {cancelledAppointments.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <p className="text-muted-foreground">No cancelled appointments</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {cancelledAppointments.map(appointment => renderAppointmentCard(appointment, false))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
