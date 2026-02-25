import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundWrapper from "@/components/layout/BackgroundWrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  AlertCircle,
  Search,
  RefreshCw
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import RescheduleDialog from "@/components/appointments/RescheduleDialog";
import AddToCalendarDropdown from "@/components/appointments/AddToCalendarDropdown";

interface Appointment {
  id: string;
  doctor_type: string;
  medical_officer_id: string | null;
  visiting_doctor_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string | null;
  notes: string | null;
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
      return <Badge className="bg-green-600 text-white">Confirmed</Badge>;
    case 'pending':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">Pending</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    case 'completed':
      return <Badge className="bg-blue-600 text-white">Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getStatusBorderColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'border-l-green-500';
    case 'pending':
      return 'border-l-yellow-500';
    case 'completed':
      return 'border-l-blue-500';
    case 'cancelled':
      return 'border-l-gray-400';
    default:
      return 'border-l-gray-300';
  }
};

export default function MyAppointments() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
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

  const filterAppointments = (appointmentList: Appointment[]) => {
    return appointmentList.filter(a => {
      const doctorName = a.medical_officers?.name || a.visiting_doctors?.name || '';
      return doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (a.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    });
  };

  const sortAppointments = (filtered: Appointment[], direction: 'asc' | 'desc') => {
    const sorted = [...filtered];
    if (sortBy === 'date') {
      sorted.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`).getTime();
        const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`).getTime();
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (sortBy === 'doctor') {
      sorted.sort((a, b) => {
        const nameA = a.medical_officers?.name || a.visiting_doctors?.name || '';
        const nameB = b.medical_officers?.name || b.visiting_doctors?.name || '';
        return nameA.localeCompare(nameB);
      });
    }
    return sorted;
  };

  // Upcoming: nearest date first (ascending)
  const upcomingAppointments = sortAppointments(filterAppointments(
    appointments?.filter(
      a => a.status !== 'cancelled' && a.status !== 'completed' && !isPast(new Date(`${a.appointment_date}T23:59:59`))
    ) || []
  ), 'asc');

  // Past: most recent first (descending)
  const pastAppointments = sortAppointments(filterAppointments(
    appointments?.filter(
      a => a.status === 'completed' || (a.status !== 'cancelled' && isPast(new Date(`${a.appointment_date}T23:59:59`)))
    ) || []
  ), 'desc');

  const cancelledAppointments = sortAppointments(filterAppointments(
    appointments?.filter(a => a.status === 'cancelled') || []
  ), 'desc');

  const followUpAppointments = sortAppointments(filterAppointments(
    appointments?.filter(a => a.reason?.toLowerCase().includes('follow') && a.status !== 'cancelled') || []
  ), 'asc');

  if (!user) {
    return (
      <BackgroundWrapper>
        <Header />
        <main className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md mx-4 bg-white/95 backdrop-blur-sm shadow-xl">
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
      </BackgroundWrapper>
    );
  }

  const renderAppointmentCard = (appointment: Appointment, showCancel = true) => {
    const doctorName = appointment.medical_officers?.name || appointment.visiting_doctors?.name;
    const doctorInfo = appointment.medical_officers?.designation || appointment.visiting_doctors?.specialization;
    const appointmentDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const canCancel = showCancel && appointment.status !== 'cancelled' && !isPast(appointmentDate);
    const appointmentNumber = `STU${new Date(appointment.created_at).getFullYear()}-${appointment.id.slice(0, 3).toUpperCase()}`;

    return (
      <Card 
        key={appointment.id} 
        className={`bg-white/95 backdrop-blur-sm shadow-lg border-l-4 ${getStatusBorderColor(appointment.status)} hover:shadow-xl transition-all duration-200 hover:scale-[1.01]`}
      >
        <CardContent className="pt-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Stethoscope className="w-4 h-4" />
              <span className="font-mono">{appointmentNumber}</span>
            </div>
            {getStatusBadge(appointment.status)}
          </div>

          {/* Doctor Info */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              appointment.doctor_type === 'medical_officer' ? 'bg-primary/10' : 'bg-secondary/10'
            }`}>
              {appointment.doctor_type === 'medical_officer' 
                ? <User className="w-6 h-6 text-primary" />
                : <Stethoscope className="w-6 h-6 text-secondary" />
              }
            </div>
            <div>
              <h3 className="font-semibold text-[#1A202C]">{doctorName}</h3>
              <p className="text-sm text-[#4A5568]">{doctorInfo}</p>
            </div>
          </div>

          {/* Date/Time */}
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
              isToday(new Date(appointment.appointment_date)) 
                ? 'bg-green-100 text-green-700 font-medium' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <Calendar className="w-3 h-3" />
              {isToday(new Date(appointment.appointment_date)) 
                ? 'Today' 
                : format(new Date(appointment.appointment_date), 'EEE, MMM d, yyyy')
              }
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatTime(appointment.appointment_time)}
            </span>
          </div>

          {/* Reason */}
          {appointment.reason && (
            <div className="p-3 bg-muted/50 rounded-lg mb-3">
              <p className="text-sm text-[#4A5568]">
                <strong className="text-[#718096]">Reason:</strong> {appointment.reason}
              </p>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="p-3 bg-blue-50 rounded-lg mb-3">
              <p className="text-sm text-blue-800">
                <strong>Notes:</strong> {appointment.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {canCancel && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setRescheduleAppointment(appointment)}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reschedule
              </Button>
            )}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel
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
            )}
            <AddToCalendarDropdown
              appointmentDate={appointment.appointment_date}
              appointmentTime={appointment.appointment_time}
              doctorName={doctorName || "Doctor"}
              reason={appointment.reason}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <BackgroundWrapper>
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#1A202C]">My Appointments</h1>
                <p className="text-[#4A5568]">Manage and view your appointment history</p>
              </div>
              <Button asChild size="lg" className="shadow-md">
                <Link to="/appointments">
                  <Plus className="w-4 h-4 mr-2" />
                  Book New Appointment
                </Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : appointments && appointments.length === 0 ? (
            <Card className="text-center py-12 bg-white/95 backdrop-blur-sm shadow-lg">
              <CardContent>
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-[#1A202C]">No Appointments Yet</h2>
                <p className="text-[#4A5568] mb-6">
                  You haven't booked any appointments. Schedule your first visit today!
                </p>
                <Button asChild size="lg">
                  <Link to="/appointments">Book an Appointment</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              {/* Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by doctor or reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date ⬇</SelectItem>
                      <SelectItem value="doctor">Doctor A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-6 bg-muted/50">
                  <TabsTrigger value="upcoming" className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Upcoming ({upcomingAppointments.length})
                  </TabsTrigger>
                  <TabsTrigger value="past" className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Past ({pastAppointments.length})
                  </TabsTrigger>
                  <TabsTrigger value="followups" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Follow-ups ({followUpAppointments.length})
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Cancelled ({cancelledAppointments.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                  {upcomingAppointments.length === 0 ? (
                    <Card className="text-center py-8 bg-muted/30">
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
                    <Card className="text-center py-8 bg-muted/30">
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

                <TabsContent value="followups">
                  {followUpAppointments.length === 0 ? (
                    <Card className="text-center py-8 bg-muted/30">
                      <CardContent>
                        <p className="text-muted-foreground">No follow-up appointments</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {followUpAppointments.map(appointment => renderAppointmentCard(appointment))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="cancelled">
                  {cancelledAppointments.length === 0 ? (
                    <Card className="text-center py-8 bg-muted/30">
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
            </div>
          )}
        </div>
      </main>
      
      {/* Reschedule Dialog */}
      {rescheduleAppointment && (
        <RescheduleDialog
          open={!!rescheduleAppointment}
          onOpenChange={(open) => !open && setRescheduleAppointment(null)}
          appointmentId={rescheduleAppointment.id}
          currentDate={rescheduleAppointment.appointment_date}
          currentTime={rescheduleAppointment.appointment_time}
          doctorName={
            rescheduleAppointment.medical_officers?.name ||
            rescheduleAppointment.visiting_doctors?.name ||
            "Doctor"
          }
        />
      )}
      
      <Footer />
    </BackgroundWrapper>
  );
}
