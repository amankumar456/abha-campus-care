import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

export default function EmergencyHandoverSection({ ambulanceRequestId }: Props) {
  const { doctorId } = useUserRole();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    current_status: "",
    pending_actions: "",
    follow_up_instructions: "",
  });

  const { data: handovers } = useQuery({
    queryKey: ["emergency-handovers", ambulanceRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_handovers")
        .select(`
          id, current_status, pending_actions, follow_up_instructions,
          confirmed, confirmed_at, created_at,
          from_doctor:handover_from_doctor_id ( name ),
          to_doctor:handover_to_doctor_id ( name )
        `)
        .eq("ambulance_request_id", ambulanceRequestId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: doctors } = useQuery({
    queryKey: ["all-doctors"],
    queryFn: async () => {
      const { data } = await supabase.from("medical_officers").select("id, name").order("name");
      return data || [];
    },
  });

  const [selectedDoctor, setSelectedDoctor] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const pendingArr = form.pending_actions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const { error } = await supabase.from("emergency_handovers").insert({
        ambulance_request_id: ambulanceRequestId,
        handover_from_doctor_id: doctorId,
        handover_to_doctor_id: selectedDoctor || null,
        current_status: form.current_status,
        pending_actions: pendingArr,
        follow_up_instructions: form.follow_up_instructions || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Handover note created");
      queryClient.invalidateQueries({ queryKey: ["emergency-handovers", ambulanceRequestId] });
      setCreateOpen(false);
      setForm({ current_status: "", pending_actions: "", follow_up_instructions: "" });
      setSelectedDoctor("");
    },
    onError: () => toast.error("Failed to create handover"),
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("emergency_handovers")
        .update({ confirmed: true, confirmed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Handover confirmed");
      queryClient.invalidateQueries({ queryKey: ["emergency-handovers", ambulanceRequestId] });
    },
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Shift Handover
              <Badge variant="secondary">{handovers?.length || 0}</Badge>
            </CardTitle>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Handover
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!handovers?.length ? (
            <p className="text-center text-muted-foreground py-6 text-sm">No handover notes yet</p>
          ) : (
            <div className="space-y-3">
              {handovers.map((h: any) => (
                <div key={h.id} className="p-4 rounded-lg border bg-card space-y-3">
                  {/* Doctor transfer */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{(h.from_doctor as any)?.name || "Unknown"}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{(h.to_doctor as any)?.name || "Incoming Doctor"}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(parseISO(h.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>

                  {/* Current status */}
                  <div className="p-2.5 rounded-md bg-muted/50 text-sm">
                    <p className="font-medium text-xs text-muted-foreground mb-1">Current Status</p>
                    <p>{h.current_status}</p>
                  </div>

                  {/* Pending actions */}
                  {h.pending_actions?.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium text-xs text-muted-foreground mb-1">Pending Actions</p>
                      <ul className="space-y-1">
                        {(h.pending_actions as string[]).map((action, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-sm">
                            <Clock className="h-3 w-3 text-amber-500" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Follow-up */}
                  {h.follow_up_instructions && (
                    <div className="text-sm p-2.5 rounded-md bg-primary/5 border border-primary/10">
                      <p className="font-medium text-xs text-muted-foreground mb-1">Follow-up Required</p>
                      <p>{h.follow_up_instructions}</p>
                    </div>
                  )}

                  {/* Confirmation */}
                  <div className="flex items-center justify-end">
                    {h.confirmed ? (
                      <Badge variant="outline" className="gap-1 text-primary">
                        <CheckCircle2 className="h-3 w-3" />
                        Confirmed {h.confirmed_at ? format(parseISO(h.confirmed_at), "h:mm a") : ""}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => confirmMutation.mutate(h.id)}
                        disabled={confirmMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm Handover
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Create Handover Note
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Handover To</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger><SelectValue placeholder="Select receiving doctor..." /></SelectTrigger>
                <SelectContent>
                  {doctors?.filter((d) => d.id !== doctorId).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Current Patient Status *</Label>
              <Textarea
                placeholder="e.g., Patient stabilized, vitals normal, IV ongoing..."
                value={form.current_status}
                onChange={(e) => setForm({ ...form, current_status: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Pending Actions (one per line)</Label>
              <Textarea
                placeholder="Blood reports pending&#10;Specialist consultation requested&#10;Complete admission form"
                value={form.pending_actions}
                onChange={(e) => setForm({ ...form, pending_actions: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label>Follow-up Instructions</Label>
              <Textarea
                placeholder="e.g., Repeat vitals every 30 min, neurology review in 2 hours..."
                value={form.follow_up_instructions}
                onChange={(e) => setForm({ ...form, follow_up_instructions: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.current_status || createMutation.isPending}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Create Handover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
