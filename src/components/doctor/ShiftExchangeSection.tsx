import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeftRight,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface ShiftExchangeProps {
  doctorId: string | null;
}

const SHIFT_TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
];

const formatTime = (time: string) => {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

export default function ShiftExchangeSection({ doctorId }: ShiftExchangeProps) {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [replacementDoctorId, setReplacementDoctorId] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("17:00");
  const [reason, setReason] = useState("");

  // Fetch current doctor's shift for today
  const { data: todayShift, isLoading: shiftLoading } = useQuery({
    queryKey: ["doctor-shift", doctorId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("doctor_shifts")
        .select("*")
        .eq("doctor_id", doctorId!)
        .eq("shift_date", today)
        .maybeSingle();
      return data;
    },
    enabled: !!doctorId,
  });

  // Fetch all medical officers for replacement selection
  const { data: allDoctors } = useQuery({
    queryKey: ["all-doctors-for-exchange"],
    queryFn: async () => {
      const { data } = await supabase
        .from("medical_officers")
        .select("id, name, designation")
        .order("name");
      return data || [];
    },
  });

  // Fetch recent exchanges
  const { data: recentExchanges } = useQuery({
    queryKey: ["recent-shift-exchanges", doctorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("shift_exchanges")
        .select("*, original_doctor:original_doctor_id(name), replacement_doctor:replacement_doctor_id(name)")
        .or(`original_doctor_id.eq.${doctorId},replacement_doctor_id.eq.${doctorId}`)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data as any[]) || [];
    },
    enabled: !!doctorId,
  });

  // Count today's appointments that would be affected
  const { data: affectedAppointments } = useQuery({
    queryKey: ["affected-appointments", doctorId, today, newStartTime, newEndTime],
    queryFn: async () => {
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("medical_officer_id", doctorId!)
        .eq("appointment_date", today)
        .in("status", ["pending", "confirmed"])
        .gte("appointment_time", newStartTime)
        .lte("appointment_time", newEndTime);
      return count || 0;
    },
    enabled: !!doctorId && dialogOpen,
  });

  const otherDoctors = allDoctors?.filter((d) => d.id !== doctorId) || [];

  // Mutation: create/update shift + create exchange + transfer appointments
  const exchangeMutation = useMutation({
    mutationFn: async () => {
      if (!doctorId || !replacementDoctorId) throw new Error("Missing data");

      const currentStart = todayShift?.start_time || "09:00";
      const currentEnd = todayShift?.end_time || "17:00";

      // 1. Upsert the doctor's shift for today
      const { error: shiftError } = await supabase
        .from("doctor_shifts")
        .upsert(
          {
            doctor_id: doctorId,
            shift_date: today,
            start_time: newStartTime,
            end_time: newEndTime,
            is_modified: true,
            modified_by: doctorId,
            notes: reason || null,
          },
          { onConflict: "doctor_id,shift_date" }
        );
      if (shiftError) throw shiftError;

      // 2. Transfer affected appointments to replacement doctor
      const { data: transferred, error: transferError } = await supabase
        .from("appointments")
        .update({
          medical_officer_id: replacementDoctorId,
          notes: `Transferred from shift exchange. Original doctor shift modified.`,
        })
        .eq("medical_officer_id", doctorId)
        .eq("appointment_date", today)
        .in("status", ["pending", "confirmed"])
        .gte("appointment_time", newStartTime)
        .lte("appointment_time", newEndTime)
        .select("id");

      if (transferError) throw transferError;
      const transferredCount = transferred?.length || 0;

      // 3. Record the exchange
      const { error: exchangeError } = await supabase
        .from("shift_exchanges")
        .insert({
          original_doctor_id: doctorId,
          replacement_doctor_id: replacementDoctorId,
          shift_date: today,
          original_start_time: currentStart,
          original_end_time: currentEnd,
          new_start_time: newStartTime,
          new_end_time: newEndTime,
          exchange_reason: reason || null,
          status: "approved",
          transferred_appointments_count: transferredCount,
          approved_at: new Date().toISOString(),
        });
      if (exchangeError) throw exchangeError;

      return transferredCount;
    },
    onSuccess: (transferredCount) => {
      toast.success("Shift exchange completed!", {
        description: `${transferredCount} appointment(s) transferred to the replacement doctor.`,
      });
      queryClient.invalidateQueries({ queryKey: ["doctor-shift"] });
      queryClient.invalidateQueries({ queryKey: ["recent-shift-exchanges"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-home-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointment-stats"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error("Exchange failed", { description: err.message });
    },
  });

  const resetForm = () => {
    setReplacementDoctorId("");
    setNewStartTime("09:00");
    setNewEndTime("17:00");
    setReason("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const currentStart = todayShift?.start_time || "09:00:00";
  const currentEnd = todayShift?.end_time || "17:00:00";

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Shift Exchange</CardTitle>
              <CardDescription>Manage your shift & transfer appointments</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(), "EEE, MMM d")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Shift Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/60 text-center">
            <p className="text-xs text-muted-foreground mb-1">Shift Start</p>
            <p className={`text-xl font-bold ${todayShift?.is_modified ? "text-amber-600" : "text-foreground"}`}>
              {formatTime(currentStart.slice(0, 5))}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/60 text-center">
            <p className="text-xs text-muted-foreground mb-1">Shift End</p>
            <p className={`text-xl font-bold ${todayShift?.is_modified ? "text-amber-600" : "text-foreground"}`}>
              {formatTime(currentEnd.slice(0, 5))}
            </p>
          </div>
        </div>

        {todayShift?.is_modified && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs">
            <RefreshCw className="h-3 w-3" />
            <span>Shift was modified from the regular schedule today</span>
          </div>
        )}

        {/* Recent Exchanges */}
        {recentExchanges && recentExchanges.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recent Exchanges
            </p>
            {recentExchanges.slice(0, 2).map((ex: any) => (
              <div key={ex.id} className="flex items-center justify-between p-2 rounded-md bg-muted/40 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {ex.original_doctor?.name} → {ex.replacement_doctor?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {ex.transferred_appointments_count} apt
                  </span>
                  {getStatusBadge(ex.status)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Exchange Button & Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2" variant="default">
              <ArrowLeftRight className="h-4 w-4" />
              Request Shift Exchange
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                Shift Exchange Request
              </DialogTitle>
              <DialogDescription>
                Modify your shift timing and transfer affected appointments to a replacement doctor.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Current shift info */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs font-medium text-muted-foreground mb-2">CURRENT SHIFT</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">{formatTime(currentStart.slice(0, 5))}</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">{formatTime(currentEnd.slice(0, 5))}</span>
                  </div>
                </div>
              </div>

              {/* Replacement Doctor */}
              <div className="space-y-2">
                <Label>Select Replacement Doctor *</Label>
                <Select value={replacementDoctorId} onValueChange={setReplacementDoctorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a doctor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {otherDoctors.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        Dr. {doc.name} — {doc.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* New Shift Times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Start Time *</Label>
                  <Select value={newStartTime} onValueChange={setNewStartTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_TIMES.map((t) => (
                        <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>New End Time *</Label>
                  <Select value={newEndTime} onValueChange={setNewEndTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_TIMES.map((t) => (
                        <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason for Exchange (Optional)</Label>
                <Textarea
                  placeholder="Please provide reason for shift exchange..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[70px]"
                />
              </div>

              {/* Warning */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>
                        <strong>{affectedAppointments ?? "..."}</strong> appointment(s) in the selected time range will be transferred
                      </li>
                      <li>The replacement doctor will receive these appointments</li>
                      <li>Patients will see the updated doctor in their dashboard</li>
                      <li>This action is recorded in the exchange history</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={!replacementDoctorId || newStartTime >= newEndTime || exchangeMutation.isPending}
                  onClick={() => exchangeMutation.mutate()}
                >
                  {exchangeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirm Exchange
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
