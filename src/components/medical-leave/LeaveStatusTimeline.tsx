import { cn } from "@/lib/utils";
import { 
  Stethoscope, 
  FileText, 
  Plane, 
  Building2, 
  Clock,
  Home, 
  CheckCircle2,
  XCircle
} from "lucide-react";
import { format } from "date-fns";

interface LeaveRequest {
  id: string;
  status: string;
  referral_date: string;
  student_form_submitted_at: string | null;
  leave_start_date: string | null;
  actual_return_date: string | null;
  return_submitted_at: string | null;
  referral_hospital: string;
  expected_return_date: string | null;
  rest_days: number | null;
  medical_officers?: {
    name: string;
  } | null;
}

interface LeaveStatusTimelineProps {
  leaveRequest: LeaveRequest;
  className?: string;
}

type StageStatus = "completed" | "current" | "pending" | "cancelled";

interface TimelineStage {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: StageStatus;
  date?: string | null;
  detail?: string;
}

const LEAVE_STAGES = [
  { id: "doctor_referred", label: "Doctor Referral", icon: Stethoscope },
  { id: "student_form_pending", label: "Student Form", icon: FileText },
  { id: "on_leave", label: "On Leave", icon: Building2 },
  { id: "return_pending", label: "Return Pending", icon: Clock },
  { id: "returned", label: "Returned", icon: Home },
] as const;

const getStageStatus = (
  stageId: string, 
  currentStatus: string
): StageStatus => {
  const stageOrder = ["doctor_referred", "student_form_pending", "on_leave", "return_pending", "returned"];
  
  if (currentStatus === "cancelled") {
    return "cancelled";
  }
  
  const currentIndex = stageOrder.indexOf(currentStatus);
  const stageIndex = stageOrder.indexOf(stageId);
  
  if (stageIndex < currentIndex) {
    return "completed";
  } else if (stageIndex === currentIndex) {
    return "current";
  } else {
    return "pending";
  }
};

const getStageDetails = (
  stageId: string, 
  leaveRequest: LeaveRequest
): { date?: string | null; detail?: string } => {
  switch (stageId) {
    case "doctor_referred":
      return {
        date: leaveRequest.referral_date,
        detail: leaveRequest.medical_officers?.name || "Campus Doctor",
      };
    case "student_form_pending":
      return {
        date: leaveRequest.student_form_submitted_at,
        detail: leaveRequest.student_form_submitted_at ? "Form submitted" : "Awaiting student",
      };
    case "on_leave":
      return {
        date: leaveRequest.leave_start_date,
        detail: leaveRequest.referral_hospital,
      };
    case "return_pending":
      return {
        date: leaveRequest.expected_return_date,
        detail: leaveRequest.rest_days ? `${leaveRequest.rest_days} days approved` : undefined,
      };
    case "returned":
      return {
        date: leaveRequest.actual_return_date || leaveRequest.return_submitted_at,
        detail: leaveRequest.actual_return_date ? "Back on campus" : undefined,
      };
    default:
      return {};
  }
};

const getStatusStyles = (status: StageStatus) => {
  switch (status) {
    case "completed":
      return {
        iconBg: "bg-primary text-primary-foreground",
        line: "bg-primary",
        text: "text-foreground",
        description: "text-muted-foreground",
      };
    case "current":
      return {
        iconBg: "bg-primary text-primary-foreground ring-4 ring-primary/20",
        line: "bg-muted",
        text: "text-foreground font-semibold",
        description: "text-primary font-medium",
      };
    case "pending":
      return {
        iconBg: "bg-muted text-muted-foreground",
        line: "bg-muted",
        text: "text-muted-foreground",
        description: "text-muted-foreground/60",
      };
    case "cancelled":
      return {
        iconBg: "bg-destructive/20 text-destructive",
        line: "bg-destructive/20",
        text: "text-muted-foreground line-through",
        description: "text-muted-foreground/60",
      };
  }
};

const LeaveStatusTimeline = ({ leaveRequest, className }: LeaveStatusTimelineProps) => {
  const isCancelled = leaveRequest.status === "cancelled";
  
  const stages: TimelineStage[] = LEAVE_STAGES.map((stage) => {
    const status = getStageStatus(stage.id, leaveRequest.status);
    const details = getStageDetails(stage.id, leaveRequest);
    
    return {
      ...stage,
      status,
      description: getStageDescription(stage.id, status),
      ...details,
    };
  });

  return (
    <div className={cn("relative", className)}>
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Leave Progress</h3>
        {isCancelled && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const styles = getStatusStyles(stage.status);
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.id} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Vertical Line */}
              {!isLast && (
                <div 
                  className={cn(
                    "absolute left-[18px] top-[40px] w-0.5 h-[calc(100%-32px)]",
                    styles.line
                  )}
                />
              )}

              {/* Icon */}
              <div 
                className={cn(
                  "relative z-10 flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-all duration-300",
                  styles.iconBg
                )}
              >
                {stage.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : stage.status === "cancelled" ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={cn("text-sm", styles.text)}>
                    {stage.label}
                  </h4>
                  {stage.date && stage.status !== "pending" && (
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(stage.date), "MMM d, h:mm a")}
                    </time>
                  )}
                </div>
                <p className={cn("text-xs mt-0.5", styles.description)}>
                  {stage.description}
                </p>
                {stage.detail && stage.status !== "pending" && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {stage.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Action Prompt */}
      {!isCancelled && (
        <CurrentActionHint status={leaveRequest.status} />
      )}
    </div>
  );
};

function getStageDescription(stageId: string, status: StageStatus): string {
  if (status === "pending") {
    return "Pending";
  }
  
  if (status === "cancelled") {
    return "Cancelled";
  }

  switch (stageId) {
    case "doctor_referred":
      return status === "current" 
        ? "Waiting for student form" 
        : "Doctor issued referral";
    case "student_form_pending":
      return status === "current" 
        ? "Complete the departure form" 
        : "Student form completed";
    case "on_leave":
      return status === "current" 
        ? "Currently off-campus" 
        : "Treatment in progress";
    case "return_pending":
      return status === "current" 
        ? "Expected back soon" 
        : "Awaiting return confirmation";
    case "returned":
      return "Successfully returned to campus";
    default:
      return "";
  }
}

function CurrentActionHint({ status }: { status: string }) {
  let message = "";
  let bgColor = "bg-muted";
  
  switch (status) {
    case "doctor_referred":
    case "student_form_pending":
      message = "⏳ Action needed: Complete the off-campus leave form";
      bgColor = "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800";
      break;
    case "on_leave":
      message = "🏥 You are currently off-campus for treatment";
      bgColor = "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800";
      break;
    case "return_pending":
      message = "🏠 Action needed: Submit return notification when you arrive";
      bgColor = "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800";
      break;
    case "returned":
      message = "✅ Leave cycle complete. Welcome back!";
      bgColor = "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800";
      break;
    default:
      return null;
  }

  return (
    <div className={cn("mt-6 p-3 rounded-lg border text-sm", bgColor)}>
      {message}
    </div>
  );
}

export default LeaveStatusTimeline;
