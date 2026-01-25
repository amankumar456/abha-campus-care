import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isWeekend, isBefore, startOfToday } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, RefreshCw } from "lucide-react";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  currentDate: string;
  currentTime: string;
  doctorName: string;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00"
];

const formatTimeSlot = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

export default function RescheduleDialog({
  open,
  onOpenChange,
  appointmentId,
  currentDate,
  currentTime,
  doctorName,
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(currentDate)
  );
  const [selectedTime, setSelectedTime] = useState(currentTime);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reschedule = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime) {
        throw new Error("Please select a date and time");
      }

      const { error } = await supabase
        .from("appointments")
        .update({
          appointment_date: format(selectedDate, "yyyy-MM-dd"),
          appointment_time: selectedTime,
          status: "pending", // Reset to pending for re-approval
        })
        .eq("id", appointmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      toast({
        title: "Appointment Rescheduled",
        description: `Your appointment has been rescheduled to ${format(
          selectedDate!,
          "MMMM d, yyyy"
        )} at ${formatTimeSlot(selectedTime)}. Awaiting confirmation.`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Rescheduling Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfToday()) || isWeekend(date);
  };

  const hasChanges =
    selectedDate &&
    (format(selectedDate, "yyyy-MM-dd") !== currentDate ||
      selectedTime !== currentTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Reschedule Appointment
          </DialogTitle>
          <DialogDescription>
            Change the date and time for your appointment with{" "}
            <span className="font-medium text-foreground">{doctorName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Appointment Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              Current Schedule
            </p>
            <p className="font-medium">
              {format(new Date(currentDate), "EEEE, MMMM d, yyyy")} at{" "}
              {formatTimeSlot(currentTime)}
            </p>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Select New Date
            </Label>
            <div className="flex justify-center border rounded-lg p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                fromDate={addDays(new Date(), 1)}
                toDate={addDays(new Date(), 60)}
                className="pointer-events-auto"
              />
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select New Time
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {formatTimeSlot(slot)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Schedule Preview */}
          {hasChanges && selectedDate && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary mb-1">New Schedule</p>
              <p className="font-medium text-primary">
                {format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
                {formatTimeSlot(selectedTime)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => reschedule.mutate()}
            disabled={!hasChanges || reschedule.isPending}
          >
            {reschedule.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Rescheduling...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Confirm Reschedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
