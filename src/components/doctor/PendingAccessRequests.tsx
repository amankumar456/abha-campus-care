import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  FileText,
  Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AccessRequest {
  id: string;
  requester: string;
  requesterRole: string;
  patient: string;
  patientRoll?: string;
  type: "medical_history" | "lab_reports" | "emergency" | "prescription";
  reason: string;
  priority: "normal" | "urgent";
  requestedAt: Date;
  status: "pending" | "approved" | "denied";
}

// Extended dummy data
const initialAccessRequests: AccessRequest[] = [
  {
    id: "req-001",
    requester: "Dr. Rajesh Verma",
    requesterRole: "Visiting Cardiologist",
    patient: "Rahul Kumar",
    patientRoll: "21CS1045",
    type: "medical_history",
    reason: "Need to review cardiac history before scheduled consultation",
    priority: "normal",
    requestedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
    status: "pending",
  },
  {
    id: "req-002",
    requester: "Emergency Ward Staff",
    requesterRole: "Nurse",
    patient: "Unknown - Emergency Case",
    type: "emergency",
    reason: "Unconscious student brought to emergency, need medical records for allergy check",
    priority: "urgent",
    requestedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 mins ago
    status: "pending",
  },
  {
    id: "req-003",
    requester: "Priya Sharma",
    requesterRole: "Lab Technician",
    patient: "Sneha Reddy",
    patientRoll: "20EC2034",
    type: "lab_reports",
    reason: "Uploading new blood test results, need to verify previous reports",
    priority: "normal",
    requestedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    status: "pending",
  },
  {
    id: "req-004",
    requester: "Dr. Anita Desai",
    requesterRole: "General Physician",
    patient: "Vikram Singh",
    patientRoll: "22ME1089",
    type: "prescription",
    reason: "Cross-referencing current medications before prescribing new treatment",
    priority: "normal",
    requestedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    status: "pending",
  },
  {
    id: "req-005",
    requester: "Ambulance Paramedic",
    requesterRole: "First Responder",
    patient: "Kavya Nair",
    patientRoll: "21ME2056",
    type: "emergency",
    reason: "Student having severe allergic reaction, need allergy information immediately",
    priority: "urgent",
    requestedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    status: "pending",
  },
];

const getTypeIcon = (type: AccessRequest["type"]) => {
  switch (type) {
    case "medical_history":
      return <FileText className="h-4 w-4" />;
    case "lab_reports":
      return <Activity className="h-4 w-4" />;
    case "emergency":
      return <AlertTriangle className="h-4 w-4" />;
    case "prescription":
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: AccessRequest["type"]) => {
  switch (type) {
    case "medical_history":
      return "Medical History";
    case "lab_reports":
      return "Lab Reports";
    case "emergency":
      return "Emergency Access";
    case "prescription":
      return "Prescription Records";
    default:
      return type;
  }
};

const PendingAccessRequests = () => {
  const [requests, setRequests] = useState<AccessRequest[]>(initialAccessRequests);
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const urgentCount = pendingRequests.filter((r) => r.priority === "urgent").length;

  const handleApprove = async (request: AccessRequest) => {
    setProcessingId(request.id);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setRequests((prev) =>
      prev.map((r) =>
        r.id === request.id ? { ...r, status: "approved" as const } : r
      )
    );
    
    toast.success("Access approved", {
      description: `${request.requester} can now access ${request.patient}'s ${getTypeLabel(request.type).toLowerCase()}.`,
    });
    
    setProcessingId(null);
  };

  const handleDenyClick = (request: AccessRequest) => {
    setSelectedRequest(request);
    setDenyReason("");
    setShowDenyDialog(true);
  };

  const handleDenyConfirm = async () => {
    if (!selectedRequest) return;
    
    setProcessingId(selectedRequest.id);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id ? { ...r, status: "denied" as const } : r
      )
    );
    
    toast.success("Access denied", {
      description: `Request from ${selectedRequest.requester} has been denied.`,
    });
    
    setProcessingId(null);
    setShowDenyDialog(false);
    setSelectedRequest(null);
  };

  return (
    <>
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Pending Access Requests
            <Badge variant="secondary" className="ml-auto">
              {pendingRequests.length}
            </Badge>
            {urgentCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {urgentCount} Urgent
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-primary/50" />
              <p className="text-sm">No pending requests</p>
              <p className="text-xs">All access requests have been processed</p>
            </div>
          ) : (
            pendingRequests
              .sort((a, b) => {
                // Sort urgent first, then by time
                if (a.priority === "urgent" && b.priority !== "urgent") return -1;
                if (a.priority !== "urgent" && b.priority === "urgent") return 1;
                return b.requestedAt.getTime() - a.requestedAt.getTime();
              })
              .map((request) => (
                <div
                  key={request.id}
                  className={`p-3 rounded-lg border transition-all ${
                    request.priority === "urgent"
                      ? "border-destructive/50 bg-destructive/5 animate-pulse"
                      : "bg-card hover:bg-muted/50"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <div className={`p-1.5 rounded-full ${
                        request.priority === "urgent" 
                          ? "bg-destructive/20 text-destructive" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <User className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {request.requester}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.requesterRole}
                        </p>
                      </div>
                    </div>
                    {request.priority === "urgent" && (
                      <Badge variant="destructive" className="text-xs shrink-0">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                  </div>

                  {/* Request Details */}
                  <div className="ml-7 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      {getTypeIcon(request.type)}
                      <span className="font-medium">{getTypeLabel(request.type)}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {request.patient}
                        {request.patientRoll && ` (${request.patientRoll})`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {request.reason}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(request.requestedAt, { addSuffix: true })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3 ml-7">
                    <Button
                      size="sm"
                      className={`flex-1 h-8 text-xs ${
                        request.priority === "urgent"
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-secondary hover:bg-secondary/90"
                      }`}
                      onClick={() => handleApprove(request)}
                      disabled={processingId === request.id}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {processingId === request.id ? "Processing..." : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleDenyClick(request)}
                      disabled={processingId === request.id}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Deny
                    </Button>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      {/* Deny Dialog */}
      <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Deny Access Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for denying this access request. The requester will be notified.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="font-medium text-sm">{selectedRequest.requester}</p>
                <p className="text-xs text-muted-foreground">
                  Requested: {getTypeLabel(selectedRequest.type)} for {selectedRequest.patient}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reason for Denial (Optional)</Label>
                <Textarea
                  placeholder="E.g., Insufficient authorization, need supervisor approval..."
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDenyDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDenyConfirm}
                  disabled={processingId === selectedRequest.id}
                >
                  {processingId === selectedRequest.id ? "Denying..." : "Confirm Denial"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingAccessRequests;
