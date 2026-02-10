import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, FileText, Stethoscope, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  related_appointment_id: string | null;
}

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!userId,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'approved':
        return 'border-l-green-500 bg-green-50';
      case 'rejected':
        return 'border-l-red-500 bg-red-50';
      case 'rescheduled':
        return 'border-l-yellow-500 bg-yellow-50';
      // Medical Leave notifications
      case 'medical_leave_referral':
        return 'border-l-purple-500 bg-purple-50';
      case 'medical_leave_on_leave':
        return 'border-l-blue-500 bg-blue-50';
      case 'medical_leave_returned':
        return 'border-l-green-500 bg-green-50';
      case 'mentee_leave_on_leave':
        return 'border-l-orange-500 bg-orange-50';
      case 'mentee_leave_returned':
        return 'border-l-teal-500 bg-teal-50';
      case 'referral_on_leave':
        return 'border-l-indigo-500 bg-indigo-50';
      case 'referral_returned':
        return 'border-l-emerald-500 bg-emerald-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  if (!userId) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-primary"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
                {notifications.map((notification) => {
                  const isMedicalLeave = notification.type.startsWith('medical_leave_') || 
                    notification.type.startsWith('mentee_leave_') || 
                    notification.type.startsWith('referral_');
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 border-l-4 cursor-pointer transition-colors hover:bg-muted/50",
                        getTypeStyles(notification.type),
                        !notification.read && "font-medium"
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          markAsReadMutation.mutate(notification.id);
                        }
                        if (isMedicalLeave || notification.type === 'approved') {
                          setOpen(false);
                          navigate("/medical-leave");
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isMedicalLeave && <Stethoscope className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                            <p className="text-sm font-medium truncate">{notification.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          {isMedicalLeave && (
                            <p className="text-xs text-primary mt-1.5 flex items-center gap-1 font-medium">
                              <ArrowRight className="h-3 w-3" />
                              Open Medical Leave
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
