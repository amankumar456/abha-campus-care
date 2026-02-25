import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ChevronRight, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DoctorTodayPatientsCardProps {
  userId: string;
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
      return <Badge className="bg-green-600 text-xs">Confirmed</Badge>;
    case 'pending':
      return <Badge variant="outline" className="border-amber-400 text-amber-700 text-xs">Pending</Badge>;
    case 'completed':
      return <Badge variant="secondary" className="text-xs">Completed</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
};

const DoctorTodayPatientsCard = ({ userId }: DoctorTodayPatientsCardProps) => {
  const { data: todayAppointments } = useQuery({
    queryKey: ['doctor-today-patients', userId],
    queryFn: async () => {
      const { data: doctor } = await supabase
        .from('medical_officers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!doctor) return [];

      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_time, status, reason, patient_id')
        .eq('medical_officer_id', doctor.id)
        .eq('appointment_date', today)
        .neq('status', 'cancelled')
        .order('appointment_time', { ascending: true });

      if (error || !data) return [];

      // Fetch student names for each appointment
      const patientIds = [...new Set(data.map(a => a.patient_id))];
      const { data: students } = await supabase
        .from('students')
        .select('user_id, full_name, roll_number')
        .in('user_id', patientIds);

      const studentMap = new Map(students?.map(s => [s.user_id, s]) || []);

      return data.map(apt => ({
        id: apt.id,
        time: apt.appointment_time,
        status: apt.status,
        reason: apt.reason,
        patientName: studentMap.get(apt.patient_id)?.full_name || 'Unknown Patient',
        rollNumber: studentMap.get(apt.patient_id)?.roll_number || '',
      }));
    },
    enabled: !!userId,
  });

  const activeCount = todayAppointments?.filter(a => a.status !== 'completed').length || 0;

  return (
    <Card className="h-full bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            Today's Patients
          </CardTitle>
          {activeCount > 0 && (
            <Badge className="bg-blue-600">{activeCount}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!todayAppointments || todayAppointments.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">No patients scheduled today</p>
            <Button asChild size="sm" className="mt-3" variant="outline">
              <Link to="/doctor/dashboard">View Dashboard</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Featured next patient */}
            {todayAppointments[0] && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-l-primary">
                <div className="flex items-start justify-between mb-1">
                  {getStatusBadge(todayAppointments[0].status)}
                  <span className="text-xs font-medium text-primary flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(todayAppointments[0].time)}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {todayAppointments[0].patientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {todayAppointments[0].rollNumber}
                  </p>
                  {todayAppointments[0].reason && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {todayAppointments[0].reason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Other patients */}
            {todayAppointments.slice(1, 4).map((apt) => (
              <div
                key={apt.id}
                className="p-3 rounded-lg bg-muted/50 border-l-4 border-l-muted-foreground/20 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(apt.time)} • {apt.reason || 'General'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>
              </div>
            ))}

            {todayAppointments.length > 4 && (
              <p className="text-xs text-center text-muted-foreground">
                +{todayAppointments.length - 4} more patients
              </p>
            )}

            <Button asChild variant="ghost" className="w-full text-primary hover:text-primary">
              <Link to="/doctor/dashboard">
                View All Appointments
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorTodayPatientsCard;
