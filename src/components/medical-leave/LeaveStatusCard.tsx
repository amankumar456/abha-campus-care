import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar, CheckCircle2, Clock, Home, MapPin, Phone, User, Users } from "lucide-react";
import { format } from "date-fns";

interface LeaveRequest {
  id: string;
  status: string;
  referral_hospital: string;
  expected_duration: string;
  referral_date: string;
  illness_description: string | null;
  leave_start_date: string | null;
  expected_return_date: string | null;
  accompanist_name: string | null;
  accompanist_contact: string | null;
  accompanist_relationship: string | null;
  actual_return_date: string | null;
  medical_officers?: {
    name: string;
  } | null;
}

interface LeaveStatusCardProps {
  leaveRequest: LeaveRequest | null;
  onFillForm?: () => void;
  onSubmitReturn?: () => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "doctor_referred":
    case "student_form_pending":
      return {
        label: "Form Pending",
        color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
        icon: Clock,
        activeStatus: "pending",
      };
    case "on_leave":
    case "return_pending":
      return {
        label: "Off-Campus for Treatment",
        color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        icon: MapPin,
        activeStatus: "on_leave",
      };
    case "returned":
      return {
        label: "Returned",
        color: "bg-green-100 text-green-800 hover:bg-green-200",
        icon: CheckCircle2,
        activeStatus: "returned",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        color: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        icon: Clock,
        activeStatus: "cancelled",
      };
    default:
      return {
        label: "On-Campus",
        color: "bg-green-100 text-green-800 hover:bg-green-200",
        icon: Home,
        activeStatus: "on_campus",
      };
  }
};

const LeaveStatusCard = ({ leaveRequest, onFillForm, onSubmitReturn }: LeaveStatusCardProps) => {
  const hasActiveLeave = leaveRequest && !["returned", "cancelled"].includes(leaveRequest.status);
  const statusConfig = leaveRequest ? getStatusConfig(leaveRequest.status) : getStatusConfig("on_campus");
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Medical Leave Status</CardTitle>
          <Badge className={statusConfig.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
        <CardDescription>Current leave status and details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusConfig.activeStatus === "on_campus" ? "bg-green-500" : "bg-muted-foreground/30"}`} />
            <span className={`text-sm ${statusConfig.activeStatus === "on_campus" ? "font-medium" : "text-muted-foreground"}`}>
              On-Campus
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusConfig.activeStatus === "on_leave" ? "bg-blue-500" : "bg-muted-foreground/30"}`} />
            <span className={`text-sm ${statusConfig.activeStatus === "on_leave" ? "font-medium" : "text-muted-foreground"}`}>
              Off-Campus
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusConfig.activeStatus === "returned" ? "bg-green-500" : "bg-muted-foreground/30"}`} />
            <span className={`text-sm ${statusConfig.activeStatus === "returned" ? "font-medium" : "text-muted-foreground"}`}>
              Returned
            </span>
          </div>
        </div>

        {!hasActiveLeave && !leaveRequest && (
          <div className="text-center py-6 text-muted-foreground">
            <Home className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No active medical leave</p>
            <p className="text-sm">You are currently on campus</p>
          </div>
        )}

        {hasActiveLeave && leaveRequest && (
          <>
            <Separator />
            
            {/* Active Leave Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Active Leave Details
              </h4>

              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Hospital</p>
                    <p className="text-sm text-muted-foreground">{leaveRequest.referral_hospital}</p>
                  </div>
                </div>

                {leaveRequest.illness_description && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Illness</p>
                      <p className="text-sm text-muted-foreground">{leaveRequest.illness_description}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Leave Period</p>
                    <p className="text-sm text-muted-foreground">
                      {leaveRequest.leave_start_date
                        ? format(new Date(leaveRequest.leave_start_date), "PP")
                        : format(new Date(leaveRequest.referral_date), "PP")}
                      {" to "}
                      {leaveRequest.expected_return_date
                        ? format(new Date(leaveRequest.expected_return_date), "PP")
                        : `${leaveRequest.expected_duration}`}
                    </p>
                  </div>
                </div>

                {leaveRequest.accompanist_name && (
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Accompanied By</p>
                      <p className="text-sm text-muted-foreground">
                        {leaveRequest.accompanist_name} ({leaveRequest.accompanist_relationship})
                      </p>
                    </div>
                  </div>
                )}

                {leaveRequest.accompanist_contact && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Contact</p>
                      <p className="text-sm text-muted-foreground">{leaveRequest.accompanist_contact}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Approved By</p>
                    <p className="text-sm text-muted-foreground">
                      {leaveRequest.medical_officers?.name || "Campus Doctor"} on {format(new Date(leaveRequest.referral_date), "PP")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-2">
                <Badge
                  variant="outline"
                  className={`w-full justify-center py-2 ${
                    leaveRequest.status === "on_leave" || leaveRequest.status === "return_pending"
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-blue-300 bg-blue-50 text-blue-700"
                  }`}
                >
                  {leaveRequest.status === "student_form_pending"
                    ? "FORM REQUIRED"
                    : leaveRequest.status === "on_leave" || leaveRequest.status === "return_pending"
                    ? "AWAITING RETURN"
                    : leaveRequest.status.toUpperCase().replace(/_/g, " ")}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {leaveRequest.status === "student_form_pending" && onFillForm && (
                <Button onClick={onFillForm} className="w-full" variant="default">
                  Complete Leave Form
                </Button>
              )}
              {(leaveRequest.status === "on_leave" || leaveRequest.status === "return_pending") && onSubmitReturn && (
                <Button onClick={onSubmitReturn} className="w-full bg-green-600 hover:bg-green-700">
                  <Home className="h-4 w-4 mr-2" />
                  Submit Return Notification
                </Button>
              )}
            </div>
          </>
        )}

        {/* Completed Leave Summary */}
        {leaveRequest && leaveRequest.status === "returned" && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Completed Leave
              </h4>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">
                    Returned on {leaveRequest.actual_return_date 
                      ? format(new Date(leaveRequest.actual_return_date), "PPp")
                      : "N/A"}
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {leaveRequest.referral_hospital} • {leaveRequest.illness_description || "Medical treatment"}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveStatusCard;
