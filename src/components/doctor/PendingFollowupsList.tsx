import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  CalendarClock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface PendingFollowupsListProps {
  doctorId: string | null;
}

interface FollowupWithStudent {
  id: string;
  follow_up_date: string;
  reason_category: string;
  reason_notes: string | null;
  visit_date: string;
  student: {
    id: string;
    full_name: string;
    roll_number: string;
    program: string;
    branch: string | null;
  } | null;
}

export default function PendingFollowupsList({ doctorId }: PendingFollowupsListProps) {
  const queryClient = useQueryClient();
  const [selectedFollowup, setSelectedFollowup] = useState<FollowupWithStudent | null>(null);
  const [actionType, setActionType] = useState<"complete" | "cancel" | null>(null);

  const { data: followups, isLoading } = useQuery({
    queryKey: ["pending-followups", doctorId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("health_visits")
        .select(`
          id,
          follow_up_date,
          reason_category,
          reason_notes,
          visit_date,
          student:students(id, full_name, roll_number, program, branch)
        `)
        
        .eq("follow_up_required", true)
        .gte("follow_up_date", today)
        .order("follow_up_date", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as FollowupWithStudent[];
    },
    enabled: !!doctorId,
  });

  const { data: overdueCount } = useQuery({
    queryKey: ["overdue-followups-count", doctorId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { count, error } = await supabase
        .from("health_visits")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .eq("follow_up_required", true)
        .lt("follow_up_date", today);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!doctorId,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (followupId: string) => {
      const { error } = await supabase
        .from("health_visits")
        .update({ follow_up_required: false })
        .eq("id", followupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-followups"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-followups-count"] });
      toast.success("Follow-up marked as completed");
      setSelectedFollowup(null);
      setActionType(null);
    },
    onError: () => {
      toast.error("Failed to update follow-up");
    },
  });

  const cancelFollowupMutation = useMutation({
    mutationFn: async (followupId: string) => {
      const { error } = await supabase
        .from("health_visits")
        .update({ follow_up_required: false, follow_up_date: null })
        .eq("id", followupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-followups"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-followups-count"] });
      toast.success("Follow-up cancelled");
      setSelectedFollowup(null);
      setActionType(null);
    },
    onError: () => {
      toast.error("Failed to cancel follow-up");
    },
  });

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const getDateVariant = (dateStr: string): "default" | "secondary" | "destructive" => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "destructive";
    if (isTomorrow(date)) return "default";
    return "secondary";
  };

  const formatReasonCategory = (category: string) => {
    return category
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleAction = (followup: FollowupWithStudent, action: "complete" | "cancel") => {
    setSelectedFollowup(followup);
    setActionType(action);
  };

  const confirmAction = () => {
    if (!selectedFollowup) return;
    
    if (actionType === "complete") {
      markCompleteMutation.mutate(selectedFollowup.id);
    } else if (actionType === "cancel") {
      cancelFollowupMutation.mutate(selectedFollowup.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Pending Follow-ups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Pending Follow-ups
            </CardTitle>
            {(overdueCount ?? 0) > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {overdueCount} overdue
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!followups || followups.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CalendarClock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pending follow-ups</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followups.map((followup) => (
                <div
                  key={followup.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm truncate">
                        {followup.student?.full_name || "Unknown Patient"}
                      </span>
                      <Badge variant={getDateVariant(followup.follow_up_date)} className="text-xs">
                        {getDateLabel(followup.follow_up_date)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(followup.follow_up_date), "MMM d, yyyy")}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatReasonCategory(followup.reason_category)}
                      </Badge>
                    </div>
                    {followup.student && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {followup.student.roll_number} • {followup.student.program}
                        {followup.student.branch && ` (${followup.student.branch})`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => handleAction(followup, "complete")}
                      title="Mark as completed"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleAction(followup, "cancel")}
                      title="Cancel follow-up"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {followups.length >= 10 && (
                <Button variant="ghost" className="w-full text-sm text-muted-foreground">
                  View all follow-ups
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedFollowup && !!actionType} onOpenChange={() => {
        setSelectedFollowup(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "complete" ? "Complete Follow-up?" : "Cancel Follow-up?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "complete" 
                ? `Mark the follow-up for ${selectedFollowup?.student?.full_name} as completed. This will remove it from your pending list.`
                : `Cancel the scheduled follow-up for ${selectedFollowup?.student?.full_name}. This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={actionType === "cancel" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {actionType === "complete" ? "Mark Complete" : "Cancel Follow-up"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
