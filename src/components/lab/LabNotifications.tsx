import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Props {
  labReports: Array<{
    id: string;
    student_id: string;
    test_name: string;
    student?: { full_name: string; roll_number: string };
  }>;
}

export default function LabNotifications({ labReports }: Props) {
  const { toast } = useToast();
  const [notifType, setNotifType] = useState("report_updated");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentHistory, setSentHistory] = useState<Array<{ time: string; recipient: string; type: string; message: string }>>([]);

  const uniqueStudents = Array.from(
    new Map(labReports.filter(r => r.student).map(r => [r.student_id, r.student!])).values()
  );

  const templates: Record<string, string> = {
    report_updated: "Your lab report has been updated. Please check your health records for the latest results.",
    deadline_reminder: "Reminder: Please visit the Health Centre lab for your pending test sample collection.",
    report_verified: "Your lab test results have been verified and are now available in your health records.",
  };

  const handleSend = async () => {
    if (!selectedStudentId) {
      toast({ title: "Select a student", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data: student } = await supabase.from("students").select("user_id, full_name").eq("id", selectedStudentId).single();
      if (!student?.user_id) throw new Error("Student not found");

      const message = customMessage || templates[notifType] || "Lab notification";
      await supabase.from("notifications").insert({
        user_id: student.user_id,
        title: notifType === "report_updated" ? "📄 Report Updated" : notifType === "deadline_reminder" ? "⏰ Lab Reminder" : "✅ Report Verified",
        message,
        type: "lab_report",
      });

      setSentHistory(prev => [{
        time: format(new Date(), "hh:mm a"),
        recipient: student.full_name,
        type: notifType,
        message: message.slice(0, 60) + "...",
      }, ...prev]);

      toast({ title: "✅ Notification Sent", description: `Sent to ${student.full_name}` });
      setCustomMessage("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Bell className="w-5 h-5 text-amber-500" />
        Notification Management
      </h2>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Send panel */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-sm">Send Notification</h3>

            <div>
              <Label className="text-sm">Select Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose student..." /></SelectTrigger>
                <SelectContent>
                  {uniqueStudents.map(s => (
                    <SelectItem key={labReports.find(r => r.student?.roll_number === s.roll_number)?.student_id || s.roll_number} value={labReports.find(r => r.student?.roll_number === s.roll_number)?.student_id || ""}>
                      {s.full_name} ({s.roll_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Notification Type</Label>
              <Select value={notifType} onValueChange={setNotifType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="report_updated">📄 Report Updated</SelectItem>
                  <SelectItem value="deadline_reminder">⏰ Deadline Reminder</SelectItem>
                  <SelectItem value="report_verified">✅ Report Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Message</Label>
              <Textarea
                value={customMessage || templates[notifType]}
                onChange={e => setCustomMessage(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            <Button onClick={handleSend} disabled={sending} className="w-full">
              <Send className="w-4 h-4 mr-1" />
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Notification History</h3>
            {sentHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications sent this session</p>
            ) : (
              <div className="space-y-3">
                {sentHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm border-b last:border-0 pb-2">
                    <Clock className="w-3 h-3 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{h.time}</span>
                        <span className="font-medium">{h.recipient}</span>
                        <Badge variant="outline" className="text-[10px]">{h.type.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
