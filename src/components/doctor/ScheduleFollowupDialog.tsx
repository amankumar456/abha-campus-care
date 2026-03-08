import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, User, Clock, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ScheduleFollowupDialogProps {
  trigger: React.ReactNode;
  doctorId: string | null;
}

// Dummy data for recent patients who may need follow-ups
const recentPatients = [
  {
    id: "p1",
    name: "Aman Kumar",
    rollNumber: "25EDI0022",
    lastVisit: "2026-01-28",
    condition: "Fever & Cold",
    priority: "medium",
  },
  {
    id: "p2",
    name: "Sneha Kumari",
    rollNumber: "25EDI0012",
    lastVisit: "2026-01-25",
    condition: "Sports Injury",
    priority: "high",
  },
  {
    id: "p3",
    name: "Micheal Alvi",
    rollNumber: "25EDI0004",
    lastVisit: "2026-01-20",
    condition: "Migraine",
    priority: "low",
  },
  {
    id: "p4",
    name: "Sudipta Maya",
    rollNumber: "25EDI0013",
    lastVisit: "2026-01-22",
    condition: "Anxiety Consultation",
    priority: "medium",
  },
];

const followupTypes = [
  { value: "routine", label: "Routine Check-up" },
  { value: "medication", label: "Medication Review" },
  { value: "test_results", label: "Test Results Discussion" },
  { value: "recovery", label: "Recovery Assessment" },
  { value: "referral", label: "Specialist Referral Follow-up" },
];

export default function ScheduleFollowupDialog({ trigger, doctorId }: ScheduleFollowupDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [patientSearch, setPatientSearch] = useState("");
  const [followupDate, setFollowupDate] = useState<Date>();
  const [followupTime, setFollowupTime] = useState("10:00");
  const [followupType, setFollowupType] = useState("");
  const [notes, setNotes] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch actual students from database
  const { data: students } = useQuery({
    queryKey: ["students-for-followup"],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("id, full_name, roll_number")
        .limit(10);
      return data || [];
    },
  });

  // Combine real students with dummy data for display
  const allPatients = [
    ...recentPatients,
    ...(students?.map((s) => ({
      id: s.id,
      name: s.full_name,
      rollNumber: s.roll_number,
      lastVisit: format(addDays(new Date(), -Math.floor(Math.random() * 14)), "yyyy-MM-dd"),
      condition: "General Consultation",
      priority: "low" as const,
    })) || []),
  ];

  const selectedPatientData = allPatients.find((p) => p.id === selectedPatient);

  const handleSchedule = async () => {
    if (!selectedPatient || !followupDate || !followupType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsScheduling(true);

    // Simulate scheduling (would create an appointment in real implementation)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Follow-up Scheduled",
      description: `Follow-up for ${selectedPatientData?.name} scheduled on ${format(followupDate, "PPP")} at ${followupTime}.`,
    });

    setIsScheduling(false);
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedPatient("");
    setFollowupDate(undefined);
    setFollowupTime("10:00");
    setFollowupType("");
    setNotes("");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-secondary" />
            Schedule Follow-up Appointment
          </DialogTitle>
          <DialogDescription>
            Schedule a follow-up visit for a patient. Select from recent patients or search by roll number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Patient Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Patient *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {allPatients.slice(0, 6).map((patient) => (
                <Card
                  key={patient.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary",
                    selectedPatient === patient.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedPatient(patient.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.rollNumber}</p>
                        <p className="text-xs text-muted-foreground mt-1">{patient.condition}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={cn("text-xs", getPriorityColor(patient.priority))}>
                          {patient.priority}
                        </Badge>
                        {selectedPatient === patient.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Follow-up Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Follow-up Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !followupDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {followupDate ? format(followupDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={followupDate}
                    onSelect={setFollowupDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Time *</Label>
              <Select value={followupTime} onValueChange={setFollowupTime}>
                <SelectTrigger>
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00"].map(
                    (time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Follow-up Type *</Label>
            <Select value={followupType} onValueChange={setFollowupType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type of follow-up" />
              </SelectTrigger>
              <SelectContent>
                {followupTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              placeholder="Add any specific instructions or notes for the follow-up..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Summary */}
          {selectedPatientData && followupDate && followupType && (
            <Card className="bg-secondary/10 border-secondary/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-secondary mb-2">Schedule Summary</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Patient:</span> {selectedPatientData.name} ({selectedPatientData.rollNumber})
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Date:</span> {format(followupDate, "PPPP")}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Time:</span> {followupTime}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Type:</span>{" "}
                    {followupTypes.find((t) => t.value === followupType)?.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={isScheduling}>
              {isScheduling ? "Scheduling..." : "Schedule Follow-up"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
