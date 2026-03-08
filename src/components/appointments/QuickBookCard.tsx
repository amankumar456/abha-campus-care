import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Thermometer, Stethoscope, Brain, Activity, Syringe, HelpCircle, CheckCircle, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const QUICK_BOOK_REASONS = [
  { id: 'fever', label: 'Fever/Cold', icon: Thermometer, color: 'bg-red-100 text-red-600 hover:bg-red-200', reason: 'Fever/Cold' },
  { id: 'injury', label: 'Injury', icon: Activity, color: 'bg-orange-100 text-orange-600 hover:bg-orange-200', reason: 'Injury' },
  { id: 'mental', label: 'Mental Wellness', icon: Brain, color: 'bg-purple-100 text-purple-600 hover:bg-purple-200', reason: 'Mental Wellness' },
  { id: 'checkup', label: 'Check-up', icon: Stethoscope, color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', reason: 'General Check-up' },
  { id: 'vaccination', label: 'Vaccination', icon: Syringe, color: 'bg-green-100 text-green-600 hover:bg-green-200', reason: 'Vaccination' },
  { id: 'other', label: 'Other', icon: HelpCircle, color: 'bg-gray-100 text-gray-600 hover:bg-gray-200', reason: 'Other' },
];

interface Doctor {
  id: string;
  name: string;
  designation: string;
}

interface QuickBookCardProps {
  onQuickBook?: (reason: string) => void;
}

const QuickBookCard = ({ onQuickBook }: QuickBookCardProps) => {
  const { user } = useUserRole();
  const queryClient = useQueryClient();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [booking, setBooking] = useState(false);
  const [bookedReason, setBookedReason] = useState<string | null>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherReason, setOtherReason] = useState("");

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const currentTime = format(today, 'HH:mm');

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      const { data } = await supabase
        .from('medical_officers')
        .select('id, name, designation')
        .order('name');
      if (data) {
        setDoctors(data);
        if (data.length > 0) setSelectedDoctor(data[0].id);
      }
      setLoadingDoctors(false);
    };
    fetchDoctors();
  }, []);

  const handleQuickBook = async (reasonId: string, reasonLabel: string) => {
    if (!user) {
      toast.error("Please sign in to book an appointment");
      return;
    }
    if (!selectedDoctor) {
      toast.error("Please select a doctor");
      return;
    }

    // If "Other" is selected, show the input first
    if (reasonId === 'other' && !showOtherInput) {
      setShowOtherInput(true);
      return;
    }

    const finalReason = reasonId === 'other' 
      ? (otherReason.trim() ? `Other: ${otherReason.trim()}` : 'Other') 
      : reasonLabel;

    setBooking(true);
    setBookedReason(reasonId);

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          medical_officer_id: selectedDoctor,
          doctor_type: 'medical_officer',
          appointment_date: todayStr,
          appointment_time: currentTime,
          reason: finalReason,
          status: 'pending',
          health_priority: 'medium',
        });

      if (error) throw error;

      toast.success("Appointment booked!", {
        description: `${reasonLabel} — ${format(today, 'MMM d, yyyy')} at ${format(today, 'hh:mm a')}`,
      });

      // Invalidate relevant queries so dashboards refresh
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments-home'] });
      queryClient.invalidateQueries({ queryKey: ['student-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['student-home-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['student-home-stats'] });

      onQuickBook?.(reasonId);
    } catch (err: any) {
      console.error('Quick book error:', err);
      toast.error("Failed to book appointment", { description: err.message });
    } finally {
      setBooking(false);
      setShowOtherInput(false);
      setOtherReason("");
      setTimeout(() => setBookedReason(null), 2000);
    }
  };

  const selectedDoctorInfo = doctors.find(d => d.id === selectedDoctor);

  return (
    <Card className="h-full bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Plus className="w-5 h-5 text-green-600" />
          </div>
          Quick Book
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto-filled date & time */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{format(today, 'EEEE, MMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium">{format(today, 'hh:mm a')}</span>
          </div>
        </div>

        {/* Doctor selection */}
        <div className="space-y-2">
          <Label className="text-sm">Select Doctor</Label>
          {loadingDoctors ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading doctors...
            </div>
          ) : (
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name} — {doc.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Quick Book Buttons */}
        <div className="pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Tap to book instantly
          </p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_BOOK_REASONS.map((reason) => (
              <Button
                key={reason.id}
                variant="ghost"
                className={cn(
                  "flex flex-col h-auto py-3 px-2 relative",
                  reason.color,
                  bookedReason === reason.id && "ring-2 ring-green-500"
                )}
                disabled={booking || !selectedDoctor}
                onClick={() => handleQuickBook(reason.id, reason.reason)}
              >
                {booking && bookedReason === reason.id ? (
                  <Loader2 className="w-5 h-5 mb-1 animate-spin" />
                ) : bookedReason === reason.id ? (
                  <CheckCircle className="w-5 h-5 mb-1 text-green-600" />
                ) : (
                  <reason.icon className="w-5 h-5 mb-1" />
                )}
                <span className="text-xs font-medium">{reason.label}</span>
              </Button>
            ))}
          </div>

          {/* Other reason input */}
          {showOtherInput && (
            <div className="mt-3 p-3 rounded-lg border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Describe your reason</Label>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => { setShowOtherInput(false); setOtherReason(""); }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <Input
                placeholder="e.g., Skin rash, headache, etc. (optional)"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank and the doctor will update the reason during your visit.
              </p>
              <Button
                size="sm"
                className="w-full"
                disabled={booking || !selectedDoctor}
                onClick={() => handleQuickBook('other', 'Other')}
              >
                {booking ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Book Appointment
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickBookCard;
