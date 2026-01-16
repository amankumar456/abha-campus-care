import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ChevronRight, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";

interface Appointment {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  date: Date;
  time: string;
  reason?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

interface UpcomingAppointmentsCardProps {
  appointments: Appointment[];
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

const getDateLabel = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
};

const getStatusColor = (status: string) => {
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

const UpcomingAppointmentsCard = ({
  appointments,
  onReschedule,
  onCancel
}: UpcomingAppointmentsCardProps) => {
  const upcomingCount = appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed').length;

  return (
    <Card className="h-full bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            Upcoming Appointments
          </CardTitle>
          {upcomingCount > 0 && (
            <Badge className="bg-blue-600">{upcomingCount}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointments.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">No upcoming appointments</p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/appointments">Book Now</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Featured next appointment */}
            {appointments[0] && (
              <div className={`p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 ${getStatusColor(appointments[0].status)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={appointments[0].status === 'confirmed' ? 'default' : 'outline'} className="text-xs">
                      {appointments[0].status.charAt(0).toUpperCase() + appointments[0].status.slice(1)}
                    </Badge>
                    <span className="text-xs font-medium text-primary">
                      {getDateLabel(appointments[0].date)}, {formatTime(appointments[0].time)}
                    </span>
                  </div>
                </div>
                <p className="font-semibold">{appointments[0].doctorName}</p>
                <p className="text-sm text-muted-foreground">{appointments[0].doctorSpecialty}</p>
                {appointments[0].reason && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Reason: {appointments[0].reason}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => onReschedule?.(appointments[0].id)}>
                    Reschedule
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => onCancel?.(appointments[0].id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Other upcoming appointments */}
            {appointments.slice(1, 3).map((apt) => (
              <div 
                key={apt.id} 
                className={`p-3 rounded-lg bg-muted/50 border-l-4 ${getStatusColor(apt.status)} hover:bg-muted transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{apt.doctorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDateLabel(apt.date)}, {formatTime(apt.time)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}

            <Button asChild variant="ghost" className="w-full text-primary hover:text-primary">
              <Link to="/my-appointments">
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

export default UpcomingAppointmentsCard;
