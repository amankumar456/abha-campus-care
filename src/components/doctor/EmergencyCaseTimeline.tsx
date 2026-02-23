import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import {
  Clock,
  Ambulance,
  MapPin,
  Navigation,
  Building2,
  CheckCircle2,
  Stethoscope,
  RefreshCw,
  AlertTriangle,
  Siren,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  ambulanceRequestId: string;
}

interface TimelineEvent {
  time: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export default function EmergencyCaseTimeline({ ambulanceRequestId }: Props) {
  // Fetch the ambulance request details
  const { data: request } = useQuery({
    queryKey: ["emergency-timeline-request", ambulanceRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ambulance_requests")
        .select("id, created_at, dispatched_at, arrived_at, hospital_arrival_at, completed_at, status, destination_hospital, pickup_location")
        .eq("id", ambulanceRequestId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch treatments
  const { data: treatments } = useQuery({
    queryKey: ["emergency-timeline-treatments", ambulanceRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_treatments")
        .select("id, treatment_type, created_at, outcome, doctor:doctor_id ( name )")
        .eq("ambulance_request_id", ambulanceRequestId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch handovers
  const { data: handovers } = useQuery({
    queryKey: ["emergency-timeline-handovers", ambulanceRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_handovers")
        .select("id, created_at, confirmed, from_doctor:handover_from_doctor_id ( name ), to_doctor:handover_to_doctor_id ( name )")
        .eq("ambulance_request_id", ambulanceRequestId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Build timeline events
  const events: TimelineEvent[] = [];

  if (request) {
    events.push({
      time: request.created_at,
      label: "Emergency Requested",
      description: `Pickup: ${request.pickup_location}`,
      icon: Siren,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    });

    if (request.dispatched_at) {
      events.push({
        time: request.dispatched_at,
        label: "Ambulance Dispatched",
        description: `En route to ${request.pickup_location}`,
        icon: Ambulance,
        color: "text-amber-600",
        bgColor: "bg-amber-500/10",
      });
    }

    if (request.arrived_at) {
      events.push({
        time: request.arrived_at,
        label: "Ambulance Arrived",
        description: `Arrived at pickup location`,
        icon: MapPin,
        color: "text-primary",
        bgColor: "bg-primary/10",
      });
    }

    if (request.hospital_arrival_at) {
      events.push({
        time: request.hospital_arrival_at,
        label: "Arrived at Hospital",
        description: request.destination_hospital,
        icon: Building2,
        color: "text-secondary",
        bgColor: "bg-secondary/10",
      });
    }

    if (request.completed_at) {
      events.push({
        time: request.completed_at,
        label: "Case Completed",
        description: "Emergency case resolved",
        icon: CheckCircle2,
        color: "text-primary",
        bgColor: "bg-primary/10",
      });
    }
  }

  // Add treatment events
  treatments?.forEach((t: any) => {
    events.push({
      time: t.created_at,
      label: `Treatment: ${t.treatment_type}`,
      description: `By ${(t.doctor as any)?.name || "Unknown"}${t.outcome ? ` • ${t.outcome}` : ""}`,
      icon: Stethoscope,
      color: "text-primary",
      bgColor: "bg-primary/10",
    });
  });

  // Add handover events
  handovers?.forEach((h: any) => {
    events.push({
      time: h.created_at,
      label: "Shift Handover",
      description: `${(h.from_doctor as any)?.name || "Unknown"} → ${(h.to_doctor as any)?.name || "Incoming"}${h.confirmed ? " (Confirmed)" : " (Pending)"}`,
      icon: RefreshCw,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    });
  });

  // Sort by time
  events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Case Timeline
          <Badge variant="secondary">{events.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">No events yet</p>
        ) : (
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />
            <div className="space-y-4">
              {events.map((event, idx) => {
                const Icon = event.icon;
                return (
                  <div key={idx} className="relative flex gap-3">
                    <div className={cn(
                      "relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-background",
                      event.bgColor
                    )}>
                      <Icon className={cn("h-4 w-4", event.color)} />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{event.label}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(event.time), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
