import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  Ambulance,
  Building2,
  Clock,
  User,
  MapPin,
  FileText,
  Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { printDocument } from "@/lib/print/printDocument";

interface CompletedCase {
  id: string;
  priority_level: string;
  ambulance_type: string;
  destination_hospital: string;
  pickup_location: string;
  status: string;
  dispatched_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  estimated_arrival_minutes: number | null;
  actual_arrival_minutes: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  accompanying_person: string | null;
  triage_notes: string | null;
  handover_notes: string | null;
  condition_during_transit: string | null;
  receiving_doctor_name: string | null;
  created_at: string;
  student: {
    full_name: string;
    roll_number: string;
    program: string;
  } | null;
  medical_officers: {
    name: string;
  } | null;
}

export default function EmergencyHistory() {
  const [selectedCase, setSelectedCase] = useState<CompletedCase | null>(null);

  const { data: completedCases, isLoading } = useQuery({
    queryKey: ["emergency-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ambulance_requests")
        .select(`
          id, priority_level, ambulance_type, destination_hospital,
          pickup_location, status, dispatched_at, arrived_at, completed_at,
          estimated_arrival_minutes, actual_arrival_minutes,
          emergency_contact_name, emergency_contact_phone,
          accompanying_person, triage_notes, handover_notes,
          condition_during_transit, receiving_doctor_name, created_at,
          student:student_id ( full_name, roll_number, program ),
          medical_officers:requesting_doctor_id ( name )
        `)
        .in("status", ["completed", "cancelled"])
        .order("completed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data as unknown as CompletedCase[]) || [];
    },
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "emergency":
        return <Badge variant="destructive">EMERGENCY</Badge>;
      case "urgent":
        return <Badge className="bg-amber-500/20 text-amber-700 border-amber-300">URGENT</Badge>;
      default:
        return <Badge variant="secondary">STANDARD</Badge>;
    }
  };

  const handlePrintReport = (c: CompletedCase) => {
    const content = `
      <div style="font-family: Georgia, serif; max-width: 700px; margin: auto;">
        <div style="text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #1a365d;">NIT Warangal Health Centre</h2>
          <p style="margin: 4px 0; font-size: 14px; color: #555;">Emergency Case Report</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Case ID</td><td style="padding: 8px;">${c.id.slice(0, 8).toUpperCase()}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Patient</td><td style="padding: 8px;">${c.student?.full_name || "Unknown"} (${c.student?.roll_number || "N/A"})</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Priority</td><td style="padding: 8px;">${c.priority_level.toUpperCase()}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Ambulance</td><td style="padding: 8px;">${c.ambulance_type.toUpperCase()}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Hospital</td><td style="padding: 8px;">${c.destination_hospital}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Pickup</td><td style="padding: 8px;">${c.pickup_location}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Dispatched</td><td style="padding: 8px;">${c.dispatched_at ? format(parseISO(c.dispatched_at), "PPp") : "—"}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Completed</td><td style="padding: 8px;">${c.completed_at ? format(parseISO(c.completed_at), "PPp") : "—"}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Response Time</td><td style="padding: 8px;">${c.actual_arrival_minutes ? `${c.actual_arrival_minutes} min` : "—"}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Requesting Doctor</td><td style="padding: 8px;">${c.medical_officers?.name || "—"}</td></tr>
          ${c.triage_notes ? `<tr><td style="padding: 8px; font-weight: bold;">Triage Notes</td><td style="padding: 8px;">${c.triage_notes}</td></tr>` : ""}
          ${c.handover_notes ? `<tr><td style="padding: 8px; font-weight: bold;">Handover Notes</td><td style="padding: 8px;">${c.handover_notes}</td></tr>` : ""}
        </table>
      </div>
    `;
    printDocument({
      title: "Emergency Case Report",
      bodyHtml: content,
      documentId: c.id,
      documentType: "emergency_case_report",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Emergency Case History
            <Badge variant="secondary" className="ml-2">{completedCases?.length || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!completedCases?.length ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="text-muted-foreground">No completed emergency cases yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedCases.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedCase(c)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.student?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.student?.roll_number} • {c.destination_hospital}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(c.priority_level)}
                    <Badge variant={c.status === "completed" ? "outline" : "destructive"} className="text-xs">
                      {c.status === "completed" ? "Resolved" : "Cancelled"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {c.completed_at ? format(parseISO(c.completed_at), "MMM d") : format(parseISO(c.created_at), "MMM d")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ambulance className="h-5 w-5 text-primary" />
              Emergency Case Report
            </DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedCase.student?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCase.student?.roll_number} • {selectedCase.student?.program}
                  </p>
                </div>
                {getPriorityBadge(selectedCase.priority_level)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Ambulance className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{selectedCase.ambulance_type.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{selectedCase.destination_hospital}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{selectedCase.pickup_location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{selectedCase.actual_arrival_minutes ? `${selectedCase.actual_arrival_minutes} min response` : "—"}</span>
                </div>
              </div>

              {selectedCase.triage_notes && (
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 text-sm">
                  <p className="font-medium mb-1">Triage Notes</p>
                  <p className="text-muted-foreground">{selectedCase.triage_notes}</p>
                </div>
              )}

              {selectedCase.handover_notes && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                  <p className="font-medium mb-1">Handover Notes</p>
                  <p className="text-muted-foreground">{selectedCase.handover_notes}</p>
                </div>
              )}

              <Button variant="outline" className="w-full gap-2" onClick={() => handlePrintReport(selectedCase)}>
                <Printer className="h-4 w-4" />
                Print Report
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
