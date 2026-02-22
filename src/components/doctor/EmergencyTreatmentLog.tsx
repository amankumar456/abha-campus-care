import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ClipboardList,
  Plus,
  Stethoscope,
  Pill,
  HeartPulse,
  StickyNote,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  ambulanceRequestId: string;
}

const TREATMENT_TYPES = [
  "Primary Assessment",
  "IV Line Established",
  "Medication Administration",
  "CPR",
  "Oxygen Therapy",
  "Wound Care",
  "Splinting",
  "Vitals Monitoring",
  "Blood Glucose Check",
  "Nebulization",
  "Other",
];

export default function EmergencyTreatmentLog({ ambulanceRequestId }: Props) {
  const { doctorId } = useUserRole();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState({
    treatment_type: "",
    medication_given: "",
    procedure_performed: "",
    notes: "",
    outcome: "",
    bp: "",
    pulse: "",
    spo2: "",
    temperature: "",
  });

  const { data: treatments, isLoading } = useQuery({
    queryKey: ["emergency-treatments", ambulanceRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_treatments")
        .select(`
          id, treatment_type, medication_given, procedure_performed,
          vitals_recorded, notes, outcome, requires_followup, created_at,
          doctor:doctor_id ( name )
        `)
        .eq("ambulance_request_id", ambulanceRequestId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const vitals: Record<string, string> = {};
      if (form.bp) vitals.bp = form.bp;
      if (form.pulse) vitals.pulse = form.pulse;
      if (form.spo2) vitals.spo2 = form.spo2;
      if (form.temperature) vitals.temperature = form.temperature;

      const { error } = await supabase.from("emergency_treatments").insert({
        ambulance_request_id: ambulanceRequestId,
        doctor_id: doctorId,
        treatment_type: form.treatment_type,
        medication_given: form.medication_given || null,
        procedure_performed: form.procedure_performed || null,
        vitals_recorded: Object.keys(vitals).length > 0 ? vitals : null,
        notes: form.notes || null,
        outcome: form.outcome || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Treatment record added");
      queryClient.invalidateQueries({ queryKey: ["emergency-treatments", ambulanceRequestId] });
      setAddDialogOpen(false);
      setForm({ treatment_type: "", medication_given: "", procedure_performed: "", notes: "", outcome: "", bp: "", pulse: "", spo2: "", temperature: "" });
    },
    onError: () => toast.error("Failed to add treatment record"),
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Treatment Log
              <Badge variant="secondary">{treatments?.length || 0}</Badge>
            </CardTitle>
            <Button size="sm" className="gap-1.5" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!treatments?.length ? (
            <p className="text-center text-muted-foreground py-6 text-sm">No treatment records yet</p>
          ) : (
            <div className="relative">
              {/* Timeline */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-4 pl-10">
                {treatments.map((t: any) => {
                  const vitals = t.vitals_recorded as Record<string, string> | null;
                  return (
                    <div key={t.id} className="relative">
                      <div className="absolute -left-[26px] top-1 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{t.treatment_type}</Badge>
                            {t.outcome && <Badge variant="secondary" className="text-xs">{t.outcome}</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(t.created_at), "h:mm a")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          By {(t.doctor as any)?.name || "Unknown"}
                        </p>
                        {t.medication_given && (
                          <p className="text-sm flex items-center gap-1 mt-1">
                            <Pill className="h-3 w-3 text-primary" />
                            {t.medication_given}
                          </p>
                        )}
                        {t.procedure_performed && (
                          <p className="text-sm flex items-center gap-1 mt-1">
                            <Stethoscope className="h-3 w-3 text-primary" />
                            {t.procedure_performed}
                          </p>
                        )}
                        {vitals && Object.keys(vitals).length > 0 && (
                          <div className="flex gap-3 mt-2 text-xs">
                            {vitals.bp && <span className="flex items-center gap-1"><HeartPulse className="h-3 w-3" /> BP: {vitals.bp}</span>}
                            {vitals.pulse && <span>Pulse: {vitals.pulse}</span>}
                            {vitals.spo2 && <span>SpO2: {vitals.spo2}%</span>}
                            {vitals.temperature && <span>Temp: {vitals.temperature}°F</span>}
                          </div>
                        )}
                        {t.notes && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
                            <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
                            {t.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Treatment Record
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Treatment Type *</Label>
              <Select value={form.treatment_type} onValueChange={(v) => setForm({ ...form, treatment_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select treatment..." /></SelectTrigger>
                <SelectContent>
                  {TREATMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Medication Given</Label>
              <Input
                placeholder="e.g., Glucose 25% IV"
                value={form.medication_given}
                onChange={(e) => setForm({ ...form, medication_given: e.target.value })}
              />
            </div>
            <div>
              <Label>Procedure Performed</Label>
              <Input
                placeholder="e.g., 18G IV in left hand"
                value={form.procedure_performed}
                onChange={(e) => setForm({ ...form, procedure_performed: e.target.value })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1"><HeartPulse className="h-3.5 w-3.5" /> Vitals</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input placeholder="BP (e.g., 120/80)" value={form.bp} onChange={(e) => setForm({ ...form, bp: e.target.value })} />
                <Input placeholder="Pulse" value={form.pulse} onChange={(e) => setForm({ ...form, pulse: e.target.value })} />
                <Input placeholder="SpO2 %" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} />
                <Input placeholder="Temperature °F" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Outcome</Label>
              <Select value={form.outcome} onValueChange={(v) => setForm({ ...form, outcome: v })}>
                <SelectTrigger><SelectValue placeholder="Select outcome..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Successful">Successful</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Administered">Administered</SelectItem>
                  <SelectItem value="Stable">Stable</SelectItem>
                  <SelectItem value="Needs Follow-up">Needs Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!form.treatment_type || addMutation.isPending}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {addMutation.isPending ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
