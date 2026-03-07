import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { FlaskConical, Upload, CheckCircle2, Clock, User, Stethoscope, Calendar, Download, Search } from "lucide-react";
import { format, startOfDay, startOfWeek, subDays, subWeeks, isAfter } from "date-fns";

interface LabReport {
  id: string;
  test_name: string;
  notes: string | null;
  status: string;
  report_file_url: string | null;
  report_file_name: string | null;
  created_at: string;
  updated_at: string;
  student_id: string;
  doctor_id: string | null;
  prescription_id: string | null;
  student?: { full_name: string; roll_number: string; branch: string | null; program: string };
  doctor?: { name: string; designation: string };
}

type DateFilter = "all" | "today" | "yesterday" | "this_week" | "last_week";

export default function LabOfficerDashboard() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const fetchLabReports = async () => {
    setLoading(true);
    try {
      const [reportsRes, studentsRes, doctorsRes] = await Promise.all([
        supabase.from("lab_reports").select("*").order("created_at", { ascending: false }),
        supabase.from("students").select("id, full_name, roll_number, branch, program"),
        supabase.from("medical_officers").select("id, name, designation"),
      ]);

      if (reportsRes.error) throw reportsRes.error;

      const studentsMap = new Map((studentsRes.data || []).map(s => [s.id, s]));
      const doctorsMap = new Map((doctorsRes.data || []).map(d => [d.id, d]));

      const enriched: LabReport[] = (reportsRes.data || []).map(r => ({
        ...r,
        student: studentsMap.get(r.student_id) || undefined,
        doctor: r.doctor_id ? doctorsMap.get(r.doctor_id) || undefined : undefined,
      }));

      setLabReports(enriched);
    } catch (err) {
      console.error("Error fetching lab reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLabReports(); }, []);

  const handleFileUpload = async (report: LabReport, file: File) => {
    if (!user) return;
    setUploadingId(report.id);

    try {
      const fileName = `${report.student_id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("lab-reports")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("lab-reports")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("lab_reports")
        .update({
          report_file_url: urlData.publicUrl,
          report_file_name: file.name,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", report.id);

      if (updateError) throw updateError;

      // Notify student
      const { data: student } = await supabase
        .from("students")
        .select("user_id, full_name")
        .eq("id", report.student_id)
        .single();

      if (student?.user_id) {
        await supabase.from("notifications").insert({
          user_id: student.user_id,
          title: "🔬 Lab Report Ready",
          message: `Your ${report.test_name} report has been uploaded. You can view it in your health records.`,
          type: "lab_report",
        });
      }

      toast({
        title: "✅ Report Uploaded",
        description: `Lab report uploaded for ${report.student?.full_name}`,
      });

      fetchLabReports();
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  const filteredReports = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = thisWeekStart;

    return labReports.filter(r => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!r.student?.full_name?.toLowerCase().includes(q) && !r.student?.roll_number?.toLowerCase().includes(q) && !r.test_name.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (dateFilter === "all") return true;
      const date = new Date(r.created_at);
      switch (dateFilter) {
        case "today": return isAfter(date, todayStart);
        case "yesterday": return isAfter(date, yesterdayStart) && !isAfter(date, todayStart);
        case "this_week": return isAfter(date, thisWeekStart);
        case "last_week": return isAfter(date, lastWeekStart) && !isAfter(date, lastWeekEnd);
        default: return true;
      }
    });
  }, [labReports, searchQuery, dateFilter]);

  const pendingTests = filteredReports.filter(r => r.status === "pending");
  const completedTests = filteredReports.filter(r => r.status === "completed");

  const renderReportCard = (r: LabReport, showUpload: boolean) => (
    <Card key={r.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{r.student?.full_name || "Unknown"}</span>
              <Badge variant="outline">{r.student?.roll_number}</Badge>
              {r.student?.branch && <Badge variant="secondary" className="text-xs">{r.student.branch}</Badge>}
              <Badge variant="secondary" className="text-xs">{r.student?.program}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Stethoscope className="w-3 h-3" />
              <span>Dr. {r.doctor?.name || "Unknown"}</span>
              <span>•</span>
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(r.created_at), "dd MMM yyyy, hh:mm a")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={showUpload ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                {r.test_name}
              </Badge>
            </div>
            {r.notes && <p className="text-sm text-muted-foreground italic">Notes: {r.notes}</p>}
          </div>
          <div className="flex items-center gap-2">
            {showUpload ? (
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(r, file);
                  }}
                  disabled={uploadingId === r.id}
                />
                <Button variant="default" size="sm" asChild disabled={uploadingId === r.id}>
                  <span>
                    <Upload className="w-4 h-4 mr-1" />
                    {uploadingId === r.id ? "Uploading..." : "Upload Report"}
                  </span>
                </Button>
              </label>
            ) : (
              <>
                <Badge className="bg-green-600 text-white">Completed</Badge>
                {r.report_file_url && (
                  <a href={r.report_file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-blue-600" />
            </div>
            Lab Officer Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage prescribed lab tests and upload diagnostic reports</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{pendingTests.length}</p>
              <p className="text-sm text-muted-foreground">Pending Tests</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{completedTests.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 flex-wrap mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by student, roll number, or test..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending ({pendingTests.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading lab tests...</p>
            ) : pendingTests.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No pending lab tests</CardContent></Card>
            ) : (
              pendingTests.map(r => renderReportCard(r, true))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-4">
            {completedTests.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No completed reports yet</CardContent></Card>
            ) : (
              completedTests.map(r => renderReportCard(r, false))
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
