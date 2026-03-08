import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { 
  Siren, 
  Activity, 
  Ambulance, 
  Phone, 
  Clock, 
  MapPin, 
  User, 
  Building2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Navigation,
  HeartPulse,
  Shield,
  Radio,
  ChevronRight,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import EmergencyTreatmentLog from "@/components/doctor/EmergencyTreatmentLog";
import EmergencyHandoverSection from "@/components/doctor/EmergencyHandoverSection";
import EmergencyCaseTimeline from "@/components/doctor/EmergencyCaseTimeline";

interface AmbulanceRequest {
  id: string;
  priority_level: string;
  ambulance_type: string;
  destination_hospital: string;
  pickup_location: string;
  status: string;
  dispatched_at: string | null;
  arrived_at: string | null;
  estimated_arrival_minutes: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  accompanying_person: string | null;
  created_at: string;
  student: {
    id: string;
    full_name: string;
    roll_number: string;
    program: string;
  } | null;
}

const PRIORITY_CONFIGS = {
  emergency: {
    label: "EMERGENCY",
    color: "bg-destructive text-destructive-foreground",
    borderColor: "border-destructive",
    bgColor: "bg-destructive/5"
  },
  urgent: {
    label: "URGENT",
    color: "bg-warning text-warning-foreground",
    borderColor: "border-warning",
    bgColor: "bg-warning/5"
  },
  standard: {
    label: "STANDARD",
    color: "bg-primary text-primary-foreground",
    borderColor: "border-primary",
    bgColor: "bg-primary/5"
  }
};

const STATUS_CONFIGS = {
  requested: { label: "Requested", color: "bg-muted text-muted-foreground", icon: Clock },
  dispatched: { label: "Dispatched", color: "bg-warning/20 text-warning-foreground", icon: Ambulance },
  arrived: { label: "Arrived", color: "bg-primary/20 text-primary", icon: MapPin },
  in_transit: { label: "In Transit", color: "bg-secondary/20 text-secondary-foreground", icon: Navigation },
  delivered: { label: "At Hospital", color: "bg-primary/20 text-primary", icon: Building2 },
  completed: { label: "Completed", color: "bg-primary/10 text-primary", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/20 text-destructive", icon: AlertTriangle }
};

// Quick contacts will be fetched from ambulance_service table

const TEMPLATE_MESSAGES = [
  "Ambulance dispatched - ETA 10 min",
  "Critical case - prepare emergency room",
  "Patient stable - en route to hospital",
  "Parent notified - contact details shared"
];

export default function EmergencyDashboard() {
  const { doctorId } = useUserRole();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<AmbulanceRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch active ambulance requests
  const { data: ambulanceRequests, isLoading, refetch } = useQuery({
    queryKey: ["emergency-ambulance-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ambulance_requests")
        .select(`
          id,
          priority_level,
          ambulance_type,
          destination_hospital,
          pickup_location,
          status,
          dispatched_at,
          arrived_at,
          estimated_arrival_minutes,
          emergency_contact_name,
          emergency_contact_phone,
          accompanying_person,
          created_at,
          student:student_id (
            id,
            full_name,
            roll_number,
            program
          )
        `)
        .in("status", ["requested", "dispatched", "arrived", "in_transit", "delivered"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as AmbulanceRequest[]) || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update ambulance status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "arrived") updates.arrived_at = new Date().toISOString();
      if (status === "completed") updates.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from("ambulance_requests")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["emergency-ambulance-requests"] });
    },
    onError: () => {
      toast.error("Failed to update status");
    }
  });

  // Group requests by priority
  const emergencyRequests = ambulanceRequests?.filter(r => r.priority_level === "emergency") || [];
  const urgentRequests = ambulanceRequests?.filter(r => r.priority_level === "urgent") || [];
  const standardRequests = ambulanceRequests?.filter(r => r.priority_level === "standard") || [];

  // Stats
  const stats = {
    activeEmergencies: emergencyRequests.length,
    ambulancesDispatched: ambulanceRequests?.filter(r => r.status === "dispatched" || r.status === "in_transit").length || 0,
    inTransit: ambulanceRequests?.filter(r => r.status === "in_transit").length || 0,
    totalActive: ambulanceRequests?.length || 0
  };

  const handleViewDetails = (request: AmbulanceRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const getEtaProgress = (request: AmbulanceRequest) => {
    if (!request.dispatched_at || !request.estimated_arrival_minutes) return 0;
    const dispatchTime = new Date(request.dispatched_at).getTime();
    const now = Date.now();
    const elapsedMinutes = (now - dispatchTime) / 60000;
    return Math.min((elapsedMinutes / request.estimated_arrival_minutes) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-destructive/10 animate-pulse">
            <Siren className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Emergency Dashboard</h2>
            <p className="text-sm text-muted-foreground">Real-time ambulance & emergency tracking</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Resource Status Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn(
          "border-2",
          stats.activeEmergencies > 0 ? "border-destructive bg-destructive/5" : "border-muted"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.activeEmergencies}</p>
                <p className="text-xs text-muted-foreground">Active Emergencies</p>
              </div>
              <Siren className={cn(
                "h-8 w-8",
                stats.activeEmergencies > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.ambulancesDispatched}</p>
                <p className="text-xs text-muted-foreground">Dispatched</p>
              </div>
              <Ambulance className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.inTransit}</p>
                <p className="text-xs text-muted-foreground">In Transit</p>
              </div>
              <Navigation className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalActive}</p>
                <p className="text-xs text-muted-foreground">Total Active</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Active Cases */}
        <div className="lg:col-span-2 space-y-4">
          {/* Emergency Cases (Red Zone) */}
          {emergencyRequests.length > 0 && (
            <Card className="border-2 border-destructive bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <Siren className="h-5 w-5 animate-pulse" />
                  EMERGENCY CASES
                  <Badge variant="destructive" className="ml-2">{emergencyRequests.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {emergencyRequests.map((request) => (
                  <EmergencyCaseCard 
                    key={request.id} 
                    request={request} 
                    onViewDetails={handleViewDetails}
                    onUpdateStatus={(status) => updateStatusMutation.mutate({ id: request.id, status })}
                    getEtaProgress={getEtaProgress}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Urgent Cases (Yellow Zone) */}
          {urgentRequests.length > 0 && (
            <Card className="border-2 border-warning bg-warning/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-warning-foreground">
                  <AlertTriangle className="h-5 w-5" />
                  URGENT CASES
                  <Badge className="bg-warning/20 text-warning-foreground ml-2">{urgentRequests.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {urgentRequests.map((request) => (
                  <EmergencyCaseCard 
                    key={request.id} 
                    request={request} 
                    onViewDetails={handleViewDetails}
                    onUpdateStatus={(status) => updateStatusMutation.mutate({ id: request.id, status })}
                    getEtaProgress={getEtaProgress}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Standard Cases */}
          {standardRequests.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Standard Cases
                  <Badge variant="secondary" className="ml-2">{standardRequests.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {standardRequests.map((request) => (
                  <EmergencyCaseCard 
                    key={request.id} 
                    request={request} 
                    onViewDetails={handleViewDetails}
                    onUpdateStatus={(status) => updateStatusMutation.mutate({ id: request.id, status })}
                    getEtaProgress={getEtaProgress}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : ambulanceRequests?.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">No Active Emergencies</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All emergency cases have been resolved
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Quick Actions & Contacts */}
        <div className="space-y-4">
          {/* Quick Contacts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Quick Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUICK_CONTACTS.map((contact) => {
                const Icon = contact.icon;
                return (
                  <a
                    key={contact.name}
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    </div>
                    <Phone className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                );
              })}
            </CardContent>
          </Card>

          {/* Template Messages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Quick Messages
              </CardTitle>
              <CardDescription>Click to copy message</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {TEMPLATE_MESSAGES.map((message, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    navigator.clipboard.writeText(message);
                    toast.success("Message copied!");
                  }}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
                >
                  {message}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Resource Status */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary" />
                Resource Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-background">
                <span className="text-sm">College Ambulance</span>
                <Badge variant="outline" className="bg-primary/10 text-primary">Available</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-background">
                <span className="text-sm">Emergency Bed</span>
                <Badge variant="outline" className="bg-primary/10 text-primary">1 Free</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-background">
                <span className="text-sm">Doctor On Duty</span>
                <Badge variant="outline" className="bg-primary/10 text-primary">Present</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-background">
                <span className="text-sm">Oxygen Supply</span>
                <Badge variant="outline" className="bg-primary/10 text-primary">Full</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Details Dialog with Treatment & Handover */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ambulance className="h-5 w-5 text-primary" />
              Emergency Case Management
            </DialogTitle>
            <DialogDescription>
              Complete case information, treatment log, and handover notes
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="treatment">Treatment</TabsTrigger>
                <TabsTrigger value="handover">Handover</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Patient Info */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedRequest.student?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.student?.roll_number} • {selectedRequest.student?.program}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Priority</p>
                    <Badge className={PRIORITY_CONFIGS[selectedRequest.priority_level as keyof typeof PRIORITY_CONFIGS]?.color || ""}>
                      {selectedRequest.priority_level.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Select
                      value={selectedRequest.status}
                      onValueChange={(value) => {
                        updateStatusMutation.mutate({ id: selectedRequest.id, status: value });
                        setSelectedRequest({ ...selectedRequest, status: value });
                      }}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dispatched">Dispatched</SelectItem>
                        <SelectItem value="arrived">Arrived</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="delivered">At Hospital</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ambulance Type</p>
                    <p className="font-medium uppercase">{selectedRequest.ambulance_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ETA</p>
                    <p className="font-medium">{selectedRequest.estimated_arrival_minutes} min</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Destination</p>
                    <p className="font-medium">{selectedRequest.destination_hospital}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Pickup Location</p>
                    <p className="font-medium">{selectedRequest.pickup_location}</p>
                  </div>
                </div>

                {/* Emergency Contact */}
                {selectedRequest.emergency_contact_name && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm font-medium mb-1">Emergency Contact</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{selectedRequest.emergency_contact_name}</span>
                      <a href={`tel:${selectedRequest.emergency_contact_phone}`} className="text-primary text-sm font-medium">
                        {selectedRequest.emergency_contact_phone}
                      </a>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <EmergencyCaseTimeline ambulanceRequestId={selectedRequest.id} />
              </TabsContent>

              <TabsContent value="treatment" className="mt-4">
                <EmergencyTreatmentLog ambulanceRequestId={selectedRequest.id} />
              </TabsContent>

              <TabsContent value="handover" className="mt-4">
                <EmergencyHandoverSection ambulanceRequestId={selectedRequest.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Emergency Case Card Component
function EmergencyCaseCard({ 
  request, 
  onViewDetails, 
  onUpdateStatus,
  getEtaProgress 
}: { 
  request: AmbulanceRequest; 
  onViewDetails: (request: AmbulanceRequest) => void;
  onUpdateStatus: (status: string) => void;
  getEtaProgress: (request: AmbulanceRequest) => number;
}) {
  const statusConfig = STATUS_CONFIGS[request.status as keyof typeof STATUS_CONFIGS] || STATUS_CONFIGS.requested;
  const StatusIcon = statusConfig.icon;
  const etaProgress = getEtaProgress(request);

  return (
    <div className="p-4 rounded-lg bg-background border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-foreground">{request.student?.full_name || "Unknown"}</p>
              <Badge variant="outline" className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{request.student?.roll_number}</p>
            
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                {request.destination_hospital}
              </span>
              <span className="flex items-center gap-1">
                <Ambulance className="h-3 w-3 text-muted-foreground" />
                {request.ambulance_type.toUpperCase()}
              </span>
            </div>

            {/* ETA Progress */}
            {request.status === "dispatched" && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">ETA: {request.estimated_arrival_minutes} min</span>
                  <span className="text-primary">{Math.round(etaProgress)}%</span>
                </div>
                <Progress value={etaProgress} className="h-1.5" />
              </div>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(request)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus("arrived")}>
              <MapPin className="h-4 w-4 mr-2" />
              Mark Arrived
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus("in_transit")}>
              <Navigation className="h-4 w-4 mr-2" />
              Mark In Transit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus("completed")}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
